#!/usr/bin/env python3
"""Dependency-free quality gate for the SparkleWash static website."""
from __future__ import annotations

from collections import Counter
from datetime import date, timedelta
from html.parser import HTMLParser
import json
from pathlib import Path
import re
import subprocess
import sys
from urllib.parse import unquote, urlsplit
import xml.etree.ElementTree as ET

ROOT = Path(__file__).resolve().parents[1]
BASE_URL = "https://sparklewash.nl"
BANNED_CLAIMS = (
    "5.0/5 op google",
    "5.0 op google",
    "zelfde dag service",
    "binnen 24-48 uur",
    "binnen 24u",
    "30 dagen garantie",
    "30 dagen tevredenheidsgarantie",
)
SEO_PAGES = {
    "index.html", "sofa.html", "carpet.html", "mattress.html", "car.html",
    "heerlen.html", "kerkrade.html", "maastricht.html", "sittard.html",
    "tapijtreiniging-limburg.html",
}
LOCAL_DUTCH_PAGES = {
    "heerlen.html", "kerkrade.html", "maastricht.html", "sittard.html",
    "tapijtreiniging-limburg.html",
}
PRIORITY_LOCAL_LINKS = {
    "heerlen.html", "kerkrade.html", "maastricht.html", "sittard.html",
    "tapijtreiniging-limburg.html",
}
SECRET_PATTERNS = {
    "private key": re.compile(r"BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY"),
    "GitHub token": re.compile(r"(?:github_pat_|ghp_)[A-Za-z0-9_]{20,}"),
    "Google API key": re.compile(r"AIza[0-9A-Za-z_-]{30,}"),
    "Slack token": re.compile(r"xox[baprs]-[A-Za-z0-9-]{10,}"),
}
FORBIDDEN_TRACKED_SUFFIXES = {".pem", ".key", ".p12", ".pfx", ".kdbx"}
REQUIRED_HTACCESS_TOKENS = (
    "Options -Indexes",
    'Strict-Transport-Security "max-age=31536000; includeSubDomains; preload"',
    "default-src 'self'",
    "base-uri 'self'",
    "object-src 'none'",
    "frame-ancestors 'none'",
    "https://formspree.io",
    'X-Frame-Options "DENY"',
    'X-Content-Type-Options "nosniff"',
    'Referrer-Policy "strict-origin-when-cross-origin"',
    "Permissions-Policy",
)


class PageParser(HTMLParser):
    def __init__(self) -> None:
        super().__init__(convert_charrefs=True)
        self.titles: list[str] = []
        self._in_title = False
        self._title_parts: list[str] = []
        self.meta: list[dict[str, str]] = []
        self.links: list[dict[str, str]] = []
        self.ids: set[str] = set()
        self.h1_count = 0
        self.h1_texts: list[str] = []
        self._in_h1 = False
        self._h1_parts: list[str] = []
        self.jsonld: list[str] = []
        self._in_jsonld = False
        self._jsonld_parts: list[str] = []

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        values = {key: value or "" for key, value in attrs}
        if values.get("id"):
            self.ids.add(values["id"])
        if tag == "title":
            self._in_title = True
            self._title_parts = []
        elif tag == "h1":
            self.h1_count += 1
            self._in_h1 = True
            self._h1_parts = []
        elif tag == "meta":
            self.meta.append(values)
        elif tag == "link":
            self.links.append(values)
        elif tag == "script" and values.get("type") == "application/ld+json":
            self._in_jsonld = True
            self._jsonld_parts = []

    def handle_endtag(self, tag: str) -> None:
        if tag == "title" and self._in_title:
            self.titles.append("".join(self._title_parts).strip())
            self._in_title = False
        elif tag == "h1" and self._in_h1:
            self.h1_texts.append("".join(self._h1_parts).strip())
            self._in_h1 = False
        elif tag == "script" and self._in_jsonld:
            self.jsonld.append("".join(self._jsonld_parts).strip())
            self._in_jsonld = False

    def handle_data(self, data: str) -> None:
        if self._in_title:
            self._title_parts.append(data)
        if self._in_h1:
            self._h1_parts.append(data)
        if self._in_jsonld:
            self._jsonld_parts.append(data)


def error(errors: list[str], path: Path | str, message: str) -> None:
    errors.append(f"{path}: {message}")


def meta_values(parser: PageParser, key: str, value: str) -> list[str]:
    return [item.get("content", "").strip() for item in parser.meta if item.get(key) == value]


def canonical_values(parser: PageParser) -> list[str]:
    return [item.get("href", "").strip() for item in parser.links if item.get("rel") == "canonical"]


