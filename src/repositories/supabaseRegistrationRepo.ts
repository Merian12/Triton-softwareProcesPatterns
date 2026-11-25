import type { SupabaseClient } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabaseClient';
import type {
  IRegistrationRepository,
  RegistrationGuest,
} from '@/services/registrationService';

const KNOWN_ERROR_MESSAGES = [
  'You are already registered for this shift.',
  'This shift is unavailable.',
  'Not enough places available for everyone.',
  'You can bring at most 5 guests per shift.',
  'Enter a name for each guest.',
  'Guest names must be 120 characters or fewer.',
  'Add at least one guest name.',
  'Registration not found.',
] as const;

function mapRpcError(message: string | undefined, fallback: string): Error {
  if (message) {
    const matched = KNOWN_ERROR_MESSAGES.find((known) =>
      message.includes(known)
    );
    if (matched) {
      return new Error(matched);
    }
  }
  return new Error(fallback);
}

export class SupabaseRegistrationRepository implements IRegistrationRepository {
  constructor(private readonly client: SupabaseClient = supabase) {}

  async registerShiftWithGuests(
    shiftId: string,
    guestNames: string[]
  ): Promise<string> {
    const { data, error } = await this.client.rpc(
      'register_shift_with_guests',
      {
        p_shift_id: shiftId,
        p_guest_names: guestNames,
      }
    );

    if (error) {
      throw mapRpcError(
        error.message,
        'Could not complete your registration. Please try again.'
      );
    }

    return String(data ?? '');
  }

  async addGuestsToRegistration(
    registrationId: string,
    guestNames: string[]
  ): Promise<void> {
    const { error } = await this.client.rpc('add_registration_guests', {
      p_registration_id: registrationId,
      p_guest_names: guestNames,
    });

    if (error) {
      throw mapRpcError(
        error.message,
        'Could not add guests. Please try again.'
      );
    }
  }

  async listGuestsForRegistrations(
    registrationIds: string[]
  ): Promise<RegistrationGuest[]> {
    if (registrationIds.length === 0) {
      return [];
    }

    const { data, error } = await this.client
      .from('registration_guests')
      .select('id, registration_id, full_name')
      .in('registration_id', registrationIds)
      .order('created_at', { ascending: true });

    if (error) {
      throw new Error(error.message);
    }

    return (data ?? []) as RegistrationGuest[];
  }
}
