'use client';

import { useEffect, useMemo, useState } from 'react';
import { MessageService, type Message } from '@/services/messageService';
import { SupabaseMessageRepository } from '@/repositories/supabaseMessageRepo';
import { button, card, input, primarySolid, textarea } from './portalStyles';

export default function Messages({ userId }: { userId: string }) {
  const service = useMemo(() => new MessageService(new SupabaseMessageRepository()), []);
  const [messages, setMessages] = useState<Message[]>([]);
  const [recipient, setRecipient] = useState('');
  const [active, setActive] = useState('');
  const [body, setBody] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout>;
    async function refresh() {
      try {
        const data = await service.list();
        if (!cancelled) { setMessages(data); setLoadError(''); }
      } catch (cause) {
        if (!cancelled) setLoadError(cause instanceof Error ? cause.message : 'Could not load messages.');
      } finally {
        if (!cancelled) { setLoading(false); timer = setTimeout(refresh, 5000); }
      }
    }
    void refresh();
    return () => { cancelled = true; clearTimeout(timer); };
  }, [service, userId]);

  const conversations = [...new Set([...messages].reverse().map(message => message.peer_email))];
  const thread = messages.filter(message => message.peer_email.toLowerCase() === active.toLowerCase());

  return <section className="mt-6" aria-label="Messages">
    <p className="mb-5 text-sm text-neutral-600">Message registered users using their email address. Conversations stay inside Triton and refresh automatically.</p>
    {loadError && <p role="alert" className="mb-4 text-sm text-red-800">{loadError}</p>}
    <div className="grid items-start gap-5 md:grid-cols-[260px_minmax(0,1fr)]">
      <aside className={card} aria-label="Conversations">
        <h2 className="mb-4 font-semibold">Conversations</h2>
        <button className={`${button} mb-4 w-full`} onClick={() => { setActive(''); setRecipient(''); setBody(''); setError(''); setNotice(''); }}>New message</button>
        {loading && <p role="status" className="text-sm">Loading messages...</p>}
        {!loading && !conversations.length && <p className="text-sm text-neutral-600">No messages yet.</p>}
        <ul className="space-y-2">
          {conversations.map(email => <li key={email}><button aria-pressed={active === email} className={`w-full break-all rounded-lg border p-3 text-left text-sm focus-visible:outline-brand ${active === email ? 'border-brand bg-brand/5' : 'border-border-default'}`} onClick={() => { setActive(email); setRecipient(email); setBody(''); setError(''); setNotice(''); }}>{email}</button></li>)}
        </ul>
      </aside>
      <div className={`${card} min-w-0`}>
        <h2 className="break-all font-semibold">{active || 'New message'}</h2>
        {active && <div role="log" aria-label="Conversation" className="my-5 max-h-96 space-y-4 overflow-y-auto">
          {thread.map(message => <article key={message.id} className={`max-w-[90%] rounded-xl p-3 ${message.sender_id === userId ? 'ml-auto bg-brand/10' : 'bg-neutral-100'}`}>
            <p className="mb-1 text-xs text-neutral-600">{message.sender_id === userId ? 'You' : message.peer_email}</p>
            <p className="whitespace-pre-wrap break-words text-sm">{message.body}</p>
            <time dateTime={message.created_at} className="mt-2 block text-xs text-neutral-500">{new Date(message.created_at).toLocaleString('en-GB')}</time>
          </article>)}
        </div>}
        <form className="mt-5 space-y-4" onSubmit={async event => {
          event.preventDefault();
          if (sending) return;
          setSending(true); setError(''); setNotice('');
          try {
            await service.send(recipient, body);
            setActive(recipient.trim().toLowerCase()); setBody(''); setNotice('Message sent.');
            try { setMessages(await service.list()); setLoadError(''); }
            catch { setLoadError('Message sent, but the conversation could not refresh. It will retry automatically.'); }
          } catch (cause) { setError(cause instanceof Error ? cause.message : 'Could not send message.'); }
          finally { setSending(false); }
        }}>
          <div><label htmlFor="message-recipient" className="mb-2 block text-sm">Recipient email</label>
            <input id="message-recipient" type="email" required readOnly={!!active} disabled={sending} className={input} value={recipient} onChange={event => setRecipient(event.target.value)} placeholder="name@example.com" /></div>
          <div><label htmlFor="message-body" className="mb-2 block text-sm">Your message</label>
            <textarea id="message-body" required maxLength={5000} rows={4} disabled={sending} className={textarea} value={body} onChange={event => setBody(event.target.value)} /></div>
          {error && <p role="alert" className="text-sm text-red-800">{error}</p>}
          {notice && <p role="status" className="text-sm">{notice}</p>}
          <button className={primarySolid} disabled={sending || !body.trim() || !recipient.trim()}>{sending ? 'Sending...' : 'Send message'}</button>
        </form>
      </div>
    </div>
  </section>;
}
