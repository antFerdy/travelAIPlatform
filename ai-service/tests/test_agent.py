from collections.abc import Sequence
from pathlib import Path
from typing import Any

import pytest

from app.agent import TourAgentService
from app.agent import build_tour_agent_service
from app.config import Settings
from app.memory import ConversationMemory


class FakeRunner:
    def __init__(self, outputs: Sequence[str]) -> None:
        self.outputs = list(outputs)
        self.inputs: list[list[dict[str, Any]]] = []

    async def __call__(self, agent: object, items: list[dict[str, Any]]) -> str:
        self.inputs.append(items)
        return self.outputs.pop(0)


@pytest.mark.asyncio
async def test_agent_passes_same_session_history_to_runner(tmp_path: Path) -> None:
    runner = FakeRunner(["Уточните бюджет", "Нашёл варианты"])
    service = TourAgentService(
        memory=ConversationMemory(tmp_path / "memory.db"),
        agent=object(),
        run_agent=runner,
    )

    await service.answer("demo", "Хочу в Турцию")
    await service.answer("demo", "До 500000 тенге")

    assert runner.inputs[1] == [
        {"role": "user", "content": "Хочу в Турцию"},
        {"role": "assistant", "content": "Уточните бюджет"},
        {"role": "user", "content": "До 500000 тенге"},
    ]


@pytest.mark.asyncio
async def test_agent_does_not_share_history_between_sessions(tmp_path: Path) -> None:
    runner = FakeRunner(["Первый ответ", "Второй ответ"])
    service = TourAgentService(
        memory=ConversationMemory(tmp_path / "memory.db"),
        agent=object(),
        run_agent=runner,
    )

    await service.answer("first", "Хочу в Турцию")
    await service.answer("second", "Хочу в Грузию")

    assert runner.inputs[1] == [
        {"role": "user", "content": "Хочу в Грузию"},
    ]


def test_build_service_attaches_local_mcp_server(tmp_path: Path) -> None:
    service = build_tour_agent_service(
        Settings(
            memory_db_path=tmp_path / "memory.db",
        )
    )

    assert service.agent.name == "Tour Assistant"
    assert [server.name for server in service.agent.mcp_servers] == ["tour-catalog"]
