import os
from pathlib import Path
import sys

import pytest
from agents.mcp import MCPServerStdio


PROJECT_ROOT = Path(__file__).parents[1]


@pytest.mark.asyncio
async def test_mcp_server_exposes_expected_tools() -> None:
    server = MCPServerStdio(
        name="tour-test",
        params={
            "command": sys.executable,
            "args": ["-m", "app.mcp_server"],
            "cwd": str(PROJECT_ROOT),
            "env": {**os.environ, "BACKEND_URL": "http://go-backend.test"},
        },
    )

    async with server:
        names = {tool.name for tool in await server.list_tools()}

    assert names == {"search_tours", "get_tour_details", "compare_tours"}


@pytest.mark.asyncio
async def test_mcp_tool_schemas_match_backend_search_contract() -> None:
    server = MCPServerStdio(
        name="tour-schema-test",
        params={
            "command": sys.executable,
            "args": ["-m", "app.mcp_server"],
            "cwd": str(PROJECT_ROOT),
            "env": {**os.environ, "BACKEND_URL": "http://go-backend.test"},
        },
    )

    async with server:
        tools = {tool.name: tool for tool in await server.list_tools()}

    search_properties = tools["search_tours"].input_schema["properties"]
    assert set(search_properties) == {
        "country",
        "min_price",
        "max_price",
        "date_from",
        "date_to",
        "page",
        "limit",
    }
    assert tools["get_tour_details"].input_schema["properties"]["tour_id"]["type"] == "integer"
    assert tools["compare_tours"].input_schema["properties"]["tour_ids"]["items"]["type"] == "integer"
