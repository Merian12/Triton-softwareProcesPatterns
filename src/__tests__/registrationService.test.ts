import { describe, expect, it, vi } from 'vitest';
import {
  MAX_GUESTS_PER_REGISTRATION,
  maxAdditionalGuests,
  RegistrationService,
  validateGuestNames,
  type IRegistrationRepository,
} from '@/services/registrationService';

function createMockRepo(): IRegistrationRepository {
  return {
    registerShiftWithGuests: vi.fn().mockResolvedValue('reg-1'),
    addGuestsToRegistration: vi.fn().mockResolvedValue(undefined),
    listGuestsForRegistrations: vi.fn().mockResolvedValue([]),
  };
}

describe('maxAdditionalGuests', () => {
  it('caps guests by both available places and the 5-guest limit', () => {
    expect(maxAdditionalGuests(10, 0, true)).toBe(MAX_GUESTS_PER_REGISTRATION);
    expect(maxAdditionalGuests(3, 0, true)).toBe(2);
    expect(maxAdditionalGuests(1, 0, true)).toBe(0);
    expect(maxAdditionalGuests(0, 0, true)).toBe(0);
    expect(maxAdditionalGuests(null, 0, true)).toBe(MAX_GUESTS_PER_REGISTRATION);
  });

  it('accounts for already registered guests when adding more later', () => {
    expect(maxAdditionalGuests(10, 2, false)).toBe(3);
    expect(maxAdditionalGuests(2, 2, false)).toBe(2);
    expect(maxAdditionalGuests(10, 5, false)).toBe(0);
    expect(maxAdditionalGuests(null, 3, false)).toBe(2);
  });
});

describe('validateGuestNames', () => {
  it('trims valid guest names and allows empty list when permitted', () => {
    expect(
      validateGuestNames([], {
        allowEmptyList: true,
        availablePlaces: 1,
        includesSelf: true,
      })
    ).toEqual({ validNames: [], error: null });

    expect(
      validateGuestNames(['  Emil Hansen  ', 'Sofia'], {
        allowEmptyList: true,
        availablePlaces: 5,
        includesSelf: true,
      })
    ).toEqual({ validNames: ['Emil Hansen', 'Sofia'], error: null });
  });

  it('rejects empty list when at least one guest is required', () => {
    expect(
      validateGuestNames([], {
        allowEmptyList: false,
        availablePlaces: 3,
        includesSelf: false,
      }).error
    ).toBe('Add at least one guest name.');
  });

  it('rejects blank names, overly long names, more than 5 guests, and insufficient capacity', () => {
    expect(
      validateGuestNames(['Emil', '   '], {
        allowEmptyList: true,
        availablePlaces: 5,
        includesSelf: true,
      }).error
    ).toBe('Enter a name for each guest.');

    expect(
      validateGuestNames(['A'.repeat(121)], {
        allowEmptyList: true,
        availablePlaces: 5,
        includesSelf: true,
      }).error
    ).toBe('Guest names must be 120 characters or fewer.');

    expect(
      validateGuestNames(['A', 'B', 'C', 'D', 'E', 'F'], {
        allowEmptyList: true,
        availablePlaces: 10,
        includesSelf: true,
      }).error
    ).toBe('You can bring at most 5 guests per shift.');

    expect(
      validateGuestNames(['Emil', 'Sofia'], {
        allowEmptyList: true,
        availablePlaces: 2,
        includesSelf: true,
      }).error
    ).toBe('Not enough places available for everyone.');

    expect(
      validateGuestNames(['Emil', 'Sofia'], {
        allowEmptyList: false,
        existingGuestCount: 4,
        availablePlaces: 10,
        includesSelf: false,
      }).error
    ).toBe('You can bring at most 5 guests per shift.');
  });
});

describe('RegistrationService', () => {
  it('registers a volunteer with trimmed guest names', async () => {
    const repo = createMockRepo();
    const service = new RegistrationService(repo);

    const id = await service.registerWithGuests('shift-1', ['  Emil  ', 'Sofia'], 4);
    expect(id).toBe('reg-1');
    expect(repo.registerShiftWithGuests).toHaveBeenCalledWith('shift-1', ['Emil', 'Sofia']);
  });

  it('blocks invalid registrations before calling the repository', async () => {
    const repo = createMockRepo();
    const service = new RegistrationService(repo);

    await expect(service.registerWithGuests('   ', [], 4)).rejects.toThrow('Choose a shift first.');
    await expect(service.registerWithGuests('shift-1', [], 0)).rejects.toThrow(
      'This shift is unavailable.'
    );
    await expect(service.registerWithGuests('shift-1', ['   '], 4)).rejects.toThrow(
      'Enter a name for each guest.'
    );
    await expect(service.registerWithGuests('shift-1', ['Emil', 'Sofia'], 2)).rejects.toThrow(
      'Not enough places available for everyone.'
    );
    expect(repo.registerShiftWithGuests).not.toHaveBeenCalled();
  });

  it('adds extra guests to an existing registration after validating capacity and cap', async () => {
    const repo = createMockRepo();
    const service = new RegistrationService(repo);

    await service.addGuests('reg-1', ['  Noah  '], 2, 3);
    expect(repo.addGuestsToRegistration).toHaveBeenCalledWith('reg-1', ['Noah']);

    await expect(service.addGuests('', ['Noah'], 0, 3)).rejects.toThrow('Registration not found.');
    await expect(service.addGuests('reg-1', ['Noah'], 0, 0)).rejects.toThrow(
      'Not enough places available for everyone.'
    );
    await expect(service.addGuests('reg-1', ['Noah', 'Freja'], 4, 5)).rejects.toThrow(
      'You can bring at most 5 guests per shift.'
    );
  });

  it('skips repository query when listing guests for an empty registration list', async () => {
    const repo = createMockRepo();
    const service = new RegistrationService(repo);

    await expect(service.listGuests([])).resolves.toEqual([]);
    expect(repo.listGuestsForRegistrations).not.toHaveBeenCalled();

    vi.mocked(repo.listGuestsForRegistrations).mockResolvedValueOnce([
      { id: 'g1', registration_id: 'reg-1', full_name: 'Emil' },
    ]);
    await expect(service.listGuests(['reg-1'])).resolves.toEqual([
      { id: 'g1', registration_id: 'reg-1', full_name: 'Emil' },
    ]);
  });
});
