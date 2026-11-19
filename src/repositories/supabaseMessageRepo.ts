import { supabase } from '@/lib/supabaseClient';
import type { IMessageRepository, Message } from '@/services/messageService';

export class SupabaseMessageRepository implements IMessageRepository {
  async list(): Promise<Message[]> {
    const { data, error } = await supabase.rpc('list_my_messages');
    if (error) throw new Error('Could not load messages. Please try again.');
    return data ?? [];
  }
  async send(email: string, body: string): Promise<void> {
    const { error } = await supabase.rpc('send_message', { recipient_email: email, message_body: body });
    if (error) {
      if (error.message.includes('Recipient not found')) throw new Error('No registered user has that email address.');
      if (error.message.includes('yourself')) throw new Error('Choose another user to message.');
      throw new Error('Could not send your message. Please try again.');
    }
  }
}
