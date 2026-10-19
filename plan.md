# Project Plan

## 1. Purpose

This file is the single source of truth for active audit work and long-term website development.

[`initial-audit-report.md`](initial-audit-report.md) records the repository condition on 12 September 2026. Keep that report as a dated baseline. Use this plan for current status, actions, decisions, and completion evidence.

Tool specifications and operating checklists remain with their tools. They do not replace this plan.

## 2. Plan rules

- Complete one work package at a time.
- Mark an item complete only after its completion test passes.
- Add concise evidence when it helps another person verify the result.
- Keep external or unavailable work in the waiting section.
- Keep a rejected or changed action in the decision log.
- Do not store confidential or real payment data in this repository.
- Keep only the next public-website package actionable in an external task system.

## 3. Current status

Status verified on 5 October 2026.

- The root page is volo1st's public introduction.
- CSV to ABA Converter version 2 is the current converter.
- The former converter address redirects to version 2.
- The legacy converter remains available as a rollback path.
- The tools directory is available at `/tools/`.
- Guitar Strum Machine is available from the tools directory.
- The Chinese-English text sorter was removed.
- The public-homepage source content and privacy boundary are approved.
- The owner approved the public homepage and section indexes for release.
- The deployed public foundation passed owner browser review.
- The CSV-to-ABA workflow validation waits for one normal Commonwealth Bank of Australia (CBA) payment run.
- Pitch Shifter version 1 and its MP3 export package are complete and deployed.

## 4. Product direction and boundaries

The website will be Vincent's public front page. It will explain his software engineering, audio, live sound, and music work. It will also host independent browser tools.

The website succeeds when a visitor can:

- understand Vincent's main professional and creative roles;
- find representative public work;
- open public projects and tools;
- find approved public profiles and contact methods; and
- use the site on a narrow screen and at 200 percent zoom.

The website succeeds for its owner when he can:

- add a project without redesigning the full site;
- maintain each tool independently;
- keep confidential information out of the public repository;
- verify a change before deployment; and
- keep stable addresses for published work.

Primary audiences include professional contacts, software engineering peers, audio and music collaborators, project users, and people who want to contact Vincent. Tool audiences include the music-school payment operator, guitar students, and general users of future public tools.

GitHub Pages is public. An unlisted page is not private. Do not put credentials, real payment data, confidential school records, employer confidential information, proprietary trading information, or unapproved private contact data in this repository.

Use one of these options for a restricted tool:

1. Make the tool safe for public access and keep all data local.
2. Put the tool behind real authentication on a suitable service.
3. Distribute the tool as a local application.

Use this target structure when the applicable content is ready:

| Address | Purpose |
| --- | --- |
| `/` | Personal introduction and selected highlights |
| `/code/` | Software engineering and public code index |
| `/sound/` | Audio, live sound, and studio index |
| `/music/` | Performance, music, and practice index |
| `/about/` | Longer biography and interests when useful content exists |
| `/projects/` | Public applications, experiments, and ideas |
| `/tools/` | Browser-tool directory |

Do not move an existing tool only to match this structure. Preserve its address or add a tested redirect.

## 5. Phase 0: Protect current users and data

- [x] Keep the current tools available during website work.
  - Evidence: The tools directory links to the current converter and Guitar Strum Machine.
- [x] Keep the former converter address working.
  - Evidence: `/tools/csv2aba/` redirects to `/tools/csv2aba-v2/`.
- [x] Keep the legacy converter available as a rollback path.
  - Evidence: `/tools/csv2aba-legacy/` contains the former conversion logic.
- [x] Replace the legacy page's person and account-like examples with clearly invented values.
  - Evidence: The correction changed only the example table. Tests pin the approved HTML, JavaScript, and CSS hashes.
- [x] Remove the text sorter when its maintenance cost exceeded its current value.
  - Evidence: The source was removed on 30 September 2026. Git history keeps it recoverable.
- [x] Review all tracked examples and fixtures for personal, payment, employer, and client data.
  - Evidence: The review found no email address. It found realistic legacy-derived BSB and account-like values in the converter tests and fixture. The approved correction replaces them with explicit structural placeholders and regenerates the golden ABA bytes.
- [x] Confirm that the fixed ABA source-identity values are approved for publication.
  - Evidence: On 1 October 2026, the owner confirmed that the current user and remitter name can remain public. Keep the values unchanged because they affect generated ABA output.

Completion gate: Current users can continue their work without exposing confidential data.

## 6. Phase 1: Validate the current CSV-to-ABA workflow

### 6.1 Implemented controls

- [x] Parse decimal text directly to integer cents.
- [x] Reject empty, invalid, zero, negative, fractional-cent, and excessive amounts.
- [x] Parse quoted CSV values, escaped quotation marks, quoted line breaks, blank lines, byte order marks, and LF and CRLF line ends.
- [x] Reject invalid headers, malformed CSV, incomplete rows, long fields, control characters, and structural payment-field errors.
- [x] Preserve the source row number for payment errors.
- [x] Check record-count and total-amount overflow.
- [x] Construct payment records only after all payment rows pass validation.
- [x] Keep the 120-character check for every generated record.
- [x] Keep Download unavailable after an input change or an error.
- [x] Show the payment count and total before download.
- [x] Add English and Simplified Chinese to the current workflow.
- [x] Add automated parser, amount, field, record, total, file, and interface-state tests.
- [x] Keep valid version 2 output compatible with the legacy converter.
  - Evidence: Characterization and golden-fixture tests pass with invented data.

### 6.2 Supported scope

- [x] Limit the converter to the established CBA payment workflow and its current fixed settings.
  - Evidence: CBA accepted files from the legacy converter for this workflow for nearly one year. Version 2 makes compatible payment data for known valid input.
- [x] Use invented data for automated converter tests and fixtures.

### 6.3 Normal workflow validation

Use [`tools/csv2aba-v2/TRIAL-CHECKLIST.md`](tools/csv2aba-v2/TRIAL-CHECKLIST.md) during one normal payment run. Do not store payment data in the result record.

- [ ] Generate the normal payment file with the current converter.
- [ ] Compare the payment entries, count, and total with the source report.
- [ ] Confirm that CBA accepts the upload.
- [ ] Compare the payment entries, count, and total shown by CBA with the source report.
- [ ] Record the date and result without confidential data.

Completion gate: The current converter matches the source report, and CBA accepts the file during the normal payment procedure.

### 6.4 Audit closure

- [x] Run the automated invalid-input and boundary tests from the initial audit.
- [x] Link each initial finding to completed work, removed scope, or an accepted product limit.
- [x] Record that support is limited to the current CBA workflow.
- [ ] After the normal payment run, record the reviewer, date, deployment, and CBA result.

## 7. Phase 2: Define the public identity

- [x] Select the public name and primary site heading.
- [x] Write a one-sentence introduction.
- [x] Write a short biography.
- [x] Define the software engineering description.
- [x] Define the audio and music description.
- [x] List approved public profiles.
- [x] Select approved contact methods.
- [x] Define employer and confidentiality boundaries.
- [x] Decide whether public identity pages use English only or two languages.
- [x] Select the first work and music highlights.

Evidence: The owner approved the source content, profiles, privacy boundary, English-only homepage, and homepage hierarchy on 1 October 2026. The approved inventory follows this checklist.

### 7.1 Homepage identity and introduction

Use `Vincent` only in the homepage greeting. Use lowercase `volo1st` as the public identity and site name everywhere else in the interface.

Use this English introduction:

> Hi, I’m Vincent.
>
> I code, shape sound, and make noise.
>
> Online, I’m `volo1st`.

Link `code`, `sound`, and `noise` to `/code/`, `/sound/`, and `/music/`. The sentence is both the introduction and the section navigation.

### 7.2 Areas of interest

Keep this approved source for future section pages. Do not show these summaries on the homepage until they have useful destination pages.

| Area | Text |
| --- | --- |
| Software | From serious systems to tiny tools, I like making useful things. |
| Audio | Recordings, rooms, and live stages. I enjoy making all of them sound better. |
| Music | Six strings. 88 keys. More enthusiasm than expertise. |
| Games | Hyrule for adventure. Sanctuary for loot. The backlog for later. |

### 7.3 Homepage project visibility

Do not feature Guitar Strum Machine or CSV to ABA Converter on the homepage. Keep both tools in the tools directory. A tool does not become a personal highlight only because it is public.

Do not present Bits & Beats Studio as a separate field of work. It spans audio and music. Use it only as the contact identity for music and audio projects on the homepage.

### 7.4 Profiles and contact

Show these links in two groups:

| Group | Service | Address |
| --- | --- | --- |
| volo1st | GitHub | `https://github.com/volo1st` |
| volo1st | YouTube | `https://www.youtube.com/channel/UChax0NeR_an7cMygg56mnXg/videos` |
| volo1st | Bilibili | `https://space.bilibili.com/14769433` |
| volo1st | RedNote | `https://www.xiaohongshu.com/user/profile/621ad629000000001000c5fb` |
| Bits & Beats Studio | Instagram | `https://www.instagram.com/bits.n.beats/` |
| Bits & Beats Studio | RedNote | `https://www.xiaohongshu.com/user/profile/5e7818aa0000000001006bf7` |

Group the personal and Bits & Beats Studio links separately. Show monochrome service icons without visible group labels. Put one vertical separator between the groups. Give each link a precise accessible name and tooltip. Distinguish the two RedNote destinations in those names.

### 7.5 Homepage hierarchy and addresses

Use this content order:

1. Introduction and section links.
2. One compact social-link strip with separate personal and studio groups.

Replace the tools-only root page with the personal homepage. Move the current directory purpose to `/tools/`. Keep all existing tool addresses unchanged.

The homepage uses English only. Humorous and personal text does not translate literally with the intended voice. The tools directory and maintained tools use English and Simplified Chinese. Keep the tool translation key sets identical. Put the compact language control at the right side of the shared breadcrumb on bilingual tool pages.

The homepage does not link to itself, the complete tools directory, or an individual tool. It links to the Code, Sound, and Music section indexes. External profile links open in a new tab.

### 7.6 Privacy and publication boundary

The approved public facts are the content in this inventory and the approved profile addresses.

Do not publish these items without separate approval:

- an employer name;
- proprietary high-frequency trading information;
- the private personal Instagram profile;
- the relationship between CSV to ABA Converter and a family business;
- private studio history, dimensions, or relocation details;
- client, performer, or venue names;
- unapproved photographs, recordings, or project media; or
- social engagement counts.

The homepage can describe Vincent's work and interests. Do not make it read like a resume. Keep the tone personal, concise, and lightly playful.

Completion gate: Approved source content exists for the first public homepage. The content does not need placeholder claims.

## 8. Phase 3: Complete the visual system and public foundation

### 8.1 Completed early for maintained tools

- [x] Add shared text, color, spacing, border, focus, width, header, card, link, and footer patterns.
  - Evidence: Maintained pages use the shared site shell and semantic domain accents.
- [x] Add a shared site icon and approved identity asset.
- [x] Keep existing tool addresses working.
- [x] Add automated internal-link and translation-key checks.
- [x] Check maintained tool layouts on narrow screens and at 200 percent zoom.
- [x] Add short descriptions and links for each current tool.

Use one quiet breadcrumb header on public section indexes and maintained tool pages. On the tools index, include the short summary in the breadcrumb. Put the summary on its own line on a narrow screen. On an individual tool page, link both `volo1st` and `Tools` in the breadcrumb. Do not repeat the site icon, a large page title, or footer navigation on these pages. Keep each tool's main interface and domain accent unchanged.

Keep breadcrumb text in English. Do not translate it with the tool interface.

Show `EN` and `中文` as plain text controls at the right side of the breadcrumb. Use a subtle underline and darker text for the selected language. Use reversed colors for keyboard focus. Do not put the language control in a bordered container.

### 8.2 Public-site design

- [x] Define the intended character of the public site.
- [x] Confirm that the existing tokens support software and music content.
- [x] Define image and media rules.
- [x] Check text contrast and focus visibility for the public design.
- [x] Make homepage wireframes for narrow and wide screens.

