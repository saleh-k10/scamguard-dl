# ScamGuard

**Think before you click.** ScamGuard helps students and everyday users assess suspicious emails, SMS messages, and other online messages *before* clicking links, sending money, or sharing personal information.

**Live app:** https://scamguard-dl.lovable.app

Built as a university **Digital Literacy** final project.

---

## Problem & Purpose

Phishing and scam messages are designed to create urgency, impersonate trusted institutions, and pressure people into acting before thinking. Most people don't have a quick, approachable way to sanity-check a suspicious message. ScamGuard fills that gap: paste a message, get an advisory risk assessment, and — most importantly — *learn why* the message looks dangerous, so the next one is easier to spot yourself.

## Core Features

- **Message check** — paste an email, SMS, or other message and get a 0–100 risk score with a Low / Medium / High level.
- **Warning signs explained** — each red flag includes *why it matters* and the scam technique behind it.
- **Recommended actions** — concrete next steps, always phrased as advice, never as a verdict.
- **"Teach Me Why"** — an educational explanation plus a quiz question for every result, turning each scan into a learning moment.
- **Scan history** — signed-in users get a persistent, private history of past scans.
- **Account management** — email/password sign-up with email verification, resend confirmation, password reset, individual scan deletion, and secure self-service account deletion.

## AI-Powered Analysis

- Messages are assessed by an AI model (OpenAI via Lovable's server-side AI gateway) for wording, links, requests, and social-engineering cues.
- Output is strictly structured and validated (risk score, level, red flags, actions, education, quiz) before it reaches the UI.
- **Advisory, never a verdict:** all wording makes clear the result is a risk assessment, not proof of fraud or safety, and recommends independent verification through official channels.
- **Rule-based fallback:** if the AI is unavailable, rate-limited, or returns invalid output, a built-in pattern checker produces a clearly-labelled basic result instead.
- Terminal AI errors (credits/access) pause AI calls durably rather than retrying automatically.

## Privacy

- **The full raw message is never stored.** History persists only a short preview (max 120 characters) plus the structured result fields needed to reopen it.
- Obvious sensitive credentials (passwords, card numbers, tokens, private keys) are detected and redacted before AI processing where practical — with a client-side warning so users can remove them themselves.
- Scan history is protected by Row Level Security: each user can only read, insert, and delete their own scans. There is no admin path to other users' data.
- Signed-out users can scan freely; their results are temporary and never persisted.

## Tech Stack

- **Lovable** — development platform and hosting
- **React 19 + TanStack Start/Router** — full-stack front end with server functions
- **Tailwind CSS v4 + shadcn/ui** — frosted-glass design system
- **Supabase (Lovable Cloud)** — authentication, Postgres database, Row Level Security
- **Lovable AI gateway** — server-side access to an OpenAI model; no API key in the browser
- **Vitest + Testing Library** — unit and component tests

## Architecture (high level)

```text
Browser (React)
  ├── Public pages: landing, check, result, login, signup, forgot/reset password
  ├── Authenticated pages: dashboard, history, account  (route guard)
  ├── Supabase browser client ──► Auth + scans table (RLS enforces owner-only access)
  └── Server functions (TanStack Start, server-only)
        ├── AI analysis ──► Lovable AI gateway (structured output, validated, fallback)
        └── Account deletion ──► verifies the caller's token, deletes their scans, then their auth user
```

## Local Setup

Requires Node.js 18+ (or Bun).

```sh
git clone <this-repository-url>
cd <repository-name>
npm install        # or: bun install
cp .env.example .env   # fill in your own values
npm run dev
```

Tests:

```sh
npm run test       # or: bunx vitest run
```

## Environment Variables

Names only — values are provided by Lovable Cloud and must never be committed.

| Variable | Purpose |
| --- | --- |
| `VITE_SUPABASE_URL` | Backend URL (browser) |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Public/anon key (browser) |
| `VITE_SUPABASE_PROJECT_ID` | Backend project identifier (browser) |
| `SUPABASE_URL` | Backend URL (server) |
| `SUPABASE_PUBLISHABLE_KEY` | Public/anon key (server) |
| `SUPABASE_PROJECT_ID` | Backend project identifier (server) |
| `LOVABLE_API_KEY` | Server-side key for the Lovable AI gateway (managed by Lovable; never in the browser) |

## Security Notes

- No service-role key, API key, or token is present in this repository or shipped to the browser.
- Server-side privileged operations (AI calls, account deletion) run only in server functions; the browser never sees privileged credentials.
- Account deletion derives the target user from the caller's validated session token — no user ID or email can be supplied by the client.
- Database access is governed by RLS policies; the anonymous role has no access to scan data.

## Limitations & Future Work

- AI redaction of sensitive text is heuristic — users should still remove credentials before pasting.
- Analysis covers message text only; it does not open links or scan attachments/images.
- Possible future work: password-strength breach checks, per-scan deletion from the history list, link-reputation lookup.

## Academic Context

This project was built for a university **Digital Literacy** course final. Beyond the technical implementation, it aims to model good security practice: privacy-minimizing storage, advisory rather than alarmist AI communication, and transparency about what the AI does and does not know (see the "How ScamGuard uses AI" section in the app).
