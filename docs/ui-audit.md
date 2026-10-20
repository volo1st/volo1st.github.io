# HTML and CSS audit

Date: 17 October 2026. Source revision: `ec8eadf`.

This report supports the active user interface (UI) style guide package in [plan.md](../plan.md). HTML means Hypertext Markup Language. CSS means Cascading Style Sheets. The inventory records the source before migration and the proposed migration boundary. See the migration result below for the current implementation. It does not replace the plan.

## Scope and method

Reviewed all 14 existing HTML documents and all 11 stylesheets. These include 12 maintained pages, one redirect, and the frozen legacy converter. Read the application state updates that affect visibility, selection, validation, and disabled controls. Checked stylesheet load order, selector scope, native element use, and accessible names in the source.

This is a source audit. No browser rendering, computed-style capture, screen reader review, device-font comparison, or zoom review ran. Sizes below are declared CSS values. They are not measured rendered sizes. The legacy converter remains unchanged.

The [UI style guide](../style-guide/index.html) and its isolated specimens now load the same shared stylesheet as the maintained pages. The inventory below records the original source. Dated design decisions record the review sequence.

## Main finding

The site shares a palette and a page shell. It does not yet share a complete component system. A component needs consistent HTML semantics, dimensions, type, state rules, and responsive behavior. Shared color variables supply only part of that contract.

Three causes explain most of the drift:

1. The apps define buttons, fields, panels, disclosures, and notices independently.
2. Global element selectors and page-specific selectors have different precedence. A new selector can change an unrelated component.
3. Type sizes, spacing, radii, warning colors, and disabled styles have no common scale or usage rule.

Some differences are useful. The homepage introduction, studio service rows, chord timeline, and audio transport each have a different job. Preserve their composition. Consolidate the common controls within them.

## Page and stylesheet inventory

The shell is [assets/site-shell.css](../assets/site-shell.css). It supplies the system font, color variables, focus outline, breadcrumb, language control, content width, and gutters.

| Page | Additional styles, in load order | Structure and semantics |
| --- | --- | --- |
| [Home](../index.html) | `assets/home.css` | One `h1`, introduction links, and two named social lists. No script. |
| [Code](../code/index.html) | `assets/section-index.css` | Breadcrumb, named section, `h2`, and links. No `h1`. |
| [Sound](../sound/index.html) | `assets/section-index.css` | Breadcrumb and named navigation list. No content heading. |
| [Music](../music/index.html) | `assets/section-index.css` | Breadcrumb, named section, `h2`, and links. No `h1`. |
| [Room acoustics](../sound/room-acoustics/index.html) | `assets/section-index.css`, `sound/details.css` | Breadcrumb, `h1`, description, and static placeholder. |
| [Live sound](../sound/live-sound/index.html) | Same as Room acoustics | Same structure. |
| [Studio](../studio/index.html) | `assets/section-index.css`, `studio/studio.css` | Breadcrumb, `h1`, and named navigation list. |
| [Studio rates](../studio/rates/index.html) | `studio/rates/rates.css` | Bilingual `h1`, service sections, price paragraphs, contact links, and footer. |
| [Tools](../tools/index.html) | `assets/site.css` | Breadcrumb, language buttons, and tool cards with `h2` headings. No `h1`. |
| [Current converter](../tools/csv2aba-v2/index.html) | `assets/site.css`, `tools/csv2aba-v2/styles.css` | Safety aside, workflow sections, file input, two textareas, result metrics, and download button. |
| [Guitar Strum Machine](../tools/guitar-strumming/index.html) | `tools/guitar-strumming/styles.css` | Named practice region, source editor, transport, chord timeline, and disclosures. |
| [Pitch Shifter](../tools/pitch-shifter/index.html) | `tools/pitch-shifter/styles.css` | Named workspace, audio transport, export controls, metrics, and disclosures. |
| [Former converter address](../tools/csv2aba/index.html) | None; no shell | Redirect with a usable fallback link. Keep it simple. |
| [Legacy converter](../tools/csv2aba-legacy/index.html) | Only its local `styles.css` | Standalone frozen design. Record differences; do not migrate it. |

The 11 stylesheets contain 1,990 lines at this revision. The largest files are Guitar at 685 lines and Pitch Shifter at 557 lines. Size alone is not a defect. These files combine common components with specialized app layout and state rules.

## Foundations

### Typography

