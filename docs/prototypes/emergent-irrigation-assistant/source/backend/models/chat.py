import uuid
from datetime import datetime, timezone
from typing import Literal

from pydantic import BaseModel, Field


def now_utc() -> datetime:
    return datetime.now(timezone.utc)


class SiteParams(BaseModel):
    area_m2: float | None = None
    dimensions: str | None = None
    water_source: str | None = None
    pressure_bar: float | None = None
    flow_lpm: float | None = None
    location: str | None = None
    terrain: str | None = None
    plants: str | None = None


# Fields the assistant must collect before a preliminary layout makes sense.
REQUIRED_SITE_FIELDS: dict[str, str] = {
    "area_m2": "Площадь газона (м²)",
    "water_source": "Источник воды",
    "pressure_bar": "Давление (бар)",
    "flow_lpm": "Дебит / расход (л/мин)",
    "location": "Населённый пункт",
}

SITE_FIELD_LABELS: dict[str, str] = {
    **REQUIRED_SITE_FIELDS,
    "dimensions": "Размеры участка",
    "terrain": "Рельеф и почва",
    "plants": "Что поливаем",
}

Guidance = Literal["preliminary", "engineering", "info"]


class Message(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    conversation_id: str
    role: Literal["user", "assistant"]
    content: str
    guidance: Guidance | None = None
    sources: list[str] = []
    created_at: datetime = Field(default_factory=now_utc)


class Conversation(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title: str = "Новый диалог"
    is_sample: bool = False
    site: SiteParams = Field(default_factory=SiteParams)
    message_count: int = 0
    created_at: datetime = Field(default_factory=now_utc)
    updated_at: datetime = Field(default_factory=now_utc)


class ConversationDetail(Conversation):
    messages: list[Message] = []


class MessageCreate(BaseModel):
    text: str = Field(min_length=1, max_length=4000)
