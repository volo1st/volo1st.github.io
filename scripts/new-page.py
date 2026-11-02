#!/usr/bin/env python3
"""Create an editable static page. Uses only the Python standard library."""

import argparse
import hashlib
import html
import os
from pathlib import Path
import re
from string import Template
import sys

REPOSITORY = Path(__file__).resolve().parent.parent
TEMPLATES = Path(__file__).resolve().parent / "templates"
SLUG = r"[a-z0-9]+(?:-[a-z0-9]+)*"
RESERVED = {"assets", "scripts", "tests", "docs", "style-guide", "vendor"}


def digest(content):
    return hashlib.sha256(content).hexdigest()[:12]


def sentence_name(slug):
    text = slug.replace("-", " ")
    return text[:1].upper() + text[1:]


def render(template, values):
    return Template((TEMPLATES / template).read_text(encoding="utf-8")).substitute(values)


def create_page(repository, location, template="reading", title=None,
                description="Content is being prepared.", domain="general"):
    """Validate and render before writing. Return paths created by this call."""
    if template not in {"reading", "tool"} or domain not in {"general", "music"}:
        raise ValueError("Unknown template or domain.")
    if not re.fullmatch(rf"{SLUG}(?:/{SLUG})*/?", location):
        raise ValueError("Use a relative path with lowercase letters, digits, and hyphens.")
    parts = location.rstrip("/").split("/")
    if parts[0] in RESERVED:
        raise ValueError("Choose a content location outside support directories.")
    repository = Path(repository).resolve()
    destination = repository.joinpath(*parts)
    cursor = repository
    for part in parts:
        cursor /= part
        if cursor.is_symlink():
            raise ValueError("The destination path must not contain a symbolic link.")
        if cursor != destination and cursor.exists() and not cursor.is_dir():
            raise ValueError("A parent path is not a directory.")
    if destination.exists():
        raise ValueError("The destination already exists. No files were changed.")
    page_id = "--".join(parts)
    for existing in repository.rglob("*.html"):
        if ".git" in existing.parts:
            continue
        if re.search(r"""data-page=["']""" + re.escape(page_id) + r"""["']""",
                     existing.read_text(encoding="utf-8")):
            raise ValueError(f"The page scope already exists: {page_id}.")
    title = sentence_name(parts[-1]) if title is None else title
    if not title.strip() or not description.strip():
        raise ValueError("Title and description must not be empty.")

    # Link to the nearest existing ancestor page, even when new parents are needed.
    parent = destination.parent
    while parent != repository and not (parent / "index.html").is_file():
        parent = parent.parent
    if not (parent / "index.html").is_file():
        raise ValueError("No ancestor index.html is available for the breadcrumb.")
    def relative(path):
        return Path(os.path.relpath(path, destination)).as_posix()

    def asset(name):
        return relative(repository / name) + "?v=" + digest((repository / name).read_bytes())

    values = {
        "title": html.escape(title, quote=True),
        "description": html.escape(description, quote=True),
        "page_id": page_id,
        "domain_attribute": ' data-domain="music"' if domain == "music" else "",
        "canonical": "https://volo1st.com/" + "/".join(parts) + "/",
        "parent_href": relative(parent) + "/",
        "parent_label": "volo1st" if parent == repository else sentence_name(parent.name),
        "favicon": asset("assets/favicon.svg"),
        "shell_css": asset("assets/site-shell.css"),
        "ui_css": asset("assets/ui.css"),
    }
    css = render("page.css.tmpl", values)
    values["page_css"] = "./styles.css?v=" + digest(css.encode("utf-8"))
    values["header"] = render(template + ".html.tmpl", values).rstrip()
    heading_class = "ui-title" if template == "reading" else "ui-visually-hidden"
    values["heading"] = f'    <h1 class="{heading_class}">{values["title"]}</h1>'
    contents = {"styles.css": css, "index.html": render("page.html.tmpl", values)}

    created_directories = []
    created_files = []
    try:
        cursor = repository
        for part in parts:
            cursor /= part
            if cursor == destination or not cursor.exists():
                cursor.mkdir()  # Never reuse a destination created by another process.
                created_directories.append(cursor)
        for name, content in contents.items():
            file = destination / name
            with file.open("x", encoding="utf-8", newline="\n") as output:
                created_files.append(file)
                output.write(content)
    except OSError:
        for file in reversed(created_files):
            file.unlink()
        for directory in reversed(created_directories):
            directory.rmdir()
        raise
    return created_files


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("path", help="New page path relative to the repository root")
    parser.add_argument("--template", choices=("reading", "tool"), default="reading")
    parser.add_argument("--title", help="Page title; defaults to the final path segment")
    parser.add_argument("--description", default="Content is being prepared.")
    parser.add_argument("--domain", choices=("general", "music"), default="general")
    args = parser.parse_args()
    try:
        files = create_page(REPOSITORY, args.path, args.template, args.title,
                            args.description, args.domain)
    except (ValueError, OSError, KeyError) as error:
        print(f"Page creation failed: {error}", file=sys.stderr)
        return 1
    for file in files:
        print(f"Created {file.relative_to(REPOSITORY)}")
    print("Add content, review metadata, and run ./scripts/check.sh before committing.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