| Role | Current declarations | Finding |
| --- | --- | --- |
| General text and controls | System sans-serif; root `100%`; line height `1.5` | Useful base. No named body-font token. |
| Public display text | Iowan Old Style, Palatino Linotype, Book Antiqua, Palatino, Georgia, serif | Shared display stack is repeated as `--home-display-font`. |
| Studio reading text | Iowan Old Style, Palatino Linotype, Palatino, Songti SC, STSong, SimSun, Georgia, serif; line height `1.7` | Deliberate Chinese serif fallback. Not shared with the other reading styles. |
| Code and arrangement text | Several local monospace stacks | Menlo, Monaco, Liberation Mono, and line heights differ by page. |
| Homepage title | `clamp(2.4rem, 7vw, 4rem)`, weight `600`, line height `.95`, letter spacing `-.055em` | Intentional display exception. |
| Studio and Sound detail title | `1.6rem`, weight `400`, line height `1.2` | Same pattern implemented twice. |
| Studio rates title | `1.05rem`, italic, weight `400` | An `h1` that is visually smaller than the service `h2` at `1.125rem`. Decide whether this is a year label or the page title. |
| Generic tool `h2` | `1.25rem`, line height `1.2` in the tool index and Guitar | Pitch has no equivalent shared heading rule. |
| Section label | `.8rem`, bold, uppercase, letter spacing `.08em` | Useful eyebrow style. It is tied to `h2` inside one layout selector. |
| Supporting text | `.85rem`, `.92rem`, `.75rem`, and `.6875rem` across pages | No common small-text roles. Studio footer is especially small. Review visually before selecting a minimum. |
| Numeric readouts | Converter `1.55rem/800`; pitch `1.15rem/750`; tempo input bold | Different purposes. Share tabular numerals and base tokens; preserve useful emphasis. |

Local font stacks depend on the operating system. A serif stack can resolve to different Latin and Chinese fonts. One CSS rule makes usage consistent; it does not guarantee the same glyphs on every device. Review bilingual samples on devices the owner uses before choosing a downloaded font. No font download is required for this package.

### Colors and surfaces

The shared palette is a strong starting point:

| Role | Current value |
| --- | --- |
| Page | `#f4f1e8` |
| Main text | `#17202a` |
| Muted text / softer muted text | `#4a4a43` / `#5c594e` |
| White / panel / subtle / inset surfaces | `#ffffff` / `#fffdf7` / `#f8f6ef` / `#f2f0e9` |
| Control / panel / divider borders | `#777263` / `#a9a38f` / `#d2cdbd` |
| Focus | `#9b5c00` |
| Default tool accent | `#075a9c` |
| Music and Guitar accent | `#27644e` |
| Public links | `#3f3a31`, hover `#171512` |

Public link values are repeated in the shell, homepage, section index, and rates page. Warning, error, and success colors are local literals. Guitar has separate warning and error palettes. Pitch gives both warning and error the same rust-colored border. The converter uses green success, red error, and gold safety notices. Centralize semantic tones without making success depend on the current tool accent.

Do not infer accessibility compliance from the shared palette. Text, surface, state, and opacity combinations need review together. The existing plan records contrast for selected base colors only.

### Space, dimensions, and decoration

| Item | Current variants | Recommended boundary |
| --- | --- | --- |
| Content width | Shell `960px`; Guitar `46rem`; Pitch, Studio, and Sound details `48rem`; section content `44rem` | Start the draft with one centered 48rem maximum. Add an exception only when a specific layout needs it. |
| Gutter | Shell `32px`, then `20px` below `560px`; Guitar root `1.5rem`, then `1rem` below `22rem` | One default responsive gutter. App override must be explicit. |
| Page padding | Header clamp; home viewport-based; studio/details `1.5rem 3rem`; Guitar bottom `3rem`; converter relies on panel margins | Separate page composition from component spacing. |
| Panel padding | Usually `1rem`; service rows `1.25rem` vertically | Reuse a small spacing scale. Keep service-row composition. |
| Button height | Common `2.75rem`; language `2.25rem`; segmented choice `2rem`; toast close `2.5rem` | Name standard and compact variants. Check effective targets before using compact controls. |
| Button padding | Shared `.6rem .9rem`; Pitch `.55rem .85rem` | Select one standard rule. |
| Borders | Common controls use `1px` or `2px`; notice stripe `4px`, `.3rem`, or `6px` | Name control, panel, and notice border roles. |
| Radii | `.15`, `.2`, `.25`, `.3`, `.4`, `.45`, `.5`, `.65rem`, `6px`, `8px`, and pills | Reduce incidental variants. Preserve circles and pill units when useful. |
| Shadow | Shared panel shadow; Guitar toast has a stronger local shadow | Name panel and overlay roles. Do not apply a shadow to every section. |
| Breakpoints | `360`, `480`, `560`, `650`, `700px`, `22rem`, and `38rem` | Do not merge mechanically. Choose breakpoints from actual component fit. |

