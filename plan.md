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

Status verified on 2 October 2026.

- The root page is volo1st's public introduction.
- CSV to ABA Converter version 2 is the current converter.
- The former converter address redirects to version 2.
- The legacy converter remains available as a rollback path.
- The tools directory is available at `/tools/`.
- Guitar Strum Machine is available from the tools directory.
- The Chinese-English text sorter was removed.
- The public-homepage source content and privacy boundary are approved.
- The owner approved the public homepage and section indexes for release.
- The CSV-to-ABA workflow validation waits for one normal Commonwealth Bank of Australia (CBA) payment run.
- No implementation package is active after the shared tool-header refinement.

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
2. Sagittarius identity signal.
3. One compact social-link strip with separate personal and studio groups.

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

Keep the existing warm page background. Keep the pixel `V` as the browser icon, but do not repeat it as an in-page logo. Do not add an element that exists only as decoration. The Sagittarius signal communicates Vincent's star sign. Do not use a pixel font for body text.

Use this visual hierarchy:

1. Make the introduction the largest item.
2. Keep the social icons compact and easy to scan.
3. Separate the personal and studio groups with one quiet vertical rule.

#### 8.2.2 Layout rules

Keep the current 960-pixel maximum content width. Use the existing page gutter, text colors, and focus style. Do not put the site header, tool language control, panels, buttons, or footer on the homepage unless they have a homepage function.

On wide screens:

- Let the short introduction use the available width.
- Put the Sagittarius signal in the blank space between the introduction and social strip.
- Show the personal and studio profiles in one compact icon strip.
- Use a bounded page region between 30 and 42 rem high. Distribute the introduction and contact directory within that region.

```text
┌──────────────────────────────────────────────────────────────┐
│ Hi, I’m Vincent.                                             │
│ I code, shape sound, and make noise.                          │
│ Online, I’m volo1st.                                         │
│                     · Sagittarius ·                          │
├──────────────────────────────────────────────────────────────┤
│ [GitHub] [YouTube] [Bilibili] [RedNote] | [Instagram] [...] │
└──────────────────────────────────────────────────────────────┘
```

On narrow screens:

- Use one content column for the introduction.
- Keep the Sagittarius signal clear of the introduction and social strip.
- Keep the social icon groups on one row when the available width permits it.
- Use the small viewport height so that the layout fills approximately one visible phone screen.
- Do not use horizontal page scrolling.

