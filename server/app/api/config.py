"""
Environment Config API - View application configuration and environment.

Features:
- View application settings (masked sensitive values)
- View environment variables
- Runtime information (Python version, platform, etc.)
- Configuration validation status
"""

import os
import sys
import platform
from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Depends
from pydantic import BaseModel

from ..api.dbexplorer import require_debug
from ..core.config import settings

router = APIRouter(prefix="/api/config", tags=["config"])

# Sensitive field patterns to mask
SENSITIVE_PATTERNS = [
    "password",
    "secret",
    "key",
    "token",
    "credential",
    "auth",
    "api_key",
    "apikey",
    "private",
]

# Environment variables to hide completely
HIDDEN_ENV_VARS = [
    "PATH",
    "PATHEXT",
    "SYSTEMROOT",
    "WINDIR",
    "COMSPEC",
    "PROGRAMFILES",
    "PROGRAMDATA",
    "APPDATA",
    "LOCALAPPDATA",
    "USERPROFILE",
    "HOMEDRIVE",
    "HOMEPATH",
    "TEMP",
    "TMP",
    "SYSTEMDRIVE",
    "PROCESSOR_IDENTIFIER",
    "PROCESSOR_ARCHITECTURE",
    "PROCESSOR_LEVEL",
    "PROCESSOR_REVISION",
    "NUMBER_OF_PROCESSORS",
    "OS",
    "COMPUTERNAME",
    "USERNAME",
    "USERDOMAIN",
]


class ConfigValue(BaseModel):
    """A configuration value."""
    key: str
    value: str
    category: str
    is_sensitive: bool = False
    is_default: bool = False
    description: Optional[str] = None


class RuntimeInfo(BaseModel):
    """Runtime environment information."""
    python_version: str
    platform: str
    platform_release: str
    platform_version: str
    architecture: str
    hostname: str
    cpu_count: Optional[int]
    pid: int
    cwd: str
    start_time: str


class ConfigStats(BaseModel):
    """Configuration statistics."""
    total_settings: int
    total_env_vars: int
    sensitive_count: int
    categories: dict[str, int]


def is_sensitive(key: str) -> bool:
    """Check if a key is sensitive and should be masked."""
    key_lower = key.lower()
    return any(pattern in key_lower for pattern in SENSITIVE_PATTERNS)


def mask_value(value: str) -> str:
    """Mask a sensitive value."""
    if not value:
        return "(empty)"
    if len(value) <= 4:
        return "*" * len(value)
    return value[:2] + "*" * (len(value) - 4) + value[-2:]


def get_setting_description(key: str) -> Optional[str]:
    """Get a description for a setting key."""
    descriptions = {
        "app_name": "Application display name",
        "app_version": "Current application version",
        "debug": "Enable debug mode with extra logging",
        "host": "Server bind address",
        "port": "Server port number",
        "postgres_host": "PostgreSQL server hostname",
        "postgres_port": "PostgreSQL server port",
        "postgres_user": "Database username",
        "postgres_password": "Database password",
        "postgres_db": "Database name",
        "redis_host": "Redis server hostname",
        "redis_port": "Redis server port",
        "redis_password": "Redis authentication password",
        "jwt_secret_key": "Secret key for JWT token signing",
        "jwt_algorithm": "JWT signing algorithm",
        "jwt_expire_minutes": "JWT token expiration time in minutes",
        "cors_origins": "Allowed CORS origins for API access",
    }
    return descriptions.get(key)


@router.get("")
async def get_config(_: None = Depends(require_debug)):
    """Get all configuration values."""
    config_values = []

    # Application settings from pydantic model
    settings_dict = {
        "app_name": settings.app_name,
        "app_version": settings.app_version,
        "debug": str(settings.debug),
        "host": settings.host,
        "port": str(settings.port),
        "postgres_host": settings.postgres_host,
        "postgres_port": str(settings.postgres_port),
        "postgres_user": settings.postgres_user,
        "postgres_password": settings.postgres_password,
        "postgres_db": settings.postgres_db,
        "redis_host": settings.redis_host,
        "redis_port": str(settings.redis_port),
        "redis_password": settings.redis_password or "(not set)",
        "jwt_secret_key": settings.jwt_secret_key,
        "jwt_algorithm": settings.jwt_algorithm,
        "jwt_expire_minutes": str(settings.jwt_expire_minutes),
        "cors_origins": ", ".join(settings.cors_origins),
    }

    # Define categories
    categories = {
        "Application": ["app_name", "app_version", "debug"],
        "Server": ["host", "port", "cors_origins"],
        "Database": ["postgres_host", "postgres_port", "postgres_user", "postgres_password", "postgres_db"],
        "Redis": ["redis_host", "redis_port", "redis_password"],
        "Authentication": ["jwt_secret_key", "jwt_algorithm", "jwt_expire_minutes"],
    }

    # Build config values list
    for category, keys in categories.items():
        for key in keys:
            if key in settings_dict:
                sensitive = is_sensitive(key)
                value = settings_dict[key]

                config_values.append(ConfigValue(
                    key=key,
                    value=mask_value(value) if sensitive else value,
                    category=category,
                    is_sensitive=sensitive,
                    description=get_setting_description(key),
                ))

    return {
        "settings": [v.model_dump() for v in config_values],
        "total": len(config_values),
    }


