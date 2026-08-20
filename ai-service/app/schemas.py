from datetime import date, datetime

from pydantic import BaseModel, Field, field_validator


class ChatRequest(BaseModel):
    session_id: str = Field(
        min_length=1,
        max_length=100,
        pattern=r"^[A-Za-z0-9_-]+$",
    )
    message: str = Field(min_length=1, max_length=2000)

    @field_validator("message")
    @classmethod
    def message_must_not_be_blank(cls, value: str) -> str:
        if not value.strip():
            raise ValueError("message must not be blank")
        return value.strip()


class ChatResponse(BaseModel):
    session_id: str
    message: str


class Country(BaseModel):
    id: int
    name: str
    code: str


class Tour(BaseModel):
    id: int
    title: str
    description: str
    country_id: int
    price: float = Field(gt=0)
    currency: str
    start_date: date
    end_date: date
    duration_days: int = Field(gt=0)
    category: str | None = None
    image_url: str | None = None
    created_at: datetime


class TourSearchFilters(BaseModel):
    country: str | None = None
    min_price: float | None = Field(default=None, ge=0)
    max_price: float | None = Field(default=None, gt=0)
    date_from: date | None = None
    date_to: date | None = None
    page: int = Field(default=1, ge=1)
    limit: int = Field(default=20, ge=1, le=100)
