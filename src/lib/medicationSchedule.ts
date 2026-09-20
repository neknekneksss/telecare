import { Prescription } from "@/lib/types";

export interface MedicationDose {
  prescriptionId: string;
  scheduledFor: string;
  label: string;
}

/**
 * Normalizes schedule text so small wording differences
 * don't break schedule generation.
 */
function normalizeSchedule(schedule: string): string {
  return schedule.trim().toLowerCase().replace(/\s+/g, " ");
}

/**
 * Converts a prescription nextDose value into a real Date.
 *
 * The doctor prescription form uses <input type="time">,
 * which stores values such as "08:00".
 *
 * We therefore support:
 * - "08:00"
 * - "20:30"
 * - full ISO timestamps
 */
function parseNextDose(nextDose: string, referenceDate: Date): Date | null {
  const value = nextDose.trim();

  if (!value) {
    return null;
  }

  /*
   * Time-only value from <input type="time">.
   *
   * Example:
   * "08:30" -> reference date at 8:30 AM
   */
  const timeMatch = value.match(/^(\d{2}):(\d{2})$/);

  if (timeMatch) {
    const hours = Number(timeMatch[1]);
    const minutes = Number(timeMatch[2]);

    if (
      !Number.isInteger(hours) ||
      !Number.isInteger(minutes) ||
      hours < 0 ||
      hours > 23 ||
      minutes < 0 ||
      minutes > 59
    ) {
      return null;
    }

    const result = new Date(referenceDate);

    result.setHours(hours, minutes, 0, 0);

    return result;
  }

  /*
   * Full date/time value.
   *
   * This keeps the function compatible with existing
   * prescriptions that may already contain ISO timestamps.
   */
  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  return parsed;
}

/**
 * Returns the interval in hours for fixed-interval schedules.
 *
 * Supports:
 * - Every 4 hours
 * - Every 6 hours
 * - Every 8 hours
 * - Every 12 hours
 * - Every 6 hrs
 * - q6h
 * - q8h
 * - q12h
 */
function getIntervalHours(schedule: string): number | null {
  const normalized = normalizeSchedule(schedule);

  const everyMatch = normalized.match(
    /every\s+(\d+(?:\.\d+)?)\s*(?:hours?|hrs?)/i,
  );

  if (everyMatch) {
    const hours = Number(everyMatch[1]);

    return Number.isFinite(hours) && hours > 0 ? hours : null;
  }

  const qMatch = normalized.match(/\bq(\d+(?:\.\d+)?)\s*h(?:ours?)?\b/i);

  if (qMatch) {
    const hours = Number(qMatch[1]);

    return Number.isFinite(hours) && hours > 0 ? hours : null;
  }

  return null;
}

/**
 * Returns the number of daily doses for common frequency-based schedules.
 */
function getDailyDoseCount(schedule: string): number | null {
  const normalized = normalizeSchedule(schedule);

  if (
    normalized === "once daily" ||
    normalized === "once a day" ||
    normalized === "daily" ||
    normalized === "once" ||
    normalized === "qd"
  ) {
    return 1;
  }

  if (
    normalized === "twice daily" ||
    normalized === "twice a day" ||
    normalized === "2 times daily" ||
    normalized === "2 times a day" ||
    normalized === "2x daily" ||
    normalized === "bid"
  ) {
    return 2;
  }

  if (
    normalized === "three times daily" ||
    normalized === "three times a day" ||
    normalized === "3 times daily" ||
    normalized === "3 times a day" ||
    normalized === "3x daily" ||
    normalized === "tid"
  ) {
    return 3;
  }

  if (
    normalized === "four times daily" ||
    normalized === "four times a day" ||
    normalized === "4 times daily" ||
    normalized === "4 times a day" ||
    normalized === "4x daily" ||
    normalized === "qid"
  ) {
    return 4;
  }

  return null;
}

/**
 * Determines whether a medication is taken only as needed.
 */
function isAsNeededSchedule(schedule: string): boolean {
  const normalized = normalizeSchedule(schedule);

  return (
    normalized === "as needed" ||
    normalized === "when needed" ||
    normalized === "prn" ||
    normalized.includes("as needed") ||
    normalized.includes("when needed") ||
    /\bprn\b/i.test(normalized)
  );
}

/**
 * Formats a dose time for display.
 */
