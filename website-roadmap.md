# Website Roadmap

## 1. Purpose

This file is the source of truth for the long-term development of this website.

The website will be Vincent's public front page. It will explain who he is and what he does. It will show selected work, music, projects, and ideas. It will give visitors clear ways to find his profiles and contact him.

The website will also host independent browser tools. Some tools will support the music school. Other tools will be public projects.

## 2. Success criteria

The website is successful when a visitor can:

- understand Vincent's main professional and creative roles;
- find representative software, audio, live sound, and music work;
- open public projects and tools;
- find current public profiles;
- contact Vincent through an approved channel; and
- use the site on a narrow screen and at 200 percent zoom.

The website is successful for its owner when he can:

- add a project without redesigning the full site;
- maintain each tool independently;
- keep confidential information out of the public repository;
- verify a change before deployment; and
- keep stable links for published work.

## 3. Product principles

- Make the public identity clear before adding more features.
- Let form follow the purpose of each page and tool.
- Keep each application isolated when it does not need shared state.
- Prefer static HTML, CSS, and JavaScript.
- Add a build system only when it removes a measured maintenance problem.
- Keep published addresses stable.
- Make public and restricted content visibly different.
- Do not describe an unlisted public page as private.
- Use real access control for restricted content.
- Collect no visitor data unless a documented need justifies it.
- Use invented data in examples and tests.
- Use controlled English for instructions and project documents.
- Add Simplified Chinese where it improves the intended user's workflow.

## 4. Audience

### Primary public audiences

- People who want to learn about Vincent.
- Software engineering peers and professional contacts.
- Audio engineers, live sound engineers, musicians, and collaborators.
- People who want to inspect or use a public project.
- People who want to contact Vincent.

### Tool audiences

- The music-school operator who uses the payment tools.
- Invited users of future school utilities.
- General users of future public applications.

## 5. Public and restricted content

GitHub Pages is public. A page is not private because the home page does not link to it.

Do not put these items in this repository:

- credentials or secret keys;
- real bank or payment data;
- confidential school records;
- employer confidential information;
- proprietary trading information; or
- private contact data that is not approved for publication.

Use one of these options for a restricted tool:

1. Make the tool safe for public access and keep all data local.
2. Put the tool behind real authentication on a suitable service.
3. Distribute the tool as a local application.

Record the selected option before implementation.

## 6. Target information architecture

The final structure can use these stable sections:

| Address | Purpose |
| --- | --- |
| `/` | Personal introduction and selected highlights |
| `/about/` | Longer biography and interests |
| `/work/` | Public software engineering portfolio |
| `/music/` | Audio, live sound, performance, and music portfolio |
| `/projects/` | Public applications, experiments, and ideas |
| `/tools/` | Browser-tool directory |
| `/contact/` | Approved contact methods |

Do not move an existing tool only to match this structure. Preserve its current address or add a tested redirect strategy.

## 7. Delivery roadmap

Complete one work package at a time. Update this file after each package.

### Phase 0: Protect the current site

- [x] Keep the current tools available during website planning.
- [x] Keep the CSV-to-ABA version 1 fallback unchanged.
- [x] Add local repository checks.
- [x] Add a safer CSV-to-ABA version 2 trial.
- [x] Add English and Simplified Chinese to the version 2 workflow.
- [ ] Complete the CSV-to-ABA operator trial.
- [ ] Record the result without confidential payment data.

Completion gate: Current users can continue their work while the public site changes.

### Phase 1: Define the public identity

- [ ] Select the public name and primary site heading.
- [ ] Write a one-sentence introduction.
- [ ] Write a short biography.
- [ ] Define the software engineering description.
- [ ] Define the audio and music description.
- [ ] List approved public profiles.
- [ ] Select approved contact methods.
- [ ] Define employer and confidentiality boundaries.
- [ ] Decide whether the public identity pages use English only or two languages.
- [ ] Select an initial set of work and music highlights.

Completion gate: Approved source content exists for the first public homepage. No placeholder claim is necessary.

### Phase 2: Define the visual system

- [ ] Define the intended character of the site.
- [ ] Select the text, color, spacing, border, and focus tokens.
- [ ] Define page widths and responsive breakpoints.
- [ ] Define header, navigation, card, link, and footer patterns.
- [ ] Define image and media rules.
- [ ] Check text contrast and focus visibility.
- [ ] Make a homepage wireframe for narrow and wide screens.
- [ ] Confirm that the design supports software and music content.

Completion gate: The approved wireframe and tokens can guide implementation without page-specific guesses.

### Phase 3: Build the public foundation

