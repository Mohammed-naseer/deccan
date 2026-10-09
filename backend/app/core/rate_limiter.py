"""
Deccan Space Works — Production Rate Limiter & Abuse Protection
Provides thread-safe, sliding-window rate limiting for sensitive endpoints:
- Admin login brute-force protection
- Public lead forms spam prevention (contacts, site visits, reviews)
"""

import time
import threading
from collections import defaultdict
from fastapi import Request, HTTPException, status

class SlidingWindowRateLimiter:
    def __init__(self):
        self._lock = threading.Lock()
        self._requests = defaultdict(list)
        self._last_clean = time.time()

    def is_allowed(self, key: str, max_requests: int, window_seconds: int) -> bool:
        now = time.time()
        cutoff = now - window_seconds

        with self._lock:
            # Periodic cleanup of expired keys every 60 seconds
            if now - self._last_clean > 60:
                self._cleanup(now)
                self._last_clean = now

            timestamps = self._requests[key]
            # Prune old timestamps for this key
            self._requests[key] = [t for t in timestamps if t > cutoff]

            if len(self._requests[key]) >= max_requests:
                return False

            self._requests[key].append(now)
            return True

    def _cleanup(self, now: float):
        # Remove empty or completely expired entries to prevent memory leak
        expired_keys = [k for k, v in self._requests.items() if not v or v[-1] < (now - 3600)]
        for k in expired_keys:
            del self._requests[k]

    def reset_key(self, key: str):
        with self._lock:
            if key in self._requests:
                del self._requests[key]

# Singleton instance
limiter = SlidingWindowRateLimiter()

def get_client_ip(request: Request) -> str:
    """Safely extract client IP from forward headers or direct client."""
    forwarded = request.headers.get("X-Forwarded-For")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return request.client.host if request.client else "127.0.0.1"

async def rate_limit_admin_login(request: Request):
    """Rate limit admin login attempts: 10 requests/min per IP to stop brute-force."""
    ip = get_client_ip(request)
    key = f"admin_login:{ip}"
    if not limiter.is_allowed(key, max_requests=10, window_seconds=60):
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail={
                "success": False,
                "message": "Too many login attempts. Please wait a minute and try again.",
                "errorCode": "RATE_LIMIT_EXCEEDED"
            }
        )

async def rate_limit_public_submission(request: Request):
    """Rate limit public lead capture forms: 15 submissions/min per IP."""
    ip = get_client_ip(request)
    path = request.url.path
    key = f"public_form:{path}:{ip}"
    if not limiter.is_allowed(key, max_requests=15, window_seconds=60):
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail={
                "success": False,
                "message": "Too many requests. Please wait a moment before submitting again.",
                "errorCode": "RATE_LIMIT_EXCEEDED"
            }
        )
