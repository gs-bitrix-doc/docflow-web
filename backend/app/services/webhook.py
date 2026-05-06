from __future__ import annotations

import hashlib
import hmac


def build_github_signature(secret: str, body: bytes) -> str:
    digest = hmac.new(secret.encode("utf-8"), body, hashlib.sha256).hexdigest()
    return f"sha256={digest}"


def is_valid_github_signature(secret: str, body: bytes, received_signature: str | None) -> bool:
    if not received_signature:
        return False

    expected_signature = build_github_signature(secret, body)
    return hmac.compare_digest(expected_signature, received_signature)
