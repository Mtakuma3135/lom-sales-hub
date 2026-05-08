# Agent Prompt (Implementation Spec)

You are the implementation owner for this repo (Laravel + Inertia React + Tailwind).
Implement the following 13 tickets. Follow the global rules first.

## Global rules
- Never allow layout breakage or content overflowing outside a card/container.
  - For long text/URL/unbroken strings: use `overflow-wrap:anywhere` and `whitespace-pre-wrap`, and/or confine inside a scrollable container.
- Every user action must produce an immediate visible UI change (button state, badge, toast, or optimistic update). Do not rely on polling only.
- State of truth is the API response. For time/date, use `meta.server_time` and `meta.date` to avoid UTC/JST drift.
- Enforce permissions both in UI and API.
- Improve perceived performance with skeleton/placeholder + progressive rendering; heavy sync (e.g. GAS) should be async or user-triggered.
- Do not create new git branches; work on the current branch.

## Tickets

### T1 Home: Notices scrollable and shows all (newest first)
- Make the Home notices card vertically scrollable and able to display all notices (sorted newest first).

### T2 Lunch break timers: Home must move when Lunch screen starts timer
- Fix any remaining sync drift so Home timer always moves after start/stop/reset on LunchBreaks screen.
- Ensure both pages compute time based on server_time offset and query date based on server-provided date.
- Ensure event-driven refresh exists (start/stop/reset dispatch → Home refetch).

### T3 Home KPI: make “this month” impactful
- Redesign KPI section so contract rate is the hero (bigger, stronger contrast).
- Add a clear visual gauge/bar and a small delta indicator (mock is OK).
- Keep it stable and not noisy.

### T4 Home task list: scrollable list
- Make Home task list scrollable within its card (no page stretch).

### T5 Sales records calendar YYYY/MM/DD looks cramped
- Adjust date input width/spacing so it doesn’t look cramped; keep responsive.

### T6 TASK / MANAGEMENT
- Creating a request must immediately add to the list without manual reload.
- When a request is assigned to the current user, highlight it with a special style.
- Color-code statuses: pending vs in_progress (and others if present) consistently.

### T7 Task screen: task add is broken, “管理” always showing is ugly
- Fix task add functionality.
- Remove always-on “管理” clutter; move add/edit into a clean modal/drawer edit UI.

### T8 NOTICE / FEED enhancements
- Add “Save as draft” button (published_at null) in create/edit flows.
- Add admin-only delete button for notices (UI + API + policy).

### T9 PRODUCTS / CATALOG search doesn’t work
- Implement functional search (name/category/active) end-to-end.

### T10 Product edit: add missing fields
- Add editing for price/status/category etc. on product edit screen (admin only), with API validation.

### T11 My page: align PROFILE and ATTENDANCE heights
- Make both cards the same height in the grid.

### T12 Credentials: slow load → optimize perceived performance
- Show fast initial UI (skeleton/placeholder).
- Avoid blocking on GAS; load from DB first, refresh asynchronously or on user action.

### T13 Logs: paginate about 10 per page
- Convert log lists that are too long into 10-per-page pagination (API paginate + UI pager).

## Delivery
- Implement in dependency order and keep each ticket verifiable.
- After completing all, provide:
  - What changed (by ticket),
  - How to test each ticket quickly,
  - Any follow-ups/risks.

