---
name: TechRAG Assistant
description: Ask the code of indexed GitHub repos; every answer arrives with its side B tracklist of exact files and lines.
colors:
  ink: "#1e3a8a"
  ink-deep: "#17307a"
  ink-body: "#172c6b"
  ink-2: "#4a62a6"
  ink-faded: "#6b86c5"
  stripe-red: "#d32f2f"
  red-deep: "#8c1d1d"
  red-wash: "#fbeceb"
  inlay-white: "#fcfbf7"
  shelf: "#f4f3ee"
  printed-rule: "#d5dcee"
  pencil: "#a6a6a6"
  pencil-text: "#6b6b6b"
  code-plate: "#eef2fa"
  ink-wash: "#e7ecf7"
typography:
  display:
    fontFamily: "Patrick Hand, Comic Neue, cursive"
    fontSize: "clamp(3rem, 2rem + 4.5vw, 5.75rem)"
    fontWeight: 400
    lineHeight: 0.95
    letterSpacing: "0.01em"
  headline:
    fontFamily: "Patrick Hand, Comic Neue, cursive"
    fontSize: "clamp(2.2rem, 1.6rem + 2.4vw, 3.6rem)"
    fontWeight: 400
    lineHeight: 1.05
    letterSpacing: "0.02em"
  title:
    fontFamily: "Patrick Hand, Comic Neue, cursive"
    fontSize: "clamp(1.45rem, 1.2rem + 1vw, 1.9rem)"
    fontWeight: 400
    lineHeight: 1.25
    letterSpacing: "0.03em"
  title-sm:
    fontFamily: "Patrick Hand, Comic Neue, cursive"
    fontSize: "1.5rem"
    fontWeight: 400
    lineHeight: 1.2
    letterSpacing: "0.04em"
  label:
    fontFamily: "Patrick Hand, Comic Neue, cursive"
    fontSize: "1.15rem"
    fontWeight: 400
    lineHeight: 1.25
    letterSpacing: "0.06em"
  body:
    fontFamily: "Atkinson Hyperlegible Next, system-ui, sans-serif"
    fontSize: "17px"
    fontWeight: 400
    lineHeight: 1.6
  body-sm:
    fontFamily: "Atkinson Hyperlegible Next, system-ui, sans-serif"
    fontSize: "0.8rem"
    fontWeight: 400
    lineHeight: 1.5
  mono:
    fontFamily: "JetBrains Mono, ui-monospace, monospace"
    fontSize: "0.86rem"
    fontWeight: 400
    lineHeight: 1.55
    fontFeature: "'liga' 0, 'calt' 0"
rounded:
  chip: "3px"
  sm: "4px"
  md: "6px"
  round: "50%"
spacing:
  xs: "0.5rem"
  sm: "0.75rem"
  md: "1rem"
  lg: "1.5rem"
  rule: "32px"
  bar: "64px"
components:
  button-primary:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.inlay-white}"
    typography: "{typography.label}"
    rounded: "{rounded.sm}"
    padding: "0.4rem 1.1rem"
    height: "44px"
  button-primary-hover:
    backgroundColor: "{colors.ink-deep}"
  button-primary-disabled:
    backgroundColor: "{colors.inlay-white}"
    textColor: "{colors.pencil-text}"
  button-secondary:
    backgroundColor: "{colors.inlay-white}"
    textColor: "{colors.ink}"
    typography: "{typography.label}"
    rounded: "{rounded.sm}"
    padding: "0.4rem 1.1rem"
    height: "44px"
  button-secondary-hover:
    backgroundColor: "{colors.ink-wash}"
  button-secondary-active:
    backgroundColor: "{colors.red-wash}"
    textColor: "{colors.stripe-red}"
  button-icon:
    textColor: "{colors.ink-2}"
    rounded: "{rounded.sm}"
    size: "40px"
  button-icon-pressed:
    backgroundColor: "{colors.red-wash}"
    textColor: "{colors.stripe-red}"
  input:
    backgroundColor: "{colors.inlay-white}"
    textColor: "{colors.ink-body}"
    typography: "{typography.body}"
    rounded: "{rounded.sm}"
    padding: "0.55rem 0.75rem"
    height: "44px"
  cite:
    backgroundColor: "{colors.inlay-white}"
    textColor: "{colors.stripe-red}"
    rounded: "{rounded.chip}"
    padding: "0 0.3em"
  cite-active:
    backgroundColor: "{colors.stripe-red}"
    textColor: "{colors.inlay-white}"
  track:
    textColor: "{colors.ink-body}"
    padding: "0.5rem 0.25rem"
  track-active:
    backgroundColor: "{colors.ink-wash}"
  code-plate:
    backgroundColor: "{colors.code-plate}"
    textColor: "{colors.ink-body}"
    typography: "{typography.mono}"
    rounded: "{rounded.sm}"
    padding: "0.9rem 1rem"
  composer:
    backgroundColor: "{colors.inlay-white}"
    rounded: "{rounded.md}"
    padding: "0.5rem 0.5rem 0.5rem 0.9rem"
  notice:
    backgroundColor: "{colors.red-wash}"
    textColor: "{colors.red-deep}"
    rounded: "{rounded.sm}"
    padding: "0.8rem 1rem"
