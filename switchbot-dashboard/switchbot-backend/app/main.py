import asyncio
import base64
import hashlib
import hmac
import os
import time
import uuid
from contextlib import asynccontextmanager
from datetime import datetime, timezone
from enum import Enum
from typing import Optional

import httpx
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

load_dotenv()

SWITCHBOT_API_BASE = "https://api.switch-bot.com/v1.1"
SWITCHBOT_TOKEN = os.getenv("SWITCHBOT_TOKEN", "")
SWITCHBOT_SECRET = os.getenv("SWITCHBOT_SECRET", "")

DATA_COLLECTION_INTERVAL = 120
RATE_LIMIT_BACKOFF_BASE = 60
MAX_BACKOFF = 600

METER_DEVICE_TYPES = ["Meter", "MeterPlus", "WoIOSensor", "Meter Plus (JP)", "Meter Pro", "Meter Pro CO2", "Hub 2"]


class TimeScale(str, Enum):
    HOUR = "hour"
    DAY = "day"
    WEEK = "week"
    MONTH = "month"
    YEAR = "year"


class MeterReading(BaseModel):
    timestamp: datetime
    temperature: float
    humidity: int
    battery: Optional[int] = None


class MeterDevice(BaseModel):
    device_id: str
    device_name: str
    device_type: str
    hub_device_id: Optional[str] = None
    current_temperature: Optional[float] = None
    current_humidity: Optional[int] = None
    battery: Optional[int] = None
    last_updated: Optional[datetime] = None


class DataStore:
    def __init__(self):
        self.devices: dict[str, MeterDevice] = {}
        self.history: dict[str, list[MeterReading]] = {}
        self.last_api_call: float = 0
        self.backoff_until: float = 0
        self.consecutive_errors: int = 0
        self.is_collecting: bool = False
        self.collection_task: Optional[asyncio.Task] = None


data_store = DataStore()


def generate_switchbot_headers() -> dict:
    if not SWITCHBOT_TOKEN or not SWITCHBOT_SECRET:
        return {}
    
    nonce = str(uuid.uuid4())
    t = int(round(time.time() * 1000))
    string_to_sign = f"{SWITCHBOT_TOKEN}{t}{nonce}"
    
    string_to_sign_bytes = bytes(string_to_sign, "utf-8")
    secret_bytes = bytes(SWITCHBOT_SECRET, "utf-8")
    
    sign = base64.b64encode(
        hmac.new(secret_bytes, msg=string_to_sign_bytes, digestmod=hashlib.sha256).digest()
    )
    
    return {
        "Authorization": SWITCHBOT_TOKEN,
        "Content-Type": "application/json",
        "charset": "utf8",
        "t": str(t),
        "sign": str(sign, "utf-8"),
        "nonce": nonce,
    }


async def call_switchbot_api(endpoint: str) -> dict:
    if time.time() < data_store.backoff_until:
        raise HTTPException(
            status_code=429,
            detail=f"Rate limited. Retry after {int(data_store.backoff_until - time.time())} seconds",
        )
    
    headers = generate_switchbot_headers()
    if not headers:
        raise HTTPException(status_code=500, detail="SwitchBot credentials not configured")
    
    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(f"{SWITCHBOT_API_BASE}{endpoint}", headers=headers)
            data_store.last_api_call = time.time()
            
            if response.status_code == 429:
                data_store.consecutive_errors += 1
                backoff_time = min(
                    RATE_LIMIT_BACKOFF_BASE * (2 ** data_store.consecutive_errors),
                    MAX_BACKOFF,
                )
                data_store.backoff_until = time.time() + backoff_time
                raise HTTPException(
                    status_code=429,
                    detail=f"Rate limited by SwitchBot API. Backing off for {backoff_time} seconds",
                )
            
            if response.status_code != 200:
                raise HTTPException(
                    status_code=response.status_code,
                    detail=f"SwitchBot API error: {response.text}",
                )
            
            data_store.consecutive_errors = 0
            return response.json()
            
        except httpx.RequestError as e:
            raise HTTPException(status_code=500, detail=f"Request error: {str(e)}")


async def fetch_devices() -> list[MeterDevice]:
    response = await call_switchbot_api("/devices")
    
    if response.get("statusCode") != 100:
        raise HTTPException(
            status_code=500,
            detail=f"SwitchBot API returned error: {response.get('message', 'Unknown error')}",
        )
    
    devices = []
    device_list = response.get("body", {}).get("deviceList", [])
    
    for device in device_list:
        device_type = device.get("deviceType", "")
        if device_type in METER_DEVICE_TYPES:
            meter = MeterDevice(
                device_id=device.get("deviceId", ""),
                device_name=device.get("deviceName", "Unknown"),
                device_type=device_type,
                hub_device_id=device.get("hubDeviceId"),
            )
            devices.append(meter)
    
    return devices