- [ ] Replace the tools-only home page with the personal homepage.
- [ ] Add shared site navigation.
- [ ] Add a tools directory at `/tools/`.
- [ ] Keep all existing tool addresses working.
- [ ] Add the initial biography, highlights, profiles, and contact path.
- [ ] Add page descriptions and social-preview metadata.
- [ ] Add a site icon and approved identity assets.
- [ ] Add a not-found page if GitHub Pages supports the required behavior.
- [ ] Add automated checks for new internal links and translation keys.
- [ ] Test keyboard use, narrow screens, and 200 percent zoom.

Completion gate: The deployed root address works as a public namecard. All existing tools remain available.

### Phase 4: Add portfolio sections

- [ ] Add the software engineering portfolio.
- [ ] Add the audio and live sound portfolio.
- [ ] Add the singing and music portfolio.
- [ ] Use a consistent case-study structure.
- [ ] Identify Vincent's role in each item.
- [ ] Use only approved public media and credits.
- [ ] Add accessible text alternatives for meaningful media.
- [ ] Check every item for employer, client, performer, and venue confidentiality.

Each case study should state:

- the context;
- the problem or goal;
- Vincent's role;
- the work that he can discuss publicly;
- the result that he can support; and
- relevant public links or media.

Completion gate: Each published item is accurate, useful, and safe to disclose.

### Phase 5: Establish the project and tool model

- [ ] Define the difference between a portfolio item, public project, public tool, and restricted tool.
- [ ] Add status labels such as active, trial, maintained, archived, and restricted.
- [ ] Define the minimum page information for each project and tool.
- [ ] Define ownership, support, privacy, and data-handling statements.
- [ ] Add a repeatable template for a new static tool.
- [ ] Define when a tool needs separate tests or a separate repository.
- [ ] Define an archive process that preserves useful links.

Completion gate: A new idea has a clear location, status, support model, and release checklist.

### Phase 6: Review privacy, security, and operations

- [ ] Document the GitHub Pages deployment process.
- [ ] Document the custom-domain and Domain Name System process.
- [ ] Review Transport Layer Security and redirects.
- [ ] Review available HTTP security headers and GitHub Pages limits.
- [ ] Confirm that the site has no unrecorded analytics or requests.
- [ ] Add a contact method that limits unnecessary personal-data exposure.
- [ ] Define backup and recovery steps.
- [ ] Define browser-support and dependency-review intervals.
- [ ] Define what another person needs to maintain the site.

Completion gate: Deployment, recovery, privacy, and maintenance do not depend on undocumented knowledge.

### Phase 7: Add content workflow only when necessary

- [ ] Measure repeated markup and maintenance effort.
- [ ] Record the specific problem that a content tool must solve.
- [ ] Compare manual pages with a small static-site generator.
- [ ] Preserve addresses and plain output if a generator is selected.
- [ ] Keep tool applications independent of the content system where practical.
- [ ] Document local setup, dependency updates, and recovery.

Do not add a framework or build system only because the site has multiple pages.

Completion gate: A build system is added only when its ongoing benefit is greater than its maintenance cost.

## 8. Work-package order

Use this order unless a production problem changes the priority:

1. Create the public-content inventory and privacy boundary.
2. Approve the homepage content outline.
3. Approve the visual direction and wireframe.
4. Build and deploy the personal homepage and tools directory.
5. Add portfolio sections one at a time.
6. Formalize the project and tool model before the tool collection grows.
7. Complete operations and recovery documentation.
8. Reassess the need for a content system after real maintenance experience.

The CSV-to-ABA trial can continue in parallel because its external operator steps do not require website implementation work.

## 9. Deferred work

| Item | Status | Reason | Review trigger |
| --- | --- | --- | --- |
| Chinese-English text sorter redesign | Deferred | The tool has low current use. | Review when regular use resumes or a defect blocks a user. |
| Site framework or static-site generator | Deferred | The current site does not have enough repeated content to justify one. | Review when manual page maintenance causes repeated errors or material delay. |
| Authentication for school tools | Not selected | Current tools can operate without stored server data. Public access is still possible. | Review before a tool needs confidential configuration, stored data, or restricted access. |

## 10. Decision log

| Date | Decision | Reason |
| --- | --- | --- |
| 17 September 2026 | Make the website Vincent's public front page. | The site must present his software engineering, audio, live sound, singing, music, projects, and contact paths. |
| 17 September 2026 | Keep independent tools isolated. | Most planned tools have separate purposes and do not need shared application state. |
| 17 September 2026 | Keep static delivery as the default. | The planned pages and most tools do not require a server or application framework. |
| 17 September 2026 | Do not treat an unlisted GitHub Pages address as private. | GitHub Pages content is publicly accessible without real access control. |
| 17 September 2026 | Defer the text sorter redesign. | The text sorter has low current use. Higher-value website foundation work takes priority. |

## 11. Current next package

Create the public-content inventory and privacy boundary for Phase 1.

The package must produce approved source text and links. It must not publish placeholder claims or confidential information.