Evidence: The following public-site design specification defines the wide layout, narrow layout, semantic color roles, responsive behavior, and media rules. Contrast calculations use the Web Content Accessibility Guidelines (WCAG) 2.2 thresholds for [text contrast](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html) and [non-text contrast](https://www.w3.org/WAI/WCAG22/Understanding/non-text-contrast.html).

#### 8.2.1 Character and visual hierarchy

The public site must feel warm, practical, personal, and lightly playful. It must not look like a resume, a corporate portfolio, a terminal, or a game interface.

Keep the existing warm page background. Keep the pixel `V` as the browser icon, but do not repeat it as an in-page logo. Do not add an element that exists only as decoration. Do not use a pixel font for body text.

Use this visual hierarchy:

1. Make the introduction the largest item.
2. Keep the social icons compact and easy to scan.
3. Separate the personal and studio groups with one quiet vertical rule.

#### 8.2.2 Layout rules

Keep the current 960-pixel maximum content width. Use the existing page gutter, text colors, and focus style. Do not put the site header, tool language control, panels, buttons, or footer on the homepage unless they have a homepage function.

On wide screens:

- Let the short introduction use the available width.
- Show the personal and studio profiles in one compact icon strip.
- Use a bounded page region between 30 and 42 rem high. Distribute the introduction and contact directory within that region.

```text
┌──────────────────────────────────────────────────────────────┐
│ Hi, I’m Vincent.                                             │
│ I code, shape sound, and make noise.                          │
│ Online, I’m volo1st.                                         │
├──────────────────────────────────────────────────────────────┤
│ [GitHub] [YouTube] [Bilibili] [RedNote] | [Instagram] [...] │
└──────────────────────────────────────────────────────────────┘
```

On narrow screens:

- Use one content column for the introduction.
- Keep the social icon groups on one row when the available width permits it.
- Use the small viewport height so that the layout fills approximately one visible phone screen.
- Do not use horizontal page scrolling.

```text
┌─────────────────────────────┐
│ Hi, I’m Vincent.            │
│ I code, shape sound...      │
│ Online, I’m volo1st.        │
├─────────────────────────────┤
│ [GH] [YT] [BI] [RN] | [...]│
└─────────────────────────────┘
```

At 200 percent zoom, use the narrow layout. Do not hide content or actions.

#### 8.2.3 Color roles and contrast

Keep these shared colors:

| Role | Color |
| --- | --- |
| Page background | `#f4f1e8` |
| Panel background | `#fffdf7` |
| Main text | `#17202a` |
| Muted text | `#4a4a43` |

Use these homepage-specific colors:

| Role | Color |
| --- | --- |
| External links | `#3f3a31` |
| External-link hover | `#171512` |

Render social icons with the external-link color. Keep each service and contact purpose in the link's accessible name and tooltip.

The main text has 14.57:1 contrast against the page background. The muted text has 7.91:1. The external-link color has more than 9:1 contrast against the page background.

Change the shared focus color from `#d78300` to `#9b5c00` during implementation. The current color has 2.61:1 contrast against the page background. The replacement has 4.74:1. Keep the three-pixel focus outline and three-pixel offset.

#### 8.2.4 Image and media rules

The first homepage release is text-first. Do not add a portrait, game artwork, client media, studio photograph, or social feed.

Use the existing pixel `V` browser icon, local social SVGs, and CSS rules. Keep the homepage static.

Use version 16 SVG paths from the [Simple Icons](https://github.com/simple-icons/simple-icons) CC0 1.0 collection for GitHub, YouTube, Bilibili, Xiaohongshu, and Instagram. Store the paths locally. Render them with the current text color. Do not load a third-party icon dependency at runtime.

For later media, use only media that Vincent owns or has approval to publish. Add useful alternative text to meaningful media. Use an empty alternative description for decoration. Set image dimensions to prevent layout movement. Do not load a social embed or third-party tracking script.

#### 8.2.5 Motion

Use motion only when it communicates important state or meaning. Do not add decorative motion without a clear function.

Do not disable or alter site motion through `prefers-reduced-motion`. If motion is not important enough to remain available, omit it from the design.

### 8.3 Public-site implementation

- [x] Replace the tools-only root page with the personal homepage.
- [x] Add shared site navigation.
- [x] Add a tools directory at `/tools/`.
- [x] Add the approved introduction, profiles, and contact path.
- [x] Add complete page descriptions and social-preview metadata.
- [x] Add useful Code, Sound, and Music section indexes.
- [x] Defer a custom not-found page until broken-link traffic or site growth makes recovery navigation useful.
  - Evidence: [GitHub Pages supports a root `404.html`](https://docs.github.com/en/pages/getting-started-with-github-pages/creating-a-custom-404-page-for-your-github-pages-site). The owner deferred this page on 5 October 2026.
- [x] Use the same approved tool names and letter case on all pages.
- [x] Keep the current page-specific search-indexing behavior. Do not add a site-wide indexing policy.
  - Evidence: The owner confirmed that no additional search-indexing work is necessary on 5 October 2026.
- [x] Test keyboard use, narrow screens, and 200 percent zoom.
  - Evidence: The owner completed the deployed public-foundation review on 5 October 2026. The final reported issue was the Pitch Shifter export indicator. The owner confirmed that the deployed fix works.

Evidence: The root page contains the approved English source and public profiles. Its linked introduction opens the Code, Sound, and Music section indexes. The Code index links to `/tools/`, the Sound index links to Bits & Beats Studio, and the Music index links to public music profiles and Guitar Strum Machine. Existing tool addresses did not change. Automated tests check the internal links, section destinations, tool translations, metadata, identity boundary, tool selection, semantic accents, external-link behavior, and current asset hashes. Owner browser review is complete.

Completion gate: The deployed root address works as a public namecard, and all existing tools remain available.

## 9. Phase 4: Review selected public work

- [x] Review the Code page and decide whether more public software content is useful now.
  - Evidence: On 12 October 2026, the owner confirmed that the current Code page is sufficient. It links to the tools directory and GitHub. Most professional software work cannot be shared publicly. Detailed software case studies are optional.
- [x] Review the Sound page and select approved public work, or record that the current links are sufficient for now.
  - Evidence: On 12 October 2026, the owner confirmed that the current studio profile links are sufficient for now.
- [x] Review the Music page and select approved public work, or record that the current links are sufficient for now.
  - Evidence: On 12 October 2026, the owner confirmed that the current music profile and practice-tool links are sufficient for now.

Review evidence on 12 October 2026: The Sound page links to the approved Bits & Beats Studio profiles. The Music page links to the approved YouTube and Bilibili profiles and Guitar Strum Machine. The owner confirmed that both pages are sufficient for now. No specific recording, performance, or audio project has been selected for a new entry. The content review is complete. Featured videos remain deferred until useful public material and a suitable presentation are selected. Keep both pages unchanged.

Add content only when it helps visitors and is approved for publication. A music tool can appear in Code and Music. Code can explain how it was built. Music can explain its use. Do not add an entry only to fill a portfolio.

Apply these requirements when a new entry is selected:

- [ ] Use a consistent structure suited to the entry. A detailed case study is optional.
- [ ] Identify Vincent's role in each item.
- [ ] Use only approved public media and credits.
- [ ] Add text alternatives for meaningful media.
- [ ] Check each item for employer, client, performer, and venue confidentiality.

If a detailed case study is useful, state the context, goal, role, public work, supported result, and relevant public links or media.

Completion gate: Each section has useful approved links or selected public work. Record the owner's decision for each section. Defer optional entries when suitable public material is unavailable.

Completion evidence: On 12 October 2026, the owner accepted the current Code, Sound, and Music pages. No new entries are required. The conditional entry requirements above apply when future content is selected. Phase 5 is the next work package.

## 10. Phase 5: Establish the project and tool model

Deferred by owner decision on 13 October 2026. The existing repository instructions cover current tool development. Do not create a formal classification system, reusable template, or additional release process now. Resume only when adding or maintaining tools exposes a specific problem. The unchecked items below are deferred, not completed. Phase 6 is the next package.

- [ ] Define the difference between a portfolio item, public project, public tool, and restricted tool.
- [ ] Add status terms for active, trial, maintained, archived, and restricted items.
- [ ] Define the minimum page information for each project and tool.
- [ ] Define ownership, support, privacy, and data-handling statements.
- [ ] Add a repeatable template for a new static tool.
- [ ] Define when a tool needs separate tests or a separate repository.
- [ ] Define an archive process that preserves useful addresses.

Completion gate: A new idea has a clear location, status, support model, and release checklist.

## 11. Phase 6: Keep useful operations notes

Scope decision on 13 October 2026: Keep this package small. Use the README for short deployment and recovery instructions. Record the custom-domain setting needed for recovery. State the repository license status without selecting a license for the owner. Keep existing privacy, dependency, and tool-limit records. Do not add a general operations manual.

- [x] Add a repository README with purpose, tools, local use, and checks.
- [x] Add one local command for syntax, tests, references, and whitespace.
- [x] Add a validation checklist for the current converter workflow.
- [x] Apply browser-asset versioning to each maintained page asset.
  - Evidence: The home page, current converter, and Guitar Strum Machine register their local interface assets in the SHA-256 stale-hash test. The frozen legacy fallback remains unversioned.
- [x] Select a license, or state that the repository has no license.
  - Evidence: On 13 October 2026, the README records that no repository-wide license has been selected and retains the distinction for third-party licenses.
- [x] Document the GitHub Pages deployment process.
  - Evidence: On 13 October 2026, the owner confirmed “Deploy from a branch”, `master`, and `/(root)`. The README records the push and public-verification steps.
- [x] Record the custom domain and the settings needed to restore it. Verify unavailable account settings with the owner before documenting them.
  - Evidence: On 13 October 2026, the owner confirmed `volo1st.com` and Squarespace DNS. The README records both services and links to the current GitHub domain-recovery instructions. Account recovery details remain outside the repository.
- [x] Document how to recover a known working revision. Identify what Git history does not preserve.
  - Evidence: On 13 October 2026, the README documents commit inspection, reversal of an ordinary commit, repository checks, and public verification. It identifies external account, hosting, and domain settings that Git does not preserve. No recovery action was performed.

Completion evidence on 13 October 2026: The owner supplied the missing publishing source and DNS provider. The README documents the confirmed setup, revision recovery, external settings, and license status. The verification blocker is resolved. No deployment, recovery operation, or hosting change was performed. Provider-specific DNS records were not inspected; use current GitHub instructions if restoration is necessary. The content-system review remains deferred until measured maintenance problems justify it.

Deferred unless a specific failure, service change, or maintenance need justifies them: a broad transport-security and redirect review, a hosting-header and limits review, a site-wide network audit, fixed browser and dependency review schedules, a maintainer handoff manual, and additional automated checks. Existing privacy rules, dependency records, and required checks still apply to changes.

Review evidence on 13 October 2026: The README already documents local use, checks, tool privacy, limits, and the Pitch Shifter dependency record. The repository has a root `CNAME` and third-party license files, but no root license file. The owner subsequently confirmed the publishing source, custom domain, and DNS provider. No hosting or domain setting was changed during this review.

Completion gate: The README gives short, verified instructions to deploy and recover this static site, identifies required external settings, and states the repository license status.

## 12. Phase 7: Add a content system only when necessary

- [ ] Measure repeated markup and maintenance effort.
- [ ] Record the specific problem that a content tool must solve.
- [ ] Compare manual pages with a small static-site generator.
- [ ] Preserve addresses and plain output if a generator is selected.
- [ ] Keep tool applications independent of the content system where practical.
- [ ] Document local setup, dependency updates, and recovery.

Do not add a framework or build system only because the site has multiple pages.

## 13. Waiting, deferred, and removed work

| Item | Status | Resume condition |
| --- | --- | --- |
| CSV-to-ABA workflow validation | Waiting | The operator runs the normal payment process and records non-confidential evidence. |
| Project and tool standards | Deferred | Adding or maintaining a tool exposes a specific problem that existing instructions do not address. |
| Chinese-English text sorter | Removed | A new requirement justifies recovery from Git history. |
| Authentication for school tools | Deferred | A tool needs confidential configuration, stored data, or restricted access. |
| Static-site generator | Deferred | Manual maintenance causes repeated errors or material delay. |
| Custom not-found page | Deferred | Broken-link traffic or site growth makes recovery navigation useful. |

Waiting work is not a blocker for unrelated tool maintenance.

### 13.1 App ideas

Keep unscheduled website-tool ideas in this section. Do not keep a separate Todoist task for each idea. Create a Todoist work package only when an idea is selected for definition or implementation.

| Idea | Status | Initial purpose | Question or outcome |
| --- | --- | --- | --- |
| Metronome | Unscheduled | Provide a steady practice pulse. | Define the practice workflow and required rhythm controls. |
| Tuner | Unscheduled | Help a user tune many types of instrument. | Define the input method, tuning modes, accuracy target, and visualization. Use [StroboPro](https://www.strobopro.se/) as a product reference and [audioMotion Analyzer](https://audiomotion.dev/demo/fluid.html) as a visualization reference. |
| Pitch Shifter | Complete | Shift one local song without changing its duration, preview it, and download it. | Version 1 and MP3 export are complete. Key recognition remains a separate future idea. |
| Guitar Strum Machine | Complete | Make looping guitar-strumming practice tracks from plain text. | The public tool and its product specification are complete. |

Pitch Shifter is classified as a public browser tool. It processes one local file and does not store or upload audio.

The Pitch Shifter prototype, version 1 package, and MP3 export package are complete. Owner listening and performance tests selected the Signalsmith Stretch default preset.

Guitar Strum Machine is classified as a public browser tool. Its requirements and decisions are in `ideas/guitar-strumming-backing-track-tool.md`.

MeTube is not part of this app-idea list. It is a Home Lab service that needs server, storage, and operating decisions. Keep its evaluation with the video-streaming service package.

### 13.2 Pitch Shifter version 1

- [x] Compare Signalsmith Stretch and SoundTouchJS with full mixes, vocals, bass, drums, and different source formats.
  - Evidence: Owner listening tests found consistently better quality from Signalsmith Stretch. SoundTouchJS produced audible transient damage.
- [x] Select the production algorithm and performance settings.
  - Evidence: The owner could not hear a material quality difference between the default and cheaper Signalsmith presets. The default preset processed the reference high-quality MP3 in 2.6 seconds, which the owner accepted. Earlier production HTTPS tests with the cheaper preset processed the 246-second, 48 kHz stereo file in approximately 2 seconds on an iPhone 16 Pro and 1.83 seconds on a Mac Studio with an M1 Max.
- [x] Find the lower acceptable quality boundary.
  - Evidence: An 80/40 millisecond manual configuration was the fastest acceptable test setting, but it produced audible distortion. Faster settings sounded unacceptable across three different sources. The official default preset gives the production quality margin.
- [x] Add the focused bilingual interface, complete-file processing, and WAV download.
  - Evidence: One compact workspace provides file selection, pitch control, comparison playback, and WAV export. A source or pitch change invalidates the old output.
- [x] Add live pitch-shifted playback and one shared transport.
  - Evidence: One transport controls the original audio, live shifted audio, and generated WAV. It keeps the playback position when the user changes the source. If live playback fails, complete-file processing remains available.
- [x] Add the local WebAssembly modules, licenses, artifact hashes, and reproduction record.
  - Evidence: The dependency record pins both source commits, Emscripten 6.0.10, both MIT licences, build options, and the three artifact hashes.
- [x] Add permanent processing, WAV, interface, privacy, and dependency tests.
  - Evidence: Generated-tone tests run both Wasm variants. Additional tests cover exact duration, stereo alignment, pitch ratio, WAV structure, clipping, local-only code, translations, dependency hashes, and installation metadata.
- [x] Record valid performance-test conditions.
  - Evidence: The specification and README require HTTPS for iOS and iPadOS measurements. They record that WebKit Enhanced Security can disable just-in-time compilation on a plain HTTP local-area-network origin.
- [x] Verify keyboard use, narrow screens, and 200 percent zoom.
  - Evidence: On 5 October 2026, the owner confirmed that all three interface checks work correctly.
- [x] Run the general repository check and review the complete diff.
  - Evidence: `./scripts/check.sh` passed on 4 October 2026. The final source review found no runtime request that can send audio.

Completion gate: A supported browser can preview, process, play, and download a local mono or stereo song. Processing stays responsive and does not send audio over the network. A failure leaves no downloadable result.

### 13.3 Pitch Shifter MP3 export

- [x] Compare current browser LAME encoders for scope, maintenance, licence clarity, size, and performance.
  - Evidence: `wasm-media-encoders` 0.7.0 provides a direct pulse-code modulation (PCM) interface in a 5.9 KB JavaScript artifact and a 133.0 KB Wasm artifact. It encoded the 246-second, 48 kHz stereo reference track at 320 kbit/s in 5.27 seconds on the development host. The output decoded without an error. `lame-wasm` 0.2.0 did not include the embedded LAME licence in its package archive. Mediabunny 1.61.1 required approximately 1 MB of minified browser code for the encoder and its peer framework.
- [x] Add WAV and MP3 output selection. Use the source format as the default when it is supported.
  - Evidence: The select in the collapsed Advanced section defaults an MP3 source to MP3 and every other source to WAV. A format change invalidates the old download. The background worker returns one typed file result for playback and download.
- [x] Add pinned local encoder artifacts, licences, hashes, and source records.
  - Evidence: The dependency record contains the wrapper and LAME commits, npm integrity value, seven SHA-256 hashes, build tools, local licences, the LAME source archive, the C bridge, and the upstream Makefile.
- [x] Add permanent MP3 encoding, interface, translation, dependency, and failure-state tests.
  - Evidence: Tests encode stereo 48 kHz PCM and mono 8 kHz and 192 kHz PCM. They check the 320 kbit/s MPEG-1 Layer III header, output sample-rate selection, local artifact hashes, both language catalogs, interface controls, local paths, and current module hashes. The existing worker failure path keeps a failed result unavailable.
- [x] Verify 320 kbit/s MP3 output quality and performance on a current iPhone.
  - Evidence: On 5 October 2026, the owner confirmed that MP3 export quality and performance work correctly on the tested current iPhone.
- [x] Run the general repository check and review the complete diff.
  - Evidence: `./scripts/check.sh` passed on 5 October 2026. The complete diff review found no audio upload, third-party runtime request, stale asset hash, or unrelated source change.

Completion gate: A supported browser can export either WAV or 320 kbit/s MP3. An MP3 source defaults to MP3. Other sources default to WAV. The output stays local. An encoder failure leaves no downloadable result.

The approved icon family uses abstract monoline and bar symbols. Each icon uses the site background `#f4f1e8` and the guitar accent `#173e30`. The Guitar Strum Machine uses its icon for home-screen installation. The other three icons record a visual direction only. They do not change the status of the app ideas.

## 14. Initial audit closure matrix

| Finding | Current state | Remaining action |
| --- | --- | --- |
| Fixed bank data | Accepted product limit | The current fixed settings define the supported workflow. |
| Invalid amounts | Implemented in version 2 | Confirm the normal workflow result. |
| Quoted CSV data | Implemented in version 2 | Confirm the normal workflow result. |
| Incomplete ABA field checks | Accepted product limit | Use CBA upload validation for the supported workflow. |
| Unsafe interface error state | Implemented in version 2 | Confirm the normal workflow result. |
| Missing bank-specific rules | Accepted product limit | Use CBA upload validation for the supported workflow. |
| No automated tests | Implemented locally | Reassess continuous integration only when its value justifies maintenance. |
| Difficult converter layout | Implemented in version 2 | No remaining audit action for the supported workflow. |
| Text sorter data loss | Removed from scope | Restore only for a new requirement. |
| Text sorter external dependency | Removed from scope | Restore only for a new requirement. |
| Repeated sorter calculations | Removed from scope | Restore only for a new requirement. |
| Incomplete documents and page data | Partly implemented | Complete licensing, deployment, operations, and public-site work. |

## 15. Decision log

Homepage removal evidence on 17 October 2026: Removed the particle canvas, its script, and its overlay styles. Updated the homepage stylesheet hash, README, design requirements, and existing tests. The complete diff was reviewed. `./scripts/check.sh` passed for all seven test files. Manual browser review did not run. It is optional for this small static change under the approved verification rule.

Decision on 12 October 2026: Keep the current Code page. The owner confirmed that most professional software work cannot be shared publicly and that the public applications currently focus on music. A tool can serve both sections: Code explains its construction, and Music explains its use. Replace the required software portfolio with a completed content review. Make detailed case studies optional. Review Sound and Music before selecting further public content. Do not add weaker entries only to fill a portfolio.

| Date | Decision | Reason |
| --- | --- | --- |
| 20 October 2026 | Scope local styles to explicit page roots. | The owner approved `data-page` roots and zero-specificity `:where()` guards. Shared foundations remain global. Live pages and their specimens use matching roots. |
| 20 October 2026 | Correct Guitar layout and use a footer disclaimer. | The owner reported panel overflow, lost chord scrolling, squeezed chord-view labels, and an intrusive notice. Constrain the shared single-column grid. Use wrapping action buttons for chord views. Keep the disclaimer below a divider in small, muted serif text. |
| 19 October 2026 | Apply the approved guide to maintained pages and tools. | The owner approved the first pass and authorized migration. Promote one component stylesheet, migrate public pages first, and then migrate each maintained tool. Preserve specialized displays, translations, input, audio, and converter safety behavior. |
| 19 October 2026 | Use segmented language controls for tools and quiet `En / 中` choices for reading pages. | The owner finds the filled group intrusive outside tools and prefers one Chinese character. Disable the current language to avoid repeating the same action. Preserve its selected appearance. Reuse native buttons for same-page language switching. |
| 19 October 2026 | Use a solid selected language segment and remove link styling. | The owner accepted the compact size but found selection unclear. Remove the underline. Use a dark neutral fill with light selected text. Keep unselected segments light and hover separate from selection. |
| 19 October 2026 | Make the language group compact and keep each label on one line. | The owner found the group too large and reported a wrapped Chinese label. Use natural segment widths, supporting-size text, smaller padding, and a 28-pixel desktop minimum. Retain 44-pixel touch targets. |
| 19 October 2026 | Join language choices into a segmented button group in the draft. | The owner found the separate choices too far apart. Use adjacent equal-width buttons with a shared border seam, rounded outer corners, and a warm selected fill. Retain the selected underline, native state, common sizing, and visible focus. |
| 19 October 2026 | Refine page headers, breadcrumbs, and language choice in the draft guide. | The owner selected this last common area before migration review. Share spacing, control sizing, and focus. Keep the quiet language choice and selected underline. Preserve compact tool headers and English breadcrumbs. |
| 19 October 2026 | Soften striped body rows and distinguish table headings and totals. | The owner found white rows too bright and dark stripes too close to headings and totals. Use the warm subtle surface for light rows. Use a deeper warm surface and stronger boundary lines for headings and totals. |
| 19 October 2026 | Add optional striped table rows to the draft guide. | The owner requested this option for long tables. Keep the plain table as the default. Alternate neutral body-row surfaces while retaining shared headings, totals, cell spacing, and scrolling. |
| 19 October 2026 | Refine tables and summary values in the draft guide. | The owner selected this next step. Use one table style and one summary grid. Share serif typography and spacing. Right-align numeric columns and keep wide-table scrolling local. Show missing values explicitly. |
| 19 October 2026 | Refine shared notice tones, content, and spacing in the draft guide. | The owner selected the next refinement. Keep information, success, warning, and error independent of tool accents. Use explicit text, a shared surface and stripe pattern, and the accepted text spacing. Keep essential errors persistent. |
| 19 October 2026 | Consolidate spacing, panels, and disclosures in the draft guide. | The owner selected this next step. Use the existing spacing scale for content flow, field groups, actions, and sections. Share panel and disclosure padding. Remove ordinary sample frames and the raised panel variant. Keep plain content unboxed. |
| 19 October 2026 | Make draft controls compact on desktop and inset the select arrow. | The owner found the desktop buttons too large and the select arrow too close to the border. Use a 2.25rem control minimum on wide screens with a fine pointer and hover. Retain the 2.75rem touch minimum. Reserve space for the select arrow and retain native selection behavior. |
| 19 October 2026 | Consolidate buttons and form controls in the draft guide before migrating apps. | The owner selected this next step. Share control dimensions, typography, focus, and disabled styles. Keep error borders from changing field dimensions. Preserve native field behavior and app-specific state logic. |
| 19 October 2026 | Try one centered 48rem maximum page width in the draft guide, with 1–2rem side gutters. | The owner wants fewer width variants, a modest desktop width, and responsive mobile pages. Align the header and content. Remove nested guide-specific text-width limits. Review the draft before migrating existing pages. |
| 19 October 2026 | Use four text sizes, two weights, and two line heights in the style guide draft. | The owner accepted supporting text at 0.875rem, body text at 1rem, section headings at 1.5rem, and page titles at 2rem. Use weights 400 and 700, normal letter spacing, body line height 1.6, and heading line height 1.2. Keep the homepage greeting as a later explicit exception. |
| 17 October 2026 | Start the style guide refinement with serif as the default, sans-serif for interactive controls, and monospace for source text and technical values. | The owner prefers this typography direction. Use one serif family for headings and prose. Keep inline links with their surrounding text. Review the draft before applying the rule to existing pages. |
| 17 October 2026 | Audit existing HTML and CSS, and build a UI style guide before refactoring the site. | The owner reported style drift. Review common controls together. Preserve app-specific displays, such as chord cards. Approve the shared design before migrating existing pages. |
| 17 October 2026 | Remove the homepage particle animation and its code, styles, and comparison option. | The owner requested removal. Keep the introduction, section links, social profiles, and existing spacing. This supersedes the earlier Sagittarius design decisions. |
| 17 October 2026 | Keep checks proportionate to the change. Do not set up browser automation for text, links, placeholder pages, or simple style changes. | The owner found heavy test setup too slow for its value. Use the existing repository check and diff review. Use manual browser review when available. Missing browser review does not block these small changes. Keep meaningful functional and ABA safety tests. |
| 16 October 2026 | Add Room acoustics and Live sound under Sound. Rename “my studio” to “Studio”. | The owner approved the labels and addresses. Room acoustics can cover demonstrations, measurements, and acoustic treatment services. Live sound can cover front-of-house mixing. Start with clearly marked placeholder pages. |
| 15 October 2026 | Remove all breadcrumb summaries and their separators from Code, Sound, Music, and Tools. | The owner wants simpler navigation. Remove unused shared styles and refresh the stylesheet hashes. |
| 13 October 2026 | Defer the formal project and tool model. Limit operations work to useful deployment, domain-recovery, revision-recovery, and license notes. | The owner wants maintenance suited to a small personal site. Existing instructions cover current safeguards. Add process only when a specific problem justifies it. |
| 12 October 2026 | Keep the current Sound and Music pages. Defer featured videos. | The owner confirmed that the current links are sufficient. Select useful public material and its presentation before adding a featured entry. The content review is complete. Project and tool standards are next. |
| 12 September 2026 | Keep the former converter available while version 2 is developed and tested. | The former converter has operational evidence for one monthly process. |
| 14 September 2026 | Use a local check script. Do not add Git hooks or continuous integration at this time. | A one-person static website does not need the additional setup and maintenance at this time. |
| 14 September 2026 | Add English and Simplified Chinese to the current converter. | The operator is more comfortable with Chinese. English-only workflow text caused operating problems. |
| 17 September 2026 | Make the website Vincent's public front page. | The site must present his software engineering, audio, live sound, music, projects, and contact paths. |
| 17 September 2026 | Keep independent tools isolated and use static delivery by default. | The tools have separate purposes and do not need shared application state or a server. |
| 17 September 2026 | Do not treat an unlisted GitHub Pages address as private. | GitHub Pages content is publicly accessible without access control. |
| 21 September 2026 | Do not plan a general technology blog. | Publish only specific material with a clear audience and purpose. |
| 28 September 2026 | Add Guitar Strum Machine to the tools directory in both supported languages. | The practice interface was implemented and verified. |
| 29 September 2026 | Put the compact language control at the right side of the title row. | Language is page-level state. The shared position keeps it visible without a separate mobile row. |
| 29 September 2026 | Use SHA-256 content hashes for versioned browser assets. | A content change must invalidate a stale browser cache entry. |
| 30 September 2026 | Remove the text sorter. | Its current value does not justify redesign and maintenance. Git history keeps it recoverable. |
| 30 September 2026 | Use one semantic site shell with domain accent tokens. | Shared structure identifies one site. Accent tokens preserve each tool's subject identity. |
| 30 September 2026 | Use an original pixel-art `V` block as the site icon. | The icon gives the site a distinct identity without copying existing artwork. |
| 1 October 2026 | Add a generic Open Graph preview to Guitar Strum Machine. | Static metadata improves link presentation. A central square-safe area supports WeChat cropping. |
| 1 October 2026 | Make version 2 the default as a controlled forced trial. | Default use provides operator evidence. Required reviews and the legacy rollback path limit, but do not remove, payment risk. |
| 1 October 2026 | Correct only the legacy example payment values. | The old examples were not clearly invented. The conversion logic and styles remain unchanged. |
| 1 October 2026 | Replace the audit action plan and website roadmap with this plan. | One active plan prevents duplicate actions and conflicting status. The initial audit report remains the dated baseline. |
| 1 October 2026 | Replace realistic legacy-derived identifiers in converter tests and fixtures. | Test data must be clearly invented. Use structural placeholders and regenerate the golden fixture without changing converter logic. |
| 1 October 2026 | Keep the current ABA user and remitter name public and unchanged. | The owner confirmed that the value is safe to publish. A replacement would change generated payment files. |
| 1 October 2026 | Validate the current converter through the normal CBA payment procedure. | The converter supports one established workflow. CBA upload acceptance plus the operator's entry, count, and total review is the applicable completion evidence. |
| 1 October 2026 | Remove general CBA rule research and configurable ABA source settings from the plan. | The converter supports only the current fixed workflow. The owner does not plan to make it a general ABA product. |
| 1 October 2026 | Use `Vincent` in the homepage greeting and lowercase `volo1st` everywhere else in the interface. | The greeting stays personal while the site and section identity remains consistent with the online handle. |
| 1 October 2026 | Feature Guitar Strum Machine on the homepage and keep CSV to ABA Converter in the tools directory. | The guitar tool has a broad public audience. The converter serves one narrow operational workflow. |
| 1 October 2026 | Keep the public homepage bilingual. | English and Simplified Chinese already form the shared site language model. |
| 1 October 2026 | Group approved public profiles under Vincent and Bits & Beats Studio. | The groups separate personal work from the studio identity without adding a private profile. |
| 1 October 2026 | Use a text-first homepage with restrained pixel details and semantic accents. | The design stays personal and playful without competing with the content or adding media approval work. |
| 1 October 2026 | Use a darker shared focus color during homepage implementation. | The current amber does not meet the three-to-one non-text contrast target against the page background. |
| 1 October 2026 | Replace the card-grid homepage with a personal workbench layout. | Open typography, indexed rows, flat highlights, and plain link directories feel authored rather than assembled from framework components. |
| 1 October 2026 | Make the homepage English-only and keep tools bilingual. | Literal translation weakens the personal voice and humor. Translation remains important for task-focused tool interfaces. |
| 1 October 2026 | Remove decorative homepage elements and redundant homepage navigation. | Each visible element must communicate information or provide an action. |
| 1 October 2026 | Open external homepage profile links in a new tab. | Visitors can keep the homepage open while they inspect an external profile. |
| 1 October 2026 | Use reversed colors for homepage link focus. | The compact contact directory does not need the shared three-pixel focus outline. Color reversal keeps the state visible without changing font weight. |
| 1 October 2026 | Keep category summaries and browser tools off the first homepage. | The homepage is a public namecard. Category details belong on useful section pages, and tools belong in the tools directory. |
| 1 October 2026 | Use Bits & Beats Studio only as the homepage contact identity for music and audio projects. | The studio spans both areas and does not need a separate homepage description. |
| 1 October 2026 | Remove the in-page logo and distribute the namecard within a viewport-aware page region. | The introduction already provides identity. Responsive vertical distribution uses sparse space without adding content or decoration. |
| 1 October 2026 | Prototype an interaction-driven link signal in the homepage gap. | Each point maps to an external link. The effect stays idle without animation and has a no-signal comparison mode. |
| 1 October 2026 | Remove the link-signal prototype. | The mapping was too subtle to understand on desktop and depended on hover that did not translate to mobile. |
| 1 October 2026 | Use a restrained Sagittarius constellation as the homepage identity signal. | The constellation has personal meaning, works without hover, and gives the intentional blank space a function. Its star positions use SIMBAD data, while its dotted connections remain a simplified drawing. |
| 1 October 2026 | Use motion only for important state or meaning, and do not apply `prefers-reduced-motion` to site motion. | The site uses little motion. When motion is included, it has a function and must remain available. Omit motion that does not meet this standard. |
| 1 October 2026 | Keep the constellation automatic and non-interactive. | Sensor control requires permission and can disturb visitors. The small visual effect does not justify a prompt. |
| 1 October 2026 | Use the introduction as navigation to Code, Sound, and Music. | Linked words avoid another navigation row and give the introduction a second function. Games remain a design influence until they have useful public content. |
| 2 October 2026 | Replace homepage social text with one monochrome icon strip. | The icons reduce visual density. One separator preserves the personal and studio grouping without visible labels. Precise link names distinguish repeated services. |
| 2 October 2026 | Mark sparse section indexes with “More when there’s something worth showing.” | The line sets expectations without an under-construction notice or placeholder content. |
| 2 October 2026 | Name the directory “Tools” and use the shared breadcrumb shell on maintained tool pages. | The shorter name fits the public-site voice. Breadcrumb links provide sufficient navigation, so a repeated logo, large title, and footer add unnecessary visual weight. |
| 2 October 2026 | Record the metronome, tuner, and song pitch and key tool as unscheduled ideas. | The concepts need product definitions before they become projects or implementation packages. |
| 2 October 2026 | Use one abstract music-app icon family and the existing guitar page palette. | Shared colours and related line forms provide subtle ownership without adding a name or monogram to each icon. |
| 3 October 2026 | Define the pitch shifter as a local-file tool with direct semitone control and WAV export. | Fixed tempo, no microphone, no links, no speed control, and no A-B loop keep the tool focused. Key recognition and MP3 export remain separate extensions. |
| 3 October 2026 | Keep the pitch-shifter deployment build-free and permit pinned local Wasm components. | Audio quality can justify a specialised dependency. Local pinned artifacts preserve static deployment and avoid runtime third-party requests. |
| 3 October 2026 | Use Signalsmith Stretch with the official cheaper preset for Pitch Shifter version 1. | Listening tests found better quality than SoundTouchJS and no material quality loss from the cheaper preset. Manual faster settings crossed the accepted distortion boundary. |
| 3 October 2026 | Use one Pitch Shifter processing mode with SIMD and scalar Wasm variants. | One mode keeps the interface focused. SIMD gives a material speed improvement on tested Apple devices. The scalar variant keeps compatible browsers usable. |
| 3 October 2026 | Reserve key recognition and MP3 export for later Pitch Shifter versions. | These features have separate algorithms, dependencies, tests, and failure states. WAV export provides a dependable version 1 result. |
| 3 October 2026 | Use the official Signalsmith AudioWorklet path for live preview and keep the custom offline worker for export. | Live play, seek, and pitch changes improve the main workflow. The offline SIMD path remains faster than real time and provides the downloadable WAV. |
| 3 October 2026 | Use HTTPS for iOS and iPadOS performance tests. | WebKit Enhanced Security can disable JavaScript and Wasm just-in-time compilation on a plain HTTP local-area-network origin. This behavior invalidated the absolute timing results from the local iPhone prototype. |
| 3 October 2026 | Do not add a Pitch Shifter progress bar in version 1. | Production HTTPS tests completed the 246-second reference file in approximately 2 seconds on the tested iPhone and Mac. Keep the working status and cancel control for slower devices. |
| 3 October 2026 | Replace the numbered Pitch Shifter workflow with one compact workspace and one transport. | Original audio, live shifted audio, and the generated WAV need the same play, pause, and seek controls. One transport removes repeated players and keeps comparison at the same position. |
| 3 October 2026 | Remove the eight-second rendered preview. | The supported current browsers and deployed HTTPS site provide AudioWorklet on the tested devices. Complete-file export remains available after a live-playback failure and supplies exact shifted playback when it completes. |
| 3 October 2026 | Use one create-or-download action and no processing overlay. | The action can show its current state without blocking the page. A source or pitch change invalidates the download and restores the create action. |
| 4 October 2026 | Let the Pitch Shifter pitch value select original or shifted playback. | A separate source selector duplicates the pitch state. Zero semitones plays the original file. A non-zero value plays live shifted audio or the generated WAV. |
| 4 October 2026 | Compare the default preset through a temporary query before revising the export actions. | The query permitted a comparable timing test without adding an end-user quality setting. The test is complete, so the temporary query is removed. |
| 4 October 2026 | Use the Signalsmith Stretch default preset for Pitch Shifter version 1. | The reference high-quality MP3 processed in 2.6 seconds. The owner accepted this time, and the default preset keeps the larger quality margin. This decision supersedes the cheaper-preset decision from 3 October. |
| 4 October 2026 | Use Prepare WAV followed by Download WAV, without a cancel control. | Processing takes approximately three seconds on the tested current devices. A distinct download click remains dependable after asynchronous processing, including in Safari. This decision supersedes the earlier requirement to keep Cancel available. |
| 4 October 2026 | Use one AudioWorklet path across zero semitones on secure origins. | Switching between a native audio element and the AudioWorklet caused an audible delay when the pitch crossed zero. One running engine can change pitch without a playback handoff. Native zero-semitone playback remains available on insecure origins for local testing. |
| 4 October 2026 | Keep live playback information separate from WAV preparation statistics. | The browser does not provide a dependable live processor-load measurement. An explanatory empty state is clearer than incomplete or mixed statistics. |
| 4 October 2026 | Combine the Pitch Shifter play and pitch controls, and use the file button as the selected-file display. | The compact layout keeps the primary controls together. The file button remains the replacement-file action, and separate metadata keeps the filename readable on narrow screens. |
| 4 October 2026 | Reserve the Pitch Shifter metadata line and distribute the mobile playback controls across the available width. | A reserved line prevents movement after file selection. Edge-aligned play and reset controls keep the centred pitch stepper visually balanced without a visible group label. |
| 4 October 2026 | Apply constant gain reduction to Pitch Shifter WAV output when the rendered sample peak exceeds the format range. | The Signalsmith default preset can create peaks above full scale from mastered input. A shared gain value prevents clipping and preserves stereo balance without a limiter. Statistics always show the adjustment. The completion status reports reductions greater than 1 dB. This decision supersedes the earlier clip-and-warn behavior. |
| 4 October 2026 | Clamp Pitch Shifter samples outside the WAV range instead of reducing the complete output level or adding a limiter. | Listening tests compared hard clipping, a fast look-ahead limiter, and a smooth look-ahead limiter on two demanding commercial mixes. The owner found all three results acceptable. Hard clipping preserves the output level and avoids a new dynamics processor. Processing statistics show the pre-encode peak and the clipped-sample count. The main status reports clipping only when more than 1 percent of channel samples are outside the WAV range. This decision supersedes the constant-gain decision from 4 October. |
| 4 October 2026 | Use the established iOS audio-session recovery for all Pitch Shifter playback and simplify the pitch controls. | The built-in iPhone speaker was silent for live and generated-file playback while EarPods worked. Guitar Strum Machine previously had the same WebKit failure and recovered by cycling the audio session from `ambient` to `playback` after playback started. Keep this optional API as a best-effort enhancement. Replace the editable pitch field with flat, sharp, and natural buttons plus a read-only value. Keep the desktop group compact and centred. Keep the mobile edge alignment. Use “Shift” as the file action. Keep MP3 export in a separate package. |
| 5 October 2026 | Use `wasm-media-encoders` 0.7.0 and LAME at 320 kbit/s for Pitch Shifter MP3 export. | The small direct PCM interface fits the existing processing worker and needs no site build system. The pinned local artifacts avoid a third-party runtime dependency. A full reference track encoded at 46.8 times real time on the development host. The MP3 can contain one short frame of codec delay because this encoder does not write LAME gapless metadata. This limit is acceptable for a downloaded pitch-shifted file. |
| 5 October 2026 | Default Pitch Shifter output to MP3 for an MP3 source and WAV for every other source. | The rule follows the source format when the tool supports it. It does not imply that AAC, FLAC, or other input formats can be preserved. The user can select either supported output before processing. |
| 5 October 2026 | Put the Pitch Shifter export format in a collapsed Advanced section. | Export format is a secondary setting. A styled native select uses less space than a segmented control and gives iOS users a familiar option picker. The main workspace keeps one Shift or Download action. |
| 5 October 2026 | Use “Export” for the Pitch Shifter complete-file action. | “Pitch shift” continues to name the audio operation. “Export” describes the button result and gives the English and Chinese interfaces a more natural action label. This decision supersedes the “Shift” action label from 4 October. |
| 5 October 2026 | Animate one to three dots during Pitch Shifter export. | A small CSS animation distinguishes active processing from a static disabled control. The accessible button text stays stable. |
| 5 October 2026 | Use the tracked project lifecycle for non-trivial repository work. | Todoist selects and prioritizes the package. Repository documents govern requirements, decisions, and evidence. Todoist records the verified outcome. A later retrospective promotes or discards local experience candidates. |
| 5 October 2026 | Defer a custom not-found page and keep the current search-indexing behavior. | GitHub Pages supports a root `404.html`, but the site does not need custom recovery navigation now. A site-wide indexing policy would add maintenance without a current use. Existing page-specific behavior remains unchanged. |
| 5 October 2026 | Use explicit dot elements for the Pitch Shifter export indicator. | The deployed pseudo-element clipping animation did not visibly cycle during owner testing. Explicit dots use discrete visibility states and keep the accessible button label stable. |
| 5 October 2026 | Keep unscheduled website-tool ideas in this plan instead of separate Todoist tasks. | The repository preserves product context and references. Todoist stays limited to selected work packages. Pitch Shifter and Guitar Strum Machine are complete. Tuner remains unscheduled. MeTube stays with the Home Lab video-streaming package because it has a different execution and support model. |

## 16. Verified completion evidence

- On 5 October 2026, the owner confirmed that the deployed Pitch Shifter export indicator works. This resolved the final reported issue in the public-foundation review and completed the Phase 3 gate.
- On 5 October 2026, the repository opted into the tracked project lifecycle. The user-level Codex skill was installed, the project mapping parsed successfully, `experience.md` was confirmed as ignored, and the general repository check passed. Hooks remain deferred until observed omissions justify them.
- On 5 October 2026, the owner confirmed correct Pitch Shifter keyboard use, narrow-screen behavior, 200 percent zoom, and current-iPhone MP3 export quality and performance. These checks completed the version 1 and MP3 export packages.
- On 4 October 2026, the owner verified the updated Pitch Shifter on an iPhone. Live and generated-file playback worked through the built-in speaker. The playback controls no longer flashed, text selection was disabled in the workspace, and the progress control no longer showed the iOS tap-highlight rectangle.
- On 4 October 2026, the owner compared hard clipping with fast and smooth look-ahead limiting on two demanding commercial mixes and found all three results acceptable. Automated tests confirmed exact clipped-sample measurement, 16-bit WAV clamping, translation-key parity, and current browser-module hashes.
- On 3 October 2026, the owner verified live preview and shifted WAV export through the deployed HTTPS site. The same 246-second, 48 kHz stereo file completed in approximately 2 seconds on an iPhone 16 Pro and 1.83 seconds on a Mac Studio with an M1 Max.
- On 3 October 2026, the owner approved the pitch-shifter product boundary, direct semitone control, build-free dependency policy, algorithm comparison, WAV baseline, and staged key-recognition and MP3 extensions.
- On 2 October 2026, the owner approved the four-icon music-app family. Automated checks confirmed the shared palette, required image dimensions, current asset hashes, local manifest paths, and Guitar Strum Machine installation metadata. The owner confirmed the deployed home-screen icon on an iPhone.
- On 2 October 2026, the owner approved the shared breadcrumb, English-only breadcrumb text, simplified language control, and footer removal on the maintained tool pages.
- On 1 October 2026, the privacy review checked all 58 tracked files. It found no email address. It replaced realistic payment-like test identifiers and one person-like parser example with explicit invented values. The regenerated ABA fixture contains four 120-character records and approved invented labels only.
- On 14 September 2026, the owner verified the current converter in Chrome on a MacBook Air and Safari on an iPhone 16 Pro. The owner also verified the page at 200 percent zoom.
- On 29 September 2026, Guitar Strum Machine playback, sharing, presets, practice controls, responsive layout, and language behavior passed owner testing on the supported clients.
- On 1 October 2026, the owner approved the shared warm theme, site shell, icon, and domain accents.
- On 1 October 2026, WeChat and WhatsApp displayed the deployed Guitar Strum Machine preview. Sharing from the WeChat browser produced an accepted plain-link fallback.
- On 1 October 2026, the owner verified the deployed current converter, redirect, and legacy fallback routes.
- The repository check covers JavaScript syntax, shell syntax, automated tests, internal references, translation keys, accessibility references, asset hashes, and whitespace.

## 17. External task-system mapping

Use `.codex/project-workflow.toml` for the external task-system mapping. Use the phase headings in this plan to define the work packages.

- Keep only the next public-website package actionable.
- Keep later phases ordered and without dates.
- Track the CSV-to-ABA workflow validation as a separate waiting task.
- Inspect comments and attachments before moving or closing an existing task.
- Get confirmation before deleting or substantially restructuring an external task.
- Do not access the private Todoist project named `.`.
- Reconcile routine package-boundary changes after the applicable repository checks pass.
- Keep `experience.md` local. Create it only after a mistake, surprise, or useful workaround.

## 18. Studio rates page

Selected by the owner on 15 October 2026. This package resumes website work after the completed operations notes. No other package is active.

Purpose: Give studio clients a readable rate list and a direct enquiry path.

Decisions before implementation:

- Use `/studio/rates/`. Reserve `/studio/` for future studio content. A later subdomain can use `/rates/` and retain the former address through a redirect.
- Match the existing site. Use three service rows that stack on narrow screens.
- Use 2026, Australian dollars, and the approved wording “No GST is charged.”
- Recording costs $100 per hour, with an engineer, equipment, and a two-hour minimum. Mixing and editing cost $90 per hour. Song and album packages use custom quotes.
- Agree on revisions, deliverables, schedule, and additional work in each quote. Do not invent a fixed revision count or cancellation rule.
- Use the approved studio Instagram and RedNote profiles for enquiries.
- Reuse the local translation utility. Keep English content readable when JavaScript is unavailable. Add no dependency, build step, form, or network request.
- Use semantic sections, explicit language buttons, visible focus, and a responsive grid. Do not add motion.

Completion checks:

- [x] Implement the English and Simplified Chinese page and Sound link.
- [x] Verify translations, language changes, local references, and asset versions with automated tests.
- [x] Run the repository check and review the complete diff.
- [ ] Verify keyboard use, visible focus, narrow screens, and 200 percent zoom in a browser.
- [x] Commit the package after the required checks pass or an owner-approved release exception.

Failure behavior: The English rate list and contact links remain available without JavaScript. Browser storage is optional. A failed language script does not remove the rate list.

Evidence on 15 October 2026: `./scripts/check.sh` passed for all seven test files. The new tests verify matching language keys, English fallback text, language-button state, document language and title, saved preference, and asset hashes. Existing site checks verify references and semantic ID references. The complete source diff was reviewed.

Earlier blocker: This session has no browser tool. Keyboard use, visible focus, narrow screens, and 200 percent zoom remain unverified. The owner later accepted the page and explicitly requested commit and deployment. This approval supersedes the earlier release hold. Do not report the missing browser checks as passed.

Revision on 15 October 2026: The owner requested the final shared rate-card draft verbatim. This replaces the first page's rewritten descriptions and booking text. Retain the separately agreed 2026 year, currency and tax note, and social contact links. Use EP in both languages. Keep the breadcrumb in English, including its accessible label. Reduce the content and heading sizes. Browser verification remains pending.

Typography revision on 15 October 2026: Use the existing display serif in italic for the year label, with light letter spacing. Set service notes to 0.75rem and a lighter warm grey. Keep the page background and shared fonts. Refresh the stylesheet content hash. Browser review remains pending.

Content revision on 15 October 2026: Use “Contact me” and the matching singular Chinese wording. Remove the recording and mixing tagline from the page and both catalogs. Move the currency and tax note to the footer at 0.6875rem. Keep the social links. Browser checks remain pending.

Studio presentation revision on 15 October 2026: Add a divider and padding above the currency footer. Set service descriptions in a local serif font stack with Chinese Song-style fallbacks and a 1.7 line height. Keep the compact text size, service-note style, and shared site assets. No font download is required. Browser review remains pending.

Contact revision on 15 October 2026: Move the contact invitation and studio social links from Additional Information to a dedicated Contact Me section. Invite visitors to send a message on Instagram or RedNote for a project discussion and tailored quote. Add matching Simplified Chinese text. Match the existing section headings and dividers. Browser checks remain pending.

Contact link revision on 15 October 2026: Put Instagram and RedNote links inside the contact sentence. Remove the separate link row. Translate the sentence as text spans around persistent links, so language changes preserve the links without HTML injection. Use the site neutral link colours and underlines. Browser review remains pending.

Typography revision on 15 October 2026: Additional Information bullets use the same serif font stack and line height as service descriptions. Refresh the stylesheet hash. Browser review remains pending.

Spacing revision on 15 October 2026: Services, Additional Information, Contact Me, and the footer share one rule for zero outer margin, 1.25rem vertical padding and the top divider. Remove the booking list browser-default margins. This removes the extra gaps before the later sections. Browser review remains pending.

Structure revision on 15 October 2026: Add `/studio/` with the studio name as its only main content. The rates page uses “2026 Studio Rates” as its main heading. Its fixed-English breadcrumb is `volo1st / studio / rates`, with links to the home page and studio index. Keep the existing Sound link to rates. The studio index uses the shared site shell and local, versioned CSS. Browser review remains pending.

Navigation revision on 15 October 2026: Move the Sound page rates, Instagram, and RedNote links to the studio index. Replace the former Sound studio block with a single “my studio” link to `/studio/`. Reuse the site section-link style on both pages. Update navigation tests and README. Browser review remains pending.

Naming revision on 15 October 2026: Use 小红书 for the platform name in both language catalogs, studio-page links, and home-page social-link accessible labels and titles. Keep the existing profile URLs.

Mobile layout revision on 15 October 2026: Keep service headings and rates in two columns on narrow screens. Reduce the mobile column gap. The heading column can wrap when space is limited. Browser and zoom review remain pending.

Release decision on 15 October 2026: The owner accepted the final page and requested commit and deployment. Deploy through the established GitHub Pages `master` branch. The full source diff was reviewed. Run the repository check before committing. Browser-only checks remain unverified and do not block this owner-approved release.

Release evidence on 15 October 2026: The repository check passed for all seven test files. The studio home, bilingual rates page, navigation, documentation, and regression tests were committed together. The owner approved release with browser-only checks still unverified.

Breadcrumb cleanup release on 15 October 2026: The owner requested deployment. The complete diff was reviewed. `./scripts/check.sh` passed for all seven test files. The change removes summary spans and unused styles, and refreshes shared stylesheet hashes. Browser-only checks were not available in this session.

## 19. Get Lucky chord correction

On 15 October 2026, the owner requested Bm7, D, F#m7, and E, played with Am7, C, Em7, and D shapes at capo 2. Preserve concurrent owner edits to the strumming pattern.

Use the existing shape notation and capo playback. Add the missing open Em7 voicing, `020000`, to the local chord catalog. The tool remains before its declared 1.0.0 release, so update the existing preset slug in place under the recorded pre-release policy. Update the README to match that policy.

Test the parsed shapes, capo value, and actual playback pitch classes. Keep the normal catalog validation and timeline tests. Refresh the two changed script hashes. No new dependency or network request is required.

Implementation evidence: Add open Em7 to the supported catalog and its catalog test. The Get Lucky regression test verifies Am7, C, Em7, and D at capo 2 and the expected Bm7, D, F#m7, and E playback pitch classes. The strum source was not changed.

Correction on 15 October 2026: The initial change omitted arrangement key metadata. Use number notation with original and playing keys set to F# minor, capo 2, and `4:m7`, `6`, `1:m7`, `7`. This enables arrangement key controls and preserves the requested shapes and sounding chords. The regression test now checks both keys, notation, shapes, and sounding harmony. Preserve the strum source.

Release decision on 15 October 2026: The owner requested 116 beats per minute and approved release of the Get Lucky update. Retain F# minor metadata, number notation, capo 2, and the existing strum pattern. Run the repository check and review the full diff before committing and deploying through GitHub Pages. Browser listening checks are not available in this session.

Strumming revision on 15 October 2026: The owner auditioned a revised Get Lucky pattern and reported a closer feel. Save the supplied pattern verbatim: `| D UX D2P UX D - D2P - D - D U4 - U4 D4 -| x4`. This replaces two early palm-muted upstrokes with dead upstrokes, changes the beat-2 muted downstroke to two strings, and uses a full downstroke on beat 3-and. Keep 116 beats per minute, capo 2, key metadata, and chords. Refresh the preset script hash.

Further strumming revision on 15 October 2026: Use the owner's revised pattern `| D UX D2P UX D - D2P - D - D4P U4 - U4 D4 -| x4`. The downstroke on beat 3-and now uses four strings with palm mute. Refresh the preset script hash.

Writing revision on 15 October 2026: Use Oxford commas where appropriate in English lists of three or more items. Correct missing commas in studio text and current project documentation. Record the rule in `AGENTS.md`. Keep paired phrases such as “acoustic and electric instruments” unchanged. Refresh the studio translation script hash and update the text expectation in its existing test.

## 20. Sound section placeholders

Purpose: Give room acoustics and live sound work stable addresses under Sound.

Selection on 16 October 2026: The owner selected this package and approved the labels and addresses. Todoist has no actionable website child task. Reconcile this package at the completion boundary. Leave deferred packages unchanged.

Requirements and decisions:

- Show Studio, Room acoustics, and Live sound on `/sound/`.
- Keep `/studio/`. Add `/sound/room-acoustics/` and `/sound/live-sound/`.
- Describe room measurements and acoustic treatment on the Room acoustics page.
- Describe front-of-house mixing on the Live sound page. An abbreviation is not necessary.
- Mark both new pages with “Examples coming soon.” Do not add unverified examples, prices, or service availability claims.
- Keep the English section-page convention and the existing site design. Use plain HTML, local styles, and breadcrumb links to Sound.
- Use real destination pages. If examples are unavailable, show the placeholder text.

Design review: Static pages and ordinary links meet this package's needs. The shared shell supplies visible focus and wrapping breadcrumbs. Reuse the section link layout. Use a small local stylesheet for the detail pages. No script, external dependency, or new network service is required.

- [x] Add the links and placeholder pages.
  - Evidence: Sound links to Studio, Room acoustics, and Live sound. Both new pages include a heading, a short description, breadcrumb links, and “Examples coming soon.”
- [x] Run the repository check and review the complete diff.
  - Evidence: `./scripts/check.sh` passed for all seven test files. Existing tests check the Sound destinations, local references, HTML identifiers, and current asset hashes. The complete source diff and new files were reviewed.
- Optional review: Check keyboard use, visible focus, narrow screens, and 200 percent zoom when a browser is available. This review has not run.
- [x] Record verification limits.
  - Evidence: Manual browser review did not run. The owner-approved verification rule permits this static-page package to proceed with the repository check and diff review. Commit the verified source changes together. Deployment remains separate.

Blocker recorded on 17 October 2026: The environment has no installed browser. A temporary Playwright and Chromium download succeeded after network approval. Chromium could not run from `/tmp` because that mount blocks executable files. After an approved workspace launch, Chromium reported missing system libraries, including `libglib-2.0.so.0`. No browser test ran. The temporary browser was moved out of the repository. Do not install system libraries as part of this content package. Browser review, the package commit, and Todoist completion remain pending. Deployment is not part of this package.

Verification decision on 17 October 2026: The owner rejected heavy automated test setup for small changes because it provides little value and takes too long. Record this rule in `AGENTS.md` and the README. The unavailable browser review is now optional for this static-page package. The recorded browser blocker no longer prevents a commit. Keep the missing review visible. Todoist has no matching package task to complete. Leave deferred tasks unchanged.

## 21. HTML and CSS audit, and UI style guide

Selection on 17 October 2026: The owner selected this package. Todoist has no actionable website task. The existing deferred tasks do not cover this work. Keep them unchanged.

Purpose: Identify current component semantics and style differences. Give the owner one page to review before selecting a shared design.

Requirements and decisions:

- Inspect every maintained HTML page and stylesheet. Record the frozen legacy page separately.
- Record page structure, fonts, colors, spacing, components, states, semantic risks, and app-specific exceptions in `docs/ui-audit.md`.
- Add `/style-guide/` as a static component showcase. Keep it out of the homepage navigation during review.
- Show a clearly marked draft for shared components and isolated examples from the current stylesheets. Do not copy current CSS into the examples.
- Show typography, bilingual text samples, links, buttons, text fields, selects, sliders, notices, panels, disclosures, tables, metrics, and common states.
- Use existing local assets and native HTML controls. Do not add a framework, build system, browser-test installation, audio engine, or conversion logic.
- Keep candidate component CSS under `style-guide/` until the owner accepts it. Existing page styles remain unchanged.
- Review the showcase with the owner in the next stage. Migrate common controls only after that review. Preserve specialized chord and audio displays, current addresses, translation keys, and app state behavior.

Failure behavior: The showcase has no payment, audio, or download operations. Static state samples remain visible without JavaScript. Each current-style example loads its own family of page styles in a separate document, so app selectors cannot change another example. A missing stylesheet remains a missing-reference check failure.

Engineering review: Prefer native buttons, inputs, selects, and disclosures. Keep action semantics separate from navigation semantics. CSS tokens alone do not share a component's markup, state rules, or dimensions. Use isolated documents to compare the existing cascades before extracting shared classes. The audit records the primary references and the limits of source-only review.

- [x] Complete the source audit and migration recommendations.
  - Evidence: `docs/ui-audit.md` inventories all 14 existing HTML documents and 11 stylesheets at revision `ec8eadf`. It records component semantics, foundations, style differences, state risks, specialized exceptions, and a staged migration sequence.
- [x] Build the draft showcase and current-style examples.
  - Evidence: `/style-guide/` contains a shared-component draft and five isolated current-style specimens. The specimens load the existing source stylesheets. No existing page imports the draft CSS. The guide has no scripts or app engines.
- [x] Run the existing repository check and review the complete diff.
  - Evidence: `./scripts/check.sh` passed for all seven test files. The existing asset-hash check includes all guide documents. The source diff was reviewed. No browser tooling was added.
- [x] Record review limits.
  - Evidence: Browser rendering, keyboard operation, device fonts, and zoom have not been reviewed. This is a source audit and a visual-review draft. Manual review belongs to the next stage. Commit this verified first package without migrating existing pages.

Tracking at the completion boundary: Todoist task `6hmjQFvhpXv93Jmc` records the owner-selected audit and showcase package. Reconcile its result after committing. Do not promote the deferred project-model or content-system tasks.

Next stage: Review and refine the draft with the owner. Do not start the site-wide migration in this package.

### 21.1 Typography iteration

Direction selected on 17 October 2026: Use serif by default for headings, prose, notices, help, and table content. Use sans-serif for buttons, inputs, selects, control labels, interface navigation, and disclosure summaries. Inline text links retain the surrounding content font. Use monospace for code, arrangement source, and technical values that need it.

Use one local serif stack for both display and reading text. Include Chinese serif fallbacks. Keep system sans-serif for controls and one monospace stack for source text. Remove decorative monospace from guide headings and captions. Keep the current-style specimens unchanged for comparison. This iteration changes only the draft and its documentation.

Verification evidence: `./scripts/check.sh` passed for all seven test files. The complete diff was reviewed. Refreshed both draft stylesheet hashes. Browser font rendering and visual review remain pending. No test tools were installed for this style change.

### 21.2 Typography scale

Direction accepted on 19 October 2026: Use four named size tokens: supporting text at 0.875rem, body text at 1rem, section headings at 1.5rem, and page titles at 2rem. These correspond to 14, 16, 24, and 32 pixels at a 16-pixel base size. Use only weights 400 and 700. Serif headings use weight 400. Buttons, control labels, emphasis, and body-size subsection headings use weight 700.

Use line height 1.6 for body text and controls. Use line height 1.2 for headings. Use normal letter spacing. Update guide captions, font samples, metrics, and comparison summaries to use these same roles. Keep the current-style specimens and existing pages unchanged. The homepage greeting remains an explicit exception for the later migration.

Verification evidence: `./scripts/check.sh` passed for all seven test files. Reviewed the complete diff and confirmed that draft text sizes, weights, and line heights use the named tokens. Refreshed both draft stylesheet hashes. Manual browser review remains pending. No tests or tools were added for this static style iteration.

### 21.3 Page width

Direction selected on 19 October 2026: Keep pages centered and bounded on desktop. Keep visible side margins on mobile. Start the draft at one maximum width of 48rem, or 768 pixels at a 16-pixel base size. Use the same container for the header and main content.

Use one gutter token for the space on each side: `clamp(1rem, 4vw, 2rem)`. Subtract both gutters from the available width before applying the maximum. This gives narrow screens flexible content width without edge-to-edge content or a fixed desktop minimum. Remove the guide's independent 42rem and 44rem limits. Keep its existing single-column small-screen layout. Do not change specialized internal scrolling or the current-style specimens.

Add a layout section to the guide that explains the width, gutters, and responsive behavior. This iteration affects only the draft and its documentation. Existing pages will migrate after the guide is accepted.

Verification evidence: `./scripts/check.sh` passed for all seven test files. Reviewed the complete diff and the container calculation. Both header and main content use `.ui-container`. The maximum is shared, both minimum gutters are subtracted, and the layout has no fixed desktop minimum. Refreshed both draft stylesheet hashes. Manual browser, mobile, and zoom review remain pending. No tests or browser tools were added for this static style change.

### 21.4 Buttons and form controls

Selection on 19 October 2026: Consolidate common controls in the draft. Existing pages and current-style specimens remain unchanged.

Requirements and decisions:

- Use one control minimum height of 2.75rem, or 44 pixels at the default base size. Share 0.5rem vertical padding, 0.75rem horizontal padding, a 1-pixel border, and the existing control radius.
- Use the accepted sans-serif body size. Buttons and labels use the bold token. Ordinary field values use the regular token. Source fields retain monospace.
- Let long button labels wrap and increase the height. Keep textareas multiline and resizable. Do not fix every control to one height.
- Keep primary, secondary, quiet, icon, selected, and caution variants within one button family. Guard hover and active styles against disabled controls. Keep a selected button recognizable on hover.
- Use one focus outline for common controls. Use native buttons, inputs, selects, file controls, checkboxes, radio buttons, and ranges.
- Keep invalid field borders at the same width. Add an inner error stroke without changing layout. Show a linked text error with each invalid sample.
- Keep read-only fields selectable and focusable. Use one neutral disabled treatment. Disabled controls remain unavailable. Busy samples remain native disabled buttons with text and no decorative animation.
- Keep native slider geometry, with shared target height, theme accent, focus, and disabled styling. Do not replace the native widget in this pass.
- Expand the guide's state samples and include a row for comparing button, field, and select alignment. Add no application logic or new dependency.

Failure behavior: The guide continues to show static state samples. It performs no validation, conversion, playback, or file reading. Native disabled and read-only attributes retain their browser behavior. Existing application state rules are outside this iteration.

Engineering review: Shared minimum dimensions and padding address the current icon/text height difference. An inset error stroke avoids a border-width change. Explicit component selectors avoid changing the shell's plain language controls. The existing audit references cover native control semantics. Browser-specific select, file, and range rendering remains for manual review.

Verification evidence: `./scripts/check.sh` passed for all seven test files. Reviewed the complete diff, shared geometry, state selector precedence, and sample labels. Refreshed both draft stylesheet hashes. No application files, tests, or dependencies changed. Manual keyboard, mobile, zoom, and native-control rendering checks did not run. They remain for the guide review. No browser tools were installed.

### 21.5 Desktop control size and select arrow

Direction selected on 19 October 2026: Reduce the shared control minimum to 2.25rem (36 pixels at the default font size) above 650 pixels when the primary pointer is fine and supports hover. Reduce vertical padding to 0.25rem. Keep the default 2.75rem (44-pixel) touch minimum and 0.5rem vertical padding. Preserve the accepted font size and shared alignment. Long labels can still increase control height.

Inset the select chevron by 0.75rem. Reserve space between the value and chevron. Keep the native select element and its keyboard and mobile selection behavior. In forced-color mode, restore the browser arrow. Keep the arrow visible on disabled selects. This changes only the draft guide.

Verification evidence: `./scripts/check.sh` passed for all seven test files. Reviewed the complete diff, responsive tokens, select padding, and disabled background precedence. Refreshed the component stylesheet hash. Manual browser, keyboard, mobile, forced-color, and 200 percent zoom checks did not run. No tests, dependencies, or browser tools were added.

### 21.6 Spacing, panels, and disclosures

Purpose: Give related content, controls, and sections consistent spacing. Apply this iteration only to the draft guide.

Requirements and decisions:

- Reuse the existing spacing scale. Use 0.5rem within action rows and between headings and their content. Use 1rem between text blocks, 1.5rem between field groups, and 2rem for section padding. Reduce section padding to 1.5rem on narrow screens.
- Add explicit reusable content-flow, field-stack, and action-row classes. Reset direct child block margins within these layouts. Keep hidden content hidden and do not change application state rules.
- Use one panel surface, 1-pixel border, and panel radius. Share 1.5rem desktop padding and 1rem mobile padding with disclosure bodies. Use the same horizontal inset for disclosure summaries. Retain the native disclosure marker, keyboard behavior, and open state.
- Remove decorative frames around ordinary guide samples. Show plain content beside a bordered panel. Remove the draft raised-panel variant. Use an unboxed fieldset for related options rather than nesting another panel.
- Demonstrate paragraph, heading, field, action, list, and disclosure spacing. Include long summaries and Chinese content. Keep specialized app displays and existing pages unchanged.

Failure behavior and engineering review: The guide remains static and needs no script. Explicit layout classes control direct children without global paragraph or section overrides. Native fieldsets retain their legends. Native disclosures retain keyboard and focus behavior. No fixed heights or clipped containers may hide wrapped content or focus outlines. Browser rendering remains an optional manual review for this style change.

Verification evidence: `./scripts/check.sh` passed for all seven test files. Reviewed the complete diff, direct child margins, responsive padding, disclosure alignment, labels, and linked help text. Refreshed both draft stylesheet hashes. Existing pages and isolated specimen files did not change. Manual browser, keyboard, narrow-screen, and 200 percent zoom checks did not run. No tests, dependencies, or browser tools were added.

### 21.7 Notice tones and content

Purpose: Give information, success, warning, and error notices one shared visual structure. Refine only the guide before app migration.

Requirements and decisions:

- Retain the existing blue, green, gold, and red tone pairs. Keep tone meanings independent of the tool accent. Use an explicit heading or text label so color is not the only indication.
- Use a 4-pixel left stripe, one panel radius, and 1rem padding. Keep body text dark and serif. Color the notice heading with its semantic tone. Keep buttons sans-serif and links underlined.
- Use the accepted `.ui-flow` spacing for notice text and lists. Remove notice-specific paragraph overrides. Show single-paragraph status, long text, error lists, Chinese text, and optional actions.
- Keep the dismiss control at its shared size while the content column can shrink and wrap. Keep the dismissible example static. Add no script, animation, timeout, or app state change.
- Keep essential instructions and actionable errors persistent. Keep empty content neutral. Do not attach live-region roles to static examples. During later migration, preserve existing app announcements and error focus rules.

Engineering review and failure behavior: Appearance does not assign announcement urgency. Use the W3C status-message and alert guidance when migrating dynamic app messages. Static notice samples perform no validation or background task. Links may move to existing guide fields. Existing field state samples remain static. Long content must wrap without clipping or shrinking the dismiss button. Retain visible keyboard focus. Missing optional browser review does not block this style iteration.

Verification evidence: `./scripts/check.sh` passed for all seven test files. Reviewed the complete diff, semantic tone variables, shared content spacing, dismiss-button sizing, and error links. The local contrast calculation gives heading-to-surface ratios of 5.75:1 or higher for all four tones. Recorded the color-pair results and primary references in `docs/ui-audit.md`. Refreshed the component stylesheet hash. Existing apps and specimen files did not change. Manual browser, keyboard, narrow-screen, and 200 percent zoom checks did not run. No tests, dependencies, or browser tools were added.

### 21.8 Tables and summary values

Purpose: Give tabular data and label/value summaries consistent type, spacing, and responsive behavior. Refine only the draft guide.

Requirements and decisions:

- Use one table class with serif body text, bold headings, a subtle header surface, and horizontal row dividers. Reuse the 0.75rem cell-padding token. Give totals the same subtle surface and bold weight.
- Mark numeric table headers and cells explicitly. Align them to the end and use tabular digits. Keep each numeric value and its unit together. Let descriptive text wrap.
- Give long descriptive columns an explicit 12rem minimum through a cell class. Preserve normal word wrapping elsewhere. This keeps narrow tables readable while the wrapper scrolls.
- Keep native table markup, captions, column headings, row headings, and footer totals. Place wide tables in a named, keyboard-focusable scroll region. Keep overflow local rather than widening the page or hiding columns.
- Use one responsive definition-list grid for summary values. Use supporting-size labels and bold body-size values. Keep the same neutral dividers and spacing across tool accents. Let long values wrap. Add no tile, oversized-number, or compact-row variant in this pass.
- Add a dedicated guide section. Show long filenames, totals, an empty table, zero values, missing values, and Chinese labels. State units in text or headings. Keep all examples invented and static.

Engineering review and failure behavior: Preserve native table and definition-list relationships. Do not use CSS to turn table rows into cards. Narrow screens can scroll the table region while summaries reflow. Missing data stays explicit and does not become zero. The guide performs no calculation, sorting, file processing, or app state update. Existing app output and financial-file logic remain unchanged.

Verification evidence: `./scripts/check.sh` passed for all seven test files. Reviewed the complete diff, numeric cell alignment, descriptive-column minimum, captions, header scopes, scroll-region names, definition-list groups, and static example totals. Refreshed the component stylesheet hash. Existing apps and isolated specimens did not change. Manual browser, keyboard scrolling, narrow-screen, and 200 percent zoom checks did not run. No tests, dependencies, or browser tools were added.

### 21.9 Optional striped table rows

Purpose and decision: Add `.ui-table--striped` as an optional modifier for long tables. Keep `.ui-table` as the shared base and plain default. Alternate white and warm inset surfaces on direct body rows only. Retain the base headings, footer totals, dividers, typography, padding, and local scrolling. Use existing surface tokens. Add an eight-row example with invented data and a footer total.

Engineering review and failure behavior: Row stripes are a reading aid. They do not indicate selection or status. Keep explicit state text and native table relationships. Do not add hover, sorting, selection, or script behavior. Limit the selectors to direct body rows so headers, totals, and nested tables keep their own styles. This iteration changes only the guide.

Verification evidence: `./scripts/check.sh` passed for all seven test files. Reviewed the complete diff, selector scope, shared base styles, caption and scroll-region references, and static totals. Refreshed the component stylesheet hash. Manual browser, keyboard scrolling, narrow-screen, and 200 percent zoom checks did not run. No tests, dependencies, or browser tools were added.

### 21.10 Table surface refinement

Purpose and decision: Replace the striped table's white rows with the existing warm subtle surface (`#f8f6ef`). Retain the inset surface (`#f2f0e9`) for alternate rows. Use the deeper warm surface (`#e9e5da`) for all draft table headers and totals. Give header boundaries the same stronger border color as footer boundaries. This supersedes the surface choices in section 21.9.

Engineering review and failure behavior: Reuse existing palette tokens. Keep row stripes distinct from structural headings and totals. Change no table layout, semantics, text, or behavior. Existing app pages and specimens remain unchanged.

Verification evidence: `./scripts/check.sh` passed for all seven test files. Reviewed the complete diff and the three surface roles. Refreshed the component stylesheet hash. Manual browser, keyboard, narrow-screen, and 200 percent zoom checks did not run. No tests, dependencies, or browser tools were added.

### 21.11 Page headers and navigation

Purpose: Give page context, titles, breadcrumbs, and language choice the accepted typography, spacing, control dimensions, and focus treatment. Change only the draft guide before migration review.

Requirements and decisions:

- Add explicit draft classes for page headers, context rows, breadcrumb navigation, and language choice. Remove the draft's partial font overrides for legacy shell selectors. Keep the shell and current-style specimens unchanged.
- Use native navigation, an ordered breadcrumb list, linked ancestors, hidden separators, and current-page state. Keep breadcrumb text in English. Reuse the neutral link treatment and shared visible focus outline.
- Keep the language choice at the right of the breadcrumb at normal desktop and mobile widths. Let breadcrumb text wrap. At exceptionally narrow widths or zoom, allow the context row to wrap rather than clip. Do not force a separate mobile language row.
- Use `EN` and `中文` as the visible language labels, with full accessible language names. Use native buttons, static `aria-pressed` states, and the shared quiet button geometry. Keep the selected underline. Use the common focus outline instead of reversed focus colors in this draft. This supersedes only the draft focus direction from section 8.1.
- Use the page-title type token for reading pages. Keep a real page heading when a compact app layout needs it visually hidden. Guide sample headings must fit the guide's own heading hierarchy. Do not add large titles to existing tools.
- Show reading-page, compact-tool, narrow-width, long-title, and Chinese-title examples. Keep language samples static. Add no translation script, persisted setting, or app state change.

Engineering review and failure behavior: Use native links and buttons for their respective purposes. Preserve the selected language in text and `aria-pressed`. Breadcrumbs identify location and do not replace a document heading. Flexible text can wrap while language controls keep their shared target size. The guide does not translate content when a sample button is pressed. Existing translation keys, language storage, and tool behavior remain unchanged.

Verification evidence: `./scripts/check.sh` passed for all seven test files. Reviewed the complete diff, breadcrumb destinations and list structure, sample heading hierarchy, selected-language hover precedence, disabled guards, and the narrow-width layout rules. Added the primary breadcrumb reference to `docs/ui-audit.md`. Refreshed both draft stylesheet hashes. Existing pages, shell styles, translation scripts, and current-style specimens did not change. Manual browser, keyboard, narrow-screen, and 200 percent zoom checks did not run. No tests, dependencies, or browser tools were added.

### 21.12 Segmented language choice

Purpose and decision: Replace the draft's separate quiet language buttons with one compact segmented group. Add reusable `.ui-button-group` geometry. Join adjacent borders, round only the outer corners, and give segments equal widths. Keep the existing button type, padding, and desktop/touch minimum heights. Use a neutral panel surface for unselected language segments and a warm fill with an underline for the selected language. This supersedes the separate quiet-button treatment in section 21.11.

Engineering review and failure behavior: Keep native buttons and explicit `aria-pressed` states. This changes appearance only. Preserve the shared focus outline and raise the focused segment above adjacent borders. Do not clip focus with an overflow rule. Guard inactive hover styling so selection remains visible. The guide remains static and adds no translation or toggle logic. Existing pages and specimens remain unchanged.

Verification evidence: `./scripts/check.sh` passed for all seven test files. Reviewed the complete diff, joined-border geometry, outer corner rules, selected and hover precedence, disabled guards, and focus stacking. Refreshed the component stylesheet hash. Manual browser, keyboard, narrow-screen, and 200 percent zoom checks did not run. No tests, dependencies, or browser tools were added.

### 21.13 Compact language group correction

Purpose and decision: The owner reported that the equal-width language segments wrapped `中文` and made the group too tall. Give language segments natural widths, prevent label wrapping and shrinking, and reduce padding to 0.25rem vertically and 0.5rem horizontally. Use the existing 0.875rem supporting size and 1.2 line height. Above 650 pixels with a fine pointer and hover, use a 1.75rem (28-pixel) minimum height. Retain the 2.75rem (44-pixel) minimum height and width for touch targets. This is an explicit compact language-control exception. General buttons keep their accepted sizing.

Engineering review and failure behavior: Use minimum dimensions rather than a fixed height. Keep the selected state, joined borders, full language names, and visible focus. Let the context row wrap when necessary. Do not wrap a language label to force the group into a row. Keep generic button groups unchanged. This supersedes the equal-width language rule in section 21.12 and changes only the guide.

Verification evidence: `./scripts/check.sh` passed for all seven test files. Reviewed the complete diff, language-specific flex override, no-wrap rule, compact geometry, and pointer-based minimum dimensions. Refreshed the component stylesheet hash. Recorded the wrapping mistake in the ignored local experience file. Manual browser, keyboard, narrow-screen, and 200 percent zoom checks did not run. No tests, dependencies, or browser tools were added.

### 21.14 Clear selected language state

Purpose and decision: Keep the accepted compact group dimensions. Remove the selected-language underline and its link-style decoration rules. Give the selected segment a dark neutral fill and border with light text. Keep unselected segments on the panel surface. Give unselected hover a light warm surface so it cannot resemble selection. This supersedes the selected fill and underline from section 21.12.

Engineering review and failure behavior: Preserve native `aria-pressed` state and the common keyboard focus outline. Keep the selected colors on hover. Do not change font size, padding, label wrapping, or desktop and touch dimensions. The guide's language examples remain static. Existing apps and specimens remain unchanged.

Verification evidence: `./scripts/check.sh` passed for all seven test files. Reviewed the complete diff, selected and unselected hover precedence, removed decoration rules, and unchanged compact geometry. Refreshed the component stylesheet hash. Manual browser, keyboard, narrow-screen, and 200 percent zoom checks did not run. No tests, dependencies, or browser tools were added.

### 21.15 Language controls by page purpose

Purpose and decision: Reserve the compact segmented language group for tools and similar interfaces. Use the existing quiet buttons in a text-style `En / 中` choice for reading pages, such as studio rates. Use `中` as the visible Chinese label in both variants. Keep full accessible language names. Make the current language natively disabled in both samples because selecting it again has no effect.

Requirements and failure behavior: Keep the current tool segment dark-filled even though it is disabled. This is an explicit exception to neutral disabled styling; use a normal cursor for the current choice. For reading pages, show the current language as plain bold text and the alternative as underlined text. Hide the slash from assistive software. Reuse common button typography, focus, and compact language sizing. Text-style choices have no visible container or background. Their horizontal minimum can be 1.5rem while the touch height remains 2.75rem. Keep the segmented variant's accepted touch dimensions. Preserve no-wrap labels and context-row wrapping.

Scope and migration note: Update the guide examples and component contract only. The guide remains static. During app migration, update the existing language binder to keep `disabled` and `aria-pressed` in step and re-enable the previous language. Do not disable unrelated language controls or change translation persistence in this package. Existing pages and current-style specimens remain unchanged.

Verification evidence: `./scripts/check.sh` passed for all seven test files. Reviewed the complete diff, native disabled attributes, selected-style exceptions, quiet-button hover and focus rules, hidden separators, compact sizing, and example labels. Refreshed the component stylesheet hash. Manual browser, keyboard, narrow-screen, and 200 percent zoom checks did not run. No tests, dependencies, or browser tools were added.

## 22. Apply the approved shared styles

Selection on 19 October 2026: The owner approved the guide and authorized application across maintained pages. Todoist task `6hpGXvmQfxcmH6M6` records this package. The older project-model and content-system tasks remain deferred.

Purpose and requirements: Promote the approved component source to `assets/ui.css`. The guide and maintained pages must load that same file. Keep page CSS for composition and specialized app displays only. Preserve addresses, content, translation keys, element IDs, event bindings, user input, download gates, financial validation, and audio behavior. Keep legacy converter files unchanged. Preserve the homepage greeting as the agreed display exception. Use real document headings, including hidden headings on compact pages. Apply quiet language choices to reading pages and segmented choices to tools. Keep language selection, disabled state, storage, and return switching consistent.

Engineering review and failure behavior: Use explicit component classes rather than copying component declarations into each page stylesheet. Remove broad local control rules that compete with shared classes. Preserve native controls, focus outlines, local table overflow, and hidden application state. Use the existing functional checks for each tool and add meaningful assertions for changed language-switch behavior. No browser downloads or system-library installation. Record unavailable manual keyboard, narrow-screen, zoom, and device audio review without treating a source check as a rendered review.

Implementation sequence and completion gates:

- [x] Promote the stylesheet and migrate public pages, studio rates, and their examples.
- [x] Migrate Guitar Strum Machine controls and wrappers while preserving chord and playback displays.
- [x] Migrate Pitch Shifter controls and wrappers while preserving pitch symbols, seek progress, processing, and audio state.
- [x] Migrate converter version 2 common visuals while preserving all financial-file behavior and legacy fallback.
- [x] Reconcile the guide, page examples, documentation, asset hashes, and remaining local style rules.
- [x] Pass the repository check and review the complete diff.
- [x] Commit the verified package and reconcile Todoist.

Authorization: Apply the local repository changes and commit verified stages. Do not push or deploy in this package.

Implementation evidence: The 12 maintained live documents, the guide, and all five specimens load `assets/ui.css`. The shared component source retains the approved design. Added page padding and explicit hidden-state guards support live app layouts. Removed competing local control, panel, type, width, notice, table, and metrics declarations. Removed the unused Sound detail stylesheet. Public pages and the tools directory use quiet language links. Current tools use segmented controls. Native disabled state is opt-in through `data-disable-current="true"` so unrelated controls retain their own behavior.

Verification evidence: `./scripts/check.sh` passed for all seven test files. Existing tests cover payment validation, exact record lengths, error recovery, download gates, guitar parsing and scheduling, sharing, presets, pitch processing, local references, asset hashes, translations, and frozen legacy hashes. Extended the existing language test to verify selection, disabled state, return switching, and stored choice. The converter status test also checks the success tone. Updated source assertions for shared markup and removed assertions for superseded local appearance. The asset check reads actual local references instead of maintaining a second asset list.

Additional source review: All 18 shared-style documents have balanced markup, unique IDs, and valid label and accessibility references. Maintained live pages preserve prior IDs, field constraints, hidden and disabled application state, and link destinations. Guitar chord presentation rules match the prior source. Changes to JavaScript are limited to language disabled state and notice classes or tones. Audio engines, pitch processing, financial conversion, and legacy files did not change. Reviewed the complete diff and stylesheet precedence. No dependencies, browser automation, or network calls were added.

Manual review remains pending: keyboard use, visible focus, narrow screens, 200 percent zoom, and representative iPhone or iPad audio behavior. A browser and representative device were unavailable for this package. These optional checks do not block the local source migration. No rendered or device result is claimed. The package does not push or deploy the website.

Completion on 20 October 2026: Commit `c855602` contains the verified migration. Added the outcome comment to Todoist task `6hpGXvmQfxcmH6M6`, completed that task, and confirmed its completed state through a fresh read. The initiative and deferred tasks remain open. No next package was selected. This log update records the completed reconciliation.


## 23. Correct Guitar Strum Machine layout

Selection on 20 October 2026: The owner reported four issues after migration. Todoist task `6hpHm7jm2vQXx7F6` records this correction package.

Purpose and requirements: Keep the exercise panel within the page width. Restore a bounded chord scroll area so existing automatic following can work. Keep chord-view labels intact and allow whole buttons to wrap on narrow screens. Display the song disclaimer below a horizontal divider in small, muted serif text. Keep the guitar specimen current. Preserve element IDs, translations, playback, chord positioning, and manual scroll controls.

Source findings and decision: `.ui-stack` creates an implicit column with an automatic minimum. The max-content chord timeline can enlarge that column through its grid item. Give this single-column component an explicit `minmax(0, 1fr)` track and let the chord region shrink. Keep overflow on the existing scroll container. The chord-view group divides width equally with a zero flex basis. Use existing `.ui-actions` for natural-width choices and whole-button wrapping. Use existing small text, content flow, and divider classes for the disclaimer. Do not add a new notice variant or hide page overflow.

Failure behavior and checks: Keep native hidden state and the existing scroll-following JavaScript. Do not clip controls or turn off scrolling. Use the repository check and complete diff review. A browser is unavailable; rendered scrolling, keyboard, narrow-screen, and zoom review remain pending. Do not install browser tools for this correction.

- [x] Correct grid sizing, chord-view layout, disclaimer markup, and the static specimen.
- [x] Refresh affected asset hashes and pass the repository check.
- [x] Review and commit the correction, then reconcile Todoist.

Verification evidence: `./scripts/check.sh` passed all seven test files. Reviewed the complete correction diff, shared grid sizing, hidden-state precedence, the chord scroll boundary, whole-button wrapping, disclaimer type, and the three-bar specimen. Guitar page and specimen markup is balanced and IDs are unique. Refreshed shared and guitar stylesheet hashes in every maintained reference. No application JavaScript, playback logic, dependencies, or browser tools changed. Manual rendered scrolling, keyboard, narrow-screen, and 200 percent zoom review did not run. Recorded the migration regression in the ignored experience file.

Completion on 20 October 2026: Commit `703c33c` contains the verified correction. Added the outcome comment to Todoist task `6hpHm7jm2vQXx7F6`, completed the task, and confirmed its completed state. Deferred packages remain unchanged.


### 23.1 Visible horizontal divider

Purpose and decision on 20 October 2026: The owner reported that the horizontal divider was difficult to see. Use the existing darker panel-border color for `.ui-divider`. Set its width to 100 percent so native automatic side margins cannot collapse the rule inside a grid. Apply the same shared rule to the guide and specimens. This is a routine visual refinement and does not select another tracked package.

Failure behavior: Keep the one-pixel rule, existing spacing, and native horizontal-rule semantics. Change no app behavior. Refresh all references to the shared stylesheet.

Verification evidence: `./scripts/check.sh` passed all seven test files. Reviewed the shared rule and refreshed asset hashes. Manual browser and zoom review did not run. No tests, dependencies, or browser tools were added.


### 23.2 Space after share actions

Purpose and decision on 20 October 2026: The owner reported that the share status was too close to the action buttons. The later `.ui-help` margin reset overrode the equal-specificity content-flow rule. Give help text inside a flow enough selector specificity to retain the existing 1rem gap. Keep the smaller gap after headings. Field grids retain their own spacing. Add the share-action and status pattern to the guitar specimen. This is a routine visual correction.

Verification evidence: `./scripts/check.sh` passed all seven test files. Reviewed the spacing cascade, preserved heading and field spacing, and refreshed shared stylesheet hashes. Manual browser review did not run. No application behavior, tests, dependencies, or browser tools changed.


## 24. Scope local styles to page roots

Selection on 20 October 2026: The owner approved page-root isolation for local styles. Todoist task `6hpHr8cGjJvP8Jj6` records this package. Deferred product packages remain unchanged.

Purpose and requirements: Add stable `data-page` attributes to maintained page bodies. Prefix local selectors with `:where([data-page="…"])`. Keep shared foundation and component styles global in `site-shell.css` and `ui.css`. Preserve existing selector specificity, declarations, media conditions, native state, IDs, links, translations, audio, payment validation, and the frozen legacy converter. Keep the redirect unchanged.

Engineering review and decisions: Scope all selectors in comma-separated lists and media rules. Do not prefix keyframe steps. Give Pitch Shifter keyframes distinct page names and keep their bindings inside the page root. Move homepage-only variables from the document root to the home scope. Keep the studio print rule on the document root with a zero-specificity relationship guard for its page body. The existing shared stylesheet already uses this selector feature. Use explicit allowed page roots for the section-layout stylesheet that serves several pages.

Specimen decision: Tool and studio specimens use the same body root as their live page. The mixed public specimen uses small wrappers with the corresponding page root for each example. Scope specimen-only CSS through a specimen marker. Scope guide-only CSS to its own root. Keep these roots separate from shared domain accent attributes.

Failure behavior and checks: A local rule must not match outside its allowed page roots. The change must not conceal overflow, change control state, or override shared components through added specificity. Review every transformed selector and preserved declaration. Run the existing repository check. Add no build step, dependency, or browser automation. Record unavailable manual browser, keyboard, narrow-screen, and zoom review.

- [x] Add page roots, scope local styles, and update matching specimens.
- [x] Document the convention, refresh asset hashes, and pass relevant checks.
- [x] Review and commit the package, then reconcile Todoist.

Verification evidence: `./scripts/check.sh` passed all seven test files. A separate source comparison checked 222 scoped selectors in 204 rule blocks across all 10 local stylesheets. Declarations, media conditions, and keyframe steps match the prior source, apart from the two matching animation-name prefixes. All 18 maintained documents have matching roots, balanced markup, unchanged text, unchanged original elements and control attributes, unchanged IDs and destinations, and valid label and accessibility references. Every loaded local stylesheet has a corresponding root in its document. Shared CSS, application JavaScript, the redirect, financial conversion, audio engines, and frozen legacy files did not change.

Review evidence: Reviewed the complete diff, including selector lists, pseudo-elements, media rules, hidden states, inherited home variables, the guarded studio print rule, and the mixed public specimen wrappers. Documented the convention in `AGENTS.md`, the README, and the UI audit. Refreshed local stylesheet hashes. Updated the existing pitch source checks for the renamed keyframes. Added no permanent tests that mirror static selectors, dependencies, build steps, or browser tooling. Manual browser, keyboard, narrow-screen, print, and 200 percent zoom review did not run.

Completion on 20 October 2026: Commit `4b21e89` contains the verified page-root isolation. Added the outcome comment to Todoist task `6hpHr8cGjJvP8Jj6`, completed the task, and confirmed its completed state through a fresh read. The initiative and deferred packages remain unchanged.
