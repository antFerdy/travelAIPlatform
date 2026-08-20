from datetime import date
import httpx
import pytest

from app.backend import (
    BackendUnavailableError,
    HttpTourGateway,
    TourNotFoundError,
    build_tour_gateway,
)
from app.config import Settings
from app.schemas import Tour, TourSearchFilters


TOUR_PAYLOAD = {
    "id": 1,
    "title": "Семейный отдых в Анталии",
    "description": "Пляжный тур",
    "country_id": 10,
    "price": 420000,
    "currency": "KZT",
    "start_date": "2026-09-10",
    "end_date": "2026-09-17",
    "duration_days": 7,
    "category": "beach",
    "image_url": "https://example.test/antalya.jpg",
    "created_at": "2026-08-20T12:00:00Z",
}


def test_tour_accepts_backend_contract() -> None:
    tour = Tour.model_validate(TOUR_PAYLOAD)

    assert tour.id == 1
    assert tour.country_id == 10
    assert tour.currency == "KZT"


def test_gateway_always_targets_configured_backend() -> None:
    gateway = build_tour_gateway(
        Settings(backend_url="http://go-backend.test")
    )

    assert isinstance(gateway, HttpTourGateway)
    assert gateway.base_url == "http://go-backend.test"


@pytest.mark.asyncio
async def test_http_search_matches_go_api_contract() -> None:
    async def handler(request: httpx.Request) -> httpx.Response:
        if request.url.path == "/api/v1/countries":
            return httpx.Response(
                200,
                json=[{"id": 10, "name": "Турция", "code": "TR"}],
            )

        assert request.url.path == "/api/v1/tours"
        assert request.url.params["country_id"] == "10"
        assert request.url.params["max_price"] == "500000.0"
        assert request.url.params["date_from"] == "2026-09-01"
        assert request.url.params["date_to"] == "2026-09-30"
        assert request.url.params["page"] == "1"
        assert request.url.params["limit"] == "20"
        return httpx.Response(
            200,
            json={"items": [TOUR_PAYLOAD], "page": 1, "limit": 20, "total": 1},
        )

    gateway = HttpTourGateway(
        "http://go-backend.test",
        timeout_seconds=2,
        transport=httpx.MockTransport(handler),
    )

    result = await gateway.search(
        TourSearchFilters(
            country="Турция",
            max_price=500_000,
            date_from=date(2026, 9, 1),
            date_to=date(2026, 9, 30),
        )
    )

    assert [tour.id for tour in result] == [1]


@pytest.mark.asyncio
async def test_http_search_returns_empty_for_unknown_country() -> None:
    transport = httpx.MockTransport(
        lambda request: httpx.Response(
            200,
            json=[{"id": 10, "name": "Турция", "code": "TR"}],
        )
    )
    gateway = HttpTourGateway(
        "http://go-backend.test",
        timeout_seconds=2,
        transport=transport,
    )

    result = await gateway.search(TourSearchFilters(country="Япония"))

    assert result == []


@pytest.mark.asyncio
async def test_http_details_uses_versioned_tour_path() -> None:
    async def handler(request: httpx.Request) -> httpx.Response:
        assert request.url.path == "/api/v1/tours/1"
        return httpx.Response(200, json=TOUR_PAYLOAD)

    gateway = HttpTourGateway(
        "http://go-backend.test",
        timeout_seconds=2,
        transport=httpx.MockTransport(handler),
    )

    tour = await gateway.get_by_id(1)

    assert tour.title == "Семейный отдых в Анталии"


@pytest.mark.asyncio
async def test_http_details_preserves_tour_not_found_error() -> None:
    transport = httpx.MockTransport(
        lambda _: httpx.Response(404, json={"error": "tour 9999 not found"})
    )
    gateway = HttpTourGateway(
        "http://go-backend.test",
        timeout_seconds=2,
        transport=transport,
    )

    with pytest.raises(TourNotFoundError, match="Tour 9999 was not found"):
        await gateway.get_by_id(9999)


@pytest.mark.asyncio
async def test_http_search_surfaces_backend_failure() -> None:
    transport = httpx.MockTransport(lambda _: httpx.Response(503))
    gateway = HttpTourGateway(
        "http://go-backend.test",
        timeout_seconds=2,
        transport=transport,
    )

    with pytest.raises(BackendUnavailableError):
        await gateway.search(TourSearchFilters())
