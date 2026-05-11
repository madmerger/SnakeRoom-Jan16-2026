import asyncio
from unittest.mock import AsyncMock, patch

import pytest

import app.main as main_module
from app.main import (
    MeterDevice,
    background_collector,
    collect_data,
    data_store,
    init_database,
)


class TestBackgroundCollector:
    async def test_background_collector_calls_collect_data(self, reset_data_store):
        call_count = 0

        async def mock_collect():
            nonlocal call_count
            call_count += 1
            if call_count >= 2:
                raise asyncio.CancelledError()

        with patch("app.main.collect_data", side_effect=mock_collect), \
             patch("app.main.DATA_COLLECTION_INTERVAL", 0):
            with pytest.raises(asyncio.CancelledError):
                await background_collector()

        assert call_count >= 2


class TestCollectDataExceptionHandling:
    async def test_collect_data_handles_generic_exception(self, reset_data_store, temp_db_path):
        original_db_path = main_module.DB_PATH
        main_module.DB_PATH = temp_db_path

        try:
            await init_database()

            with patch.object(main_module, "SWITCHBOT_TOKEN", "test-token"), \
                 patch.object(main_module, "SWITCHBOT_SECRET", "test-secret"), \
                 patch("app.main.fetch_devices", new_callable=AsyncMock) as mock_fetch:
                mock_fetch.side_effect = RuntimeError("Unexpected error")

                await collect_data()
        finally:
            main_module.DB_PATH = original_db_path

    async def test_collect_data_handles_status_non_http_exception(self, reset_data_store, temp_db_path):
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
                mock_fetch_status.side_effect = ValueError("Unexpected")

                await collect_data()

                assert "device-001" in data_store.devices
        finally:
            main_module.DB_PATH = original_db_path


class TestLifespan:
    async def test_lifespan_startup_and_shutdown(self, temp_db_path):
        original_db_path = main_module.DB_PATH
        original_devices = data_store.devices.copy()
        original_history = data_store.history.copy()
        original_db_initialized = data_store.db_initialized
        original_collection_task = data_store.collection_task

        main_module.DB_PATH = temp_db_path
        data_store.devices = {}
        data_store.history = {}
        data_store.db_initialized = False
        data_store.collection_task = None

        try:
            from app.main import lifespan

            with patch.object(main_module, "SWITCHBOT_TOKEN", ""), \
                 patch.object(main_module, "SWITCHBOT_SECRET", ""), \
                 patch("app.main.cleanup_old_readings", new_callable=AsyncMock) as mock_cleanup_readings, \
                 patch("app.main.cleanup_old_latency_logs", new_callable=AsyncMock) as mock_cleanup_logs:

                from app.main import app as test_app
                async with lifespan(test_app):
                    assert data_store.db_initialized is True
                    assert data_store.collection_task is None

                mock_cleanup_readings.assert_called_once()
                mock_cleanup_logs.assert_called_once()
        finally:
            main_module.DB_PATH = original_db_path
            data_store.devices = original_devices
            data_store.history = original_history
            data_store.db_initialized = original_db_initialized
            data_store.collection_task = original_collection_task

    async def test_lifespan_with_credentials_starts_collector(self, temp_db_path):
        original_db_path = main_module.DB_PATH
        original_devices = data_store.devices.copy()
        original_history = data_store.history.copy()
        original_db_initialized = data_store.db_initialized
        original_collection_task = data_store.collection_task

        main_module.DB_PATH = temp_db_path
        data_store.devices = {}
        data_store.history = {}
        data_store.db_initialized = False
        data_store.collection_task = None

        try:
            from app.main import lifespan

            with patch.object(main_module, "SWITCHBOT_TOKEN", "test-token"), \
                 patch.object(main_module, "SWITCHBOT_SECRET", "test-secret"), \
                 patch("app.main.background_collector", new_callable=AsyncMock), \
                 patch("app.main.cleanup_old_readings", new_callable=AsyncMock), \
                 patch("app.main.cleanup_old_latency_logs", new_callable=AsyncMock):

                from app.main import app as test_app
                async with lifespan(test_app):
                    assert data_store.collection_task is not None
                    assert data_store.db_initialized is True
        finally:
            main_module.DB_PATH = original_db_path
            data_store.devices = original_devices
            data_store.history = original_history
            data_store.db_initialized = original_db_initialized
            data_store.collection_task = original_collection_task
