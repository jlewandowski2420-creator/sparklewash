#!/usr/bin/env python3
"""Dependency-free quality gate for the SparkleWash static website."""
from __future__ import annotations

from collections import Counter
from datetime import date, timedelta
from html.parser import HTMLParser
import json
from pathlib import Path
import re
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
        elif tag == "script" and self._in_jsonld:
            self.jsonld.append("".join(self._jsonld_parts).strip())
            self._in_jsonld = False

    def handle_data(self, data: str) -> None:
        if self._in_title:
            self._title_parts.append(data)
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


def main() -> int:
    errors: list[str] = []
    pages = sorted(ROOT.glob("*.html"))
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
        desc = meta_values(parser, "name", "description")
        if len(desc) != 1 or not desc[0]:
            error(errors, rel, f"expected one meta description, got {desc}")
        else:
            descriptions.setdefault(desc[0], []).append(page.name)
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
