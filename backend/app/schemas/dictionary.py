from __future__ import annotations

from datetime import datetime
from typing import Literal
from uuid import UUID

from pydantic import BaseModel, ConfigDict

DictionaryType = Literal[
    "dictionary",
    "glossary",
    "static_terms",
    "section_headings",
    "note_titles",
    "include_labels",
    "prompt",
]
DictionaryEntrySource = Literal["base", "user"]


class DictionaryEntryRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    key: str
    value: str
    source: DictionaryEntrySource
    entry_id: UUID | None
    updated_by: str | None
    updated_at: datetime | None


class DictionaryResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    dict_type: DictionaryType
    entries: list[DictionaryEntryRead]


class DictionaryEntryCreate(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    key: str
    value: str


class DictionaryEntryUpdate(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    value: str
