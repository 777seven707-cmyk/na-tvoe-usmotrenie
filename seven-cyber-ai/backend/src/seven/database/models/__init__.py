"""ORM models. Importing this package registers every table on ``Base.metadata``.

Phase 1 ships ``users`` and ``projects``. The remaining tables from the architecture
proposal (scope rules, approvals, jobs, findings, ...) arrive with the phases that use them.
"""

from seven.database.models.project import AutonomyMode, Project, ProjectStatus
from seven.database.models.user import User, UserRole

__all__ = ["AutonomyMode", "Project", "ProjectStatus", "User", "UserRole"]
