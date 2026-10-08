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
- Signup verification UI lives in a dedicated component that calls Auth signup resend with the existing callback URL and a timed click cooldown; this keeps the form and callback independent.
- Scans are stored per user in the `scans` table with RLS (owner-only); never persist the full raw message, only a short preview — privacy requirement.
