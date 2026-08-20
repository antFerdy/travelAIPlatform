from typing import Protocol

import httpx

from app.config import Settings
from app.schemas import Country, Tour, TourSearchFilters


class BackendUnavailableError(RuntimeError):
    pass


class TourNotFoundError(LookupError):
    pass


class TourGateway(Protocol):
    async def search(self, filters: TourSearchFilters) -> list[Tour]: ...

    async def get_by_id(self, tour_id: int) -> Tour: ...


class HttpTourGateway:
    def __init__(
        self,
        base_url: str,
        timeout_seconds: float,
        transport: httpx.AsyncBaseTransport | None = None,
    ) -> None:
        self.base_url = base_url
        self.timeout_seconds = timeout_seconds
        self.transport = transport

    async def search(self, filters: TourSearchFilters) -> list[Tour]:
        country_id = await self._resolve_country_id(filters.country)
        if filters.country is not None and country_id is None:
            return []

        params = filters.model_dump(
            exclude={"country"},
            exclude_none=True,
            mode="json",
        )
        if country_id is not None:
            params["country_id"] = country_id

        payload = await self._get("/api/v1/tours", params=params)
        if not isinstance(payload, dict) or not isinstance(payload.get("items"), list):
            raise BackendUnavailableError("Backend returned an invalid tours page")
        return [Tour.model_validate(item) for item in payload["items"]]

    async def get_by_id(self, tour_id: int) -> Tour:
        payload = await self._get(
            f"/api/v1/tours/{tour_id}",
            not_found_message=f"Tour {tour_id} was not found",
        )
        if not isinstance(payload, dict):
            raise BackendUnavailableError("Backend returned an invalid tour")
        return Tour.model_validate(payload)

    async def _resolve_country_id(self, country: str | None) -> int | None:
        if country is None:
            return None
        payload = await self._get("/api/v1/countries")
        if not isinstance(payload, list):
            raise BackendUnavailableError("Backend returned invalid countries")
        search_value = country.casefold()
        for item in payload:
            parsed = Country.model_validate(item)
            if parsed.name.casefold() == search_value or parsed.code.casefold() == search_value:
                return parsed.id
        return None

    async def _get(
        self,
        path: str,
        params: dict[str, object] | None = None,
        not_found_message: str | None = None,
    ) -> object:
        try:
            async with httpx.AsyncClient(
                base_url=self.base_url,
                timeout=self.timeout_seconds,
                transport=self.transport,
            ) as client:
                response = await client.get(path, params=params)
                if response.status_code == 404 and not_found_message is not None:
                    raise TourNotFoundError(not_found_message)
                response.raise_for_status()
                return response.json()
        except (httpx.HTTPError, ValueError) as exc:
            raise BackendUnavailableError("Tour backend is unavailable") from exc


def build_tour_gateway(settings: Settings) -> TourGateway:
    return HttpTourGateway(
        settings.backend_url,
        timeout_seconds=settings.request_timeout_seconds,
    )
