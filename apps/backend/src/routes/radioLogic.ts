export interface RadioClockSlot {
  startedAt: Date;
  duration: number;
}

export function radioPosition(slot: RadioClockSlot, now = new Date()): number {
  return Math.max(0, Math.floor((now.getTime() - slot.startedAt.getTime()) / 1000));
}

export function isRadioSlotExpired(slot: RadioClockSlot, now = new Date()): boolean {
  return radioPosition(slot, now) >= Math.max(1, Math.floor(slot.duration));
}

export function nextRadioStartTime(previous: RadioClockSlot | null, now = new Date()): Date {
  if (!previous) return now;
  const naturalEnd = previous.startedAt.getTime() + Math.max(1, previous.duration) * 1000;
  return new Date(Math.max(naturalEnd, now.getTime()));
}
