from datetime import datetime, timezone
from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from fastapi import HTTPException

import app.main as main_module
from app.main import (
    MeterDevice,
    MeterReading,
    collect_data,
    data_store,
    init_database,
)


class TestCollectData:
    async def test_collect_data_without_credentials(self, reset_data_store):
        with patch.object(main_module, "SWITCHBOT_TOKEN", ""), \
             patch.object(main_module, "SWITCHBOT_SECRET", ""):
            
            initial_devices = len(data_store.devices)
            await collect_data()
            
            assert len(data_store.devices) == initial_devices

    async def test_collect_data_updates_datastore(self, reset_data_store, temp_db_path):
        original_db_path = main_module.DB_PATH
        main_module.DB_PATH = temp_db_path
        
        try:
            await init_database()
            
            mock_devices = [
                MeterDevice(
                    device_id="device-001",
                    device_name="Test Meter",
                    device_type="Meter",
                )
            ]
            
            mock_status = {
                "temperature": 25.5,
                "humidity": 60,
                "battery": 85,
            }
            
            with patch.object(main_module, "SWITCHBOT_TOKEN", "test-token"), \
                 patch.object(main_module, "SWITCHBOT_SECRET", "test-secret"), \
                 patch("app.main.fetch_devices", new_callable=AsyncMock) as mock_fetch_devices, \
                 patch("app.main.fetch_device_status", new_callable=AsyncMock) as mock_fetch_status:
                
                mock_fetch_devices.return_value = mock_devices
                mock_fetch_status.return_value = mock_status
                
                await collect_data()
                
                assert "device-001" in data_store.devices
                assert data_store.devices["device-001"].current_temperature == 25.5
                assert data_store.devices["device-001"].current_humidity == 60
                assert data_store.devices["device-001"].battery == 85
        finally:
            main_module.DB_PATH = original_db_path

    async def test_collect_data_adds_to_history(self, reset_data_store, temp_db_path):
        original_db_path = main_module.DB_PATH
        main_module.DB_PATH = temp_db_path
        
        try:
            await init_database()
            
            mock_devices = [
                MeterDevice(
                    device_id="device-001",
                    device_name="Test Meter",
                    device_type="Meter",
                )
            ]
            
            mock_status = {
                "temperature": 25.5,
                "humidity": 60,
                "battery": 85,
            }
            
            with patch.object(main_module, "SWITCHBOT_TOKEN", "test-token"), \
                 patch.object(main_module, "SWITCHBOT_SECRET", "test-secret"), \
                 patch("app.main.fetch_devices", new_callable=AsyncMock) as mock_fetch_devices, \
                 patch("app.main.fetch_device_status", new_callable=AsyncMock) as mock_fetch_status:
                
                mock_fetch_devices.return_value = mock_devices
                mock_fetch_status.return_value = mock_status
                
                await collect_data()
                
                assert "device-001" in data_store.history
                assert len(data_store.history["device-001"]) == 1
                assert data_store.history["device-001"][0].temperature == 25.5
        finally:
            main_module.DB_PATH = original_db_path

    async def test_collect_data_updates_existing_device(self, reset_data_store, temp_db_path):
        original_db_path = main_module.DB_PATH
        main_module.DB_PATH = temp_db_path
        
        try:
            await init_database()
            
            data_store.devices["device-001"] = MeterDevice(
                device_id="device-001",
                device_name="Old Name",
                device_type="Meter",
                current_temperature=20.0,
            )
            data_store.history["device-001"] = []
            
            mock_devices = [
                MeterDevice(
                    device_id="device-001",
                    device_name="New Name",
                    device_type="MeterPlus",
                )
            ]
            
            mock_status = {
                "temperature": 30.0,
                "humidity": 70,
                "battery": 90,
            }
            
            with patch.object(main_module, "SWITCHBOT_TOKEN", "test-token"), \
                 patch.object(main_module, "SWITCHBOT_SECRET", "test-secret"), \
                 patch("app.main.fetch_devices", new_callable=AsyncMock) as mock_fetch_devices, \
                 patch("app.main.fetch_device_status", new_callable=AsyncMock) as mock_fetch_status:
                
                mock_fetch_devices.return_value = mock_devices
                mock_fetch_status.return_value = mock_status
                
                await collect_data()
                
                assert data_store.devices["device-001"].device_name == "New Name"
                assert data_store.devices["device-001"].device_type == "MeterPlus"
                assert data_store.devices["device-001"].current_temperature == 30.0
        finally:
            main_module.DB_PATH = original_db_path

    async def test_collect_data_handles_fetch_devices_error(self, reset_data_store):
        with patch.object(main_module, "SWITCHBOT_TOKEN", "test-token"), \
             patch.object(main_module, "SWITCHBOT_SECRET", "test-secret"), \
             patch("app.main.fetch_devices", new_callable=AsyncMock) as mock_fetch_devices:
            
            mock_fetch_devices.side_effect = HTTPException(status_code=500, detail="API Error")
            
            await collect_data()

    async def test_collect_data_handles_fetch_status_error(self, reset_data_store, temp_db_path):
        original_db_path = main_module.DB_PATH
        main_module.DB_PATH = temp_db_path
        
        try:
            await init_database()
            
            mock_devices = [
                MeterDevice(
                    device_id="device-001",
                    device_name="Test Meter",
                    device_type="Meter",
                )
            ]
            
            with patch.object(main_module, "SWITCHBOT_TOKEN", "test-token"), \
                 patch.object(main_module, "SWITCHBOT_SECRET", "test-secret"), \
                 patch("app.main.fetch_devices", new_callable=AsyncMock) as mock_fetch_devices, \
                 patch("app.main.fetch_device_status", new_callable=AsyncMock) as mock_fetch_status:
                
                mock_fetch_devices.return_value = mock_devices
                mock_fetch_status.side_effect = HTTPException(status_code=500, detail="Status Error")
                
                await collect_data()
                
                assert "device-001" in data_store.devices
        finally:
            main_module.DB_PATH = original_db_path

    async def test_collect_data_rate_limit_breaks_loop(self, reset_data_store, temp_db_path):
        original_db_path = main_module.DB_PATH
        main_module.DB_PATH = temp_db_path
        
        try:
            await init_database()
            
            mock_devices = [
                MeterDevice(device_id="device-001", device_name="Meter 1", device_type="Meter"),
                MeterDevice(device_id="device-002", device_name="Meter 2", device_type="Meter"),
                MeterDevice(device_id="device-003", device_name="Meter 3", device_type="Meter"),
            ]
            
            call_count = 0
            
            async def mock_fetch_status(device_id):
                nonlocal call_count
                call_count += 1
                if call_count == 1:
                    return {"temperature": 25.0, "humidity": 60, "battery": 85}
                raise HTTPException(status_code=429, detail="Rate limited")
            
            with patch.object(main_module, "SWITCHBOT_TOKEN", "test-token"), \
                 patch.object(main_module, "SWITCHBOT_SECRET", "test-secret"), \
                 patch("app.main.fetch_devices", new_callable=AsyncMock) as mock_fetch_devices, \
                 patch("app.main.fetch_device_status", side_effect=mock_fetch_status):
                
                mock_fetch_devices.return_value = mock_devices
                
                await collect_data()
                
                assert call_count == 2
        finally:
            main_module.DB_PATH = original_db_path

    async def test_collect_data_skips_null_temperature(self, reset_data_store, temp_db_path):
        original_db_path = main_module.DB_PATH
        main_module.DB_PATH = temp_db_path
        
        try:
            await init_database()
            
            mock_devices = [
                MeterDevice(
                    device_id="device-001",
                    device_name="Test Meter",
                    device_type="Meter",
                )
            ]
            
            mock_status = {
                "temperature": None,
                "humidity": 60,
                "battery": 85,
            }
            
            with patch.object(main_module, "SWITCHBOT_TOKEN", "test-token"), \
                 patch.object(main_module, "SWITCHBOT_SECRET", "test-secret"), \
                 patch("app.main.fetch_devices", new_callable=AsyncMock) as mock_fetch_devices, \
                 patch("app.main.fetch_device_status", new_callable=AsyncMock) as mock_fetch_status:
                
                mock_fetch_devices.return_value = mock_devices
                mock_fetch_status.return_value = mock_status
                
                await collect_data()
                
                assert "device-001" in data_store.devices
                assert data_store.devices["device-001"].current_temperature is None
                assert len(data_store.history.get("device-001", [])) == 0
        finally:
            main_module.DB_PATH = original_db_path

    async def test_collect_data_trims_history(self, reset_data_store, temp_db_path):
        original_db_path = main_module.DB_PATH
        main_module.DB_PATH = temp_db_path
        
        try:
            await init_database()
            
            max_readings = 365 * 24 * 30
            data_store.devices["device-001"] = MeterDevice(
                device_id="device-001",
                device_name="Test Meter",
                device_type="Meter",
            )
            data_store.history["device-001"] = [
                MeterReading(
                    timestamp=datetime.now(timezone.utc),
                    temperature=25.0,
                    humidity=60,
                )
                for _ in range(max_readings)
            ]
            
            mock_devices = [
                MeterDevice(
                    device_id="device-001",
                    device_name="Test Meter",
                    device_type="Meter",
                )
            ]
            
            mock_status = {
                "temperature": 26.0,
                "humidity": 65,
                "battery": 80,
            }
            
            with patch.object(main_module, "SWITCHBOT_TOKEN", "test-token"), \
                 patch.object(main_module, "SWITCHBOT_SECRET", "test-secret"), \
                 patch("app.main.fetch_devices", new_callable=AsyncMock) as mock_fetch_devices, \
                 patch("app.main.fetch_device_status", new_callable=AsyncMock) as mock_fetch_status:
                
                mock_fetch_devices.return_value = mock_devices
                mock_fetch_status.return_value = mock_status
                
                await collect_data()
                
                assert len(data_store.history["device-001"]) == max_readings
        finally:
            main_module.DB_PATH = original_db_path

    async def test_collect_data_multiple_devices(self, reset_data_store, temp_db_path):
        original_db_path = main_module.DB_PATH
        main_module.DB_PATH = temp_db_path
        
        try:
            await init_database()
            
            mock_devices = [
                MeterDevice(device_id="device-001", device_name="Meter 1", device_type="Meter"),
                MeterDevice(device_id="device-002", device_name="Meter 2", device_type="MeterPlus"),
            ]
            
            status_map = {
                "device-001": {"temperature": 25.0, "humidity": 60, "battery": 85},
                "device-002": {"temperature": 26.0, "humidity": 65, "battery": 90},
            }
            
            async def mock_fetch_status(device_id):
                return status_map[device_id]
            
            with patch.object(main_module, "SWITCHBOT_TOKEN", "test-token"), \
                 patch.object(main_module, "SWITCHBOT_SECRET", "test-secret"), \
                 patch("app.main.fetch_devices", new_callable=AsyncMock) as mock_fetch_devices, \
                 patch("app.main.fetch_device_status", side_effect=mock_fetch_status):
                
                mock_fetch_devices.return_value = mock_devices
                
                await collect_data()
                
                assert len(data_store.devices) == 2
                assert data_store.devices["device-001"].current_temperature == 25.0
                assert data_store.devices["device-002"].current_temperature == 26.0
        finally:
            main_module.DB_PATH = original_db_path
