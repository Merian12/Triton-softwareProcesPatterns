# Messages setup

Run `migrations/202611190000_messages.sql` in the Supabase SQL editor against the same project configured in `.env.local`, or apply it through your normal Supabase migration workflow.

Messages are stored in Supabase, not delivered as external email. Registered users start conversations by entering an exact email address. Organizer, admin and volunteer dashboards share the Messages component; open conversations refresh every five seconds.

The migration restricts reads to the sender and recipient. Sending uses an authenticated RPC that derives the sender from the session and looks up only the specified recipient. No service role key or public profile directory is required.

After applying, sign in with two separate registered accounts in separate browser sessions. Send a message by email, open Messages in the other session, and reply. Verify a third account cannot read the conversation and an unknown recipient produces an error.
