# Administrator dashboard

Open `/login` and sign in with an existing Supabase user whose `profiles` row has the `organizer` role. The dashboard is at `/organizer-dashboard`; existing role checks and logout remain in place.

## Interface

- A compact 64px header uses `#ff0000`, with the existing logo rendered in white for contrast.
- The navigation matches the volunteer portal: Overview, Find events, My shifts, Messages.
- Overview shows upcoming published events, a calendar and compact staffing totals. Find events includes drafts and past events.
- Both dashboards render `ShiftCalendar`. The volunteer wrapper still loads registered shifts from Supabase; the organizer passes the shifts from its current event repository. Month navigation, day selection and calendar styling are shared.
- Each staffing icon represents one volunteer place. Filled places are light green (`#86efac`); empty places are grey. The numeric count remains available alongside an accessible label.
- Create event uses a white button with a red outline. The event editor, validation errors, dates and navigation are in English.
- My shifts lists the organizer's event shifts, with the availability filter and volunteer rosters. Messages has an empty state; messaging has not been implemented.
- Demo explanation paragraphs and published/available-place captions have been removed from the interface.

## Existing event workflow

The three-step editor preserves values when moving back. Drafts may be incomplete, but names and any supplied dates/shifts must be valid. Publishing requires all event details and at least one valid shift. Existing registrations cannot be removed through the editor, capacity cannot be reduced below enrollment, and schedule/location/task changes require acknowledgement before saving. Navigation and logout still confirm before discarding unsaved changes.

## Data and architecture

The event path remains UI → EventService → IEventRepository → DemoEventRepository. Event changes remain in memory for the current dashboard mount and reset on reload; these UI changes do not connect event storage to Supabase. Supabase authentication and the volunteer calendar's existing database integration are unchanged.

Staffing totals count places across upcoming published events, using the current date in Europe/Copenhagen. Drafts are excluded. The same volunteer may occupy places on different shifts.

## Verification

Run `npm run lint`, `npm run test:run`, and `npm run build`.

Tests cover event validation, draft handling, protected registrations, editor navigation, availability filtering, unsaved changes, the four navigation tabs, calendar navigation and shift markers, and the five-filled/eight-total staffing example. Calendar tests mock Supabase rather than requiring live credentials.
