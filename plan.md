# Website plan

Updated on 6 November 2026.

## 1. Purpose

Maintain Vincent's small personal website and focused browser tools. Use this file for current direction, open work, and decisions. Use the [README](README.md) for maintenance and [AGENTS.md](AGENTS.md) for repository rules. Git history holds completed work and earlier decisions.

## 2. Current state

The personal homepage, Code, Sound, Music, studio, and tools pages are published. The current tools are Guitar strum machine, Pitch shifter, and CSV to ABA converter. The shared visual system, bilingual style guide, Python page scaffolding, and component copying are implemented.

The converter test cleanup and initial audit removal are committed locally. These changes and the current documentation cleanup await deployment. Publish only when requested.

Hosting recovery record, confirmed by the owner on 13 October 2026: GitHub Pages publishes `master` at the repository root. The domain is `volo1st.com`, with domain records at Squarespace. Recheck external settings before recovery.

## 3. Current work

Clean up Guitar strum machine documentation. Keep current syntax, playback and failure behavior, preset identity, sharing limits, and audio recovery evidence. Replace completed work packages and repeated specifications with focused tool references. Git history preserves the old notes. Application behavior must stay unchanged.

- [x] Check retained rules and examples against the source and tests.
- [x] Update links, run `./scripts/check.sh`, and review the diff.

Completed on 6 November 2026: Replaced repeated Guitar specifications and work packages with six focused references. Documented shape and number examples parse successfully. All nine JavaScript test files and eight Python tests passed. Reviewed the documentation diff and updated links. Application files are unchanged. Browser review was unavailable and was not needed for this documentation change. No Todoist task was changed.

Next: Clean up the Pitch shifter specification. Keep current behavior, limits, and dependency records.

## 4. Public content

Use `Vincent` in the homepage greeting and `volo1st` as the site identity. Keep the homepage personal, concise, and English-only. Its introduction links to Code, Sound, and Music. Keep personal and studio profile links in separate groups. Use the approved links in [the homepage](index.html). Add homepage highlights only after owner selection.

The owner accepted the current section content on 12 October 2026. More portfolio entries are optional. Add an entry when it has useful public work and an approved role, description, and media. Do not add content only to fill a section. Tools can appear in Code and Music when each link serves that section.

[Room acoustics](sound/room-acoustics/) and [Live sound](sound/live-sound/) have placeholder pages. Add examples only when approved material is available. Do not invent prices, examples, or service availability. Keep studio rates and quote conditions in [the rates page](studio/rates/). Agree on revisions, deliverables, schedule, and extra work in each quote.

## 5. Publication boundaries

GitHub Pages is public. An unlisted address is not private. Keep credentials, payment data, confidential school records, employer information, and unapproved contact details out of this repository.

Get approval before publishing employer names, proprietary trading information, client or performer names, venue names, photographs, recordings, or project media. Keep the private Instagram profile, private studio history and relocation details, social engagement counts, and the converter's family-business relationship unpublished unless approved.

Use media Vincent owns or has permission to publish. Keep third-party tracking and social embeds out of the site. A tool that needs private configuration, stored data, or restricted access needs a separate access decision before implementation.

## 6. Visual reference

Use [the style guide](style-guide/) for approved components and page patterns. Shared stylesheets remain the source for their appearance. Keep experiments on separate pages. The [icon editor](style-guide/icons.html) is a comparison tool; apply candidates to icons used by installed apps only after the owner selects them.

Keep live breadcrumbs in English. Use quiet language controls on reading pages and segmented controls on tools. Preserve separate English and Simplified Chinese views where translations exist. New page shells start in English until complete translations are added.

Use Python scaffolding and copy components as described in the README. Update the guide when a shared component changes. Keep design values out of this plan.

## 7. Tool requirements and evidence

| Tool | Current reference |
| --- | --- |
| CSV to ABA converter | [Input rules and limits](tools/csv2aba-v2/README.md), [payment review](tools/csv2aba-v2/PAYMENT-CHECKLIST.md), and financial safety rules in AGENTS.md |
| Guitar strum machine | [Use and maintenance](tools/guitar-strumming/README.md), [source format](tools/guitar-strumming/docs/FORMAT.md), and [audio recovery evidence](tools/guitar-strumming/docs/AUDIO.md) |
| Pitch shifter | [Specification](ideas/song-pitch-shifter.md) and [dependencies and licenses](tools/pitch-shifter/docs/DEPENDENCIES.md) |

On 29 October 2026, the owner confirmed several successful converter runs over the previous two months. This supports only the established Commonwealth Bank of Australia (CBA) workflow. Exact run dates, revisions, comparison records, and bank receipts were not supplied. This is not general bank approval.

The owner approved the converter's fixed source identity for publication on 1 October 2026. Preserve those settings and the fixed expected-output tests. Review payment entries, count, and total before approval. Stop the payment process if a result is unexpected.

## 8. Review limits

The owner completed browser reviews of the public foundation and music tools in September and October 2026. These results do not verify later interface changes.

Manual review remains unrecorded for the studio rates refinements, Sound placeholders, later shared-style changes, guide language switching, component copying, and icon controls. When a browser is available, check keyboard use, visible focus, narrow screens, 200 percent zoom, and relevant clipboard behavior. Device audio checks follow AGENTS.md. These optional reviews do not block small documentation changes.

## 9. Unscheduled ideas

These are options, not selected implementation work.

| Idea | Selection condition |
| --- | --- |
| Metronome | Define the practice workflow and rhythm controls. |
| Tuner | Define input, tuning modes, accuracy, and visualization. Retain [StroboPro](https://www.strobopro.se/) and [audioMotion Analyzer](https://audiomotion.dev/demo/fluid.html) as references. |
| Pitch key recognition | Define the musical scope and acceptable accuracy. |
| Portfolio additions or featured videos | Select useful public work and obtain publication approval. |
| Custom not-found page | Broken-link traffic or site growth makes recovery navigation useful. |

Todoist also holds options to consider event photos and review a design reference. Neither is selected by this cleanup. MeTube belongs with the Home Lab service work.

## 10. Project and tool model

Deferred since 13 October 2026. Resume when a new tool exposes a concrete gap in current instructions. Define only the needed status, ownership, support, privacy, tests, or archive rule. Existing Python templates cover page scaffolding; do not plan a second template system.

Todoist task `6hXWVC5j9vw9HX4c` refers to this section.

## 11. Work and decision rules

Complete one package at a time. Record important requirements and failure behavior before implementation. Mark completion only after its checks pass. Keep completion evidence short. Remove superseded detail instead of appending another development diary.

Use `.codex/project-workflow.toml` for tracking. The owner selected this cleanup directly. The two deferred model tasks remain deferred. The two other labeled options concern photos and design research. Leave those task labels and priorities unchanged during this cleanup.

Decisions retained on 6 November 2026:

- The style guide governs visual examples. Tool documents govern their behavior and limits.
- Python scaffolding supersedes the earlier decision to defer reusable page templates.
- Current safety and maintenance instructions supersede completed audit checklists.
- Completed logs and discarded experiments remain in Git history. Do not create a second archive document.

## 12. Content system

Deferred until manual maintenance causes repeated errors or material delay that existing scripts cannot address. Record the specific problem before comparing solutions. If a generator is selected, preserve addresses, plain output, and independent tools. Do not add a framework only because the site has multiple pages.

Todoist task `6hXWVC5M4G6FP3G6` refers to this section.
