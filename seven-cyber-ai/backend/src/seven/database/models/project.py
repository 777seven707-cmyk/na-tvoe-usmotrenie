from __future__ import annotations

import enum
import uuid
from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import DateTime, Enum, ForeignKey, Index, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from seven.database.base import Base, TimestampMixin, UUIDPrimaryKeyMixin

if TYPE_CHECKING:
    from seven.database.models.user import User


class AutonomyMode(enum.StrEnum):
    OBSERVE = "observe"
    ANALYZE = "analyze"
    AUDIT = "audit"
    RESEARCH = "research"


class ProjectStatus(enum.StrEnum):
    ACTIVE = "active"
    ARCHIVED = "archived"


def _values(e: type[enum.Enum]) -> list[str]:
    return [str(m.value) for m in e]


class Project(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "projects"
    __table_args__ = (Index("ix_projects_owner_id_status", "owner_id", "status"),)

    owner_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False, default="")
    default_mode: Mapped[AutonomyMode] = mapped_column(
        Enum(AutonomyMode, name="autonomy_mode", values_callable=_values),
        nullable=False,
        default=AutonomyMode.OBSERVE,
    )
    status: Mapped[ProjectStatus] = mapped_column(
        Enum(ProjectStatus, name="project_status", values_callable=_values),
        nullable=False,
        default=ProjectStatus.ACTIVE,
    )
    archived_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))

    owner: Mapped[User] = relationship(back_populates="projects")
