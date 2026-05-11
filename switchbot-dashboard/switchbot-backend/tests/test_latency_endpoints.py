from datetime import datetime, timedelta, timezone

import pytest
from fastapi.testclient import TestClient

import app.main as main_module
from app.main import (
    app,
    init_database,
    save_latency_log,
)


@pytest.fixture
def client(reset_data_store) -> TestClient:
    return TestClient(app)


class TestGetLatencyLogsEndpoint:
    async def test_get_latency_logs_no_filters(self, client, reset_data_store, temp_db_path):
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

            response = client.get("/api/latency-logs")

            assert response.status_code == 200
            data = response.json()
            assert data["count"] == 1
            assert len(data["logs"]) == 1
            assert data["logs"][0]["endpoint"] == "/devices"
        finally:
            main_module.DB_PATH = original_db_path

    async def test_get_latency_logs_with_time_filters(self, client, reset_data_store, temp_db_path):
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
            start = (now - timedelta(hours=1)).strftime("%Y-%m-%dT%H:%M:%SZ")
            end = (now + timedelta(hours=1)).strftime("%Y-%m-%dT%H:%M:%SZ")

            response = client.get(f"/api/latency-logs?start_time={start}&end_time={end}")

            assert response.status_code == 200
            data = response.json()
            assert data["count"] == 1
        finally:
            main_module.DB_PATH = original_db_path

    async def test_get_latency_logs_with_endpoint_filter(self, client, reset_data_store, temp_db_path):
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

            response = client.get("/api/latency-logs?endpoint=/devices")

            assert response.status_code == 200
            data = response.json()
            assert data["count"] == 1
            assert data["logs"][0]["endpoint"] == "/devices"
        finally:
            main_module.DB_PATH = original_db_path

    async def test_get_latency_logs_with_device_filter(self, client, reset_data_store, temp_db_path):
        original_db_path = main_module.DB_PATH
        main_module.DB_PATH = temp_db_path

        try:
            await init_database()

            await save_latency_log(
                endpoint="/devices/status",
                latency_ms=100.0,
                status_code=200,
                success=True,
                device_id="dev-001",
            )

            response = client.get("/api/latency-logs?device_id=dev-001")

            assert response.status_code == 200
            data = response.json()
            assert data["count"] == 1
        finally:
            main_module.DB_PATH = original_db_path

    async def test_get_latency_logs_with_limit(self, client, reset_data_store, temp_db_path):
        original_db_path = main_module.DB_PATH
        main_module.DB_PATH = temp_db_path

        try:
            await init_database()

            for i in range(5):
                await save_latency_log(
                    endpoint="/devices",
                    latency_ms=float(i * 100),
                    status_code=200,
                    success=True,
                )

            response = client.get("/api/latency-logs?limit=2")

            assert response.status_code == 200
            data = response.json()
            assert data["count"] == 2
        finally:
            main_module.DB_PATH = original_db_path

    async def test_get_latency_logs_with_z_timezone(self, client, reset_data_store, temp_db_path):
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
            start = (now - timedelta(hours=1)).strftime("%Y-%m-%dT%H:%M:%SZ")
            end = (now + timedelta(hours=1)).strftime("%Y-%m-%dT%H:%M:%SZ")

            response = client.get(f"/api/latency-logs?start_time={start}&end_time={end}")

            assert response.status_code == 200
            data = response.json()
            assert data["count"] == 1
        finally:
            main_module.DB_PATH = original_db_path


class TestGetLatencyStatsEndpoint:
    async def test_get_latency_stats_no_filters(self, client, reset_data_store, temp_db_path):
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
                latency_ms=300.0,
                status_code=200,
                success=True,
            )

            response = client.get("/api/latency-stats")

            assert response.status_code == 200
            data = response.json()
            assert data["total_calls"] == 2
            assert data["avg_latency_ms"] == 200.0
            assert data["min_latency_ms"] == 100.0
            assert data["max_latency_ms"] == 300.0
            assert data["successful_calls"] == 2
            assert data["success_rate"] == 100.0
        finally:
            main_module.DB_PATH = original_db_path

    async def test_get_latency_stats_with_time_filters(self, client, reset_data_store, temp_db_path):
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
            start = (now - timedelta(hours=1)).strftime("%Y-%m-%dT%H:%M:%SZ")
            end = (now + timedelta(hours=1)).strftime("%Y-%m-%dT%H:%M:%SZ")

            response = client.get(f"/api/latency-stats?start_time={start}&end_time={end}")

            assert response.status_code == 200
            data = response.json()
            assert data["total_calls"] == 1
        finally:
            main_module.DB_PATH = original_db_path

    async def test_get_latency_stats_empty(self, client, reset_data_store, temp_db_path):
        original_db_path = main_module.DB_PATH
        main_module.DB_PATH = temp_db_path

        try:
            await init_database()

            response = client.get("/api/latency-stats")

            assert response.status_code == 200
            data = response.json()
            assert data["total_calls"] == 0
            assert data["success_rate"] == 0
        finally:
            main_module.DB_PATH = original_db_path

    async def test_get_latency_stats_with_z_timezone(self, client, reset_data_store, temp_db_path):
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
            start = (now - timedelta(hours=1)).strftime("%Y-%m-%dT%H:%M:%SZ")
            end = (now + timedelta(hours=1)).strftime("%Y-%m-%dT%H:%M:%SZ")

            response = client.get(f"/api/latency-stats?start_time={start}&end_time={end}")

            assert response.status_code == 200
            data = response.json()
            assert data["total_calls"] == 1
        finally:
            main_module.DB_PATH = original_db_path