The shell subtracts `--site-gutter` once from the total width. A `32px` value produces `16px` on each side when the page fills the available width. Record that meaning before renaming the variable or replacing the width calculation.

## Common component inventory

| Component and semantic purpose | Current source and style | Consolidation decision to review |
| --- | --- | --- |
| Breadcrumb navigation | Shell `.site-breadcrumb`, native `nav`, current-page span, hidden separators | Share one markup pattern and one link treatment. Keep a meaningful accessible name. |
| Language choice | Shell `.language-switcher`; native buttons; script updates `aria-pressed` | Keep fixed-English breadcrumb. Choose one visible label pair. Tools use EN/中文; rates uses English/简体中文. |
| Text navigation links | Shell accent link; section neutral link; home inline hero link; rates contact link | Share neutral and accent variants. Hero typography can remain specialized. |
| Social icon link | Home `.social-link` and local SVG symbol; accessible name and title | Preserve the named link and current icon source. Base focus and target size should be shared. |
| Primary action | Shared `.primary-action`; Guitar unqualified `button`; Pitch local `.primary-action` | One class with default, hover, focus, disabled, and busy states. Use `button` for an action. |
| Navigation styled as button | Shared/Pitch `.button-link`, native anchor | Share visual geometry with buttons. Keep link semantics and destination. A download link needs a valid generated URL before it becomes available. |
| Secondary action | Guitar `button.secondary-button`; Pitch `.secondary-button` | Same base dimensions and state rules; choose one border, surface, and text color. |
| Icon action | Pitch `.icon-button`, `.pitch-symbol-button`; Guitar toast close | Shared icon-button wrapper and accessible name. Keep pitch symbols and app actions. |
| Toggle / segmented choice | Guitar `.chord-view-switcher`, language choice, play button | Share selected-state styling where appropriate. Preserve each control's purpose and state model. |
| Text and number input | Guitar global `input` rules and tempo pill | Shared field geometry, labels, help, invalid, read-only, and disabled states. The tempo pill can keep its unit wrapper. |
| Textarea / source editor | Converter global `textarea`; Guitar global `textarea` | Share border, font token, focus, and read-only style. Keep different rows and minimum heights for different tasks. |
| Select dropdown | Guitar global `select` uses `2px` border and white surface; Pitch `.advanced-control select` uses `1px` and subtle surface | One select class. Layout wrappers must not define its core appearance. |
| Range slider | Guitar native `input[type=range]`; Pitch ID selector with custom WebKit and Firefox tracks/thumbs | Share the base range appearance and disabled state. Preserve seek progress and tempo bindings in app code. |
| File selection | Converter native file input; Pitch hidden input with proxy button | Shared visible button style. Preserve accept filters and user-gesture behavior. Do not move browser file access into showcase code. |
| Label and field help | Converter block label `750` and `.field-help`; Guitar label `700` and `.preset-goal`; Pitch `.control-help` | Shared label, help, and validation slots with `for` and `aria-describedby`. |
| Panel / card | Shared `.panel`; Guitar `section, details`; Pitch `.workflow-section, .info-section` | Shared panel class. Do not turn every semantic `section` into a panel. |
| Disclosure | Converter plain `details/summary`; Guitar padded bordered `details`; Pitch `.info-section` | Share native `details/summary` appearance with optional panel treatment. Show open and closed states. |
| Persistent information / privacy notice | Converter `.safety-notice`, `.privacy-note`; Guitar `.preset-notice`; Pitch About disclosure | Shared tone and text treatment. Required financial instructions remain persistent and prominent. |
| Live status | Converter `.status-message`; Guitar `.context-status` and `.validation-summary`; Pitch `.status` | Shared inline notice styles and explicit tones. Preserve `role=status` and update behavior in app code. |
| Error summary | Converter `.error-panel` with `role=alert` and focused summary; Guitar `.validation-errors` | Shared visual base. Preserve error codes, row details, focus management, and output invalidation. |
| Toast notification | Guitar `.playback-toast`, fixed placement, tone, and dismiss button | Common notice content and button; separate overlay placement. Do not replace essential errors with temporary toasts. |
| Table | Converter caption, scoped column headings, scroll wrapper | Shared table surface and cell spacing. Keep overflow local and keyboard reachable. |
| Metrics / definition list | Converter `.payment-totals`; Pitch `.metrics` | Shared label/value type and spacing; optional tile and compact-row layouts. Preserve authoritative count and total values. |
| Divider | Shell token; converter choice divider; rates section border; audio action divider | One color and spacing rule. Keep decorative lines hidden from assistive software when needed. |
| Empty / placeholder state | Section `.section-status`; Pitch `.metrics-empty` | Shared supporting-text style. Keep descriptive text; do not imply work succeeded. |
| Busy indicator | Pitch export dots tied to `aria-busy`; Guitar startup disables controls | Preserve meaningful busy state and text. A motion effect is optional; functional state is not. |
| Visually hidden text / hidden content | Separate Guitar and Pitch utilities; Pitch global `[hidden]`; local Guitar hidden overrides | Share utilities. Ensure display rules do not accidentally reveal hidden output or controls. |

