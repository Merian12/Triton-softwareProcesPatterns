type Props = { filled: number; capacity: number; label?: string };

export default function StaffingIcons({ filled, capacity, label = 'Volunteer places' }: Props) {
  return <div className="mt-3">
    <div role="img" aria-label={`${label}: ${filled} of ${capacity} filled`} className="flex flex-wrap items-center gap-1">
      {Array.from({ length: capacity }, (_, index) => <svg key={index} aria-hidden="true" viewBox="0 0 20 24"
        className={`h-6 w-5 shrink-0 stroke-[1.2] ${index < filled ? 'fill-[#86efac] stroke-[#16a34a]' : 'fill-neutral-100 stroke-neutral-300'}`}>
        <circle cx="10" cy="5" r="3.5" />
        <path d="M3 22v-5a7 7 0 0 1 14 0v5Z" />
      </svg>)}
    </div>
    <p className="mt-1.5 text-xs tabular-nums text-neutral-500">{filled} / {capacity} signed up</p>
  </div>;
}
