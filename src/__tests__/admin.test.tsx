import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AuthService, type IAuthRepository } from '@/services/authService';
import OrganizerManagement from '@/components/OrganizerManagement';
const mocks = vi.hoisted(() => ({ list: vi.fn(), remove: vi.fn() }));
vi.mock('@/repositories/supabaseAdminRepo', () => ({ SupabaseAdminRepository: class {
  listOrganizers = mocks.list;
  removeOrganizer = mocks.remove;
} }));
const admin = { id: 'a1', email: 'admin@example.com', role: 'admin' as const };
function auth() {
  const repo: IAuthRepository = { signIn: vi.fn().mockResolvedValue(admin), signUp: vi.fn(), getCurrentUser: vi.fn().mockResolvedValue(admin), signOut: vi.fn() };
  return { repo, service: new AuthService(repo) };
}
beforeEach(() => { vi.restoreAllMocks(); mocks.list.mockReset(); mocks.remove.mockReset(); });
describe('Admin authorization', () => {
  it('routes admin login and wrong-role navigation to the admin dashboard', async () => {
    const { service } = auth();
    expect((await service.login(admin.email, 'password123')).redirectUrl).toBe('/admin-dashboard');
    expect(await service.authorize('admin')).toMatchObject({ authorized: true });
    expect(await service.authorize('organizer')).toMatchObject({ authorized: false, redirectUrl: '/admin-dashboard' });
  });
  it('rejects public admin registration before calling the repository', async () => {
    const { service, repo } = auth();
    await expect(service.register(admin.email, 'password123', 'password123', 'admin')).rejects.toThrow('Admin accounts');
    expect(repo.signUp).not.toHaveBeenCalled();
  });
  it('denies organizer access to the admin route', async () => {
    const { service, repo } = auth();
    vi.mocked(repo.getCurrentUser).mockResolvedValue({ ...admin, role: 'organizer' });
    expect(await service.authorize('admin')).toMatchObject({ authorized: false, redirectUrl: '/organizer-dashboard' });
  });
});
describe('Organizer management', () => {
  it('only removes the organizer after confirmation and reports success', async () => {
    mocks.list.mockResolvedValue([{ id: 'o1', email: 'org@example.com', role: 'organizer' }]);
    mocks.remove.mockResolvedValue(undefined);
    const confirm = vi.spyOn(window, 'confirm').mockReturnValue(false);
    render(<OrganizerManagement />);
    const remove = await screen.findByRole('button', { name: 'Remove organizer org@example.com' });
    fireEvent.click(remove);
    expect(mocks.remove).not.toHaveBeenCalled();
    confirm.mockReturnValue(true);
    fireEvent.click(remove);
    await screen.findByText('org@example.com is now a Volunteer.');
    expect(mocks.remove).toHaveBeenCalledWith('o1');
    expect(screen.queryByRole('button', { name: 'Remove organizer org@example.com' })).not.toBeInTheDocument();
  });
  it('keeps the organizer visible when the database rejects removal', async () => {
    mocks.list.mockResolvedValue([{ id: 'o1', email: 'org@example.com', role: 'organizer' }]);
    mocks.remove.mockRejectedValue(new Error('Admin access required.'));
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    render(<OrganizerManagement />);
    fireEvent.click(await screen.findByRole('button', { name: 'Remove organizer org@example.com' }));
    await screen.findByRole('alert');
    await waitFor(() => expect(screen.getByRole('button', { name: 'Remove organizer org@example.com' })).toBeEnabled());
  });
});