## Differences and risks to resolve

### High priority before migration

1. **Selector collisions.** Guitar's `button:hover:not(:disabled)` also matches language buttons. It can supply an accent background where the shell expects a plain text control. Its `section, details` rule also gives every section a panel surface. Converter `label`, `textarea`, `table`, and `summary` rules are global. Rates `h1, h2` rules are global. These are source-level collision paths; visible impact needs browser review.
2. **Hidden and disabled state is functional.** Converter output must remain unavailable after edits or errors. Pitch download links and file controls depend on state. Guitar disables controls during startup and unsupported playback. Keep IDs, data attributes, and state updates when changing classes.
3. **Controls are coupled to layout.** Pitch select styling requires `.advanced-control`; seek styling requires `#transport-position`; Guitar primary buttons have no component class. Extract common appearance without moving audio or validation logic into a design-system layer.
4. **Notice tones have no common meaning.** Informational, successful, warning, and error outcomes need explicit text and semantic tone. Converter `.status-message` gives every non-empty status a green success treatment, including file-reading status. Tool color must not stand in for a success color. Preserve financial instructions and error details.

### Medium priority for the style guide review

5. **Disabled styles conflict.** Converter and Guitar replace color, border, and background with gray. Pitch keeps the original palette and applies `.58` opacity. Pitch also suppresses that fade for preview-locked controls. Choose a base disabled style and an explicit reason for any exception.
6. **Focus styles vary.** The shell uses a `3px` outline at `3px` offset. Home hero/social links and language controls replace it with reversed colors. Pitch selects use a `2px` offset. Keep focus easy to recognize across control types.
7. **Hover guards differ.** Shared `.primary-action:hover` does not exclude `:disabled`. The following disabled rule currently wins for color, border, and background. Guitar and Pitch exclude disabled controls from hover rules directly. Select one convention so the result does not depend on keeping the same declaration order.
8. **Headings are inconsistent.** Several pages intentionally omit a visible `h1`; some begin at `h2`; Sound has no content heading. A breadcrumb's current-page text is navigation, not a heading. Review a visually hidden page heading where the compact layout should remain. Do not add redundant visible titles everywhere.
9. **Field validation states are incomplete visually.** Existing error lists are useful, but there is no shared invalid-field border or help pattern. A future component must connect the message to the actual field. Do not add decorative error styling without a real error state.
10. **Action labels and toggle state need a semantics review.** Guitar changes Play to Pause while also setting `aria-pressed`. A stable-label toggle and a changing-label action are different patterns. Keep playback logic intact and choose the intended announcement during migration.
11. **Spacing and typography repeat.** Studio and Sound detail headings are equivalent local rules. Monospace stacks, muted-text sizes, public link colors, and panel definitions repeat. These are good early extraction targets.
12. **Responsive behavior differs by component.** Shared primary actions become full width below `480px`; Pitch result actions below `650px`; Guitar transport changes near `608px`. Some differences fit the content. Do not require all buttons to become full width on every small screen.
13. **Names and source rules have drifted.** The plan still described a tools breadcrumb summary that the owner removed. The language-label specification differs from studio rates. Use the showcase review to select current rules and update the plan before migration.

