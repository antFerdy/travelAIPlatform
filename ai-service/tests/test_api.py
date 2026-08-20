from fastapi.testclient import TestClient

from app.main import create_app


class FakeChatService:
    async def start(self) -> None:
        return None

    async def close(self) -> None:
        return None

    async def answer(self, session_id: str, message: str) -> str:
        return f"Ответ для {session_id}: {message}"


def test_health_reports_service_is_ready() -> None:
    response = TestClient(create_app()).get("/health")

    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_chat_rejects_blank_message() -> None:
    response = TestClient(create_app()).post(
        "/chat",
        json={"session_id": "demo-1", "message": "   "},
    )

    assert response.status_code == 422


def test_chat_uses_injected_service() -> None:
    response = TestClient(create_app(chat_service=FakeChatService())).post(
        "/chat",
        json={"session_id": "demo", "message": "Привет"},
    )

    assert response.status_code == 200
    assert response.json() == {
        "session_id": "demo",
        "message": "Ответ для demo: Привет",
    }


def test_app_builds_default_service_during_lifespan(monkeypatch) -> None:
    fake_service = FakeChatService()
    monkeypatch.setattr(
        "app.main.build_tour_agent_service",
        lambda settings: fake_service,
    )

    with TestClient(create_app()) as client:
        response = client.post(
            "/chat",
            json={"session_id": "demo", "message": "Привет"},
        )

    assert response.status_code == 200
    assert response.json()["message"] == "Ответ для demo: Привет"
