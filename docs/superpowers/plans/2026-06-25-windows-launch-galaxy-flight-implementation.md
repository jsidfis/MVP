# Windows Launch and Galaxy Flight Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove the release console window and make galaxy routes accurately connect planets with stable varied curves and a compact exploration UFO.

**Architecture:** Keep the existing percentage-based galaxy layout and align the route SVG to the same full rectangular coordinate space. Move curve variation into the pure `galaxyLayout` domain function using a deterministic task-derived seed, and keep the UFO as lightweight inline SVG so no asset or rendering dependency is added.

**Tech Stack:** React 19, TypeScript, SVG, CSS, Vitest, Testing Library, Tauri 2, Rust.

---

### Task 1: Hide the Windows release console

**Files:**
- Modify: `src-tauri/src/main.rs`

- [ ] **Step 1: Add the release-only Windows GUI subsystem declaration**

Use the standard Tauri entry declaration:

```rust
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

fn main() {
    daily_plan_review_lib::run();
}
```

- [ ] **Step 2: Verify the native entry compiles**

Run:

```powershell
npm.cmd run tauri:check:gnu
```

Expected: command exits with code 0.

### Task 2: Generate stable varied route paths

**Files:**
- Modify: `src/domain/galaxyLayout.test.ts`
- Modify: `src/domain/galaxyLayout.ts`

- [ ] **Step 1: Write failing deterministic route tests**

Add tests that build the same layout twice and assert:

```ts
expect(first.routes.map((route) => route.path)).toEqual(
  second.routes.map((route) => route.path),
);
```

Add two tasks whose routes have equivalent geometry but different IDs and assert that their
control-point sections differ. Also parse each path and assert its `M` coordinates equal
`route.from` and its final coordinates equal `route.to`.

- [ ] **Step 2: Run the focused test and verify RED**

Run:

```powershell
npm.cmd run test:run -- src/domain/galaxyLayout.test.ts
```

Expected: the ID-based variation test fails because the current algorithm only uses route index.

- [ ] **Step 3: Implement deterministic seeded curve controls**

Change the call to:

```ts
path: buildRoutePath(from, to, task.id),
```

Add a small string hash and seeded fraction helper. Use the resulting values to vary control-point
progress, bend direction, and two perpendicular offsets while keeping the route inside a restrained
distance-based bend range.

- [ ] **Step 4: Run the focused test and verify GREEN**

Run:

```powershell
npm.cmd run test:run -- src/domain/galaxyLayout.test.ts
```

Expected: all galaxy layout tests pass.

### Task 3: Align SVG coordinates and render the UFO

**Files:**
- Modify: `src/views/GalaxyView.test.tsx`
- Modify: `src/views/GalaxyView.tsx`
- Modify: `src/styles.css`

- [ ] **Step 1: Write failing rendering tests**

Assert the route SVG has:

```tsx
expect(screen.getByLabelText('飞行轨迹').closest('svg')).toHaveAttribute(
  'preserveAspectRatio',
  'none',
);
```

Assert the current ship contains elements labelled or marked as:

```tsx
expect(screen.getByTestId('ufo-cabin')).toBeTruthy();
expect(screen.getByTestId('ufo-body')).toBeTruthy();
expect(screen.getByTestId('ufo-thruster')).toBeTruthy();
```

- [ ] **Step 2: Run the focused test and verify RED**

Run:

```powershell
npm.cmd run test:run -- src/views/GalaxyView.test.tsx
```

Expected: tests fail because the SVG scaling attribute and UFO parts are absent.

- [ ] **Step 3: Implement coordinate alignment and SVG UFO**

Set:

```tsx
<svg
  className="galaxy-routes"
  viewBox="0 0 100 100"
  preserveAspectRatio="none"
>
```

Replace the polygon with a compact grouped UFO made from ellipses, paths, and a thruster glow.
Keep `animateMotion`, `rotate="auto"`, the existing route path, and current accessibility label.
Replace the static CSS triangle with a small DOM/SVG UFO using the same visual language.

- [ ] **Step 4: Add restrained UFO styling**

Add scoped cabin, body, wing, and thruster styles. Keep route strokes non-scaling and preserve the
existing reduced-motion behavior.

- [ ] **Step 5: Run focused tests and verify GREEN**

Run:

```powershell
npm.cmd run test:run -- src/views/GalaxyView.test.tsx src/domain/galaxyLayout.test.ts
```

Expected: all selected tests pass.

### Task 4: Verify, package, and update the installed portable copy

**Files:**
- Modify if required by changed behavior: `AGENTS.md`
- Modify if required by changed behavior: `CHANGELOG.md`

- [ ] **Step 1: Run full automated verification**

Run:

```powershell
npm.cmd run test:run
npm.cmd run build
npm.cmd run tauri:check:gnu
git diff --check
```

Expected: all commands exit successfully.

- [ ] **Step 2: Build the portable release**

Run:

```powershell
npm.cmd run portable:build:gnu
```

Expected: `dist-portable/每日计划与复盘-v0.2.0-portable.zip` is regenerated.

- [ ] **Step 3: Inspect package contents**

Confirm the zip contains the executable and required runtime files, and does not contain:

```text
.git
node_modules
src
src-tauri
data/user.sqlite
```

- [ ] **Step 4: Replace the D drive executable**

After confirming the resolved target stays inside
`D:\daily plan\每日计划与复盘`, back up the current executable and replace it with the newly built
portable executable. Keep the existing desktop shortcut unchanged.

- [ ] **Step 5: Run manual smoke checks**

Double-click the desktop shortcut and confirm:

- no console window appears;
- the application remains open independently;
- routes meet planet centers in the rectangular galaxy map;
- route shapes remain stable after reopening;
- the UFO follows the active route.

