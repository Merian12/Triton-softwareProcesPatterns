import type { UserProfile } from './authService';

export interface IAdminRepository {
  listOrganizers(): Promise<UserProfile[]>;
  removeOrganizer(id: string): Promise<void>;
}

export class AdminService {
  constructor(private repository: IAdminRepository) {}
  listOrganizers() { return this.repository.listOrganizers(); }
  removeOrganizer(id: string) {
    if (!id.trim()) throw new Error('Choose an organizer.');
    return this.repository.removeOrganizer(id);
  }
}
