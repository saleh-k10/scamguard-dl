# Save scan history to the user's account

## Current state (checked)
- The database has no tables yet.
- `/check` is public and saves results only in browser storage; `/result/$id` and `/history` read browser storage mixed with 3 sample scans.
- Login, sign-up, email confirmation and the protected Dashboard/History pages already work and stay untouched.

## What changes for the user
- Signed-in users: every scan they run is saved to their account. History shows only their own scans, even after refresh, logout/login or switching devices.
- The full pasted message is not stored. Only a short preview (first 120 characters) plus the score, risk level, warning signs, next steps and quiz.
- Sample scans no longer appear in History. They stay as clearly labelled examples ("Example") on the home page only, opening at `/result/sample-0` etc.
- Signed-out visitors can still check a message and see the result, with a small note "Log in to save this scan to your history". Nothing is saved for them.
- Old browser-only scans are no longer shown (no migration of local data — keeps the step simple).
- Look and layout stay the same; the only new things are loading/empty states and that note.

## Steps
1. Database: create a `scans` table with Row Level Security so each user can only view, add and delete their own rows.
2. Shared code: add `src/lib/scans.ts` with `createScan`, `listMyScans`, `getMyScan(id)` using the signed-in browser client (RLS enforces ownership). Remove `saveResult`/`loadResults` from `analyzer.ts`; keep `analyze`, labels and `SAMPLES`.
3. `/check`: after analysis, if signed in, insert the scan and go to `/result/<new id>`; if signed out, keep the result in memory only and show it with the "log in to save" note.
4. `/result/$id`: load from samples if the id starts with `sample-` (with an "Example scan" badge), otherwise fetch from the database; show "Result not found" if missing or not yours. Display the preview text instead of the full message.
5. `/history`: load from the database, with loading and empty ("No scans yet — Check a message") states; counts and filters unchanged.
6. Verify: sign in as a test user, run a scan, confirm it appears in History after reload, and confirm a second user cannot read it.

## Technical details
```text
scans
  id            uuid pk default gen_random_uuid()
  user_id       uuid not null default auth.uid()
  channel       text check in ('email','sms','other')
  preview       text not null  (<= 120 chars, set client-side)
  score         int  check 0..100
  level         text check in ('low','medium','high')
  signs         jsonb not null default '[]'
  actions       jsonb not null default '[]'
  quiz          jsonb not null
  created_at    timestamptz default now()
index (user_id, created_at desc)
GRANT select, insert, delete TO authenticated; ALL TO service_role; no anon grant
RLS policies (TO authenticated): select/insert/delete where user_id = auth.uid()
```
- No updates needed, so no UPDATE grant/policy.
- `Result.message` becomes `preview` in the mapped type; result page reads it.
- `/result/$id` stays a public route but fetches client-side (useEffect) since the session lives in browser storage; RLS returns nothing for others.
- Record in AGENTS.md: scans are stored per user with RLS; raw message text is never persisted.
