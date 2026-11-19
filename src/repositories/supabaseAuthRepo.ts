import { SupabaseClient } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabaseClient';
import { IAuthRepository, UserProfile, UserRole } from '@/services/authService';

export class SupabaseAuthRepository implements IAuthRepository {
  private supabase: SupabaseClient;

  constructor(supabaseClient?: SupabaseClient) {
    this.supabase = supabaseClient || supabase;
  }

  async signUp(email: string, password: string, role: UserRole, username: string): Promise<UserProfile> {
    if (role !== 'volunteer' && role !== 'organizer') throw new Error('Admin accounts must be assigned by an administrator.');
    const { data: authData, error: authError } = await this.supabase.auth.signUp({
      email,
      password,
      options: {
        data: { username },
      },
    });

    if (authError || !authData.user) {
      throw new Error(authError?.message || 'Sign-up failed.');
    }

    const { data: profileData, error: profileError } = await this.supabase
      .from('profiles')
      .upsert(
        { id: authData.user.id, email, role, username },
        { onConflict: 'id' }
      )
      .select('id, email, role, username')
      .single();

    if (profileError || !profileData) {
      throw new Error(profileError?.message || 'Could not create user profile.');
    }

    return profileData as UserProfile;
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
      .select('id, email, role, username')
      .eq('id', authData.user.id)
      .single();

    if (profileError || !profileData) {
      throw new Error('Could not load user role profile.');
    }

    return profileData as UserProfile;
  }
  async getCurrentUser(): Promise<UserProfile | null> {
    const { data: sessionData } = await this.supabase.auth.getSession();
    const user = sessionData.session?.user;

    if (!user) {
      return null;
    }

    const { data: profileData, error } = await this.supabase
      .from('profiles')
      .select('id, email, role, username')
      .eq('id', user.id)
      .single();

    if (error || !profileData) {
      return null;
    }

    return profileData as UserProfile;
  }

  async signOut(): Promise<void> {
    let timer: ReturnType<typeof setTimeout> | undefined;
    try {
      await Promise.race([
        (async () => {
          const { error } = await this.supabase.auth.signOut({ scope: 'local' });
          if (error) {
            // The SDK can clear the browser session even if server revocation fails.
            // Only proceed to login once that local sign-out is confirmed.
            const { data, error: sessionError } = await this.supabase.auth.getSession();
            if (sessionError || data.session) throw sessionError || error;
          }
        })(),
        new Promise<never>((_, reject) => {
          timer = setTimeout(() => reject(new Error('Logout timed out. Please try again.')), 12_000);
        }),
      ]);
    } finally {
      clearTimeout(timer);
    }
  }
}