@router.get("/env")
async def get_env_vars(_: None = Depends(require_debug)):
    """Get environment variables (filtered and masked)."""
    env_vars = []

    for key, value in sorted(os.environ.items()):
        # Skip hidden system vars
        if key.upper() in HIDDEN_ENV_VARS:
            continue

        # Skip very long values (like PATH)
        if len(value) > 500:
            continue

        sensitive = is_sensitive(key)

        env_vars.append({
            "key": key,
            "value": mask_value(value) if sensitive else value,
            "is_sensitive": sensitive,
        })

    return {
        "env_vars": env_vars,
        "total": len(env_vars),
        "hidden": len(HIDDEN_ENV_VARS),
    }


@router.get("/runtime")
async def get_runtime_info(_: None = Depends(require_debug)):
    """Get runtime environment information."""
    return RuntimeInfo(
        python_version=sys.version,
        platform=platform.system(),
        platform_release=platform.release(),
        platform_version=platform.version(),
        architecture=platform.machine(),
        hostname=platform.node(),
        cpu_count=os.cpu_count(),
        pid=os.getpid(),
        cwd=os.getcwd(),
        start_time=datetime.utcnow().isoformat() + "Z",
    )


@router.get("/stats")
async def get_config_stats(_: None = Depends(require_debug)):
    """Get configuration statistics."""
    # Count settings by category
    categories = {
        "Application": 3,
        "Server": 3,
        "Database": 5,
        "Redis": 3,
        "Authentication": 3,
    }

    # Count env vars
    env_count = sum(
        1 for key in os.environ.keys()
        if key.upper() not in HIDDEN_ENV_VARS
    )

    # Count sensitive
    sensitive_settings = sum(
        1 for key in [
            "postgres_password", "redis_password",
            "jwt_secret_key"
        ]
    )

    return ConfigStats(
        total_settings=sum(categories.values()),
        total_env_vars=env_count,
        sensitive_count=sensitive_settings,
        categories=categories,
    )


@router.get("/validate")
async def validate_config(_: None = Depends(require_debug)):
    """Validate configuration and check for issues."""
    issues = []
    warnings = []

    # Check debug mode
    if settings.debug:
        warnings.append({
            "key": "debug",
            "message": "Debug mode is enabled - disable in production",
            "severity": "warning",
        })

    # Check JWT secret
    if "change-this" in settings.jwt_secret_key.lower():
        issues.append({
            "key": "jwt_secret_key",
            "message": "Using default JWT secret - change in production",
            "severity": "error",
        })

    # Check database password
    if settings.postgres_password == "roguelike_secret":
        warnings.append({
            "key": "postgres_password",
            "message": "Using default database password",
            "severity": "warning",
        })

    # Check host binding
    if settings.host == "0.0.0.0":
        warnings.append({
            "key": "host",
            "message": "Server binds to all interfaces - restrict in production",
            "severity": "info",
        })

    # Check CORS origins
    if len(settings.cors_origins) > 5:
        warnings.append({
            "key": "cors_origins",
            "message": f"Many CORS origins configured ({len(settings.cors_origins)})",
            "severity": "info",
        })

    return {
        "valid": len(issues) == 0,
        "issues": issues,
        "warnings": warnings,
        "total_issues": len(issues),
        "total_warnings": len(warnings),
    }


@router.get("/connections")
async def get_connection_strings(_: None = Depends(require_debug)):
    """Get connection strings (masked)."""
    return {
        "database_url": mask_value(settings.database_url),
        "database_url_sync": mask_value(settings.database_url_sync),
        "redis_url": mask_value(settings.redis_url),
    }


@router.post("/reveal/{key}")
async def reveal_value(
    key: str,
    _: None = Depends(require_debug),
):
    """Reveal a masked configuration value (debug only)."""
    # Map of revealable keys to their values
    revealable = {
        "postgres_password": settings.postgres_password,
        "redis_password": settings.redis_password,
        "jwt_secret_key": settings.jwt_secret_key,
        "database_url": settings.database_url,
        "redis_url": settings.redis_url,
    }

    if key not in revealable:
        return {"error": "Key not found or not revealable"}

    return {
        "key": key,
        "value": revealable[key] or "(not set)",
        "warning": "This value is sensitive - do not share or log",
    }