```text
┌─────────────────────────────┐
│ Hi, I’m Vincent.            │
│ I code, shape sound...      │
│ Online, I’m volo1st.        │
│       · Sagittarius ·       │
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

Use the existing pixel `V` browser icon, local social SVGs, CSS rules, and the local Sagittarius canvas in the first release. Normalize the principal star positions from [SIMBAD](https://simbad.cds.unistra.fr/simbad/) J2000 ICRS coordinates. The dotted connection topology is a simplified visual guide. It is not an official constellation boundary or figure.

Use version 16 SVG paths from the [Simple Icons](https://github.com/simple-icons/simple-icons) CC0 1.0 collection for GitHub, YouTube, Bilibili, Xiaohongshu, and Instagram. Store the paths locally. Render them with the current text color. Do not load a third-party icon dependency at runtime.

Draw the signal in one neutral color. Use small anti-aliased circular particles. Let it drift and morph smoothly within the available gap. Make the movement clear during a short visit. Let the figure approach the safe horizontal edges. Do not let it overlap text or links. Hide it when the gap is too small. Stop motion when the page is hidden. Do not make a network request. Support `?constellation=off` for visual comparison.

For later media, use only media that Vincent owns or has approval to publish. Add useful alternative text to meaningful media. Use an empty alternative description for decoration. Set image dimensions to prevent layout movement. Do not load a social embed or third-party tracking script.

### 8.3 Public-site implementation

- [x] Replace the tools-only root page with the personal homepage.
- [x] Add shared site navigation.
- [x] Add a tools directory at `/tools/`.
- [x] Add the approved introduction, profiles, and contact path.
- [x] Add complete page descriptions and social-preview metadata.
- [x] Add useful Code, Sound, and Music section indexes.
- [ ] Add a not-found page if GitHub Pages supports the required behavior.
- [x] Use the same approved tool names and letter case on all pages.
- [ ] Decide which prototype and tool pages search engines can index.
- [ ] Test keyboard use, narrow screens, and 200 percent zoom.

Evidence: The root page contains the approved English source and public profiles. Its linked introduction opens the Code, Sound, and Music section indexes. The Code index links to `/tools/`, the Sound index links to Bits & Beats Studio, and the Music index links to public music profiles and Guitar Strum Machine. Existing tool addresses did not change. Automated tests check the internal links, section destinations, tool translations, metadata, identity boundary, tool selection, semantic accents, external-link behavior, and current asset hashes. Owner browser review remains open.

Completion gate: The deployed root address works as a public namecard, and all existing tools remain available.

## 9. Phase 4: Add portfolio sections

- [ ] Add the software engineering portfolio.
- [ ] Add the audio and live sound portfolio.
- [ ] Add the singing and music portfolio.
- [ ] Use a consistent case-study structure.
- [ ] Identify Vincent's role in each item.
- [ ] Use only approved public media and credits.
- [ ] Add text alternatives for meaningful media.
- [ ] Check each item for employer, client, performer, and venue confidentiality.

Each case study must state the context, goal, role, public work, supported result, and relevant public links or media.

## 10. Phase 5: Establish the project and tool model

- [ ] Define the difference between a portfolio item, public project, public tool, and restricted tool.
- [ ] Add status terms for active, trial, maintained, archived, and restricted items.
- [ ] Define the minimum page information for each project and tool.
- [ ] Define ownership, support, privacy, and data-handling statements.
- [ ] Add a repeatable template for a new static tool.
- [ ] Define when a tool needs separate tests or a separate repository.
- [ ] Define an archive process that preserves useful addresses.

Completion gate: A new idea has a clear location, status, support model, and release checklist.

## 11. Phase 6: Complete operations and project documents

- [x] Add a repository README with purpose, tools, local use, and checks.
- [x] Add one local command for syntax, tests, references, and whitespace.
- [x] Add a validation checklist for the current converter workflow.
- [x] Apply browser-asset versioning to each maintained page asset.
  - Evidence: The home page, current converter, and Guitar Strum Machine register their local interface assets in the SHA-256 stale-hash test. The frozen legacy fallback remains unversioned.
- [ ] Select a license, or state that the repository has no license.
- [ ] Document the GitHub Pages deployment process.
- [ ] Document the custom domain and Domain Name System process.
- [ ] Review Transport Layer Security and redirects.
- [ ] Review available HTTP security headers and GitHub Pages limits.
- [ ] Confirm that the site has no unrecorded analytics or network requests.
- [ ] Define backup and recovery steps.
- [ ] Define browser-support and dependency-review intervals.
- [ ] Define what another person needs to maintain the site.
- [ ] Add more format, HTML, lint, or automated accessibility checks when a measured need justifies them.

Completion gate: Deployment, recovery, privacy, and maintenance do not depend on undocumented knowledge.

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
| Chinese-English text sorter | Removed | A new requirement justifies recovery from Git history. |
| Authentication for school tools | Deferred | A tool needs confidential configuration, stored data, or restricted access. |
| Static-site generator | Deferred | Manual maintenance causes repeated errors or material delay. |

Waiting work is not a blocker for unrelated tool maintenance.

### 13.1 App ideas

These items are unscheduled ideas. They are not approved projects or implementation packages.

| Idea | Initial purpose | Question to answer before planning |
| --- | --- | --- |
| Metronome | Provide a steady practice pulse. | Define the practice workflow and required rhythm controls. |
| Tuner | Help a user tune an instrument. | Define the supported instruments, input method, and tuning modes. |
| Song pitch and key shifter and recogniser | Recognise a song's pitch or key and help a user shift it. | Decide whether recognition and shifting belong in one app. Define the audio source and intended output. |

Classify each idea under the project and tool model before implementation starts.

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

| Date | Decision | Reason |
| --- | --- | --- |
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
| 1 October 2026 | Do not apply the reduced-motion preference to the constellation. | The effect is small, subtle, and not essential to page operation. |
| 1 October 2026 | Keep the constellation automatic and non-interactive. | Sensor control requires permission and can disturb visitors. The small visual effect does not justify a prompt. |
| 1 October 2026 | Use the introduction as navigation to Code, Sound, and Music. | Linked words avoid another navigation row and give the introduction a second function. Games remain a design influence until they have useful public content. |
| 2 October 2026 | Replace homepage social text with one monochrome icon strip. | The icons reduce visual density. One separator preserves the personal and studio grouping without visible labels. Precise link names distinguish repeated services. |
| 2 October 2026 | Mark sparse section indexes with “More when there’s something worth showing.” | The line sets expectations without an under-construction notice or placeholder content. |
| 2 October 2026 | Name the directory “Tools” and use the shared breadcrumb shell on maintained tool pages. | The shorter name fits the public-site voice. Breadcrumb links provide sufficient navigation, so a repeated logo, large title, and footer add unnecessary visual weight. |
| 2 October 2026 | Record the metronome, tuner, and song pitch and key tool as unscheduled ideas. | The concepts need product definitions before they become projects or implementation packages. |

## 16. Verified completion evidence

- On 2 October 2026, the owner approved the shared breadcrumb, English-only breadcrumb text, simplified language control, and footer removal on the maintained tool pages.
- On 1 October 2026, the privacy review checked all 58 tracked files. It found no email address. It replaced realistic payment-like test identifiers and one person-like parser example with explicit invented values. The regenerated ABA fixture contains four 120-character records and approved invented labels only.
- On 14 September 2026, the owner verified the current converter in Chrome on a MacBook Air and Safari on an iPhone 16 Pro. The owner also verified the page at 200 percent zoom.
- On 29 September 2026, Guitar Strum Machine playback, sharing, presets, practice controls, responsive layout, and language behavior passed owner testing on the supported clients.
- On 1 October 2026, the owner approved the shared warm theme, site shell, icon, and domain accents.
- On 1 October 2026, WeChat and WhatsApp displayed the deployed Guitar Strum Machine preview. Sharing from the WeChat browser produced an accepted plain-link fallback.
- On 1 October 2026, the owner verified the deployed current converter, redirect, and legacy fallback routes.
- The repository check covers JavaScript syntax, shell syntax, automated tests, internal references, translation keys, accessibility references, asset hashes, and whitespace.

## 17. External task-system mapping

Use the phase headings in this plan when an external task system is necessary.

- Keep only the next public-website package actionable.
- Keep later phases ordered and without dates.
- Track the CSV-to-ABA workflow validation as a separate waiting task.
- Inspect comments and attachments before moving or closing an existing task.
- Get confirmation before deleting or substantially restructuring an external task.
- Do not access the private Todoist project named `.`.
