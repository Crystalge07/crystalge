# crystal's portfolio — build handoff

Build my personal portfolio site from this design. `reference/Stipple.dc.html` is the prototype from a design tool. It uses a custom runtime (`<x-dc>`, `{{ holes }}`, `sc-for`, `sc-if`, `class Component extends DCLogic`), so **don't copy that runtime**. Treat it as the source of truth for markup, styles, copy and canvas logic, and port it to a normal stack (Next.js + React + TypeScript recommended, or plain HTML/JS if simpler). The canvas drawing code in `draw()`, `build()` and `buildImage()` can be ported almost line for line.

## Look
- Background `#F2ECDF` (cream). Ink `#1D2340`. Muted text `#6A6578`. Dividers `rgba(29,35,64,0.14)`. Link hover `#4B3F8F`.
- Fonts (Google Fonts): **Instrument Serif** (name, quote, detail-sheet titles) and **Newsreader** (everything else, 17–19px, line-height ~1.6).
- Single centered column, max-width 760px, all copy lowercase.

## Sections, top to bottom
1. **Top bar:** "crystal ge" (italic) on the left; nav on the right: work · projects · about · resume ↗ (anchor links + resume PDF).
2. **Floating name:** "crystal ge" in Instrument Serif, clamp(64px, 12vw, 120px). Each letter is its own span:
   - On load, each letter tumbles in from a random offset (±260px x, ±130px y, ±110° rotation) over 1.6s, staggered 60ms (`arrive` keyframes using the `translate`/`rotate` properties, fill-mode `backwards`).
   - Then it drifts forever on its own orbit (`drift` keyframes on `transform`, 4.2–6.6s each, different negative delays).
   - On hover: lifts 24px and tilts 14° with a springy cubic-bezier(.2,1.6,.4,1).
   - The "c" and "g" are italic.
3. Subtitle: "cs at western · ai solutions engineer at intercept".
4. **Hero art (the crystallize effect):** a canvas over `public/prince.gif` (500×290, 22 frames), aspect-ratio 500/290.
   - Sample the first GIF frame on an offscreen canvas. Place dots on a jittered ~3.6px grid. Keep each dot with probability `(1 - luminance)^0.8 * 0.95 + 0.04`, times an oval edge fade. Radius `0.9 + (1-L)*1.1`, colour = that pixel bucketed to steps of 24. Batch drawing into one Path2D per colour.
   - Each dot starts scattered (random direction, 18–64px away) and drifts gently. A per-dot `cr` value from 0 to 1 eases it home (smoothstep).
   - Cursor/touch within 130px adds `(1 - d/130) * 0.5` to `cr` per frame.
   - Until the picture is fully formed, every dot loses 0.006 `cr` per frame, so unattended areas slowly dissolve back into the cloud.
   - When sampled average `cr` > 0.3, lock it ("done"): every dot settles at +0.05 per frame. After 1.4s, crossfade (1.4s) the canvas out and the real animated GIF in.
   - The GIF has a soft oval mask so it melts into the cream: `mask-image: radial-gradient(ellipse 50% 50% at 50% 50%, #000 58%, transparent 100%)`.
   - Caption "move across it to crystallize" fades out once it's done.
5. **Quote:** *"what is essential is invisible to the eye."*, cite *le petit prince* (Instrument Serif italic, ~34px).
6. **Work:** rows. Each row is a full-width `<button>`: title, org + one-line description (muted) on the left; dates + "→" on the right. Clicking opens the detail sheet.
7. **Projects:** a "window pane" grid, `repeat(auto-fit, minmax(280px, 1fr))`, gap 28/24. Each pane is a `<button>`: a 16:10 screenshot (dotted placeholder until real images exist), then "title · tag" and a one-liner. It lifts 4px on hover. Clicking opens the detail sheet.
8. **About:** a paragraph plus email · github · linkedin.
9. **Footer:** "richmond hill, on · {live Toronto time}".

## Detail sheet (modal)
A fixed overlay with a dim backdrop `rgba(29,35,64,.32)` (clicking it closes) and a cream panel (max-width 720px, max-height 88vh, scrolls). It shows meta (org · dates, or the tag), a big Instrument Serif title, a screenshot (projects only), bullets, and an optional link. Add Esc to close and focus trapping (the prototype skips these).

## Data
All work and project content is in the `work` and `projects` arrays in `renderVals()` in the reference file. Move it to a `content.ts`. Anything in [brackets] is a placeholder I still need to fill in.

## Must-haves
- Responsive: the grid goes to one column on phones, and touch dragging also crystallizes.
- Respect `prefers-reduced-motion`: skip the tumble/drift and show the GIF straight away.
- Keep it fast: build the dots once per resize, and draw with one Path2D per colour bucket.
