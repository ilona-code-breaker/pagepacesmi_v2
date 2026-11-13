<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.

## What Lovable manages

Rules outside this block are the project's own. Change the pieces below in
Lovable, not by hand. With the [Lovable MCP](https://mcp.lovable.dev)
connected, `send_message` asks Lovable to do it; otherwise ask the user to
use the editor.

- **Database.** Do not add or edit `supabase/migrations/` or `drizzle/`.
  Ask Lovable to change the schema.
- **Generated files.** Do not edit a file whose header says it is automatically
  generated.
- **AI gateway.** Keep model calls on Lovable's gateway, and keep
  `LOVABLE_API_KEY` out of browser code.
- **Connectors.** Lovable provides native connectors. `list_connectors` shows
  which are enabled; `add_connector` only returns the dashboard link. When a
  connector is enabled, calls go through the connector gateway and need
  `LOVABLE_API_KEY`. When Lovable does not provide one, users can bring their
  own key and store it in Secrets.
- **Secrets.** Lovable manages them. Do not put secret values in the repo.
<!-- LOVABLE:END -->

- PagePace app lives in src/pagepace and renders client-only from the / route (data is in browser storage); its server endpoints are src/routes/api/* calling src/pagepace/server/api.server.ts, so AI and book search stay on the server.
- Share recommendation date-window and exclusion helpers between client and server so both enforce the same eligibility and distinct-pick rules.
- Track's reading queue and Library's Want to read shelf share the same App-owned device-local queue, separate from completed books; queued starts prefill BookForm and dequeue only after current-read creation succeeds so cancelling never loses a saved book and statistics remain completed-only.
- Current and dropped reads use one shared reading-list hook across Track and Library; dropping preserves progress in separate storage and never creates a completed entry, so goals and streaks remain completion-only.
- Render genre legends outside the fixed-height Recharts canvas with a responsive grid so long labels never reduce or overlap the donut; chart and legend share CSS palette tokens.
- Owned books (Book Corner) are a separate device-local collection; read/unread is derived from completed books by ISBN or title match, never stored, so it stays in sync.
- Accounts are optional Google sign-in; src/pagepace/sync mirrors every pagepace_* browser-storage key to the per-user user_data table, merging device data on a device's first sign-in and treating the account as the source afterwards, so the app keeps reading browser storage unchanged.
