import { SupabaseClient } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabaseClient';
import { IAuthRepository, UserProfile } from '@/services/authService';

export class SupabaseAuthRepository implements IAuthRepository {
  private supabase: SupabaseClient;

  constructor(supabaseClient?: SupabaseClient) {
    this.supabase = supabaseClient || supabase;
  }

  async signIn(email: string, password: string): Promise<UserProfile> {
    const { data: authData, error: authError } = await this.supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError || !authData.user) {
      throw new Error(authError?.message || 'Invalid login credentials.');
    }

    const { data: profileData, error: profileError } = await this.supabase
      .from('profiles')
      .select('id, email, role')
      .eq('id', authData.user.id)
      .single();

    if (profileError || !profileData) {
      throw new Error('Could not load user role profile.');
    }

    return profileData as UserProfile;
  }
  async getCurrentUser(): Promise<UserProfile | null> {
    const { data: sessionData } = await supabase.auth.getSession();
    const user = sessionData.session?.user;

    if (!user) {
      return null;
    }

    const { data: profileData, error } = await supabase
      .from('profiles')
      .select('id, email, role')
      .eq('id', user.id)
      .single();

    if (error || !profileData) {
      return null;
    }

    return profileData as UserProfile;
  }

  async signOut(): Promise<void> {
    await supabase.auth.signOut();
  }
}
