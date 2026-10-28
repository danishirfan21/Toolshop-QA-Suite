# Exploratory session: <title>

Fill this in yourself during a real manual session. Do not copy findings from `docs/exploratory-notes.md`: those came from scripted probing by Claude Code, not from a manual session. Leave a field empty rather than guess.

| Field | Value |
| --- | --- |
| Tester | |
| Date and start time | |
| Timebox | minutes |
| Session ID | EX-YYYYMMDD-NN |

## Session objective

Explore <area> with <resources or technique> to discover <information>.

## Environment

| Item | Value |
| --- | --- |
| Target | CI-hosted at the pinned TOOLSHOP_REF, or the public demo |
| URL | |
| Browser and version | |
| Device or viewport (real device, or emulation) | |
| Account used | seeded customer, seeded admin, guest, or a throwaway registered user |
| Build or commit of this repo | |

## Feature or risk area

Area (AUTH, CART, CAT, CHK) and the risk behind it, using the priorities in `docs/test-plan.md`.

## Preconditions

-

## Steps explored (time stamped)

| Time | Step | Data used |
| --- | --- | --- |
| | | |

## Observations

Facts only: what you saw. Put interpretation in the follow-up section.

| # | Observation | Evidence ref |
| --- | --- | --- |
| 1 | | |

## Expected versus actual

| # | Expected (and where that expectation comes from: upstream doc, app-recon, or your own judgment) | Actual | Match? |
| --- | --- | --- | --- |
| 1 | | | |

## Evidence references

Screenshot, screen recording, HAR or response body saved where? Use a path or link, one line per item.

-

## Severity assessment

Use the severity values in `docs/templates/bug-report.md`. State impact and how often you reproduced it (at least three tries before it counts as reproduced).

| Finding | Severity | Reproduced (n of m) | Reasoning |
| --- | --- | --- | --- |
| | | | |

## Questions

-

## Bugs found

| Bug ID | Title | Severity |
| --- | --- | --- |
| | | |

## Follow-up actions

- [ ] New or changed test case (ID)
- [ ] Bug report written from `docs/templates/bug-report.md`
- [ ] Update `docs/app-recon.md` if a behavior moved from UNKNOWN to known
- [ ] Automate, or record why it stays manual