def local_target(page: Path, raw_url: str) -> tuple[Path | None, str]:
    parsed = urlsplit(raw_url)
    if parsed.scheme or parsed.netloc or raw_url.startswith(("mailto:", "tel:", "data:", "javascript:")):
        return None, ""
    path = unquote(parsed.path)
    if not path:
        return page, parsed.fragment
    target = (ROOT / path.lstrip("/")) if path.startswith("/") else (page.parent / path)
    if target.is_dir():
        target = target / "index.html"
    return target.resolve(), parsed.fragment


def parse_i18n(errors: list[str]) -> None:
    path = ROOT / "js/i18n.js"
    languages = {name: [] for name in ("nl", "de", "en", "pl")}
    current: str | None = None
    for line_no, line in enumerate(path.read_text(encoding="utf-8").splitlines(), 1):
        language = re.match(r"\s{4}(nl|de|en|pl): \{", line)
        if language:
            current = language.group(1)
            continue
        if current:
            key = re.match(r"\s+'([^']+)':", line)
            if key:
                languages[current].append((key.group(1), line_no))
    reference = {key for key, _ in languages["nl"]}
    for language, entries in languages.items():
        counts = Counter(key for key, _ in entries)
        duplicates = sorted(key for key, count in counts.items() if count > 1)
        keys = set(counts)
        if duplicates:
            error(errors, path.relative_to(ROOT), f"duplicate {language} keys: {duplicates}")
        if keys != reference:
            error(errors, path.relative_to(ROOT), f"{language} key mismatch; missing={sorted(reference-keys)}, extra={sorted(keys-reference)}")


def validate_sitemap(errors: list[str], pages: list[Path]) -> None:
    path = ROOT / "sitemap.xml"
    try:
        tree = ET.parse(path)
    except (ET.ParseError, OSError) as exc:
        error(errors, "sitemap.xml", f"invalid XML: {exc}")
        return
    namespace = {"sm": "http://www.sitemaps.org/schemas/sitemap/0.9"}
    urls = tree.findall("sm:url", namespace)
    locations: list[str] = []
    for node in urls:
        loc = node.findtext("sm:loc", default="", namespaces=namespace).strip()
        modified = node.findtext("sm:lastmod", default="", namespaces=namespace).strip()
        locations.append(loc)
        if not loc.startswith(BASE_URL + "/"):
            error(errors, "sitemap.xml", f"invalid location: {loc}")
        try:
            parsed = date.fromisoformat(modified)
            if parsed > date.today() + timedelta(days=1):
                error(errors, "sitemap.xml", f"lastmod is more than one day in the future for {loc}: {modified}")
        except ValueError:
            error(errors, "sitemap.xml", f"invalid lastmod for {loc}: {modified}")
    if len(locations) != len(set(locations)):
        error(errors, "sitemap.xml", "duplicate locations")
    expected = {BASE_URL + "/" if page.name == "index.html" else BASE_URL + "/" + page.name for page in pages if page.name != "404.html"}
    actual = set(locations)
    if actual != expected:
        error(errors, "sitemap.xml", f"coverage mismatch; missing={sorted(expected-actual)}, extra={sorted(actual-expected)}")


