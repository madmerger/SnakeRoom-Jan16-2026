from datetime import datetime, timedelta, timezone

import app.main as main_module
from app.main import (
    LatencyLog,
    cleanup_old_latency_logs,
    get_latency_logs,
    get_latency_stats,
    init_database,
    save_latency_log,
)


class TestSaveLatencyLog:
    async def test_save_latency_log(self, temp_db_path):
        original_db_path = main_module.DB_PATH
        main_module.DB_PATH = temp_db_path

        try:
            await init_database()

            await save_latency_log(
                endpoint="/devices",
                latency_ms=150.5,
                status_code=200,
                success=True,
                device_id="device-001",
            )

            logs = await get_latency_logs()
            assert len(logs) == 1
            assert logs[0].endpoint == "/devices"
            assert logs[0].latency_ms == 150.5
            assert logs[0].status_code == 200
            assert logs[0].success is True
            assert logs[0].device_id == "device-001"
        finally:
            main_module.DB_PATH = original_db_path

    async def test_save_latency_log_with_error(self, temp_db_path):
        original_db_path = main_module.DB_PATH
        main_module.DB_PATH = temp_db_path

        try:
            await init_database()

            await save_latency_log(
                endpoint="/devices/status",
                latency_ms=5000.0,
                status_code=500,
                success=False,
                error_message="Internal Server Error",
            )

            logs = await get_latency_logs()
            assert len(logs) == 1
            assert logs[0].success is False
            assert logs[0].error_message == "Internal Server Error"
        finally:
            main_module.DB_PATH = original_db_path


class TestGetLatencyLogs:
    async def test_get_latency_logs_empty(self, temp_db_path):
        original_db_path = main_module.DB_PATH
        main_module.DB_PATH = temp_db_path

        try:
            await init_database()
            logs = await get_latency_logs()
            assert logs == []
        finally:
            main_module.DB_PATH = original_db_path

    async def test_get_latency_logs_with_time_filter(self, temp_db_path):
        original_db_path = main_module.DB_PATH
        main_module.DB_PATH = temp_db_path

        try:
            await init_database()

            await save_latency_log(
                endpoint="/devices",
                latency_ms=100.0,
                status_code=200,
                success=True,
            )

            now = datetime.now(timezone.utc)
            logs = await get_latency_logs(
                start_time=now - timedelta(minutes=5),
                end_time=now + timedelta(minutes=5),
            )
            assert len(logs) == 1

            logs = await get_latency_logs(
                start_time=now + timedelta(hours=1),
            )
            assert len(logs) == 0
        finally:
            main_module.DB_PATH = original_db_path

    async def test_get_latency_logs_with_endpoint_filter(self, temp_db_path):
        original_db_path = main_module.DB_PATH
        main_module.DB_PATH = temp_db_path

        try:
            await init_database()

            await save_latency_log(
                endpoint="/devices",
                latency_ms=100.0,
                status_code=200,
                success=True,
            )
            await save_latency_log(
                endpoint="/devices/status",
                latency_ms=200.0,
                status_code=200,
                success=True,
            )

            logs = await get_latency_logs(endpoint="/devices")
            assert len(logs) == 1
            assert logs[0].endpoint == "/devices"
        finally:
            main_module.DB_PATH = original_db_path

    async def test_get_latency_logs_with_device_filter(self, temp_db_path):
        original_db_path = main_module.DB_PATH
        main_module.DB_PATH = temp_db_path

        try:
            await init_database()

            await save_latency_log(
                endpoint="/devices/status",
                latency_ms=100.0,
                status_code=200,
                success=True,
                device_id="device-001",
            )
            await save_latency_log(
                endpoint="/devices/status",
                latency_ms=200.0,
                status_code=200,
                success=True,
                device_id="device-002",
            )

            logs = await get_latency_logs(device_id="device-001")
            assert len(logs) == 1
            assert logs[0].device_id == "device-001"
        finally:
            main_module.DB_PATH = original_db_path

    async def test_get_latency_logs_limit(self, temp_db_path):
        original_db_path = main_module.DB_PATH
        main_module.DB_PATH = temp_db_path

        try:
            await init_database()

            for i in range(10):
                await save_latency_log(
                    endpoint="/devices",
                    latency_ms=float(i * 100),
                    status_code=200,
                    success=True,
                )

            logs = await get_latency_logs(limit=3)
            assert len(logs) == 3
        finally:
            main_module.DB_PATH = original_db_path

    async def test_get_latency_logs_ordered_desc(self, temp_db_path):
        original_db_path = main_module.DB_PATH
        main_module.DB_PATH = temp_db_path

        try:
            await init_database()

            for i in range(3):
                await save_latency_log(
                    endpoint="/devices",
                    latency_ms=float(i * 100),
                    status_code=200,
                    success=True,
                )

            logs = await get_latency_logs()
            assert len(logs) == 3
            for i in range(len(logs) - 1):
                assert logs[i].timestamp >= logs[i + 1].timestamp
        finally:
            main_module.DB_PATH = original_db_path


