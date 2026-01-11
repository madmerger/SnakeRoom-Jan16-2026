import os
from datetime import datetime, timedelta, timezone

import aiosqlite
import pytest

import app.main as main_module
from app.main import (
    MeterDevice,
    MeterReading,
    cleanup_old_readings,
    data_store,
    get_readings_from_db,
    init_database,
    load_devices_from_db,
    save_device_to_db,
    save_reading_to_db,
)


class TestInitDatabase:
    async def test_init_database_creates_tables(self, temp_db_path):
        original_db_path = main_module.DB_PATH
        main_module.DB_PATH = temp_db_path
        
        try:
            await init_database()
            
            async with aiosqlite.connect(temp_db_path) as db:
                cursor = await db.execute(
                    "SELECT name FROM sqlite_master WHERE type='table' AND name='devices'"
                )
                result = await cursor.fetchone()
                assert result is not None
                assert result[0] == "devices"
                
                cursor = await db.execute(
                    "SELECT name FROM sqlite_master WHERE type='table' AND name='readings'"
                )
                result = await cursor.fetchone()
                assert result is not None
                assert result[0] == "readings"
        finally:
            main_module.DB_PATH = original_db_path

    async def test_init_database_creates_index(self, temp_db_path):
        original_db_path = main_module.DB_PATH
        main_module.DB_PATH = temp_db_path
        
        try:
            await init_database()
            
            async with aiosqlite.connect(temp_db_path) as db:
                cursor = await db.execute(
                    "SELECT name FROM sqlite_master WHERE type='index' AND name='idx_readings_device_timestamp'"
                )
                result = await cursor.fetchone()
                assert result is not None
                assert result[0] == "idx_readings_device_timestamp"
        finally:
            main_module.DB_PATH = original_db_path

    async def test_init_database_sets_initialized_flag(self, temp_db_path):
        original_db_path = main_module.DB_PATH
        original_initialized = data_store.db_initialized
        main_module.DB_PATH = temp_db_path
        data_store.db_initialized = False
        
        try:
            await init_database()
            assert data_store.db_initialized is True
        finally:
            main_module.DB_PATH = original_db_path
            data_store.db_initialized = original_initialized

    async def test_init_database_idempotent(self, temp_db_path):
        original_db_path = main_module.DB_PATH
        main_module.DB_PATH = temp_db_path
        
        try:
            await init_database()
            await init_database()
            
            async with aiosqlite.connect(temp_db_path) as db:
                cursor = await db.execute(
                    "SELECT COUNT(*) FROM sqlite_master WHERE type='table' AND name='devices'"
                )
                result = await cursor.fetchone()
                assert result[0] == 1
        finally:
            main_module.DB_PATH = original_db_path


class TestSaveDeviceToDb:
    async def test_save_device_to_db(self, temp_db_path):
        original_db_path = main_module.DB_PATH
        main_module.DB_PATH = temp_db_path
        
        try:
            await init_database()
            
            device = MeterDevice(
                device_id="test-001",
                device_name="Test Meter",
                device_type="Meter",
                hub_device_id="hub-001",
                current_temperature=25.5,
                current_humidity=60,
                battery=85,
                last_updated=datetime.now(timezone.utc),
            )
            
            await save_device_to_db(device)
            
            async with aiosqlite.connect(temp_db_path) as db:
                db.row_factory = aiosqlite.Row
                cursor = await db.execute(
                    "SELECT * FROM devices WHERE device_id = ?", ("test-001",)
                )
                result = await cursor.fetchone()
                
                assert result is not None
                assert result["device_id"] == "test-001"
                assert result["device_name"] == "Test Meter"
                assert result["device_type"] == "Meter"
                assert result["hub_device_id"] == "hub-001"
                assert result["current_temperature"] == 25.5
                assert result["current_humidity"] == 60
                assert result["battery"] == 85
        finally:
            main_module.DB_PATH = original_db_path

    async def test_save_device_to_db_update(self, temp_db_path):
        original_db_path = main_module.DB_PATH
        main_module.DB_PATH = temp_db_path
        
        try:
            await init_database()
            
            device = MeterDevice(
                device_id="test-001",
                device_name="Test Meter",
                device_type="Meter",
                current_temperature=25.5,
            )
            await save_device_to_db(device)
            
            updated_device = MeterDevice(
                device_id="test-001",
                device_name="Updated Meter",
                device_type="MeterPlus",
                current_temperature=30.0,
            )
            await save_device_to_db(updated_device)
            
            async with aiosqlite.connect(temp_db_path) as db:
                db.row_factory = aiosqlite.Row
                cursor = await db.execute("SELECT COUNT(*) as count FROM devices")
                result = await cursor.fetchone()
                assert result["count"] == 1
                
                cursor = await db.execute(
                    "SELECT * FROM devices WHERE device_id = ?", ("test-001",)
                )
                result = await cursor.fetchone()
                assert result["device_name"] == "Updated Meter"
                assert result["device_type"] == "MeterPlus"
                assert result["current_temperature"] == 30.0
        finally:
            main_module.DB_PATH = original_db_path

    async def test_save_device_with_null_optional_fields(self, temp_db_path):
        original_db_path = main_module.DB_PATH
        main_module.DB_PATH = temp_db_path
        
        try:
            await init_database()
            
            device = MeterDevice(
                device_id="test-001",
                device_name="Test Meter",
                device_type="Meter",
            )
            await save_device_to_db(device)
            
            async with aiosqlite.connect(temp_db_path) as db:
                db.row_factory = aiosqlite.Row
                cursor = await db.execute(
                    "SELECT * FROM devices WHERE device_id = ?", ("test-001",)
                )
                result = await cursor.fetchone()
                
                assert result["hub_device_id"] is None
                assert result["current_temperature"] is None
                assert result["current_humidity"] is None
                assert result["battery"] is None
                assert result["last_updated"] is None
        finally:
            main_module.DB_PATH = original_db_path


