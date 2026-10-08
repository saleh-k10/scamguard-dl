# ScamGuard after the .env deletion: diagnosis and safe repair

## What the checks found (read-only)
- The `.env` deletion from GitHub came in as commit `8f51a67`. At 15:51 the preview restarted, and Lovable recreated `.env` in the workspace with all six connection values: the browser URL, publishable key and project ID, plus the matching server values.
- Every needed value is available to the app: the browser connection values, the server connection values, the AI key and the admin key.
- No build errors and no runtime errors are logged. `/`, `/check` and `/login` all return 200 in the preview.
- `.gitignore` now ignores `.env`, so the recreated file stays out of GitHub.

## Root cause
The likeliest cause: the outage was the short gap after the deletion was pulled in. The app's backend connection setup throws "Missing ... environment variable(s)" if the URL or publishable key is missing. The browser values are baked in when the app is built, so for a moment those values were missing. Lovable then recreated `.env` from its own project settings. The preview works again now. The published site still runs whatever was last published, so if it was published during that gap, it would show the error until it is republished.

This is not fully confirmed: no error was captured in the logs at the moment of failure.

## Publishable values vs real secrets
- Safe in the browser (publishable): `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`, `VITE_SUPABASE_PROJECT_ID` and their server twins. They are visible to every visitor already, and data is protected by row-level security.
- Real secrets, server-only, never in git: `SUPABASE_SERVICE_ROLE_KEY`, `LOVABLE_API_KEY`, the database password and any private tokens. These come from Lovable's secret store, never from `.env`, and they were not affected.

## Is a tracked .env needed?
No. Lovable creates `.env` itself from the backend connection, so it does not need to live in GitHub. Do not commit it again, and do not add these values by hand in settings.

## Repair steps (after approval)
1. Change no code or files. Keep `.env` ignored and `.env.example` as the reference.
2. Reload the preview and check that login, a scan and History all work with a real session.
3. Republish so the live site gets a build that includes the values. Then open https://scamguard-dl.lovable.app and check login and a scan.
4. If the live site still fails after republishing, collect its exact error and look into it further. Do not restore a tracked `.env`.
