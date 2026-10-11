<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

## Rules
- Self-service deletion uses a POST server function with strict confirmation input and existing bearer middleware; a server-only helper revalidates the token through Admin Auth and derives the sole deletion target before deleting scans then the auth user, so callers cannot select another account.
- AI analysis is a public server function using a server-only streamed Responses SDK helper; credentials and prompts never enter client bundles, while user scans continue through the existing RLS browser client.
- Analysis metadata and education use optional quiz.meta within the existing JSON column, so older scans remain readable without a scans schema change.
- Terminal AI availability/credit/access errors pause calls in a server-only service-state table; restore access and clear its pause explicitly before resuming, never retry terminal errors automatically.
- Signup verification UI lives in a dedicated component that calls Auth signup resend with the existing callback URL and a timed click cooldown; this keeps the form and callback independent.
- Scans are stored per user in the `scans` table with RLS (owner-only); never persist the full raw message, only a short preview — privacy requirement.
- Password recovery uses dedicated public request/reset routes and the browser Auth client; reset forms require validated recovery provenance rather than an ordinary session, so normal sign-in cannot silently unlock recovery.
- Individual scan deletion accepts only a validated scan ID through the existing authenticated browser client and verifies one returned row before success; ownership remains enforced by existing RLS, with no admin path.
- Publishable backend values are pinned as fallbacks in vite.config.ts because .env is git-ignored and the publish build does not receive it; only browser-safe values belong there, never secrets.
- The authenticated layout subscribes to auth changes and unmounts private pages, clears the query cache and re-runs its gate when the session ends or switches user, so stale cross-tab UI or in-flight reads never show or act on another session.
