# Open Source Release Prep Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Prepare the repository so external users can understand, run, test, report issues, and consume a portable release.

**Architecture:** Keep Phase 6 as repository and documentation work only. Add GitHub-facing metadata, CI, issue templates, and release notes without changing runtime behavior or adding cloud/team scope.

**Tech Stack:** Markdown, GitHub Issue Forms, GitHub Actions, Node 20, Rust stable, Tauri 2, React, TypeScript, Vitest.

---

## File Structure

- Create `LICENSE`: MIT license text for open source publication.
- Create `CONTRIBUTING.md`: contributor workflow, test commands, data privacy rules, and code style boundaries.
- Create `CHANGELOG.md`: human-readable version history.
- Create `.github/workflows/ci.yml`: Windows CI for install, tests, frontend build, and Rust/Tauri crate check.
- Create `.github/ISSUE_TEMPLATE/bug_report.yml`: bug report form.
- Create `.github/ISSUE_TEMPLATE/feature_request.yml`: feature request form.
- Create `.github/ISSUE_TEMPLATE/experience_feedback.yml`: user experience feedback form.
- Create `.github/ISSUE_TEMPLATE/config.yml`: issue template chooser config.
- Create `docs/PROJECT_PHASE_6_OPEN_SOURCE.md`: Phase 6 scope, implementation state, boundaries, and verification.
- Create `docs/RELEASE_DRAFT_v0.2.0.md`: GitHub release draft and manual smoke checklist.
- Modify `README.md`: surface CI, open source docs, issue guidance, and release notes.
- Modify `AGENTS.md`: update handoff context after Phase 6.
- Modify `package.json`: add repository and license metadata.

## Tasks

### Task 1: Phase 6 Plan and Stage Document

**Files:**
- Create: `docs/superpowers/plans/2026-06-23-open-source-release-prep.md`
- Create: `docs/PROJECT_PHASE_6_OPEN_SOURCE.md`

- [ ] **Step 1: Write this implementation plan**

Create this file with Phase 6 scope, file structure, and task list.

- [ ] **Step 2: Write the Phase 6 stage document**

Create `docs/PROJECT_PHASE_6_OPEN_SOURCE.md` with goals, deliverables, boundaries, manual release process, and verification requirements.

- [ ] **Step 3: Verify docs render as plain Markdown**

Run: `git diff --check`

Expected: exit code 0.

### Task 2: Open Source Project Metadata

**Files:**
- Create: `LICENSE`
- Create: `CONTRIBUTING.md`
- Create: `CHANGELOG.md`
- Create: `docs/RELEASE_DRAFT_v0.2.0.md`
- Modify: `package.json`

- [ ] **Step 1: Add MIT license**

Use `Copyright (c) 2026 jsidfis`.

- [ ] **Step 2: Add contributor guide**

Document issue etiquette, local setup, required checks, privacy limits, and scope boundaries.

- [ ] **Step 3: Add changelog**

Record the current MVP portable release and Phase 6 repository prep.

- [ ] **Step 4: Add release draft**

Document portable zip asset, WebView2 prerequisite, no-source-code package boundary, and manual smoke checklist.

- [ ] **Step 5: Add package metadata**

Set `license`, `repository`, `bugs`, and `homepage` fields in `package.json`.

- [ ] **Step 6: Verify metadata edits**

Run: `npm.cmd run build`

Expected: TypeScript and Vite build exit code 0.

### Task 3: GitHub Feedback and CI

**Files:**
- Create: `.github/workflows/ci.yml`
- Create: `.github/ISSUE_TEMPLATE/bug_report.yml`
- Create: `.github/ISSUE_TEMPLATE/feature_request.yml`
- Create: `.github/ISSUE_TEMPLATE/experience_feedback.yml`
- Create: `.github/ISSUE_TEMPLATE/config.yml`

- [ ] **Step 1: Add Windows CI**

CI must run `npm ci`, `npm run test:run`, `npm run build`, and `cargo check --locked` in `src-tauri`.

- [ ] **Step 2: Add bug report form**

Require system version, app version, run mode, reproduction steps, expected behavior, actual behavior, and privacy confirmation.

- [ ] **Step 3: Add feature request form**

Ask for problem, proposed workflow, local-first impact, and non-goals.

- [ ] **Step 4: Add experience feedback form**

Ask for workflow stage, friction, useful parts, and optional screenshot notes without private data.

- [ ] **Step 5: Verify YAML files are present**

Run: `git status --short`

Expected: `.github/` files appear as new files.

### Task 4: README and Handoff Updates

**Files:**
- Modify: `README.md`
- Modify: `AGENTS.md`

- [ ] **Step 1: Update README**

Add CI badge, contributor links, release draft reference, issue guidance, and Phase 6 document link.

- [ ] **Step 2: Update AGENTS**

Add Phase 6 status, new files, and next recommended step.

- [ ] **Step 3: Run verification**

Run:

```powershell
npm.cmd run test:run
npm.cmd run build
git diff --check
```

Expected: all commands exit code 0.

- [ ] **Step 4: Commit and push**

Run:

```powershell
git add LICENSE CONTRIBUTING.md CHANGELOG.md package.json README.md AGENTS.md .github docs/PROJECT_PHASE_6_OPEN_SOURCE.md docs/RELEASE_DRAFT_v0.2.0.md docs/superpowers/plans/2026-06-23-open-source-release-prep.md
git commit -m "docs: prepare open source release"
git push origin codex/daily-plan-review-mvp:main
```

Expected: push updates `https://github.com/jsidfis/MVP`.