export function formatDoseTime(dateTime: string): string {
  const date = new Date(dateTime);

  if (Number.isNaN(date.getTime())) {
    return "Invalid time";
  }

  return new Intl.DateTimeFormat("en-PH", {
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

/**
 * Creates a Date using the time from sourceDate
 * and the calendar date from targetDate.
 */
function createDateWithTargetDay(sourceDate: Date, targetDate: Date): Date {
  const result = new Date(targetDate);

  result.setHours(
    sourceDate.getHours(),
    sourceDate.getMinutes(),
    sourceDate.getSeconds(),
    sourceDate.getMilliseconds(),
  );

  return result;
}

/**
 * Generates dose occurrences for a single prescription
 * on a specific calendar date.
 *
 * nextDose may be either:
 * - "08:00"
 * - "20:30"
 * - an ISO timestamp
 */
export function generateDosesForDate(
  prescription: Prescription,
  targetDate: Date = new Date(),
): MedicationDose[] {
  const normalizedSchedule = normalizeSchedule(prescription.schedule ?? "");

  /*
   * As-needed medications have no automatic dose occurrences.
   */
  if (isAsNeededSchedule(normalizedSchedule)) {
    return [];
  }

  /*
   * Important:
   *
   * The doctor form stores nextDose as "HH:MM".
   * We parse it against targetDate instead of calling
   * new Date("HH:MM"), which is invalid.
   */
  const nextDose = parseNextDose(prescription.nextDose, targetDate);

  if (!nextDose) {
    return [];
  }

  const startOfTargetDay = new Date(targetDate);
  startOfTargetDay.setHours(0, 0, 0, 0);

  const endOfTargetDay = new Date(startOfTargetDay);
  endOfTargetDay.setDate(endOfTargetDay.getDate() + 1);

  const doses: MedicationDose[] = [];

  /*
   * FIXED INTERVAL SCHEDULES
   *
   * Examples:
   * Every 4 hours
   * Every 6 hours
   * Every 8 hours
   * Every 12 hours
   */
  const intervalHours = getIntervalHours(prescription.schedule);

  if (intervalHours) {
    const intervalMs = intervalHours * 60 * 60 * 1000;

    /*
     * Start from the specified next-dose time.
     */
    let occurrence = new Date(nextDose);

    /*
     * Move backwards until we reach the earliest
     * occurrence that belongs to today.
     */
    while (occurrence.getTime() - intervalMs >= startOfTargetDay.getTime()) {
      occurrence = new Date(occurrence.getTime() - intervalMs);
    }

    /*
     * Generate every interval throughout the day.
     */
    while (occurrence < endOfTargetDay) {
      if (occurrence >= startOfTargetDay && occurrence < endOfTargetDay) {
        doses.push({
          prescriptionId: prescription.id,
          scheduledFor: occurrence.toISOString(),
          label: formatDoseTime(occurrence.toISOString()),
        });
      }

      occurrence = new Date(occurrence.getTime() + intervalMs);
    }

    return doses;
  }

  /*
   * DAILY FREQUENCY SCHEDULES
   *
   * Once daily       -> 1 dose
   * Twice daily      -> 2 doses
   * Three times daily -> 3 doses
   * Four times daily -> 4 doses
   */
  const dailyDoseCount = getDailyDoseCount(prescription.schedule);

  if (dailyDoseCount) {
    const intervalMs = (24 * 60 * 60 * 1000) / dailyDoseCount;

    /*
     * nextDose's time becomes today's first dose.
     */
    const firstOccurrence = createDateWithTargetDay(nextDose, targetDate);

    for (let index = 0; index < dailyDoseCount; index += 1) {
      const occurrence = new Date(
        firstOccurrence.getTime() + index * intervalMs,
      );

      if (occurrence >= startOfTargetDay && occurrence < endOfTargetDay) {
        doses.push({
          prescriptionId: prescription.id,
          scheduledFor: occurrence.toISOString(),
          label: formatDoseTime(occurrence.toISOString()),
        });
      }
    }

    return doses;
  }

  /*
   * FALLBACK
   *
   * For an otherwise valid non-PRN prescription whose
   * schedule format isn't recognized, treat nextDose as
   * one dose for the target day.
   */
  const fallbackOccurrence = createDateWithTargetDay(nextDose, targetDate);

  if (
    fallbackOccurrence >= startOfTargetDay &&
    fallbackOccurrence < endOfTargetDay
  ) {
    doses.push({
      prescriptionId: prescription.id,
      scheduledFor: fallbackOccurrence.toISOString(),
      label: formatDoseTime(fallbackOccurrence.toISOString()),
    });
  }

  return doses;
}

/**
 * Generates today's doses for multiple prescriptions.
 */
export function generateTodayDoses(
  prescriptions: Prescription[],
  targetDate: Date = new Date(),
): MedicationDose[] {
  return prescriptions
    .flatMap((prescription) => generateDosesForDate(prescription, targetDate))
    .sort(
      (a, b) =>
        new Date(a.scheduledFor).getTime() - new Date(b.scheduledFor).getTime(),
    );
}

/**
 * Determines whether a scheduled dose is in the past.
 */
export function isDosePast(scheduledFor: string): boolean {
  return new Date(scheduledFor).getTime() < Date.now();
}

/**
 * Determines whether a scheduled dose is upcoming.
 */
export function isDoseUpcoming(scheduledFor: string): boolean {
  return new Date(scheduledFor).getTime() > Date.now();
}
