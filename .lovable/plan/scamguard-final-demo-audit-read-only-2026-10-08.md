# ScamGuard — Final Demo Audit (read-only)

Overall verdict: every requirement in the brief is covered. Automated checks pass and the database security check finds no real problems. The main risks for the demo are live-environment checks that haven't been run yet. No missing features block the grade.

## MUST FIX BEFORE DEMO
1. **Publish the latest version and run the full flow on the live site.** Sign-up emails, confirmation links and password-reset links all point to the published address. If the live site is behind the preview, those links open an older version. Test: sign up, confirm, log in, scan, check History, delete a scan, reset your password, log out and back in.
2. **Check that users can't see each other's scans, using two accounts.** The protection is in place and the code looks right, but no one has tried it with two real accounts. This matters most for the privacy part of the grade.
3. **Make sure AI analysis works on the live site, and that AI isn't paused.** If AI credits run out, ScamGuard pauses AI and falls back to the basic pattern check until someone turns it back on. Check your credit balance the day before. Rehearse the fallback too, so it comes across as a deliberate safety feature.
4. **Prepare a demo account and backup scans in advance.** Email delivery can be slow or end up in spam. Have one account that's already confirmed and has 3–4 saved scans (high, medium and low risk). Run any live sign-up only as an extra.
5. **Test account deletion with a throwaway account only.** Never run it on the demo account.

## NICE TO POLISH IF TIME (low risk, optional)
- Fix three small typing warnings: the History links in the navigation and dashboard don't declare the optional "scan deleted" setting. This changes nothing visible, but leaves the checks clean for anyone reviewing the code.
- One-tap delete in the History list. This was deliberately left out. Skip it unless there's lots of spare time.
- Prepare a 30-second spoken walkthrough of the "How ScamGuard uses AI" section. It links directly to Digital Literacy grading points (advisory results, privacy, checking things yourself).
- Quickly check old or sample results and the quiz on a phone-sized screen just before presenting.

## DO NOT ADD / FREEZE FEATURES
- Google or other social login, payments, admin pages, sharing, messaging, or analytics.
- Switching AI models or rewriting the AI instructions. That could change outputs and break the structured results.
- Changes to the database or its protections, or to how emails are sent or styled.
- Password breach checks or stricter password rules. They add sign-up friction during a live demo, so mention them as future work instead.
- Browser extensions, screenshot or image scanning, or link checking against outside services. These are big new risks with little effect on the grade.

## Findings notes
- Database security check: one informational note, about the internal table that tracks whether AI is paused. It deliberately allows no user access, so this is expected.
- Raw messages aren't stored: only a short preview of up to 120 characters is saved, after obvious sensitive details are hidden. Mention that this hiding is best-effort, which the app already says.
- No code changes are proposed. If you approve this plan, nothing gets built. Only the optional typing-warning fix would need your OK.
