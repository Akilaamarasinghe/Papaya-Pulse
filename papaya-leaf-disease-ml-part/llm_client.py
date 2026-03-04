"""
llm_client.py
=============
Thin wrapper around the OpenAI SDK that targets GitHub Models inference.

Endpoint : https://models.github.ai/inference
Auth     : GITHUB_TOKEN environment variable  (Personal-Access-Token with
           "Models: read" permission, OR a GitHub Codespaces token)
Model    : ADVISOR_MODEL env var, defaults to "openai/gpt-4.1-mini"

Usage
-----
    from llm_client import generate_advice_json

    result_dict = generate_advice_json(prompt_string)
"""

from __future__ import annotations

import json
import logging
import os
import time

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Client initialisation (module-level, lazy singleton pattern)
# ---------------------------------------------------------------------------
_client = None
_CLIENT_AVAILABLE = False

_GITHUB_TOKEN   = os.environ.get("GITHUB_TOKEN", "")
_DEFAULT_MODEL  = os.environ.get("ADVISOR_MODEL", "openai/gpt-4.1-mini")
_BASE_URL       = "https://models.github.ai/inference"


def _get_client():
    """Return the OpenAI client, initialising it on first call."""
    global _client, _CLIENT_AVAILABLE
    if _client is not None:
        return _client

    token = os.environ.get("GITHUB_TOKEN", "")          # re-read at call time
    if not token:
        logger.warning("[llm_client] GITHUB_TOKEN not set – AI enrichment disabled.")
        return None

    try:
        from openai import OpenAI  # noqa: PLC0415
        _client = OpenAI(
            base_url=_BASE_URL,
            api_key=token,
        )
        _CLIENT_AVAILABLE = True
        logger.info("[llm_client] GitHub Models client initialised (model=%s).", _DEFAULT_MODEL)
    except ImportError:
        logger.warning("[llm_client] openai package not installed – run: pip install openai")
        _client = None

    return _client


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------
def is_available() -> bool:
    """Return True if a GitHub token is present and openai is importable."""
    return bool(os.environ.get("GITHUB_TOKEN")) and _get_client() is not None


def generate_advice_json(
    prompt: str,
    model: str | None = None,
    retries: int = 2,
) -> dict:
    """
    Send *prompt* to GitHub Models and parse the JSON response.

    Parameters
    ----------
    prompt  : Full prompt string; must instruct the model to reply in JSON.
    model   : Override model name (defaults to ADVISOR_MODEL env var or
              'openai/gpt-4.1-mini').
    retries : Number of retry attempts on transient errors (exponential back-off).

    Returns
    -------
    dict – parsed JSON from the model, or empty dict on total failure.
    """
    client = _get_client()
    if client is None:
        return {}

    target_model = model or os.environ.get("ADVISOR_MODEL", _DEFAULT_MODEL)

    for attempt in range(retries + 1):
        try:
            response = client.chat.completions.create(
                model=target_model,
                messages=[
                    {
                        "role": "system",
                        "content": (
                            "You are a strict JSON-only responder. "
                            "Output ONLY a valid JSON object. No markdown, no extra text."
                        ),
                    },
                    {"role": "user", "content": prompt},
                ],
                response_format={"type": "json_object"},
                temperature=0.3,
                max_tokens=1200,
            )

            raw = response.choices[0].message.content or ""
            raw = raw.strip()

            # Strip accidental markdown fences (safety net)
            if raw.startswith("```"):
                parts = raw.split("```")
                raw = parts[1] if len(parts) >= 2 else raw
                if raw.startswith("json"):
                    raw = raw[4:]
                raw = raw.strip()

            return json.loads(raw)

        except json.JSONDecodeError as exc:
            logger.warning("[llm_client] JSON decode failed (attempt %d): %s", attempt + 1, exc)
            # Return the raw text so the caller can surface it
            return {"_raw": raw}

        except Exception as exc:  # noqa: BLE001
            logger.warning(
                "[llm_client] API call failed (attempt %d/%d): %s",
                attempt + 1, retries + 1, exc,
            )
            if attempt < retries:
                sleep_secs = 1.5 * (2 ** attempt)   # 1.5 s, 3 s, 6 s …
                logger.info("[llm_client] Retrying in %.1f s …", sleep_secs)
                time.sleep(sleep_secs)

    return {}
