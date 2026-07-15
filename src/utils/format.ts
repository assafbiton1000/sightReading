export function formatMinutes(minutes: number): string {
  return minutes >= 100 ? String(Math.round(minutes)) : minutes.toFixed(minutes < 10 ? 1 : 0);
}

export function formatPoints(points: number): string {
  return points >= 100 ? String(Math.round(points)) : points.toFixed(points % 1 === 0 ? 0 : 1);
}
