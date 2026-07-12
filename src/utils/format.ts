export function formatMinutes(minutes: number): string {
  return minutes >= 100 ? String(Math.round(minutes)) : minutes.toFixed(minutes < 10 ? 1 : 0);
}