---

# Design System: TechRAG Assistant

## Overview

**Creative North Star: "The Cassette J-Card"**

The whole app is a cassette inlay filled in with a ballpoint pen. The conversation is side A, the sources behind each answer are the side B tracklist, and every conversation is a tape label in the flap. Everything is drawn in one blue ink on inlay white; the only other color is the brand stripe's red, which marks what is live: the active tape, the citations, the stripe itself, focus and errors.

Density is quiet and readable. Chrome is lettered in hand-drawn block caps, but the answer, which is long technical prose with code, is set in a highly legible sans at 17px and capped at 68ch. Reading comfort beats lettering whenever they disagree. Structure comes from 1.5px pen borders and printed rules, not from fills or shadows; the surface stays flat, like card stock.

The world refuses the grey-sidebar chat with source cards: sources are never cards, they are a numbered tracklist with right-aligned line ranges.

**Key Characteristics:**
- One blue ink family on inlay white; red only for what is live.
- Patrick Hand block caps for every label, heading, button, track number and counter.
- Atkinson Hyperlegible Next for reading; JetBrains Mono only for code and paths, ligatures off.
- 1.5px ballpoint borders carry the structure; surfaces are flat.
- Printed 32px rules appear only on empty fields.
- Signature: the Lado B tracklist paired with red cite chips, plus spinning reels and a tape counter while streaming.

## Colors

One ballpoint blue in several pressures on an off-white inlay, with a single printed red.

### Primary
- **Ballpoint Blue** (ink): UI ink. Borders, headings, labels, the primary button fill, links, strong text.
- **Pressed Ballpoint** (ink-deep): primary button hover only.
- **Long-Text Ink** (ink-body): body copy, answer prose, file paths, input text. A shade darker than the UI ink so long reading stays calm.
- **Light-Pressure Ink** (ink-2): secondary text such as metadata, hints, status lines, tape labels and directory prefixes in paths (5.6:1 on paper).
- **Faded Ink** (ink-faded): hairline borders on code plates, the tape counter and hovered tape labels, and the scrollbar thumb. Use it for borders and large text only.

### Secondary
- **Brand-Stripe Red** (stripe-red): the double stripe, cite chips, the active tape's side letter and corner marks, the active track number and underline, focus rings, the text caret, the streaming caret, error borders, and pressed or current toggles.
- **Deep Red** (red-deep): text inside error notices.
- **Red Wash** (red-wash): the fill behind error notices and pressed or current toggles.

### Neutral
- **Inlay White** (inlay-white): every working surface, including panels, inputs, buttons and the j-card.
- **Shelf** (shelf): the page behind the j-card on the login screen; the shelf the cassette sits on.
- **Printed Rule** (printed-rule): row dividers in tracklists and tables, plus the ruled lines on empty fields.
- **Code Plate** (code-plate): background for inline code and code blocks.
- **Ink Wash** (ink-wash): hover and active-row fill, and the avatar placeholder.
- **Pencil** (pencil): strokes for tentative or disabled controls. Never text.
- **Legible Pencil** (pencil-text): tentative text, such as placeholders, disabled labels, relevance scores and empty-list notes.

### Named Rules
**The Brand-Stripe Rule.** Red marks only what is live or must be noticed: the stripe, citations, the active tape or track, focus, the caret and errors. It never decorates.

**The One Ink Rule.** All text and strokes come from the blue ink family or pencil. There is no black and no neutral grey text other than the legible pencil.

**The Pencil Rule.** Disabled and pending states are drawn in pencil: a pencil outline with pencil-text on inlay white, never a filled grey block.

## Typography

**Display Font:** Patrick Hand (with Comic Neue, cursive)
**Body Font:** Atkinson Hyperlegible Next (with system-ui, sans-serif)
**Label/Mono Font:** JetBrains Mono (with ui-monospace, monospace), for code and paths only

**Character:** Hand-printed block caps, like a label written on the inlay, over a plain, legible reading face. The lettering names things and the sans explains them.

