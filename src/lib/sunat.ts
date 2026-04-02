const DEADLINE_MAP: Record<string, number> = {
  "0": 7,
  "1": 8,
  "2": 9,
  "3": 10,
  "4": 11,
  "5": 12,
  "6": 13,
  "7": 14,
  "8": 15,
  "9": 16,
};

export function sunatDeadlineDay(ruc: string): number {
  const lastDigit = ruc.slice(-1);
  return DEADLINE_MAP[lastDigit] ?? 16;
}

export function getUltimoDigitoRUC(ruc: string): string {
  return ruc.slice(-1);
}
