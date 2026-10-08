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
- AI analysis is a public server function using a server-only streamed Responses SDK helper; credentials and prompts never enter client bundles, while user scans continue through the existing RLS browser client.
- Analysis metadata and education use optional quiz.meta within the existing JSON column, so older scans remain readable without a scans schema change.
- Terminal AI availability/credit/access errors pause calls in a server-only service-state table; restore access and clear its pause explicitly before resuming, never retry terminal errors automatically.
- Signup verification UI lives in a dedicated component that calls Auth signup resend with the existing callback URL and a timed click cooldown; this keeps the form and callback independent.
- Scans are stored per user in the `scans` table with RLS (owner-only); never persist the full raw message, only a short preview — privacy requirement.