### Hierarchy
- **Display** (400, clamp(3rem, 2rem + 4.5vw, 5.75rem), 0.95, uppercase): the product name on the j-card front. Used once.
- **Headline** (400, clamp(2.2rem, 1.6rem + 2.4vw, 3.6rem), 1.05, uppercase, max 14ch): the empty-state prompt.
- **Title** (400, clamp(1.45rem, 1.2rem + 1vw, 1.9rem), 1.25, uppercase): each question, as the side A heading, ruled underneath with a pen line.
- **Title-sm** (400, 1.35 to 1.6rem, uppercase): the flap title, the top bar title, the tracklist head, and answer h1 to h3 (1.6, 1.4 and 1.2rem).
- **Label** (400, 1.05 to 1.2rem, 0.04 to 0.06em, uppercase): buttons, field labels, tape names, track numbers, line ranges and the counter.
- **Body** (400 and 700, 17px, 1.6, max 68ch in answers): answers, descriptions and inputs.
- **Body-sm** (0.75 to 0.95rem): metadata, hints, statuses and relevance scores.
- **Mono** (0.8 to 0.86rem, 1.55, ligatures and contextual alternates off): inline code, code blocks, file paths and source excerpts.

### Named Rules
**The Lettered Label Rule.** Patrick Hand is always uppercase and always short: headings, labels, numbers and buttons. It never sets a paragraph.

**The Reading Wins Rule.** Answer prose is Atkinson at 17px/1.6 within 68ch. Never letter an answer.

**The Literal Code Rule.** Mono appears only where the user reads code or a path, with ligatures off, so `===` shows as three characters.

## Layout

On desktop the app shell is a three-column grid: a 64px spine, a 300px flap (the tape list), and a fluid main area. The spine carries the deck mark, the stripe and vertical TECHRAG lettering. Inside the main area, the reading column is centered at max 820px with 2.25rem 1.5rem padding. Answers cap at 68ch. The composer is pinned below the scroll area at the same 820px width.

The top bar and the spine mark are both 64px tall, so the red stripe runs as one continuous line across the spine and the main area. Turns are separated by 3rem. Inside components, spacing steps through 0.5, 0.75, 1 and 1.5rem.

At 860px and below, the spine is hidden and the flap becomes a fixed drawer (min(320px, 86vw)) that slides in over a blue scrim. The repo selector wraps to a full-width row, the column padding drops to 1.5rem 1rem, and the composer hint is hidden. The login j-card collapses to one column, with the inside panel stacked under the front.

The login is a j-card of up to 1120px, centered on the shelf color. Its columns are the 64px spine, the front (1.15fr) and the inside (1fr).

**The Empty Field Ruling Rule.** Printed 32px rules (1px printed-rule lines) fill only empty space: the flap below the tape rows and the foot of the login's inside panel. They never run behind the answer column or any text.

## Elevation & Depth

The system is flat card stock. Depth comes from 1.5px pen borders, ink-wash fills and printed rules. There are exactly two shadows, both physical: the j-card lifting off the shelf on the login screen, and the flap drawer when it is open on mobile.

### Shadow Vocabulary
- **Lifted J-Card** (`box-shadow: 0 18px 40px -18px rgb(23 44 107 / 0.35)`): the login j-card only.
- **Open Flap** (`box-shadow: 12px 0 30px -12px rgb(23 44 107 / 0.35)`): the mobile drawer while it is open.
- **Scrim** (`background: rgb(23 44 107 / 0.25)`): behind the open drawer.

### Named Rules
**The Flat Inlay Rule.** Nothing else casts a shadow. Focus and hover are shown with ink or red strokes and washes, never with glow. The composer's focus is a red border, not a shadow.

## Shapes

Corners are slight, like die-cut card. Chips (cites, inline code, the counter) use 3px. Buttons, inputs, tape labels, code plates and notices use 4px. The composer uses 6px. The avatar is the only circle. The j-card itself is square-cornered.

Every structural line is the 1.5px ballpoint stroke ("pen"). Printed-rule hairlines (1px) divide rows, and faded-ink hairlines (1px) frame code plates. Heavier marks are reserved for two places: the 3px ink rule under the display title, and the stripe, which is two 2px red bands 7px apart.

## Components

### Buttons
Lettered and inked: Patrick Hand caps (1.15rem, 0.06em) inside a 1.5px pen border.
- **Shape:** gently squared (4px), min height 44px.
- **Primary:** an ink fill with inlay-white lettering, for New tape, Send and Sign in with GitHub. Hovering deepens the ink, and pressing nudges the button down 1px.
- **Secondary:** inlay white with ink lettering and a pen border. Hovering fills it with ink wash. When it is the current view (for example the Record tape button in the flap foot), it switches to a red border, red text and the red wash.
- **Quiet:** borderless and transparent, min height 36px, filling with ink wash on hover.
- **Icon:** 40px square and transparent, drawn in ink-2. When pressed (for example a feedback thumb), it gets a red stroke, red icon and red wash.
- **Disabled:** drawn in pencil, following the Pencil Rule.
- **Focus:** a 2px red outline with a 2px offset, everywhere.

