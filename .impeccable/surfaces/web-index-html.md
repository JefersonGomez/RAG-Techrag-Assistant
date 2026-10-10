---
version: 1
slug: "web-index-html"
primary_target: "web/index.html"
related_targets: []
---

# Surface: TechRAG chat app (web/)

Scope: the whole web app: GitHub sign-in screen, chat (conversations, repo filter, streamed answers with sources, feedback), admin ingest panel. Mode: Operate.

Audience/job: portfolio visitors (recruiters, devs) and the owner ask questions about indexed repos and check where each answer comes from. Owner (admin) also indexes repos.

Constraints: Spanish UI; sign-in with GitHub required to chat; standard chat controls (sidebar, composer, buttons, inputs); answers are long technical text with code, so reading comfort wins over lettering.

Chosen direction: Cassette j-card (user adopted it over the assigned direction).

Memorable moment: the sources of every answer arrive as a mixtape tracklist.

## Direction contract

THESIS: Every answer is a mixtape you can audit: the conversation is side A, its sources are the side B tracklist, file by file with exact line ranges. Refuses the grey-sidebar chat with source cards.

OWN-WORLD: Ballpoint blue #1E3A8A on lined inlay white #FCFBF7, faded blue #6B86C5 for secondary ink, pencil gray #A6A6A6 only for tentative/pending, brand-stripe red #D32F2F only for active state, citations and the stripe. Hand-lettered block caps (Patrick Hand) for headings, labels, tracklists; Atkinson Hyperlegible Next for answer body; JetBrains Mono only for code. Ruled lines, 1.5px ballpoint borders, no shadows except the folded flap.

STORY: Visitor signs in with GitHub, picks a tape (repo), asks; the answer streams in ink, the tracklist of sources fills beneath with file, line range and relevance; they trust it because every claim points at a track.

FIRST VIEWPORT: Left spine rail (264px): vertical TECHRAG lettering + red stripe, "Nueva cinta" button, repo selector, conversation list as tape labels. Main: question as side A heading, answer column 68ch, composer pinned bottom. Sources: SIDE B tracklist directly under each answer.

FORM: Cassette j-card, from the challenger catalog (vernacular-ephemera-cassette-j-card), adopted by the user; seed key 0f8ce567. Signature interaction: hovering/focusing [N] in the answer underlines track N in red pen and vice versa; streaming shows a tape-counter of tokens.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
