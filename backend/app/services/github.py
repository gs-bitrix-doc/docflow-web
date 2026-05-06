from __future__ import annotations

import base64
import binascii
from dataclasses import dataclass
from urllib.parse import quote

import httpx

GITHUB_API_BASE_URL = "https://api.github.com"


@dataclass(slots=True)
class GitHubAPIError(Exception):
    status_code: int
    detail: str

    def __post_init__(self) -> None:
        Exception.__init__(self, self.detail)

    def __str__(self) -> str:
        return self.detail


class GitHubClient:
    def __init__(self, access_token: str) -> None:
        self._access_token = access_token

    @property
    def _headers(self) -> dict[str, str]:
        return {
            "Accept": "application/vnd.github+json",
            "Authorization": f"Bearer {self._access_token}",
        }

    async def _get(self, url: str, *, params: dict[str, str] | None = None) -> httpx.Response:
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                return await client.get(url, headers=self._headers, params=params)
        except httpx.HTTPError:
            raise GitHubAPIError(status_code=502, detail="GitHub request failed") from None

    async def _put(self, url: str, *, json: dict[str, str]) -> httpx.Response:
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                return await client.put(url, headers=self._headers, json=json)
        except httpx.HTTPError:
            raise GitHubAPIError(status_code=502, detail="GitHub request failed") from None

    @staticmethod
    def _raise_for_error(response: httpx.Response) -> None:
        if response.status_code < 400:
            return

        detail = "GitHub request failed"
        try:
            payload = response.json()
        except ValueError:
            payload = None

        if isinstance(payload, dict) and payload.get("message"):
            detail = str(payload["message"])

        raise GitHubAPIError(status_code=response.status_code, detail=detail)

    @staticmethod
    def _decode_content(encoded_content: str) -> str:
        try:
            raw_content = base64.b64decode(encoded_content.replace("\n", ""), validate=True)
        except binascii.Error as exc:
            raise GitHubAPIError(
                status_code=502,
                detail="GitHub returned invalid base64 content",
            ) from exc

        try:
            return raw_content.decode("utf-8")
        except UnicodeDecodeError as exc:
            raise GitHubAPIError(
                status_code=502,
                detail="GitHub returned a non-UTF-8 file",
            ) from exc

    async def get_file_content(self, repo: str, path: str, ref: str) -> tuple[str, str]:
        repo_name = quote(repo, safe="/")
        file_path = quote(path, safe="/")
        response = await self._get(
            f"{GITHUB_API_BASE_URL}/repos/{repo_name}/contents/{file_path}",
            params={"ref": ref},
        )
        self._raise_for_error(response)

        payload = response.json()
        encoded_content = payload.get("content")
        sha = payload.get("sha")
        if not encoded_content or not sha:
            raise GitHubAPIError(status_code=502, detail="GitHub returned an invalid file payload")

        return self._decode_content(str(encoded_content)), str(sha)

    async def get_file_sha(self, repo: str, path: str, ref: str) -> str | None:
        repo_name = quote(repo, safe="/")
        file_path = quote(path, safe="/")
        response = await self._get(
            f"{GITHUB_API_BASE_URL}/repos/{repo_name}/contents/{file_path}",
            params={"ref": ref},
        )
        if response.status_code == 404:
            return None

        self._raise_for_error(response)
        payload = response.json()
        sha = payload.get("sha")
        if not sha:
            raise GitHubAPIError(status_code=502, detail="GitHub returned an invalid file payload")
        return str(sha)

    async def get_repo_tree(self, repo: str, ref: str, path: str = "") -> list[str]:
        repo_name = quote(repo, safe="/")
        response = await self._get(
            f"{GITHUB_API_BASE_URL}/repos/{repo_name}/git/trees/{quote(ref, safe='')}",
            params={"recursive": "1"},
        )
        self._raise_for_error(response)

        tree_payload = response.json()
        if tree_payload.get("truncated"):
            raise GitHubAPIError(
                status_code=502,
                detail="Repository tree is too large to list",
            )

        normalized_path = path.strip("/")
        prefix = f"{normalized_path}/" if normalized_path else ""

        files: list[str] = []
        for item in tree_payload.get("tree", []):
            item_path = item.get("path")
            if item.get("type") != "blob" or not isinstance(item_path, str):
                continue
            if prefix and not item_path.startswith(prefix):
                continue
            if not item_path.lower().endswith(".md"):
                continue
            files.append(item_path)

        return sorted(files)

    async def create_or_update_file(
        self,
        *,
        repo: str,
        path: str,
        message: str,
        content: str,
        sha: str | None,
        branch: str,
    ) -> str:
        repo_name = quote(repo, safe="/")
        file_path = quote(path, safe="/")
        payload: dict[str, str] = {
            "message": message,
            "content": base64.b64encode(content.encode("utf-8")).decode("utf-8"),
            "branch": branch,
        }
        if sha is not None:
            payload["sha"] = sha

        response = await self._put(
            f"{GITHUB_API_BASE_URL}/repos/{repo_name}/contents/{file_path}",
            json=payload,
        )
        self._raise_for_error(response)

        commit_sha = response.json().get("commit", {}).get("sha")
        if not commit_sha:
            raise GitHubAPIError(
                status_code=502,
                detail="GitHub returned an invalid commit payload",
            )
        return str(commit_sha)

    async def get_user_repos(self) -> list[str]:
        repos: list[str] = []
        page = 1

        while True:
            response = await self._get(
                f"{GITHUB_API_BASE_URL}/user/repos",
                params={"per_page": "100", "page": str(page)},
            )
            self._raise_for_error(response)

            payload = response.json()
            if not payload:
                return repos

            for repo_data in payload:
                if repo_data.get("archived"):
                    continue

                full_name = repo_data.get("full_name")
                if isinstance(full_name, str):
                    repos.append(full_name)

            page += 1