### Chips (Cite)
- **Style:** a red 1.5px outline on inlay white, with red Patrick Hand numerals (01, 02...) at 0.9em with tabular figures.
- **State:** on hover, or when its track is active, the chip fills solid red with inlay-white numerals. Each cite is linked to its track: activating one marks the other.

### Inputs / Fields
- **Style:** a pen border, 4px corners, inlay white and ink-body text, min height 44px. Placeholders are in legible pencil. Labels sit above in Patrick Hand caps at 1.05rem.
- **Select:** a pen border with a custom ink chevron, set in Patrick Hand.
- **Focus:** the global red outline.

### Composer
A pen-bordered box (6px corners) holding an auto-growing textarea (44 to 200px) and the primary Send button. On focus-within, the border turns red with no shadow. The caret is red. A small ink-2 hint sits right-aligned beneath it on desktop.

### Navigation (Flap and Tape Labels)
- Each conversation is a tape label: a small header (the side letter, the repo and the date, in Patrick Hand caps 0.95rem, ink-2) over the question in Patrick Hand caps at 1.2rem, clamped to two lines.
- **Hover:** a faded-ink outline.
- **Current:** a full pen border, a red side letter, and three red tally marks at the top-right corner.
- **Delete:** a quiet icon that appears on hover or focus.
- **Mobile:** the flap becomes the drawer described in Layout.

### Code Plate
The code-plate fill with a 1px faded-ink border and 4px corners, in mono at 0.85rem/1.55 with ligatures off. Inline code is the same plate color without a border, at 3px.

### Lado B Tracklist (signature)
The sources under every answer.
- **Head:** "LADO B · FUENTES" in Patrick Hand caps at 1.35rem, underlined in red (2px, offset 5px), with the track count right-aligned. A pen rule sits beneath.
- **Rows:** a three-column grid (2.4rem, 1fr, auto) with printed-rule dividers. Columns hold the track number (Patrick Hand), the path in mono (ink-2 directory, ink-body file), and a right-aligned line range "L 96–112" in Patrick Hand with the relevance score below it in small legible pencil.
- **Active:** an ink-wash row, a red number, and the file name underlined in red.
- **Expanded:** shows the excerpt on a code plate (max 320px tall), indented to the path column, with line numbers in faded ink.
- **Empty state:** the same head is reused as "LADO A · PARA EMPEZAR", listing suggested questions as tracks.

### Deck and Counter (streaming)
An ink-drawn cassette SVG (40 by 26) with a red top stripe. Its two reels spin linearly every 1.6s while an answer streams. Beside it, a tape counter shows the token count in Patrick Hand (0.08em, tabular figures) inside a 1px faded-ink, 3px-corner frame. A blinking red block caret trails the streaming text. Motion uses cubic-bezier(0.16, 1, 0.3, 1) for state transitions (140 to 260ms) and is cut to near zero when reduced motion is preferred.

### Notice
An error notice: a 1.5px red border, red wash, deep-red text, and a red alert icon.

## Do's and Don'ts

### Do:
- **Do** draw structure with the 1.5px ink pen border and divide rows with 1px printed rules.
- **Do** keep red for live and attention states only: the stripe, cites, the active tape or track, focus, the caret and errors.
- **Do** letter every label, heading, button and number in uppercase Patrick Hand, and set all reading text in Atkinson at 17px/1.6 within 68ch.
- **Do** render sources as a numbered tracklist with right-aligned line ranges, paired with red cite chips in the answer.
- **Do** run the stripe at the 64px line so it reads as one band across the spine and the top bar.
- **Do** fill empty space, and only empty space, with the 32px printed ruling.
- **Do** show disabled and pending states in pencil (outline plus pencil-text), never as a grey fill.

### Don't:
- **Don't** render sources as cards, or put the chat in a grey sidebar.
- **Don't** use red to decorate, or as a second accent for headings.
- **Don't** run the ruled lines behind answers, code or any text.
- **Don't** add shadows beyond the lifted j-card and the open flap; focus is a red stroke, not a glow.
- **Don't** set paragraphs in Patrick Hand, or use mono for UI labels.
- **Don't** enable ligatures in code or paths.
- **Don't** use pencil (#a6a6a6) for text, or faded ink for small text.
