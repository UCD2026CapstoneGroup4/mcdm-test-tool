═══════════════════════════════════════════════════════════════════════
  DISC-MCDM Decision Support Tool
  UCD Michael Smurfit Graduate Business School
  Capstone Project 26 — MSc Business Analytics 2025/2026
  Academic Supervisor: Assoc. Prof. Peter Keenan
═══════════════════════════════════════════════════════════════════════

  LIVE WEB VERSION (no download required)
  ────────────────────────────────────────
  https://ucd2026capstonegroup4.github.io/disc-mcdm-tool_1/

  The tool is publicly hosted on GitHub Pages. Open the URL above
  in any modern browser to use it instantly — no installation,
  no login, no download needed.

  To use the downloaded local copy instead, see "HOW TO RUN" below.

═══════════════════════════════════════════════════════════════════════

WHAT IS THIS?
─────────────
A modern browser-based implementation of the DISC Multicriteria
Decision Making (MCDM) tool, grounded in Brugha's Nomological
framework. Supports DISCUS (Utility Scoring) and DISCRIM (Relative
Intensity Measurement) scoring modes with direct criterion weighting,
session persistence (save/load via JSON), and version history.

Academic references:
  · Brugha, C.M. (2004). Structure of multi-criteria decision-making.
    Journal of the Operational Research Society, 55(11), 1156–1168.
  · O'Brien, D.B. & Brugha, C.M. (2010). Adapting and refining in
    multi-criteria decision-making. JORS, 61(5), 756–767.
  · Kakeneno, J.R. & Brugha, C.M. (2017). Usability of Nomology-based
    methodologies. CEJOR, 25, 393–415.


═══════════════════════════════════════════════════════════════════════
  HOW TO RUN — ANY OPERATING SYSTEM
═══════════════════════════════════════════════════════════════════════

NO installation required. NO server required. NO internet required
(after first load). Works on Windows, macOS, Linux, iOS, and Android.

──────────────────────────────────────────────
METHOD 1 — DOUBLE-CLICK (Simplest, Recommended)
──────────────────────────────────────────────
1. Unzip the folder (disc-mcdm-project.zip) to any location.
2. Open the folder "disc-mcdm-project".
3. Double-click "index.html".
4. The tool opens in your default browser. Done.

Tip: If double-click opens a text editor instead, right-click
"index.html" → "Open With" → choose your browser (Chrome, Edge,
Firefox, or Safari).


──────────────────────────────────────────────
METHOD 2 — DRAG INTO BROWSER
──────────────────────────────────────────────
1. Open your browser (Chrome, Edge, Firefox, or Safari).
2. Drag "index.html" from the folder into the browser window.
   OR press Ctrl+O (Windows/Linux) / Cmd+O (macOS) → browse to
   index.html → click Open.
3. The tool loads immediately.


──────────────────────────────────────────────
METHOD 3 — LOCAL SERVER (Optional, for developers)
──────────────────────────────────────────────
If you prefer to serve the files (e.g. to test on another device on
the same network), any of these one-liners work:

  Python 3 (installed on macOS/Linux by default):
    cd disc-mcdm-project
    python3 -m http.server 8080
  → Open http://localhost:8080 in your browser.

  Node.js (if installed):
    npx serve disc-mcdm-project
  → Follow the URL shown in the terminal.

  VS Code users:
    Install the "Live Server" extension → right-click index.html
    → "Open with Live Server".


══════════════════════════════════════════════
  BROWSER COMPATIBILITY
══════════════════════════════════════════════

Tested and supported:
  ✓ Google Chrome         88+
  ✓ Microsoft Edge        88+
  ✓ Mozilla Firefox       85+
  ✓ Apple Safari          14+  (macOS and iOS)
  ✓ Samsung Internet      13+  (Android)

Minimum requirement: any browser released after January 2021.
Internet Explorer is NOT supported (ES6 required).

Google Fonts (Spectral, Manrope, DM Mono) load from the internet
on first use. If offline, the tool falls back to system fonts
(Georgia, sans-serif, monospace) — fully functional either way.


══════════════════════════════════════════════
  FILE STRUCTURE
══════════════════════════════════════════════

disc-mcdm-project/
│
├── index.html            Main entry point — open this in a browser
│
├── css/
│   ├── tokens.css        Design tokens (colours, spacing, fonts)
│   ├── base.css          Reset, typography, animations
│   ├── layout.css        Header, sidebar, main content area
│   ├── components.css    Cards, buttons, forms, modals, results
│   ├── steps.css         Step-specific UI and breakdown table
│   └── responsive.css    Mobile, tablet, and print styles
│
├── js/
│   ├── state.js          Application state — single source of truth
│   ├── compute.js        DISCUS and DISCRIM computation engine
│   ├── templates.js      Pre-built decision problem templates
│   ├── session.js        Save/load JSON, version history, CSV export
│   ├── ui.js             DOM rendering for all 4 steps
│   └── init.js           Bootstrap — keyboard shortcuts, first render
│
└── README.txt            This file


══════════════════════════════════════════════
  HOW TO USE THE TOOL
══════════════════════════════════════════════