class TestSaveReadingToDb:
    async def test_save_reading_to_db(self, temp_db_path):
        original_db_path = main_module.DB_PATH
        main_module.DB_PATH = temp_db_path
        
        try:
            await init_database()
            
            reading = MeterReading(
                timestamp=datetime.now(timezone.utc),
                temperature=25.5,
                humidity=60,
                battery=85,
            )
            
            await save_reading_to_db("test-001", reading)
            
            async with aiosqlite.connect(temp_db_path) as db:
                db.row_factory = aiosqlite.Row
                cursor = await db.execute(
                    "SELECT * FROM readings WHERE device_id = ?", ("test-001",)
                )
                result = await cursor.fetchone()
                
                assert result is not None
                assert result["device_id"] == "test-001"
                assert result["temperature"] == 25.5
                assert result["humidity"] == 60
                assert result["battery"] == 85
        finally:
            main_module.DB_PATH = original_db_path

    async def test_save_multiple_readings(self, temp_db_path):
        original_db_path = main_module.DB_PATH
        main_module.DB_PATH = temp_db_path
        
        try:
            await init_database()
            
            now = datetime.now(timezone.utc)
            for i in range(5):
                reading = MeterReading(
                    timestamp=now - timedelta(hours=i),
                    temperature=25.0 + i,
                    humidity=60 + i,
                )
                await save_reading_to_db("test-001", reading)
            
            async with aiosqlite.connect(temp_db_path) as db:
                cursor = await db.execute(
                    "SELECT COUNT(*) FROM readings WHERE device_id = ?", ("test-001",)
                )
                result = await cursor.fetchone()
                assert result[0] == 5
        finally:
            main_module.DB_PATH = original_db_path


class TestLoadDevicesFromDb:
    async def test_load_devices_from_db(self, temp_db_path, reset_data_store):
        original_db_path = main_module.DB_PATH
        main_module.DB_PATH = temp_db_path
        
        try:
            await init_database()
            
            device1 = MeterDevice(
                device_id="test-001",
                device_name="Test Meter 1",
                device_type="Meter",
                current_temperature=25.5,
            )
            device2 = MeterDevice(
                device_id="test-002",
                device_name="Test Meter 2",
                device_type="MeterPlus",
                current_temperature=26.5,
            )
            await save_device_to_db(device1)
            await save_device_to_db(device2)
            
            data_store.devices = {}
            data_store.history = {}
            
            await load_devices_from_db()
            
            assert len(data_store.devices) == 2
            assert "test-001" in data_store.devices
            assert "test-002" in data_store.devices
            assert data_store.devices["test-001"].device_name == "Test Meter 1"
            assert data_store.devices["test-002"].device_name == "Test Meter 2"
        finally:
            main_module.DB_PATH = original_db_path

    async def test_load_devices_initializes_history(self, temp_db_path, reset_data_store):
        original_db_path = main_module.DB_PATH
        main_module.DB_PATH = temp_db_path
        
        try:
            await init_database()
            
            device = MeterDevice(
                device_id="test-001",
                device_name="Test Meter",
                device_type="Meter",
            )
            await save_device_to_db(device)
            
            data_store.devices = {}
            data_store.history = {}
            
            await load_devices_from_db()
            
            assert "test-001" in data_store.history
            assert data_store.history["test-001"] == []
        finally:
            main_module.DB_PATH = original_db_path

    async def test_load_devices_empty_db(self, temp_db_path, reset_data_store):
        original_db_path = main_module.DB_PATH
        main_module.DB_PATH = temp_db_path
        
        try:
            await init_database()
            
            data_store.devices = {}
            data_store.history = {}
            
            await load_devices_from_db()
            
            assert len(data_store.devices) == 0
            assert len(data_store.history) == 0
        finally:
            main_module.DB_PATH = original_db_path


