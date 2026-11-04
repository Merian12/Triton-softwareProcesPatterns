import { UpcomingEvent } from '@/services/profileService';

interface UpcomingEventsProps {
  events: UpcomingEvent[];
  signedUpIds: string[];
  onToggleSignUp: (eventId: string) => void;
}

export default function UpcomingEvents({ events, signedUpIds, onToggleSignUp }: UpcomingEventsProps) {
  return (
    <ul className="mt-2 space-y-2">
      {events.map((event) => {
        const isSignedUp = signedUpIds.includes(event.id);

        return (
          <li
            key={event.id}
            className={`flex items-center justify-between rounded-lg border-l-4 bg-white p-4 shadow ${
              isSignedUp ? 'border-green-600' : 'border-blue-600'
            }`}
          >
            <div>
              <p className="font-medium text-gray-800">
                {event.name}
                <span
                  className={`ml-2 rounded-full px-2 py-0.5 text-xs font-semibold ${
                    isSignedUp ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'
                  }`}
                >
                  {isSignedUp ? 'Tilmeldt' : 'Kommende'}
                </span>
              </p>
              <p className="text-sm text-gray-500">{event.date}, {event.location}</p>
            </div>
            <button
              onClick={() => onToggleSignUp(event.id)}
              className={`rounded-md px-4 py-2 text-sm font-semibold ${
                isSignedUp ? 'bg-gray-200 text-gray-800' : 'bg-blue-600 text-white'
              }`}
            >
              {isSignedUp ? 'Afmeld' : 'Tilmeld'}
            </button>
          </li>
        );
      })}
    </ul>
  );
}
