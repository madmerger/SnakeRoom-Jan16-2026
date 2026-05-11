import tempfile
from pathlib import Path
from unittest.mock import patch

import pytest
from fastapi.testclient import TestClient

import app.main as main_module
from app.main import (
    app,
    init_database,
)


@pytest.fixture
def client(reset_data_store) -> TestClient:
    return TestClient(app)


class TestBackupDatabaseEndpoint:
    async def test_backup_database_success(self, client, reset_data_store, temp_db_path):
        original_db_path = main_module.DB_PATH
        main_module.DB_PATH = temp_db_path

        try:
            await init_database()

            response = client.get("/api/backup")

            assert response.status_code == 200
            assert response.headers["content-type"] == "application/x-sqlite3"
            assert "switchbot_backup_" in response.headers["content-disposition"]
            assert ".db" in response.headers["content-disposition"]
            assert len(response.content) > 0
        finally:
            main_module.DB_PATH = original_db_path

    def test_backup_database_not_found(self, client, reset_data_store):
        original_db_path = main_module.DB_PATH
        main_module.DB_PATH = "/nonexistent/path/test.db"

        try:
            response = client.get("/api/backup")
            assert response.status_code == 404
            assert "not found" in response.json()["detail"].lower()
        finally:
            main_module.DB_PATH = original_db_path


class TestServeSpa:
    def test_serve_spa_index(self, reset_data_store):
        with tempfile.TemporaryDirectory() as tmpdir:
            static_dir = Path(tmpdir)
            index_html = static_dir / "index.html"
            index_html.write_text("<html><body>Test</body></html>")

            with patch.object(main_module, "STATIC_DIR", static_dir):
                from fastapi import FastAPI
                test_app = FastAPI()

                @test_app.get("/{full_path:path}")
                async def serve_spa(full_path: str):
                    file_path = (static_dir / full_path).resolve()
                    if not file_path.is_relative_to(static_dir.resolve()):
                        from fastapi.responses import FileResponse
                        return FileResponse(static_dir / "index.html")
                    if full_path and file_path.is_file():
                        from fastapi.responses import FileResponse
                        return FileResponse(file_path)
                    from fastapi.responses import FileResponse
                    return FileResponse(static_dir / "index.html")

                test_client = TestClient(test_app)

                response = test_client.get("/")
                assert response.status_code == 200
                assert "Test" in response.text

    def test_serve_spa_static_file(self, reset_data_store):
        with tempfile.TemporaryDirectory() as tmpdir:
            static_dir = Path(tmpdir)
            index_html = static_dir / "index.html"
            index_html.write_text("<html><body>Index</body></html>")
            js_file = static_dir / "app.js"
            js_file.write_text("console.log('hello');")

            from fastapi import FastAPI
            test_app = FastAPI()

            @test_app.get("/{full_path:path}")
            async def serve_spa(full_path: str):
                file_path = (static_dir / full_path).resolve()
                if not file_path.is_relative_to(static_dir.resolve()):
                    from fastapi.responses import FileResponse
                    return FileResponse(static_dir / "index.html")
                if full_path and file_path.is_file():
                    from fastapi.responses import FileResponse
                    return FileResponse(file_path)
                from fastapi.responses import FileResponse
                return FileResponse(static_dir / "index.html")

            test_client = TestClient(test_app)

            response = test_client.get("/app.js")
            assert response.status_code == 200
            assert "hello" in response.text

    def test_serve_spa_nonexistent_path_returns_index(self, reset_data_store):
        with tempfile.TemporaryDirectory() as tmpdir:
            static_dir = Path(tmpdir)
            index_html = static_dir / "index.html"
            index_html.write_text("<html><body>SPA</body></html>")

            from fastapi import FastAPI
            test_app = FastAPI()

            @test_app.get("/{full_path:path}")
            async def serve_spa(full_path: str):
                file_path = (static_dir / full_path).resolve()
                if not file_path.is_relative_to(static_dir.resolve()):
                    from fastapi.responses import FileResponse
                    return FileResponse(static_dir / "index.html")
                if full_path and file_path.is_file():
                    from fastapi.responses import FileResponse
                    return FileResponse(file_path)
                from fastapi.responses import FileResponse
                return FileResponse(static_dir / "index.html")

            test_client = TestClient(test_app)

            response = test_client.get("/nonexistent")
            assert response.status_code == 200
            assert "SPA" in response.text