### Existing strengths

- Native controls and explicit labels cover most interactive work.
- Breadcrumbs use navigation landmarks and current-page state.
- Local SVGs avoid third-party icon requests.
- Live status regions already exist in maintained apps.
- The converter has strong validation, output-invalidation, and download-state tests.
- The palette and domain accent variables already connect the site visually.
- There is no build requirement and no maintained-page inline event handler.

## Specialized components to preserve

| Component | Keep | Replace only the common parts |
| --- | --- | --- |
| Guitar chord timeline | Bar widths, label lanes, chord names, timing positions, duration regions, scrolling, and current-chord state | Container tokens, supporting text, focus, and shared control classes around it |
| Guitar tempo control | Synchronized numeric/range values and optional unit pill | Number input and range appearance |
| Guitar arrangement controls | Key, capo, swing, ramp, presets, and source format | Buttons, fields, selects, labels, notices, and disclosure wrappers |
| Pitch transport and pitch stepper | Audio timing, seek progress, pitch symbols, and preview/export state | Base buttons, range, select, notice, and panel styles |
| Pitch drag overlay | Drop-state behavior and full-page target cue | Color and type tokens |
| Converter workflow | Validation, safety notice, source rows, integer money, exact output, counts, totals, and download gate | Shared visual classes only; preserve all functional safety tests |
| Studio service rows | Service/price relationship, readable prose, translations, and print layout | Shared text, link, divider, and width tokens |
| Homepage namecard | Introduction scale, social grouping, and vertical composition | Shared fonts, links, and focus tokens where they fit |
| Frozen legacy converter | Entire operational fallback | Nothing in this refactor unless a separate critical fix is required |

## Proposed shared system

The approved source is now `assets/ui.css`. The dated notes below record its review before promotion.

1. **Foundations:** One serif family for default content and headings, one sans-serif family for interactive controls, and one monospace family for source text; a small text scale; semantic colors; spacing; radii; border roles; widths; and focus.
2. **Common components:** Button, link-button, icon button, field, select, range, label/help, notice, panel, disclosure, table, metrics, language choice, and visually hidden text.
3. **Page composition:** Home namecard, section index, reading page, service list, and app workspace. Composition uses components rather than redefining them.
4. **App-specific displays:** Chord timeline, transport timing, pitch symbols, workflow sequencing, and domain data. These can use shared tokens without losing their own layout.

Use explicit classes for common appearance. Use native attributes such as `disabled`, `readonly`, `aria-invalid`, `aria-pressed`, and `open` for state. Keep application logic responsible for when a state changes. Use domain attributes for accent variables rather than separate blue and green copies of each component.

Typography direction selected on 17 October 2026: The owner prefers serif as the default. The draft now uses the same serif stack for headings, prose, notices, help, and table content. Buttons, inputs, selects, control labels, interface navigation, and disclosure summaries use system sans-serif. Inline content links retain the surrounding font. Code, arrangement source, and suitable technical values use monospace. Chinese serif fallbacks are part of the default stack. Existing page styles and current-style specimens have not been migrated.

Scale accepted on 19 October 2026: Use four named sizes: supporting text at 0.875rem, body text at 1rem, section headings at 1.5rem, and page titles at 2rem. Use weights 400 and 700. Serif headings remain regular. Control labels, buttons, emphasis, and body-size subsection headings use bold. Use line heights 1.6 for text and controls, and 1.2 for headings. Use normal letter spacing. The homepage greeting remains an explicit exception for the later migration. The current-style specimens retain the original declarations for comparison.

Page-width draft on 19 October 2026: Start with one centered container capped at 48rem. Use side gutters of `clamp(1rem, 4vw, 2rem)` on each side. Header and main content use the same `.ui-container` class. Remove the guide's separate 42rem and 44rem limits. Keep the existing small-screen single-column layout. Widths inside the current-style specimens remain unchanged. Review this draft before selecting any page-width exception for the later migration.

Control draft on 19 October 2026: Buttons, inputs, selects, textareas, and file-selector buttons now share minimum height, border width, padding, radius, and control typography. The default minimum is 2.75rem, or 44 pixels at the default font size. Above 650 pixels, a fine primary pointer with hover uses a 2.25rem (36-pixel) minimum and 0.25rem vertical padding. This keeps desktop controls compact and touch targets larger. Textareas retain a larger minimum and vertical resizing. Long button labels can wrap. Icon buttons use the same minimum dimension as text buttons. Native ranges and choice labels share the target height without replacing the browser widget.

