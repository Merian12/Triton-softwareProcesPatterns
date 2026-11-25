
export type Shift = {
  id: string;
  event_id: string;
  title: string | null;
  description: string | null;
  location: string | null;
  starts_at: string;
  ends_at: string;
  capacity: number | null;
  registered_count: number;
  status: string;
  contact: string | null;
  registration_deadline: string | null;
};

export type Event = {
  id: string;
  title?: string | null;
  name?: string | null;
  description?: string | null;
  location?: string | null;
  starts_at?: string | null;
  shifts: Shift[];
  status: 'draft' | 'published';
};

export type Booking = {
  id: string;
  shift_id: string;
  status: string;
  event: Event;
  shift: Shift;
};

export type RegistrationRow = {
  id: string;
  shift_id: string;
  status: string;
};
