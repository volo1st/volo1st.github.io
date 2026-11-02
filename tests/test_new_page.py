"""Behavior checks for page creation. All output stays in temporary directories."""
import hashlib
import importlib.util
from pathlib import Path
import re
import shutil
import subprocess
import sys
import tempfile
import unittest
from unittest.mock import patch

ROOT = Path(__file__).resolve().parent.parent
spec = importlib.util.spec_from_file_location("new_page", ROOT / "scripts/new-page.py")
new_page = importlib.util.module_from_spec(spec)
spec.loader.exec_module(new_page)


class PageTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name)
        shutil.copytree(ROOT / "assets", self.root / "assets", ignore=shutil.ignore_patterns("app-icons"))
        (self.root / "index.html").write_text('<body data-page="home"></body>')
        (self.root / "sound").mkdir()
        (self.root / "sound/index.html").write_text('<body data-page="sound"></body>')

    def test_nested_page_has_valid_local_references_hashes_and_scope(self):
        files = new_page.create_page(self.root, "sound/notes/example/")
        page = self.root / "sound/notes/example/index.html"
        text = page.read_text()
        self.assertEqual(set(files), {page, page.with_name("styles.css")})
        self.assertIn('data-page="sound--notes--example"', text)
        self.assertIn('<h1 class="ui-title">Example</h1>', text)
        self.assertIn('href="../../"', text)  # Nearest existing ancestor: sound.
        self.assertIn('content="https://volo1st.com/sound/notes/example/"', text)
        for url in re.findall(r'(?:src|href)="([^"]+)"', text):
            if url.startswith("https:"):
                continue
            path, _, version = url.partition("?v=")
            target = (page.parent / path).resolve()
            if path.endswith("/"):
                target /= "index.html"
            self.assertTrue(target.is_file(), url)
            if version:
                self.assertEqual(version, hashlib.sha256(target.read_bytes()).hexdigest()[:12])
        self.assertIn(':where([data-page="sound--notes--example"])', page.with_name("styles.css").read_text())
        self.assertNotIn("<script", text)

    def test_tool_uses_music_accent_and_escapes_title_and_description(self):
        new_page.create_page(self.root, "tools/example", "tool", 'A & "B" <C>', '<script>"&', "music")
        text = (self.root / "tools/example/index.html").read_text()
        self.assertIn('data-domain="music"', text)
        self.assertIn('ui-tool-header', text)
        self.assertIn('<h1 class="ui-visually-hidden">A &amp; &quot;B&quot; &lt;C&gt;</h1>', text)
        self.assertIn('content="&lt;script&gt;&quot;&amp;"', text)
        self.assertEqual(text.count('<h1 '), 1)

    def test_existing_destinations_and_invalid_paths_leave_files_unchanged(self):
        existing = self.root / "sound/index.html"
        before = existing.read_bytes()
        for location in ["sound", "", "/tmp/example", "../example", "a/../b", "a//b", "a/./b", "My-page", "a b", "a\\b", "scripts/example", "a.html"]:
            with self.subTest(location=location), self.assertRaises(ValueError):
                new_page.create_page(self.root, location)
        self.assertEqual(existing.read_bytes(), before)
        self.assertFalse((self.root / "a").exists())

    def test_repeated_run_does_not_overwrite_edited_page(self):
        new_page.create_page(self.root, "example")
        page = self.root / "example/index.html"
        page.write_text("Owner edits")
        with self.assertRaises(ValueError):
            new_page.create_page(self.root, "example")
        self.assertEqual(page.read_text(), "Owner edits")

    def test_symlink_paths_and_duplicate_scope_are_rejected(self):
        (self.root / "alias").symlink_to(self.root / "sound", target_is_directory=True)
        (self.root / "dangling").symlink_to(self.root / "missing", target_is_directory=True)
        for location in ["alias/new", "dangling/new"]:
            with self.assertRaises(ValueError):
                new_page.create_page(self.root, location)
        (self.root / "index.html").write_text('<body data-page="example"></body>')
        with self.assertRaises(ValueError):
            new_page.create_page(self.root, "example")
        self.assertFalse((self.root / "example").exists())

    def test_missing_asset_fails_before_writing(self):
        (self.root / "assets/ui.css").unlink()
        with self.assertRaises(OSError):
            new_page.create_page(self.root, "sound/new/example")
        self.assertFalse((self.root / "sound/new").exists())

    def test_write_failure_removes_only_this_attempts_files_and_directories(self):
        original = Path.open
        def fail_index(path, *args, **kwargs):
            if path.name == "index.html" and args and args[0] == "x":
                raise OSError("Simulated disk failure")
            return original(path, *args, **kwargs)
        with patch.object(Path, "open", fail_index), self.assertRaises(OSError):
            new_page.create_page(self.root, "sound/new/example")
        self.assertFalse((self.root / "sound/new").exists())
        self.assertTrue((self.root / "sound/index.html").is_file())

    def test_command_uses_script_repository_and_returns_failure_status(self):
        shutil.copytree(ROOT / "scripts", self.root / "scripts", ignore=shutil.ignore_patterns("__pycache__"))
        command = [sys.executable, "-B", str(self.root / "scripts/new-page.py"), "example"]
        first = subprocess.run(command, cwd="/tmp", capture_output=True, text=True)
        self.assertEqual(first.returncode, 0, first.stderr)
        second = subprocess.run(command, cwd="/tmp", capture_output=True, text=True)
        self.assertEqual(second.returncode, 1)
        self.assertIn("already exists", second.stderr)


if __name__ == "__main__":
    unittest.main()
