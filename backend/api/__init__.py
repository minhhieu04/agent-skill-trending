from api.skills import router as skills_router
from api.categories import router as categories_router
from api.preferences import router as preferences_router
from api.collect import router as collect_router
from api.auth import router as auth_router
from api.history import router as history_router
from api.bundles import router as bundles_router
from api.playground import router as playground_router
from api.studio import router as studio_router
from api.agent_chat import router as agent_chat_router
from api.daily_digest import router as daily_digest_router

__all__ = [
    "skills_router", 
    "categories_router", 
    "preferences_router", 
    "collect_router",
    "auth_router",
    "history_router",
    "bundles_router",
    "playground_router",
    "studio_router",
    "agent_chat_router",
    "daily_digest_router"
]
