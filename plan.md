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

Status verified on 1 October 2026.

- The root page is a tools directory.
- CSV to ABA Converter version 2 is the current converter.
- The former converter address redirects to version 2.
- The legacy converter remains available as a rollback path.
- Guitar Strum Machine is available from the tools directory.
- The Chinese-English text sorter was removed.
- Public-homepage implementation is paused. Tool maintenance can continue.
- The CSV-to-ABA workflow validation waits for one normal Commonwealth Bank of Australia (CBA) payment run.
- No feature package is active after this documentation consolidation.

When public-homepage work resumes, create the public-content inventory and privacy boundary first.

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
| `/about/` | Longer biography and interests |
| `/work/` | Public software engineering portfolio |
| `/music/` | Audio, live sound, performance, and music portfolio |
| `/projects/` | Public applications, experiments, and ideas |
| `/tools/` | Browser-tool directory |
| `/contact/` | Approved contact methods |

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

- [ ] Select the public name and primary site heading.
- [ ] Write a one-sentence introduction.
- [ ] Write a short biography.
- [ ] Define the software engineering description.
- [ ] Define the audio and music description.
- [ ] List approved public profiles.
- [ ] Select approved contact methods.
- [ ] Define employer and confidentiality boundaries.
- [ ] Decide whether public identity pages use English only or two languages.
- [ ] Select the first work and music highlights.

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

### 8.2 Public-site design

- [ ] Define the intended character of the public site.
- [ ] Confirm that the existing tokens support software and music content.
- [ ] Define image and media rules.
- [ ] Check text contrast and focus visibility for the public design.
- [ ] Make homepage wireframes for narrow and wide screens.

### 8.3 Public-site implementation

- [ ] Replace the tools-only root page with the personal homepage.
- [ ] Add shared site navigation.
- [ ] Add a tools directory at `/tools/`.
- [ ] Add the approved biography, highlights, profiles, and contact path.
- [ ] Add complete page descriptions and social-preview metadata.
- [ ] Add a not-found page if GitHub Pages supports the required behavior.
- [ ] Use the same approved tool names and letter case on all pages.
- [ ] Decide which prototype and tool pages search engines can index.
- [ ] Test keyboard use, narrow screens, and 200 percent zoom.

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
| Public homepage | Paused | The owner resumes the Phase 2 content package. |
| Chinese-English text sorter | Removed | A new requirement justifies recovery from Git history. |
| Authentication for school tools | Deferred | A tool needs confidential configuration, stored data, or restricted access. |
| Static-site generator | Deferred | Manual maintenance causes repeated errors or material delay. |

Waiting work is not a blocker for unrelated tool maintenance.

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

## 16. Verified completion evidence

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
