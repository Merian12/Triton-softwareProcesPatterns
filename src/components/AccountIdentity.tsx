import { displayNameFor } from '@/services/authService';

type AccountIdentityProps = {
  email: string;
  username?: string;
  roleLabel: string;
  roleClassName?: string;
};

/**
 * Displays the signed-in user's avatar icon, username (or email fallback), and role label.
 */
export function AccountIdentity({
  email,
  username,
  roleLabel,
  roleClassName = 'text-neutral-600',
}: AccountIdentityProps) {
  const name = displayNameFor(email, username);

  return (
    <>
      <svg aria-hidden="true" viewBox="0 0 32 40" className="hidden h-7 w-6 fill-current sm:block">
        <circle cx="16" cy="10" r="8" />
        <path d="M1 36a15 15 0 0 1 30 0v2H1Z" />
      </svg>
      <span className="text-left">
        <span className="block max-w-28 truncate text-sm font-semibold">{name}</span>
        <span className={`block text-[11px] ${roleClassName}`}>{roleLabel}</span>
      </span>
    </>
  );
}
