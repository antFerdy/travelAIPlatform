from contextlib import asynccontextmanager
import logging
from typing import AsyncIterator, Protocol

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from app.agent import AgentServiceError, build_tour_agent_service
from app.config import Settings
from app.schemas import ChatRequest, ChatResponse


logger = logging.getLogger(__name__)


class ChatService(Protocol):
    async def start(self) -> None: ...

    async def close(self) -> None: ...

    async def answer(self, session_id: str, message: str) -> str: ...


def create_app(
    chat_service: ChatService | None = None,
    settings: Settings | None = None,
) -> FastAPI:
    app_settings = settings or Settings()

    @asynccontextmanager
    async def lifespan(application: FastAPI) -> AsyncIterator[None]:
        service = chat_service or build_tour_agent_service(app_settings)
        await service.start()
        application.state.chat_service = service
        try:
            yield
        finally:
            await service.close()

    application = FastAPI(title="Tour AI Service", lifespan=lifespan)

    # Чат открывается в браузере, запрос к /chat идёт с origin фронтенда.
    application.add_middleware(
        CORSMiddleware,
        allow_origins=app_settings.allowed_origins,
        allow_origin_regex=app_settings.allowed_origin_regex,
        allow_methods=["GET", "POST"],
        allow_headers=["Content-Type"],
    )

    @application.get("/health")
    async def health() -> dict[str, str]:
        return {"status": "ok"}

    @application.post("/chat", response_model=ChatResponse)
    async def chat(request: ChatRequest) -> ChatResponse:
        service = getattr(application.state, "chat_service", chat_service)
        if service is None:
            raise HTTPException(status_code=503, detail="AI service is not configured")
        try:
            message = await service.answer(request.session_id, request.message)
        except AgentServiceError:
            logger.exception("Tour agent request failed")
            raise HTTPException(
                status_code=503,
                detail="AI service is temporarily unavailable",
            ) from None
        return ChatResponse(session_id=request.session_id, message=message)

    return application


app = create_app()