Single-line selects use a local chevron inset by 0.75rem, with space reserved beside the value. Selection still uses the native control. Disabled selects keep the chevron. Forced-color mode restores the browser arrow.

Spacing and panel draft on 19 October 2026: Reuse the existing spacing tokens through explicit layout classes. `.ui-flow` controls direct child margins, with 1rem between text blocks and 0.5rem after headings. Lists use 0.5rem between items. `.ui-stack` separates field groups by 1.5rem. `.ui-actions` wraps buttons with a 0.5rem gap. Sections use 2rem padding on desktop and 1.5rem on mobile. Panels and disclosure bodies share 1.5rem desktop padding and 1rem mobile padding. Disclosure summaries use the same horizontal inset and retain native markers, keyboard behavior, and focus outlines.

Use `.ui-panel.ui-flow` for a bordered content group and `.ui-disclosure__body.ui-flow` for disclosure text. Use `.ui-group` with a native fieldset and legend when related options need no extra panel. The draft removes the raised-panel variant and frames around ordinary samples. The guide compares plain content with a settings panel. It also shows long summaries, Chinese content, wrapping actions, and natural closed-disclosure height. Existing pages and isolated current-style specimens remain unchanged.

Notice draft on 19 October 2026: Use `.ui-notice.ui-flow` with an explicit text label or heading. Information is blue, success is green, warning is gold, and error is red. The tone is independent of the tool accent. Each notice uses a 0.25rem left stripe, the panel radius, 1rem padding, dark serif body text, and a colored `.ui-notice__title`. Reuse content-flow spacing for paragraphs and lists. The dismissible sample uses a flexible content column beside a fixed-size common button. Examples include short status text under the music accent, linked error details, long text, and Chinese text. Empty content retains a neutral panel.

The local sRGB contrast calculation gives heading-to-surface ratios of 6.32:1 for information, 6.73:1 for success, 5.75:1 for warning, and 7.09:1 for error. Dark body text ranges from 14.61:1 to 15.37:1 on these surfaces. These calculations cover the named color pairs only. They do not establish whole-page accessibility. Static examples have no live-region roles. Keep essential errors and instructions persistent. Assign dynamic announcement behavior during app migration, using the W3C references below.

Table and summary draft on 19 October 2026: Use one serif table style with bold headings, 0.75rem cell padding, horizontal row dividers, and a subtle header and totals surface. Apply `.ui-table__number` to numeric headers and cells for end alignment, tabular digits, and values that stay on one line. Apply `.ui-table__text` to long descriptions for a 12rem minimum width and wrapping within long words. Other cells retain normal word wrapping. Keep captions, scoped row and column headings, and footer totals in native table markup. Use a named, focusable `.ui-table-scroll` region for local overflow. Keep the table structure on narrow screens rather than hiding columns or changing rows into cards.

Use one neutral `.ui-metrics` definition-list grid for summary values. Reuse supporting-size labels and bold body-size values. Separate groups by 1.5rem and labels from values by 0.5rem. Long values wrap within the grid. Use a nonbreaking space when a unit must stay with a short value. Missing values use explicit text and remain distinct from zero. The dedicated guide section shows long filenames, totals, an empty table, zero and missing values, and Chinese labels. All data is invented and static. Existing apps and isolated specimens remain unchanged.

Striped-row option added on 19 October 2026: Keep the plain table as the default. Add `.ui-table--striped` for long tables. After owner review, direct body rows alternate between the warm subtle surface (`#f8f6ef`) and inset surface (`#f2f0e9`). All draft table headers and totals use a deeper warm surface (`#e9e5da`) and stronger boundary lines. Typography, cell spacing, and scroll behavior use the base table rules. Stripes do not indicate selection or status. The guide includes an eight-row example with explicit state text, a long filename, and a footer total.

Header draft on 19 October 2026: Use `.ui-page-header` for 1.5rem spacing between page context and title content. Use `.ui-context-row` for a flexible breadcrumb beside the language choice. `.ui-breadcrumb` uses a named native navigation landmark, an ordered list, neutral links, hidden separators, and current-page state. Breadcrumbs remain in English and can wrap. Reading pages use the page-title type token. Compact apps can keep their page heading visually hidden. Guide sample headings follow the guide's own document hierarchy.

