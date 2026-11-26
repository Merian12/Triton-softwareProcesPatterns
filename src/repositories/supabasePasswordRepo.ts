import { SupabaseClient } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabaseClient';
import { IPasswordRepository } from '@/services/profileService';

export class SupabasePasswordRepository implements IPasswordRepository {
  private client: SupabaseClient;

  constructor(client?: SupabaseClient) {
    this.client = client || supabase;
  }

  async changePassword(email: string, currentPassword: string, newPassword: string): Promise<void> {
    // Tjek først, at den nuværende adgangskode er rigtig.
    const { error: signInError } = await this.client.auth.signInWithPassword({
      email,
      password: currentPassword,
    });

    if (signInError) {
      if (/invalid login credentials/i.test(signInError.message)) {
        throw new Error('Current password is incorrect.');
      }
      throw new Error(signInError.message);
    }

    // Gem den nye adgangskode for den bruger, der er logget ind.
    const { error: updateError } = await this.client.auth.updateUser({
      password: newPassword,
      current_password: currentPassword,
    });

    if (updateError) throw new Error(updateError.message || 'Could not change your password.');
  }
}
