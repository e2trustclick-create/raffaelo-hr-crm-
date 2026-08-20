/**
 * Albanian Date & Formatting Utilities
 */

export const ALBANIAN_MONTHS = [
  'Janar',
  'Shkurt',
  'Mars',
  'Prill',
  'Maj',
  'Qershor',
  'Korrik',
  'Gusht',
  'Shtator',
  'Tetor',
  'Nëntor',
  'Dhjetor',
];

export const ALBANIAN_DAYS = [
  'E Diel',
  'E Hënë',
  'E Martë',
  'E Mërkurë',
  'E Enjte',
  'E Premte',
  'E Shtunë',
];

export const ALBANIAN_DAYS_SHORT = ['Die', 'Hën', 'Mar', 'Mër', 'Enj', 'Pre', 'Sht'];

export function formatAlbanianDate(dateString: string): string {
  if (!dateString) return '';
  const [year, month, day] = dateString.split('-').map(Number);
  if (!year || !month || !day) return dateString;
  const monthName = ALBANIAN_MONTHS[month - 1] || '';
  return `${day} ${monthName} ${year}`;
}

export function formatAlbanianDateWithDay(dateString: string): string {
  if (!dateString) return '';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return dateString;
  const dayName = ALBANIAN_DAYS[date.getDay()];
  const [year, month, day] = dateString.split('-').map(Number);
  const monthName = ALBANIAN_MONTHS[month - 1] || '';
  return `${dayName}, ${day} ${monthName} ${year}`;
}

export function getTodayString(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getCurrentMonthString(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

export function formatMonthName(monthKey: string): string {
  const [year, month] = monthKey.split('-').map(Number);
  const monthName = ALBANIAN_MONTHS[month - 1] || '';
  return `${monthName} ${year}`;
}

/** Numri real i ditëve të muajit (28-31), p.sh. "2026-02" -> 28. Pa argument, muaji aktual. */
export function getDaysInMonth(monthKey: string = getCurrentMonthString()): number {
  const [year, month] = monthKey.split('-').map(Number);
  return new Date(year, month, 0).getDate();
}

export function calculateHoursBetween(start: string, end: string): number {
  if (!start || !end) return 0;
  const [startH, startM] = start.split(':').map(Number);
  const [endH, endM] = end.split(':').map(Number);
  let totalMinutes = endH * 60 + endM - (startH * 60 + startM);
  if (totalMinutes < 0) {
    // Overnight shift
    totalMinutes += 24 * 60;
  }
  return Number((totalMinutes / 60).toFixed(1));
}

export function formatCurrency(amount: number): string {
  const rounded = Math.round(amount);
  const grouped = Math.abs(rounded).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  return (rounded < 0 ? '-' : '') + grouped + ' Lekë';
}