Language direction selected on 19 October 2026: Use `En` and `中` with full accessible language names and explicit `aria-pressed` states. Tools use `.ui-button-group.ui-language.ui-language--tool` with adjacent segments and rounded outer corners. The current language is disabled and retains its solid dark fill and light text. This is an explicit exception to the general disabled appearance. Reading pages use `.ui-language.ui-language--text` with existing quiet buttons to show `En / 中`. The current language is disabled and appears as plain bold text; the alternative appears as underlined text. The slash is hidden from assistive software. Native buttons preserve the same-page action semantics without adding language URLs or a new general link-button component.

Both variants use natural widths, no-wrap labels, the existing 0.875rem size, 1.2 line height, and compact padding. The desktop minimum height is 28 pixels, and the touch height is 44 pixels. Segmented controls retain a 44-pixel minimum touch width. Text-style choices use a 1.5rem horizontal minimum to stay quiet. The alternative language keeps the common focus outline. Exceptionally narrow context rows can wrap without clipping. During migration, update the existing language binder to keep `disabled` in step with `aria-pressed` and re-enable the previous language. Guide examples remain static. Existing translation scripts, shell styles, and current-style specimens remain unchanged.

The draft gives common controls one focus outline and neutral disabled styling. Native range and choice rendering retains browser-specific details. Read-only fields remain selectable and focusable. Invalid fields use a fixed border width plus an inset error stroke, with a linked text message. Selected button hover styles retain the selected tone. Ordinary disabled styles take precedence over selected or invalid visual styles. Current-language controls retain their selected appearance as an explicit exception. Busy samples use disabled buttons and text without animation. The guide includes alignment, long-label, Chinese, read-only, invalid, and disabled examples. No application state logic or existing page styles changed. Browser-specific file, select, and slider appearance still needs manual review.

Do not use `!important` or broad element overrides to make one demo look correct. Do not introduce a framework or content generator for this package. Native range controls in the draft keep browser-specific geometry; their accent and surrounding layout are shared. If a custom track is selected, review both browser engines before migrating it.

## Review and migration sequence

1. Compare the current specimens with the draft. Choose typography, control geometry, disabled/focus treatment, notice tones, and panel density.
2. Refine the draft until the owner accepts the full set, including Chinese samples and long labels.
3. Promote the accepted component stylesheet to shared assets. Record required markup and state rules in the guide.
4. Migrate public pages and studio text first. Check content, links, spacing, and translations.
5. Migrate one app at a time. Preserve IDs, native semantics, data attributes, state logic, and specialized displays. Remove only the replaced CSS rules.
6. Run existing checks and the app's relevant functional tests. Use a focused manual browser review where available. Do not install heavy browser tooling for visual checks.
7. Keep the guide loaded from the same component source as the migrated pages. A new page must reuse an accepted component or document a specific exception.

The later migration is not authorized by completion of this audit alone. The owner explicitly placed visual iteration before site-wide changes.

## Primary references

