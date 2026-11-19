import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import Messages from '@/components/Messages';
import { MessageService } from '@/services/messageService';

const { list, send } = vi.hoisted(() => ({ list: vi.fn(), send: vi.fn() }));
vi.mock('@/repositories/supabaseMessageRepo', () => ({
  SupabaseMessageRepository: class { list = list; send = send; },
}));
beforeEach(() => { vi.resetAllMocks(); list.mockResolvedValue([]); send.mockResolvedValue(undefined); });

describe('Messages', () => {
  it('opens an incoming conversation and sends a reply', async () => {
    list.mockResolvedValue([{ id: 'm1', sender_id: 'other', recipient_id: 'me', peer_email: 'friend@example.com', body: 'Can you help?', created_at: '2026-11-19T10:00:00Z' }]);
    render(<Messages userId="me" />);
    fireEvent.click(await screen.findByRole('button', { name: 'friend@example.com' }));
    expect(screen.getByText('Can you help?')).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText('Your message'), { target: { value: ' Yes! ' } });
    fireEvent.click(screen.getByRole('button', { name: 'Send message' }));
    await waitFor(() => expect(send).toHaveBeenCalledWith('friend@example.com', 'Yes!'));
    expect(await screen.findByText('Message sent.')).toBeInTheDocument();
    expect(screen.getByLabelText('Your message')).toHaveValue('');
  });
  it('keeps the draft when the recipient is not registered', async () => {
    send.mockRejectedValue(new Error('No registered user has that email address.'));
    render(<Messages userId="me" />);
    fireEvent.change(screen.getByLabelText('Recipient email'), { target: { value: 'missing@example.com' } });
    fireEvent.change(screen.getByLabelText('Your message'), { target: { value: 'Hello' } });
    fireEvent.click(screen.getByRole('button', { name: 'Send message' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('No registered user');
    expect(screen.getByLabelText('Your message')).toHaveValue('Hello');
  });
  it('rejects empty and oversized messages before calling the repository', async () => {
    const service = new MessageService({ list, send });
    await expect(service.send('friend@example.com', '  ')).rejects.toThrow('5,000');
    await expect(service.send('friend@example.com', 'a'.repeat(5001))).rejects.toThrow('5,000');
    await expect(service.send('invalid', 'Hello')).rejects.toThrow('valid recipient');
    expect(send).not.toHaveBeenCalled();
  });
});
