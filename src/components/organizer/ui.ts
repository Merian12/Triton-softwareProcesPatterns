const action = 'inline-flex min-h-10 cursor-pointer items-center justify-center rounded-lg border px-4 py-2 text-sm transition-colors focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#ff0000] disabled:cursor-not-allowed disabled:opacity-40';
export const button = `${action} border-neutral-300 bg-white text-neutral-900 hover:bg-neutral-50`;
export const primary = `${action} border-[#ff0000] bg-white font-semibold text-neutral-900 hover:bg-[#ff0000]/5`;
export const panel = 'border-b border-neutral-200 pb-7';
export function dateLabel(value: string) {
  return value ? new Date(`${value}T12:00:00`).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Not specified';
}
