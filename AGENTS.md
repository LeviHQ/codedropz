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

## Technical decisions
- SDSM portal DB reads go through passcode-gated SECURITY DEFINER RPCs (`portal_list_shares` / `portal_get_share`) that verify the SHA-256 of `PORTAL_PASSWORD` inside the database and use only the publishable key — never `supabaseAdmin` — so external hosts (Vercel) need no service-role key. If `PORTAL_PASSWORD` changes, the hash in those RPCs must be updated too.
