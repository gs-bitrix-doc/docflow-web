from __future__ import annotations

from app.services.webhook import build_github_signature, is_valid_github_signature


def test_hmac_valid():
    body = b'{"zen":"Keep it logically awesome."}'
    secret = "webhook-secret"
    signature = build_github_signature(secret, body)

    assert is_valid_github_signature(secret, body, signature) is True


def test_hmac_invalid():
    body = b'{"ref":"refs/heads/main"}'

    assert is_valid_github_signature("webhook-secret", body, "sha256=invalid") is False


def test_hmac_timing_safe(mocker):
    compare_digest = mocker.patch("app.services.webhook.hmac.compare_digest", return_value=False)
    body = b"payload"

    assert is_valid_github_signature("webhook-secret", body, "sha256=x") is False
    compare_digest.assert_called_once()

    expected_signature = build_github_signature("webhook-secret", body)
    received_signature = "sha256=x"
    assert compare_digest.call_args == mocker.call(expected_signature, received_signature)
