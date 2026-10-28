---
description: Turn a user story into test cases using the repo template
argument-hint: <user story text>
---

You are helping design tests for this repo. The user story is:

$ARGUMENTS

Do the following.

1. Read `docs/app-recon.md`, `docs/test-plan.md`, `docs/templates/test-case.md`, the existing case files in `docs/test-cases/` for the story's area, and `docs/traceability.md`, so you do not duplicate a case or reuse an ID.
2. Write test cases for the story, numbering new IDs `TC-<AREA>-NNN` after the highest existing one (one unique ID per automated test), giving each a Priority from the risk table in `docs/test-plan.md`, each one using exactly the structure of `docs/templates/test-case.md`. Cover the happy path, validation and error cases, and role or permission cases where relevant.
3. For every case, set Automation to `Automate` or `Keep manual` and give a one line reason. Prefer automation for stable, repeatable checks. Keep manual for exploratory, visual, or rule-unclear cases.
4. Use only behavior confirmed in `docs/app-recon.md`. Where the recon does not confirm a behavior, write `UNKNOWN` as the expected result and add it to the open questions. Never invent data, endpoints, messages or business rules.
5. End with two lists: **Assumptions** (what you relied on, with the recon section) and **Open questions** (what must be answered before the UNKNOWN cases can be written).
6. If a case documents a known defect, link its `docs/bug-reports/` file and say whether the expectation comes from upstream docs or tester judgment.
7. Do not create or change files unless the user asks you to save the output.
