from __future__ import annotations

from pydantic import BaseModel, ConfigDict


class TasksPerDayPoint(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    date: str
    count: int


class TopErrorStat(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    error_type: str
    count: int


class AnalyticsResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    total_tasks: int
    success_rate: float
    avg_duration_seconds: float
    tasks_by_status: dict[str, int]
    tasks_per_day: list[TasksPerDayPoint]
    top_errors: list[TopErrorStat]