- [W3C button pattern](https://www.w3.org/WAI/ARIA/apg/patterns/button/): Actions, links, names, and toggle state have distinct semantics.
- [W3C breadcrumb pattern](https://www.w3.org/WAI/ARIA/apg/patterns/breadcrumb/): Use a named navigation landmark and current-page state for the page hierarchy.
- [W3C slider pattern](https://www.w3.org/WAI/ARIA/apg/patterns/slider/): A range value needs a name and understandable value information. Preserve native input behavior when possible.
- [W3C status-message guidance](https://www.w3.org/WAI/WCAG22/Understanding/status-messages.html): Dynamic status messages need appropriate programmatic identification. Message context determines announcement behavior.
- [W3C alert pattern](https://www.w3.org/WAI/ARIA/apg/patterns/alert/): Alerts carry important messages without moving focus. Avoid automatic dismissal of important messages.
- [HTML disclosure specification](https://html.spec.whatwg.org/multipage/interactive-elements.html#the-details-element): Native `details` and `summary` provide disclosure behavior.
- [Mozilla cascade and specificity guidance](https://developer.mozilla.org/en-US/docs/Learn_web_development/Core/Styling_basics/Handling_conflicts): Selector precedence explains why local rules can override common styles.

These references support component semantics and the cascade analysis. They do not establish that this site's rendered interface passes an accessibility review.

## Migration result · 19 October 2026

The owner approved application after the guide review. See section 22 in [plan.md](../plan.md) for completion evidence.

- `assets/site-shell.css` supplies the palette, domain accents, base box sizing, and focus outline.
- `assets/ui.css` supplies shared typography, containers, spacing, controls, notices, disclosures, tables, summaries, breadcrumbs, and language choices. It replaces `style-guide/components.css`.
- All maintained public pages, studio rates, and the three current tools load these shared assets. The guide and all five specimens load the same assets. The redirect and frozen legacy converter are excluded.
- Page styles retain composition and specialized displays. The homepage greeting remains an explicit type exception. Guitar chord timing, pitch glyphs, seek progress, busy feedback, and the drop overlay remain specialized.
- Reading pages use `En / 中`. Tools use the compact segmented group. Each choice has a full accessible name. Language buttons use `data-disable-current="true"`. The binder updates both selected and disabled state and re-enables the previous choice.
- Existing validation, live-region announcements, native controls, focus targets, hidden state, and download gates remain in use. Common notices use shared semantic tones. Guitar keeps its existing Play/Pause action and announcement behavior; a separate semantics review can change that behavior later.

For new pages, load `site-shell.css`, then `ui.css`, then the local composition stylesheet. Use `.ui-container` for page width. Use `.ui-flow`, `.ui-stack`, `.ui-field`, and `.ui-actions` for spacing. Apply component classes to native elements. Do not copy common declarations into page CSS. Use the guide to review a shared change before applying a new exception. The five specimens contain static, invented examples and run no app engines.

Source checks do not establish rendered or device behavior. Manual keyboard, focus, narrow-screen, 200 percent zoom, and representative iPhone or iPad audio checks remain pending. This package adds no browser automation or dependencies.


## Page-root isolation · 20 October 2026

Every maintained live page has a stable `data-page` attribute on its body. Each tool and studio specimen uses the same value as the live page. The mixed public specimen uses matching roots around its examples. Specimen-only styles require `data-specimen`. The guide has its own page root.

Shared palette, typography, components, and layout primitives stay global in `assets/site-shell.css` and `assets/ui.css`. Page composition and specialized rules require a root guard:

```html
<body data-page="guitar">
```

```css
:where([data-page="guitar"]) .chord-timeline {
  display: flex;
}
```

The `:where()` guard adds no selector specificity. Scope every selector in a comma-separated list. Apply the same guard inside media rules. The section-layout stylesheet lists its supported page roots in one guard. Keep page-only variables on the page root. The studio print rule uses a guarded document-root selector to preserve the page background and inherited color. Keep animation bindings inside the scope and give animation names a page prefix. Keyframe steps remain native keyframe selectors.

These guards restrict where a local rule can match. They do not create a separate cascade within the page. Local selectors must still preserve shared component contracts. The frozen legacy converter and redirect remain outside this convention. See section 24 in [plan.md](../plan.md) for checks and completion evidence.


## Link and supporting-text refinement · 20 October 2026

Text links use dotted underlines. Reading-language choices use the same decoration for the available language. Button links and social icons keep their own presentation. Breadcrumbs use the body serif family. Disclosure summaries prevent text selection; disclosure content keeps its existing selection behavior.

`.ui-small` controls size and line height. `.ui-muted` controls the lighter warm text color through `--ui-text-muted`. Combine them for quiet supporting text. Use either class alone when size and emphasis differ. `.ui-help` remains a semantic component with its own readable instruction color. Use color rather than element opacity. The guide demonstrates the three combinations. Existing small-text uses now make their color choice explicit.


## Mobile header comparison and casing · 20 October 2026

The guide compares two proposed mobile tool headers. Option A uses a parent link and a short tool label. Option B uses a parent breadcrumb and a separate full heading. Both use shared serif text and existing segmented language controls. Guide-only rules center the row contents and retain touch target height. A narrower example shows the whole language group on a separate row. The live header layout remains unchanged pending selection.

Use sentence case for generic labels and descriptive tool names. The full names are `Guitar strum machine`, `Pitch shifter`, and `CSV to ABA converter`. Proposed short navigation labels are `Guitar`, `Pitch`, and `CSV to ABA`. A short label must retain the full browser title and accessible heading. Preserve proper names and acronyms. Use `Studio / Rates` for breadcrumb levels and `2026 studio rates` for the page heading. Keep the intended case in source text. Do not use CSS capitalization. Dated audit findings above retain the original names. See section 27 in [plan.md](../plan.md) for the current decision and verification evidence.