def validate_repository_security(errors: list[str], pages: list[Path]) -> None:
    """Reject common static-site security regressions before deployment."""
    try:
        output = subprocess.check_output(
            ["git", "ls-files", "-z"], cwd=ROOT, stderr=subprocess.DEVNULL
        ).decode("utf-8")
        tracked = [ROOT / item for item in output.split("\0") if item]
    except (OSError, subprocess.CalledProcessError, UnicodeDecodeError):
        tracked = [path for path in ROOT.rglob("*") if path.is_file() and ".git" not in path.parts]

    for path in tracked:
        rel = path.relative_to(ROOT)
        lowered_name = path.name.lower()
        if lowered_name == ".env" or lowered_name.startswith(".env."):
            if lowered_name != ".env.example":
                error(errors, rel, "secret environment file must not be tracked")
        if path.suffix.lower() in FORBIDDEN_TRACKED_SUFFIXES:
            error(errors, rel, "credential/key container must not be tracked")
        if lowered_name.startswith("deploy") and path.suffix.lower() == ".py":
            error(errors, rel, "deployment scripts must remain outside the repository")
        try:
            text = path.read_text(encoding="utf-8")
        except (OSError, UnicodeDecodeError):
            continue
        for label, pattern in SECRET_PATTERNS.items():
            if pattern.search(text):
                error(errors, rel, f"possible committed {label}")

    for workflow in sorted((ROOT / ".github/workflows").glob("*.y*ml")):
        text = workflow.read_text(encoding="utf-8")
        for match in re.finditer(r"^\s*uses:\s*([^\s#]+)", text, re.MULTILINE):
            action = match.group(1)
            if action.startswith("./"):
                continue
            ref = action.rsplit("@", 1)[-1] if "@" in action else ""
            if not re.fullmatch(r"[0-9a-f]{40}", ref):
                error(errors, workflow.relative_to(ROOT), f"action is not pinned to a full commit SHA: {action}")

    for page in pages:
        text = page.read_text(encoding="utf-8")
        rel = page.relative_to(ROOT)
        for tag in re.finditer(r"<([a-z][a-z0-9:-]*)\b([^>]*)>", text, re.IGNORECASE | re.DOTALL):
            attrs = tag.group(2)
            if re.search(r"\son[a-z]+\s*=", " " + attrs, re.IGNORECASE):
                error(errors, rel, f"inline event handler on <{tag.group(1).lower()}>")
            if re.search(r"(?:href|src)\s*=\s*[\"']\s*javascript:", attrs, re.IGNORECASE):
                error(errors, rel, f"javascript: URL on <{tag.group(1).lower()}>")
        for anchor in re.finditer(r"<a\b([^>]*)>", text, re.IGNORECASE | re.DOTALL):
            attrs = anchor.group(1)
            if re.search(r"target\s*=\s*[\"']_blank[\"']", attrs, re.IGNORECASE):
                rel_match = re.search(r"rel\s*=\s*[\"']([^\"']*)[\"']", attrs, re.IGNORECASE)
                rel_tokens = set(rel_match.group(1).lower().split()) if rel_match else set()
                if not {"noopener", "noreferrer"}.issubset(rel_tokens):
                    error(errors, rel, 'target="_blank" requires rel="noopener noreferrer"')
        for script in re.finditer(r"<script\b([^>]*)>(.*?)</script>", text, re.IGNORECASE | re.DOTALL):
            attrs, body = script.groups()
            script_type = re.search(r"type\s*=\s*[\"']([^\"']+)", attrs, re.IGNORECASE)
            is_jsonld = script_type and script_type.group(1).lower() == "application/ld+json"
            if "src=" not in attrs.lower() and body.strip() and not is_jsonld:
                error(errors, rel, "executable inline script is forbidden by CSP")
        for iframe in re.finditer(r"<iframe\b([^>]*)>", text, re.IGNORECASE | re.DOTALL):
            attrs = iframe.group(1)
            if "sandbox=" not in attrs.lower():
                error(errors, rel, "iframe must declare a sandbox")
            if not re.search(r"referrerpolicy\s*=\s*[\"'](?:no-referrer|strict-origin|strict-origin-when-cross-origin)[\"']", attrs, re.IGNORECASE):
                error(errors, rel, "iframe must use a restrictive referrerpolicy")

    htaccess = (ROOT / ".htaccess").read_text(encoding="utf-8")
    active_htaccess = "\n".join(
        line for line in htaccess.splitlines() if not line.lstrip().startswith("#")
    )
    for token in REQUIRED_HTACCESS_TOKENS:
        if token not in active_htaccess:
            error(errors, ".htaccess", f"required security directive missing: {token}")
    csp_lines = [
        line for line in active_htaccess.splitlines()
        if "Content-Security-Policy" in line
    ]
    if len(csp_lines) != 1:
        error(errors, ".htaccess", "expected exactly one active Content-Security-Policy header")
    else:
        script_src = re.search(r"script-src([^;\"]*)", csp_lines[0])
        if not script_src:
            error(errors, ".htaccess", "CSP must declare script-src")
        elif {"'unsafe-inline'", "'unsafe-eval'"} & set(script_src.group(1).split()):
            error(errors, ".htaccess", "script-src must not allow unsafe-inline or unsafe-eval")