class TestGetReadingsFromDb:
    async def test_get_readings_from_db_with_cutoff(self, temp_db_path):
        original_db_path = main_module.DB_PATH
        main_module.DB_PATH = temp_db_path
        
        try:
            await init_database()
            
            now = datetime.now(timezone.utc)
            for i in range(10):
                reading = MeterReading(
                    timestamp=now - timedelta(hours=i),
                    temperature=25.0 + i,
                    humidity=60,
                )
                await save_reading_to_db("test-001", reading)
            
            cutoff = (now - timedelta(hours=5)).timestamp()
            readings = await get_readings_from_db("test-001", cutoff)
            
            assert len(readings) == 6
            for reading in readings:
                assert reading.timestamp >= datetime.fromtimestamp(cutoff, tz=timezone.utc)
        finally:
            main_module.DB_PATH = original_db_path

    async def test_get_readings_from_db_empty(self, temp_db_path):
        original_db_path = main_module.DB_PATH
        main_module.DB_PATH = temp_db_path
        
        try:
            await init_database()
            
            cutoff = datetime.now(timezone.utc).timestamp()
            readings = await get_readings_from_db("nonexistent-device", cutoff)
            
            assert readings == []
        finally:
            main_module.DB_PATH = original_db_path

    async def test_get_readings_from_db_ordered_by_timestamp(self, temp_db_path):
        original_db_path = main_module.DB_PATH
        main_module.DB_PATH = temp_db_path
        
        try:
            await init_database()
            
            now = datetime.now(timezone.utc)
            timestamps = [now - timedelta(hours=5), now - timedelta(hours=2), now]
            
            for i, ts in enumerate(timestamps):
                reading = MeterReading(
                    timestamp=ts,
                    temperature=25.0 + i,
                    humidity=60,
                )
                await save_reading_to_db("test-001", reading)
            
            cutoff = (now - timedelta(hours=10)).timestamp()
            readings = await get_readings_from_db("test-001", cutoff)
            
            assert len(readings) == 3
            for i in range(len(readings) - 1):
                assert readings[i].timestamp <= readings[i + 1].timestamp
        finally:
            main_module.DB_PATH = original_db_path

    async def test_get_readings_from_db_filters_by_device(self, temp_db_path):
        original_db_path = main_module.DB_PATH
        main_module.DB_PATH = temp_db_path
        
        try:
            await init_database()
            
            now = datetime.now(timezone.utc)
            
            for i in range(3):
                reading = MeterReading(
                    timestamp=now - timedelta(hours=i),
                    temperature=25.0,
                    humidity=60,
                )
                await save_reading_to_db("device-001", reading)
            
            for i in range(5):
                reading = MeterReading(
                    timestamp=now - timedelta(hours=i),
                    temperature=30.0,
                    humidity=70,
                )
                await save_reading_to_db("device-002", reading)
            
            cutoff = (now - timedelta(hours=10)).timestamp()
            
            readings_001 = await get_readings_from_db("device-001", cutoff)
            readings_002 = await get_readings_from_db("device-002", cutoff)
            
            assert len(readings_001) == 3
            assert len(readings_002) == 5
            assert all(r.temperature == 25.0 for r in readings_001)
            assert all(r.temperature == 30.0 for r in readings_002)
        finally:
            main_module.DB_PATH = original_db_path


class TestCleanupOldReadings:
    async def test_cleanup_old_readings(self, temp_db_path):
        original_db_path = main_module.DB_PATH
        main_module.DB_PATH = temp_db_path
        
        try:
            await init_database()
            
            now = datetime.now(timezone.utc)
            
            old_reading = MeterReading(
                timestamp=now - timedelta(days=400),
                temperature=25.0,
                humidity=60,
            )
            await save_reading_to_db("test-001", old_reading)
            
            recent_reading = MeterReading(
                timestamp=now - timedelta(days=30),
                temperature=26.0,
                humidity=65,
            )
            await save_reading_to_db("test-001", recent_reading)
            
            async with aiosqlite.connect(temp_db_path) as db:
                cursor = await db.execute("SELECT COUNT(*) FROM readings")
                result = await cursor.fetchone()
                assert result[0] == 2
            
            await cleanup_old_readings()
            
            async with aiosqlite.connect(temp_db_path) as db:
                cursor = await db.execute("SELECT COUNT(*) FROM readings")
                result = await cursor.fetchone()
                assert result[0] == 1
                
                db.row_factory = aiosqlite.Row
                cursor = await db.execute("SELECT * FROM readings")
                result = await cursor.fetchone()
                assert result["temperature"] == 26.0
        finally:
            main_module.DB_PATH = original_db_path

    async def test_cleanup_old_readings_keeps_recent(self, temp_db_path):
        original_db_path = main_module.DB_PATH
        main_module.DB_PATH = temp_db_path
        
        try:
            await init_database()
            
            now = datetime.now(timezone.utc)
            
            for i in range(10):
                reading = MeterReading(
                    timestamp=now - timedelta(days=i * 30),
                    temperature=25.0 + i,
                    humidity=60,
                )
                await save_reading_to_db("test-001", reading)
            
            await cleanup_old_readings()
            
            async with aiosqlite.connect(temp_db_path) as db:
                cursor = await db.execute("SELECT COUNT(*) FROM readings")
                result = await cursor.fetchone()
                assert result[0] == 10
        finally:
            main_module.DB_PATH = original_db_path