class TestGetLatencyStats:
    async def test_get_latency_stats_empty(self, temp_db_path):
        original_db_path = main_module.DB_PATH
        main_module.DB_PATH = temp_db_path

        try:
            await init_database()
            stats = await get_latency_stats()
            assert stats["total_calls"] == 0
            assert stats["avg_latency_ms"] is None
            assert stats["successful_calls"] == 0
            assert stats["failed_calls"] == 0
            assert stats["success_rate"] == 0
        finally:
            main_module.DB_PATH = original_db_path

    async def test_get_latency_stats_with_data(self, temp_db_path):
        original_db_path = main_module.DB_PATH
        main_module.DB_PATH = temp_db_path

        try:
            await init_database()

            await save_latency_log(
                endpoint="/devices",
                latency_ms=100.0,
                status_code=200,
                success=True,
            )
            await save_latency_log(
                endpoint="/devices",
                latency_ms=200.0,
                status_code=200,
                success=True,
            )
            await save_latency_log(
                endpoint="/devices",
                latency_ms=300.0,
                status_code=500,
                success=False,
            )

            stats = await get_latency_stats()
            assert stats["total_calls"] == 3
            assert stats["avg_latency_ms"] == 200.0
            assert stats["min_latency_ms"] == 100.0
            assert stats["max_latency_ms"] == 300.0
            assert stats["successful_calls"] == 2
            assert stats["failed_calls"] == 1
            assert abs(stats["success_rate"] - 66.666) < 1
        finally:
            main_module.DB_PATH = original_db_path

    async def test_get_latency_stats_with_time_filter(self, temp_db_path):
        original_db_path = main_module.DB_PATH
        main_module.DB_PATH = temp_db_path

        try:
            await init_database()

            await save_latency_log(
                endpoint="/devices",
                latency_ms=100.0,
                status_code=200,
                success=True,
            )

            now = datetime.now(timezone.utc)
            stats = await get_latency_stats(
                start_time=now - timedelta(minutes=5),
                end_time=now + timedelta(minutes=5),
            )
            assert stats["total_calls"] == 1

            stats = await get_latency_stats(
                start_time=now + timedelta(hours=1),
            )
            assert stats["total_calls"] == 0
        finally:
            main_module.DB_PATH = original_db_path


class TestCleanupOldLatencyLogs:
    async def test_cleanup_old_latency_logs(self, temp_db_path):
        original_db_path = main_module.DB_PATH
        main_module.DB_PATH = temp_db_path

        try:
            await init_database()

            import aiosqlite

            now = datetime.now(timezone.utc)
            old_timestamp = (now - timedelta(days=60)).isoformat()
            recent_timestamp = (now - timedelta(days=1)).isoformat()

            async with aiosqlite.connect(temp_db_path) as db:
                await db.execute(
                    "INSERT INTO latency_logs (endpoint, timestamp, latency_ms, status_code, success) VALUES (?, ?, ?, ?, ?)",
                    ("/devices", old_timestamp, 100.0, 200, 1),
                )
                await db.execute(
                    "INSERT INTO latency_logs (endpoint, timestamp, latency_ms, status_code, success) VALUES (?, ?, ?, ?, ?)",
                    ("/devices", recent_timestamp, 200.0, 200, 1),
                )
                await db.commit()

            await cleanup_old_latency_logs()

            async with aiosqlite.connect(temp_db_path) as db:
                cursor = await db.execute("SELECT COUNT(*) FROM latency_logs")
                result = await cursor.fetchone()
                assert result[0] == 1
        finally:
            main_module.DB_PATH = original_db_path


class TestLatencyLogModel:
    def test_latency_log_creation(self):
        log = LatencyLog(
            endpoint="/devices",
            timestamp=datetime.now(timezone.utc),
            latency_ms=150.5,
            status_code=200,
            success=True,
        )
        assert log.id is None
        assert log.endpoint == "/devices"
        assert log.device_id is None
        assert log.error_message is None

    def test_latency_log_with_all_fields(self):
        now = datetime.now(timezone.utc)
        log = LatencyLog(
            id=1,
            endpoint="/devices/status",
            device_id="device-001",
            timestamp=now,
            latency_ms=250.0,
            status_code=500,
            success=False,
            error_message="Server Error",
        )
        assert log.id == 1
        assert log.device_id == "device-001"
        assert log.error_message == "Server Error"