STEP 1 — SETUP
  · Enter 2–15 alternatives (the options you are comparing).
  · Add criteria and assign each to a Nomological tier:
      Somatic   = Technical / objective / measurable
      Psychic   = Contextual / relational / situational
      Pneumatic = Values / ethical / strategic intent
  · Choose scoring mode:
      DISCUS  = Score each alternative 0–100 per criterion (absolute)
      DISCRIM = Allocate 100 points across all alternatives per
                criterion (relative) — scores must sum to basis
  · Or load a Quick-Start Template to get started immediately.

STEP 2 — WEIGHTS
  · Set Tier Weights (how important is Somatic vs Psychic vs Pneumatic)
  · Set Criterion Weights within each tier
  · All weight groups must sum to 1.0 (green indicator confirms this)
  · The criteria tree updates live showing global weights

STEP 3 — SCORE
  · DISCUS: enter a score 0–100 for each alternative on each criterion
  · DISCRIM: allocate exactly 100 points across all alternatives per
    criterion (the row sum indicator shows if you are on target)
  · "Fill sample scores" populates all cells for demonstration

STEP 4 — RESULTS
  · Rankings with score bars and numerical values
  · Bar chart visualisation
  · Sensitivity analysis: vary one criterion weight, watch rank changes
  · Weighted breakdown table showing each criterion's contribution
  · Refinement panel to modify alternatives, weights, or scores
    (auto-saves a checkpoint before each refinement)


══════════════════════════════════════════════
  SAVING AND LOADING SESSIONS
══════════════════════════════════════════════

SAVING A SESSION
  · Click "💾 Save" in the header at any step.
  · Give the session a name (e.g. "Phase 1 — Shortlist of 6").
  · Add an optional version note.
  · Click "Download JSON" — a .json file downloads to your computer.
  · Filename format: disc-mcdm_{name}_v{n}_{date}.json

LOADING A SAVED SESSION
  · Click "📂 Load" in the header.
  · Select your previously saved .json file.
  · The tool restores exactly where you left off — same step, same
    alternatives, same weights, same scores.

VERSION HISTORY (sidebar)
  · Every save and every refinement action creates a version entry
    in the left sidebar.
  · Click any version card to restore that exact state.
  · Up to 30 versions are stored automatically in your browser's
    localStorage (persists across sessions on the same browser).
  · To share a session with a teammate, send them the .json file.
    They load it on their machine with the "📂 Load" button.

KEYBOARD SHORTCUTS
  · Ctrl/Cmd + S   → Open Save modal
  · Escape          → Close modal

EXPORTING RESULTS
  · Click "⬇ Export" (visible on Step 4) to download a CSV
    containing rankings, criterion weights, and score breakdown.
  · Click "🖨 Print" to print or save as PDF using the browser.


══════════════════════════════════════════════
  TROUBLESHOOTING
══════════════════════════════════════════════

Tool doesn't open:
  → Make sure all files are in the same folder structure as delivered.
  → Do not move index.html out of the disc-mcdm-project folder.

Fonts look different:
  → Normal when offline. The tool falls back to system fonts.
  → Connect to the internet to load Google Fonts.

Session not saving across browser sessions:
  → The sidebar history uses localStorage. Some browsers clear this
    in private/incognito mode. Always download the .json file for
    permanent storage.

Load button doesn't work:
  → Make sure you are selecting a .json file previously saved by
    this tool. Do not try to load CSV files here.

RIM scores don't add up:
  → DISCRIM requires scores at each criterion to sum to the basis
    (default 100). The "Sum" column turns green when correct.

Blank screen:
  → Open the browser's developer tools (F12 → Console) and check
    for errors. Most commonly caused by opening index.html while
    a file is missing from the css/ or js/ folders.


══════════════════════════════════════════════
  TECHNOLOGY STACK
══════════════════════════════════════════════

  HTML5          — Semantic markup, ARIA labels, file API
  CSS3           — Custom properties, Grid, Flexbox, media queries
  JavaScript     — Vanilla ES6+ (no frameworks, no build tools)
  Google Fonts   — Spectral (serif), Manrope (sans), DM Mono (mono)
                   Loaded via CDN; falls back gracefully offline.

  NO dependencies. NO npm. NO bundler. NO server.
  Open index.html. That's it.


══════════════════════════════════════════════
  TEAM
══════════════════════════════════════════════

  Group:          Project 26
  Supervisor:     Assoc. Prof. Peter Keenan, UCD Smurfit
  Programme:      MSc Business Analytics 2025/2026
  Members:        Nayeem · Waheed · Deepesh

═══════════════════════════════════════════════════════════════════════

────────────────────────────────────────────
UCD SMURFIT CAMPUS BACKGROUND IMAGE
────────────────────────────────────────────
The hero background is wired to a CSS variable so you can drop in your own
exact UCD Smurfit photo without touching layout code.

1. Add your image to:   ./assets/ucd-smurfit.jpg
2. Open:                ./css/tokens.css
3. Replace this line:
       --campus-img: url('https://images.unsplash.com/...');
   with:
       --campus-img: url('../assets/ucd-smurfit.jpg');
