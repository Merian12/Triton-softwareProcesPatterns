export interface Message {
  id: string;
  sender_id: string;
  recipient_id: string;
  peer_email: string;
  body: string;
  created_at: string;
}

export interface IMessageRepository {
  list(): Promise<Message[]>;
  send(email: string, body: string): Promise<void>;
}

export class MessageService {
  constructor(private repository: IMessageRepository) {}
  list() { return this.repository.list(); }
  async send(email: string, body: string) {
    const recipient = email.trim().toLowerCase();
    const content = body.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(recipient)) throw new Error('Enter a valid recipient email.');
    if (!content || content.length > 5000) throw new Error('Write a message between 1 and 5,000 characters.');
    await this.repository.send(recipient, content);
  }
}
