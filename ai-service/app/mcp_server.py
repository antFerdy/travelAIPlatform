import asyncio
from datetime import date
import logging
from typing import Any

from mcp.server.mcpserver import MCPServer

from app.backend import build_tour_gateway
from app.config import Settings
from app.schemas import Tour, TourSearchFilters


logger = logging.getLogger(__name__)
settings = Settings()
gateway = build_tour_gateway(settings)
mcp = MCPServer(name="tour-catalog", log_level="WARNING")


def _serialize(tour: Tour) -> dict[str, Any]:
    return tour.model_dump(mode="json")


@mcp.tool(description="Найти доступные туры по стране, бюджету и датам.")
async def search_tours(
    country: str | None = None,
    min_price: float | None = None,
    max_price: float | None = None,
    date_from: date | None = None,
    date_to: date | None = None,
    page: int = 1,
    limit: int = 20,
) -> list[dict[str, Any]]:
    logger.info("MCP tool called: search_tours")
    filters = TourSearchFilters(
        country=country,
        min_price=min_price,
        max_price=max_price,
        date_from=date_from,
        date_to=date_to,
        page=page,
        limit=limit,
    )
    tours = await gateway.search(filters)
    return [_serialize(tour) for tour in tours]


@mcp.tool(description="Получить полную информацию о туре по его идентификатору.")
async def get_tour_details(tour_id: int) -> dict[str, Any]:
    logger.info("MCP tool called: get_tour_details")
    return _serialize(await gateway.get_by_id(tour_id))


@mcp.tool(description="Получить данные двух или трёх туров для сравнения.")
async def compare_tours(tour_ids: list[int]) -> list[dict[str, Any]]:
    logger.info("MCP tool called: compare_tours")
    unique_ids = list(dict.fromkeys(tour_ids))
    if not 2 <= len(unique_ids) <= 3:
        raise ValueError("compare_tours requires two or three unique tour IDs")
    tours = [await gateway.get_by_id(tour_id) for tour_id in unique_ids]
    return [_serialize(tour) for tour in tours]


if __name__ == "__main__":
    asyncio.run(mcp.run_stdio_async())