async def fetch_device_status(device_id: str) -> dict:
    response = await call_switchbot_api(f"/devices/{device_id}/status")
    
    if response.get("statusCode") != 100:
        raise HTTPException(
            status_code=500,
            detail=f"SwitchBot API returned error: {response.get('message', 'Unknown error')}",
        )
    
    return response.get("body", {})


async def collect_data():
    if not SWITCHBOT_TOKEN or not SWITCHBOT_SECRET:
        return
    
    try:
        devices = await fetch_devices()
        
        for device in devices:
            if device.device_id not in data_store.devices:
                data_store.devices[device.device_id] = device
                data_store.history[device.device_id] = []
            else:
                data_store.devices[device.device_id].device_name = device.device_name
                data_store.devices[device.device_id].device_type = device.device_type
        
        for device_id in list(data_store.devices.keys()):
            try:
                status = await fetch_device_status(device_id)
                
                temperature = status.get("temperature")
                humidity = status.get("humidity")
                battery = status.get("battery")
                
                if temperature is not None:
                    now = datetime.now(timezone.utc)
                    
                    data_store.devices[device_id].current_temperature = temperature
                    data_store.devices[device_id].current_humidity = humidity
                    data_store.devices[device_id].battery = battery
                    data_store.devices[device_id].last_updated = now
                    
                    reading = MeterReading(
                        timestamp=now,
                        temperature=temperature,
                        humidity=humidity if humidity is not None else 0,
                        battery=battery,
                    )
                    data_store.history[device_id].append(reading)
                    
                    max_readings = 365 * 24 * 30
                    if len(data_store.history[device_id]) > max_readings:
                        data_store.history[device_id] = data_store.history[device_id][-max_readings:]
                        
            except HTTPException as e:
                if e.status_code == 429:
                    break
                    
    except HTTPException:
        pass
    except Exception:
        pass


async def background_collector():
    while True:
        await collect_data()
        await asyncio.sleep(DATA_COLLECTION_INTERVAL)


@asynccontextmanager
async def lifespan(app: FastAPI):
    if SWITCHBOT_TOKEN and SWITCHBOT_SECRET:
        data_store.collection_task = asyncio.create_task(background_collector())
    yield
    if data_store.collection_task:
        data_store.collection_task.cancel()
        try:
            await data_store.collection_task
        except asyncio.CancelledError:
            pass


app = FastAPI(lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/healthz")
async def healthz():
    return {"status": "ok"}


@app.get("/api/meters")
async def get_meters():
    meters = list(data_store.devices.values())
    return {
        "meters": [meter.model_dump() for meter in meters],
        "last_updated": max(
            (m.last_updated for m in meters if m.last_updated),
            default=None,
        ),
    }


@app.get("/api/meters/{device_id}/history")
async def get_meter_history(device_id: str, time_scale: TimeScale = TimeScale.HOUR):
    if device_id not in data_store.history:
        raise HTTPException(status_code=404, detail="Device not found")
    
    history = data_store.history[device_id]
    now = datetime.now(timezone.utc)
    
    if time_scale == TimeScale.HOUR:
        cutoff = now.timestamp() - 3600
    elif time_scale == TimeScale.DAY:
        cutoff = now.timestamp() - 86400
    elif time_scale == TimeScale.WEEK:
        cutoff = now.timestamp() - 604800
    elif time_scale == TimeScale.MONTH:
        cutoff = now.timestamp() - 2592000
    else:
        cutoff = now.timestamp() - 31536000
    
    filtered_history = [
        reading for reading in history
        if reading.timestamp.timestamp() >= cutoff
    ]
    
    return {
        "device_id": device_id,
        "time_scale": time_scale,
        "history": [reading.model_dump() for reading in filtered_history],
        "device": data_store.devices.get(device_id).model_dump() if device_id in data_store.devices else None,
    }


@app.post("/api/meters/refresh")
async def refresh_meters():
    if not SWITCHBOT_TOKEN or not SWITCHBOT_SECRET:
        raise HTTPException(status_code=500, detail="SwitchBot credentials not configured")
    
    await collect_data()
    
    return {
        "status": "ok",
        "message": "Data collection triggered",
        "meters_count": len(data_store.devices),
    }


@app.get("/api/status")
async def get_status():
    return {
        "configured": bool(SWITCHBOT_TOKEN and SWITCHBOT_SECRET),
        "meters_count": len(data_store.devices),
        "is_rate_limited": time.time() < data_store.backoff_until,
        "backoff_remaining": max(0, int(data_store.backoff_until - time.time())),
        "last_api_call": data_store.last_api_call,
        "collection_interval": DATA_COLLECTION_INTERVAL,
    }
