export { portalButton as button, portalPrimary as primary } from '@/components/portalStyles';
export const panel = 'border-b border-neutral-200 pb-7';
export function dateLabel(value: string) {
  return value ? new Date(`${value}T12:00:00`).toLocaleDateString('da-DK', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Ikke angivet';
}