def main() -> int:
    errors: list[str] = []
    pages = sorted(ROOT.glob("*.html"))
    validate_repository_security(errors, pages)
    parsed: dict[Path, PageParser] = {}
    titles: dict[str, list[str]] = {}
    descriptions: dict[str, list[str]] = {}
    canonicals: dict[str, list[str]] = {}

    for page in pages:
        text = page.read_text(encoding="utf-8")
        parser = PageParser()
        parser.feed(text)
        parsed[page.resolve()] = parser
        rel = page.relative_to(ROOT)

        if len(parser.titles) != 1 or not parser.titles[0]:
            error(errors, rel, f"expected one non-empty title, got {parser.titles}")
        else:
            titles.setdefault(parser.titles[0], []).append(page.name)
            if len(parser.titles[0]) > 60:
                error(errors, rel, f"title exceeds 60 characters: {len(parser.titles[0])}")
        desc = meta_values(parser, "name", "description")
        if len(desc) != 1 or not desc[0]:
            error(errors, rel, f"expected one meta description, got {desc}")
        else:
            descriptions.setdefault(desc[0], []).append(page.name)
            if len(desc[0]) > 160:
                error(errors, rel, f"meta description exceeds 160 characters: {len(desc[0])}")
        canonical = canonical_values(parser)
        if page.name == "404.html":
            robots = meta_values(parser, "name", "robots")
            if not robots or "noindex" not in robots[0].lower():
                error(errors, rel, "404 page must be noindex")
            if canonical:
                error(errors, rel, "404 page must not declare a canonical")
        elif len(canonical) != 1 or not canonical[0].startswith(BASE_URL + "/"):
            error(errors, rel, f"expected one absolute canonical, got {canonical}")
        else:
            canonicals.setdefault(canonical[0], []).append(page.name)
        if parser.h1_count != 1:
            error(errors, rel, f"expected one h1, got {parser.h1_count}")
        elif page.name in SEO_PAGES and (not parser.h1_texts or "SparkleWash" not in parser.h1_texts[0]):
            error(errors, rel, "priority SEO page h1 must include SparkleWash")
        if page.name != "404.html":
            for property_name in ("og:title", "og:description", "og:image", "og:url"):
                values = meta_values(parser, "property", property_name)
                if len(values) != 1 or not values[0]:
                    error(errors, rel, f"expected one {property_name}, got {values}")
        for index, payload in enumerate(parser.jsonld, 1):
            try:
                json.loads(payload)
            except json.JSONDecodeError as exc:
                error(errors, rel, f"JSON-LD block {index}: {exc}")

        lowered = text.lower()
        for phrase in BANNED_CLAIMS:
            if phrase in lowered:
                error(errors, rel, f"banned/unverified claim: {phrase}")
        if "cloud.umami.is/script.js" in text:
            error(errors, rel, "Umami must not load statically before consent")
        if text.count("js/cookie.js?v=100") != 1:
            error(errors, rel, "expected exactly one consent loader")
        if page.name in LOCAL_DUTCH_PAGES:
            if "js/i18n.js" in text or "lang-switcher" in text:
                error(errors, rel, "Dutch-only landing must not load or expose the multilingual switcher")
            if re.search(r'hreflang=["\'](?:de|en|pl)["\']', text):
                error(errors, rel, "Dutch-only landing advertises an untranslated hreflang alternate")
        if page.name in {"sofa.html", "carpet.html", "mattress.html", "car.html"}:
            for language in ("nl", "de", "en", "pl"):
                if f'data-lang="{language}"' not in text:
                    error(errors, rel, f"missing working {language} language control")
            if "onclick=\"setLang(" in text:
                error(errors, rel, "obsolete inline setLang handler remains")

        refs: list[str] = []
        refs.extend(match.group(1) for match in re.finditer(r'(?:href|src)=["\']([^"\']+)', text, re.I))
        for raw in refs:
            target, fragment = local_target(page.resolve(), raw)
            if target is None:
                continue
            if not target.exists():
                error(errors, rel, f"missing local target: {raw}")
            elif fragment and target.suffix == ".html":
                target_parser = parsed.get(target)
                if target_parser is None:
                    target_parser = PageParser(); target_parser.feed(target.read_text(encoding="utf-8")); parsed[target] = target_parser
                if fragment not in target_parser.ids:
                    error(errors, rel, f"missing fragment target: {raw}")

    for label, values in (("title", titles), ("description", descriptions), ("canonical", canonicals)):
        for value, owners in values.items():
            if len(owners) > 1:
                error(errors, "site", f"duplicate {label} in {owners}: {value}")

    parse_i18n(errors)
    validate_sitemap(errors, pages)

    homepage = (ROOT / "index.html").read_text(encoding="utf-8")
    for target in sorted(PRIORITY_LOCAL_LINKS):
        if not re.search(rf'href=["\']{re.escape(target)}(?:[#?][^"\']*)?["\']', homepage):
            error(errors, "index.html", f"missing direct priority local link: {target}")

    robots = (ROOT / "robots.txt").read_text(encoding="utf-8")
    if "Sitemap: https://sparklewash.nl/sitemap.xml" not in robots:
        error(errors, "robots.txt", "canonical sitemap declaration missing")

    if errors:
        print(f"FAILED: {len(errors)} issue(s)")
        for item in errors:
            print(f"- {item}")
        return 1
    print(f"PASS: {len(pages)} HTML pages; metadata, links, fragments, JSON-LD, consent, i18n and sitemap valid")
    return 0


if __name__ == "__main__":
    sys.exit(main())
