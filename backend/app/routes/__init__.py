from .auth import router as auth_router
from .files import router as files_router
from .analytics import router as analytics_router
from .admin import router as admin_router

__all__ = ['auth_router', 'files_router', 'analytics_router', 'admin_router']
