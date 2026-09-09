from typing import Optional
from fastapi import Request

def _clean_ip(ip_str: str) -> str:
    """Cleans up IP strings by removing surrounding whitespace, ports, and bracketed IPv6 formatting."""
    ip = ip_str.strip()
    if not ip:
        return ""
    # Handle bracketed IPv6 with optional port: [2001:db8::1]:8080 or [::1]
    if ip.startswith("[") and "]" in ip:
        ip = ip[1:ip.index("]")]
    elif ":" in ip and ip.count(":") == 1:
        # IPv4 with port: 192.0.2.1:8080 -> 192.0.2.1
        ip = ip.split(":")[0].strip()
    return ip[:64]

def get_client_ip(request: Optional[Request] = None, fallback: str = "127.0.0.1") -> str:
    """
    Extracts client IP address from reverse proxy headers with standard fallback.
    Supported headers:
    1. CF-Connecting-IP (Cloudflare)
    2. X-Real-IP (Nginx / Caddy / Traefik)
    3. X-Forwarded-For (First non-empty valid client IP in proxy chain)
    4. request.client.host
    5. fallback string (default '127.0.0.1', or 'system:scheduler' for background tasks)
    """
    if not request:
        return fallback

    # 1. Cloudflare
    cf_ip = request.headers.get("CF-Connecting-IP")
    if cf_ip and cf_ip.strip():
        cleaned = _clean_ip(cf_ip)
        if cleaned:
            return cleaned

    # 2. X-Real-IP
    real_ip = request.headers.get("X-Real-IP")
    if real_ip and real_ip.strip():
        cleaned = _clean_ip(real_ip)
        if cleaned:
            return cleaned

    # 3. X-Forwarded-For (can contain multiple IPs: client, proxy1, proxy2)
    forwarded = request.headers.get("X-Forwarded-For")
    if forwarded and forwarded.strip():
        for candidate in forwarded.split(","):
            cleaned = _clean_ip(candidate)
            if cleaned:
                return cleaned

    # 4. Direct socket client host
    if request.client and request.client.host:
        cleaned = _clean_ip(request.client.host)
        if cleaned:
            return cleaned

    return fallback
