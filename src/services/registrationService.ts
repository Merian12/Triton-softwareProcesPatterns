export const MAX_GUESTS_PER_REGISTRATION = 5;
export const MAX_GUEST_NAME_LENGTH = 120;

export interface RegistrationGuest {
  id: string;
  registration_id: string;
  full_name: string;
}

export interface IRegistrationRepository {
  registerShiftWithGuests(shiftId: string, guestNames: string[]): Promise<string>;
  addGuestsToRegistration(registrationId: string, guestNames: string[]): Promise<void>;
  listGuestsForRegistrations(registrationIds: string[]): Promise<RegistrationGuest[]>;
}

export interface GuestValidationOptions {
  allowEmptyList: boolean;
  existingGuestCount?: number;
  availablePlaces: number | null;
  includesSelf: boolean;
}

export interface GuestValidationResult {
  validNames: string[];
  error: string | null;
}

export function normalizeGuestNames(rawNames: string[]): string[] {
  return rawNames.map((name) => name.trim());
}

export function maxAdditionalGuests(
  availablePlaces: number | null,
  existingGuestCount: number,
  includesSelf: boolean
): number {
  const remainingUnderCap = Math.max(
    0,
    MAX_GUESTS_PER_REGISTRATION - existingGuestCount
  );

  if (availablePlaces === null) {
    return remainingUnderCap;
  }

  const availableForGuests = Math.max(
    0,
    availablePlaces - (includesSelf ? 1 : 0)
  );

  return Math.min(remainingUnderCap, availableForGuests);
}

export function validateGuestNames(
  rawNames: string[],
  options: GuestValidationOptions
): GuestValidationResult {
  const existingGuestCount = options.existingGuestCount ?? 0;
  const cleaned = normalizeGuestNames(rawNames);

  if (!options.allowEmptyList && cleaned.length === 0) {
    return { validNames: [], error: 'Add at least one guest name.' };
  }

  if (cleaned.some((name) => name.length === 0)) {
    return { validNames: [], error: 'Enter a name for each guest.' };
  }

  if (cleaned.some((name) => name.length > MAX_GUEST_NAME_LENGTH)) {
    return {
      validNames: [],
      error: 'Guest names must be 120 characters or fewer.',
    };
  }

  if (existingGuestCount + cleaned.length > MAX_GUESTS_PER_REGISTRATION) {
    return {
      validNames: [],
      error: 'You can bring at most 5 guests per shift.',
    };
  }

  const spotsNeeded = (options.includesSelf ? 1 : 0) + cleaned.length;
  if (
    options.availablePlaces !== null &&
    spotsNeeded > options.availablePlaces
  ) {
    return {
      validNames: [],
      error: 'Not enough places available for everyone.',
    };
  }

  return { validNames: cleaned, error: null };
}

export class RegistrationService {
  constructor(private readonly repository: IRegistrationRepository) {}

  async registerWithGuests(
    shiftId: string,
    rawGuestNames: string[],
    availablePlaces: number | null
  ): Promise<string> {
    if (!shiftId.trim()) {
      throw new Error('Choose a shift first.');
    }

    if (availablePlaces === 0) {
      throw new Error('This shift is unavailable.');
    }

    const { validNames, error } = validateGuestNames(rawGuestNames, {
      allowEmptyList: true,
      existingGuestCount: 0,
      availablePlaces,
      includesSelf: true,
    });

    if (error) {
      throw new Error(error);
    }

    return this.repository.registerShiftWithGuests(shiftId, validNames);
  }

  async addGuests(
    registrationId: string,
    rawGuestNames: string[],
    existingGuestCount: number,
    availablePlaces: number | null
  ): Promise<void> {
    if (!registrationId.trim()) {
      throw new Error('Registration not found.');
    }

    if (availablePlaces === 0) {
      throw new Error('Not enough places available for everyone.');
    }

    const { validNames, error } = validateGuestNames(rawGuestNames, {
      allowEmptyList: false,
      existingGuestCount,
      availablePlaces,
      includesSelf: false,
    });

    if (error) {
      throw new Error(error);
    }

    await this.repository.addGuestsToRegistration(registrationId, validNames);
  }

  async listGuests(registrationIds: string[]): Promise<RegistrationGuest[]> {
    if (registrationIds.length === 0) {
      return [];
    }

    return this.repository.listGuestsForRegistrations(registrationIds);
  }
}
