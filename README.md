# Carlos Miguel Ochia — QA Engineer Portfolio

Live: https://ochiacarlosmiguel.github.io/myPortfolio/

A static, dependency-free portfolio (plain HTML, CSS, and JavaScript — no build step).
Open `index.html` directly in a browser, or serve the folder with any static server.

## Project structure

```
index.html                 Page content + metadata (SEO, social preview, structured data)
favicon.svg / .png         Browser-tab icon ("CMO.")
apple-touch-icon.png       Home-screen icon

assets/
  css/                     Loaded in numeric order — later files may refine earlier ones
    01-tokens.css          Design tokens (colors, fonts, spacing) + light theme
    02-base.css            Reset, base typography, preloader, cursor, skip link
    03-nav.css             Floating nav, theme toggle, mobile menu
    04-buttons.css         Buttons + social icons
    05-hero.css            Hero, photo orb, stats, marquee
    06-sections.css        Section shells, reveal, spotlight
    07-about.css           About bento grid
    08-experience.css      Timeline + tabs
    09-skills.css          Chips, skills, proficiency, expertise cards
    10-projects.css        Project cards + Client QA Support case study
    11-certificates.css    Certificate cards, filters, full-size viewer
    12-contact-footer.css  Contact banner + footer
    13-overlays.css        Back-to-top, toast
    14-responsive.css      Breakpoints, reduced motion, print
    15-effects.css         Motion & effects layer (progress bar, glows, confetti…)
    16-playful.css         Optional fun layer (Bug Hunt, HUD, simulator…)
    17-motion.css          Scroll-driven animations, context cursor, dot nav

  js/                      Classic scripts, loaded in order (works from file:// too)
    core.js                window.CMO: helpers, ONE scroll loop, resize hub, ready lifecycle
    theme.js               Dark/light toggle (dark is default)
    hero.js                Name animation, role rotator, particle network, orb parallax
    preloader.js           Loading screen → CMO.setReady()
    nav.js                 Nav state, active pill, progress bar, back-to-top, mobile menu
    scroll-fx.js           Reveal-on-scroll, word scrub, timeline line, marquee lean
    interactions.js        Custom cursor, glow, magnetic, spotlight, tilt, ripple
    components.js          Tabs, filters, details toggles, copy email, year
    certificates.js        Certificate filters + full-size viewer
    playful.js             Optional fun layer (remove its <script> + CSS to disable)
    motion.js              Context cursor labels, section flash, side dot nav

  img/
    profile.jpg            Hero photo
    og-image.jpg           1200×630 link-preview card
    certs/                 Full-size certificates (phone photos cleaned to scans)
    certs/thumbs/          Card thumbnails

  docs/
    Carlos-Miguel-Ochia-Resume.pdf

_archive/                  Not used by the site — kept for reference (safe to exclude from deploys)
```

## Conventions

- **One scroll listener.** Modules register with `CMO.onScroll((y, max) => …)`; the core
  runs them once per animation frame. Resize handlers use `CMO.onResize(fn)` (debounced).
- **Ready lifecycle.** Anything that should start after the loading screen uses
  `CMO.whenReady(fn)` (runs immediately if the page is already ready).
- **Progressive enhancement.** Every effect is optional: reduced-motion users get a calm
  version, touch devices skip mouse-only effects, and browsers without scroll-driven
  animations simply show the static layout.
- **Theme.** Colors come from CSS variables in `01-tokens.css`; light mode overrides them
  under `[data-theme="light"]`.

## Updating content

Text, links, dates, and certificates all live in `index.html`. To add a certificate,
put the full image in `assets/img/certs/`, a ~720px-wide thumbnail in
`assets/img/certs/thumbs/`, and copy an existing `<button class="cert">` block.
