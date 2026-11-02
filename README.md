# volo1st's website

Vincent's personal website: software, sound, music, and a few tools for specific tasks. It is not a general public service. GitHub Pages hosts it at [volo1st.com](https://volo1st.com/).

The site uses static pages with local styles and scripts. It needs no build step.

## Local use

Open `index.html` in a browser to view the home page. For tools that need a server, run this command from the repository root:

```sh
python3 -m http.server 8000
```

Open `http://localhost:8000/`.

## Add or change a page

Use the [style guide](style-guide/) as the visual reference. It has separate English and Chinese views.

Create a reading page:

```sh
python3 scripts/new-page.py sound/example --template reading --title "Example"
```

For a tool, use `--template tool`. Add `--domain music` for the music accent. The script uses Python's standard library. It creates editable page files and refuses to overwrite an existing destination.

Replace the placeholder content. Review the title, description, and navigation. Remove `noindex` when the page is ready.

Use **Copy component** in the guide to copy example markup. Give each copy a different identifier prefix. Update its text, links, and heading levels. Add application behavior where needed.

Keep shared styles in `assets/site-shell.css` and `assets/ui.css`. Keep page-specific layout in local stylesheets. Update the guide when a shared component changes. Refresh asset hashes after editing styles or scripts. The checks report stale hashes.

## Check and publish

Install Bash, Git, Node.js, and Python 3. Run this command before each commit:

```sh
./scripts/check.sh
```

Review the diff. For interface changes, check keyboard use, visible focus, narrow screens, and 200 percent zoom when a browser is available. Run the relevant tool workflow after a functional change.

Pushing reviewed commits to `origin master` publishes the repository root through GitHub Pages. Confirm that deployment succeeds and check the changed pages at the site address. To undo a published change, revert its commit, run the checks, and publish the reversal.

## Working references

- [Repository instructions](AGENTS.md): writing, source, safety, and test rules.
- [Plan](plan.md): current work, decisions, and completion evidence.
- [CSV to ABA converter](tools/csv2aba-v2/README.md): payment checks and input rules.
- [Guitar strum machine](tools/guitar-strumming/docs/ARCHITECTURE.md): source layout. [Sharing notes](tools/guitar-strumming/docs/SHARING.md) explain what a shared link exposes.
- [Pitch shifter](tools/pitch-shifter/): use and limits. [Dependency notes](tools/pitch-shifter/docs/DEPENDENCIES.md) cover bundled code and licenses.

No repository-wide license is selected. Keep third-party license files and notices with their code.
