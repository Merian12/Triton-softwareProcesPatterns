import { supabase } from '@/lib/supabaseClient';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { IAdminRepository } from '@/services/adminService';
import type { UserProfile } from '@/services/authService';

export class SupabaseAdminRepository implements IAdminRepository {
  constructor(private client: SupabaseClient = supabase) {}
  async listOrganizers(): Promise<UserProfile[]> {
    const { data, error } = await this.client.rpc('admin_list_organizers');
    if (error) throw new Error(error.message);
    return data ?? [];
  }
  async removeOrganizer(id: string): Promise<void> {
    const { error } = await this.client.rpc('admin_remove_organizer', { organizer_id: id });
    if (error) throw new Error(error.message);
  }
}
