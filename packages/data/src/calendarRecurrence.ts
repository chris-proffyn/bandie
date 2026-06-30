export type CalendarRepeatKind = 'weekly' | 'monthly_nth_weekday';

export type CalendarRepeatPattern = {
  kind: CalendarRepeatKind;
  /** 1–4 for first–fourth weekday; -1 for last. Used when kind is monthly_nth_weekday. */
  ordinal?: number;
};

export type CalendarRepeatInput =
  | { kind: 'none' }
  | { kind: 'weekly'; occurrenceCount: number }
  | { kind: 'monthly_nth_weekday'; ordinal: number; occurrenceCount: number };

export type CalendarOccurrence = {
  startsAt: Date;
  endsAt: Date | null;
};

export const CALENDAR_REPEAT_ORDINAL_OPTIONS = [
  { value: 1, label: '1st' },
  { value: 2, label: '2nd' },
  { value: 3, label: '3rd' },
  { value: 4, label: '4th' },
  { value: -1, label: 'Last' },
] as const;

export const CALENDAR_DEFAULT_OCCURRENCE_COUNT = 6;
export const CALENDAR_MAX_OCCURRENCE_COUNT = 52;

const WEEKDAY_LABELS = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
] as const;

export function parseCalendarRepeatPattern(
  value: string | null | undefined,
): CalendarRepeatPattern | null {
  if (!value?.trim()) {
    return null;
  }

  try {
    const parsed = JSON.parse(value) as CalendarRepeatPattern;
    if (parsed.kind === 'weekly') {
      return { kind: 'weekly' };
    }
    if (
      parsed.kind === 'monthly_nth_weekday' &&
      typeof parsed.ordinal === 'number' &&
      [1, 2, 3, 4, -1].includes(parsed.ordinal)
    ) {
      return { kind: 'monthly_nth_weekday', ordinal: parsed.ordinal };
    }
  } catch {
    return null;
  }

  return null;
}

export function serializeCalendarRepeatPattern(pattern: CalendarRepeatPattern): string {
  return JSON.stringify(pattern);
}

export function repeatPatternFromInput(repeat: CalendarRepeatInput): CalendarRepeatPattern | null {
  if (repeat.kind === 'none') {
    return null;
  }
  if (repeat.kind === 'weekly') {
    return { kind: 'weekly' };
  }
  return { kind: 'monthly_nth_weekday', ordinal: repeat.ordinal };
}

export function inferMonthlyOrdinal(date: Date): number {
  const weekday = date.getDay();
  const dayOfMonth = date.getDate();
  let count = 0;

  for (let day = 1; day <= dayOfMonth; day += 1) {
    if (new Date(date.getFullYear(), date.getMonth(), day).getDay() === weekday) {
      count += 1;
    }
  }

  const daysInMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  let lastWeekday = 0;
  for (let day = daysInMonth; day >= 1; day -= 1) {
    if (new Date(date.getFullYear(), date.getMonth(), day).getDay() === weekday) {
      lastWeekday = day;
      break;
    }
  }

  if (dayOfMonth === lastWeekday) {
    return -1;
  }

  return count;
}

export function formatCalendarRepeatPattern(
  pattern: CalendarRepeatPattern | null,
  anchorDate?: Date | string | null,
): string | null {
  if (!pattern) {
    return null;
  }

  const anchor = anchorDate ? new Date(anchorDate) : null;
  const weekdayLabel = anchor ? WEEKDAY_LABELS[anchor.getDay()] : 'weekday';

  if (pattern.kind === 'weekly') {
    return anchor ? `Every ${weekdayLabel}` : 'Every week';
  }

  const ordinal =
    pattern.ordinal ??
    (anchor ? inferMonthlyOrdinal(anchor) : 1);
  const ordinalLabel =
    CALENDAR_REPEAT_ORDINAL_OPTIONS.find((option) => option.value === ordinal)?.label ?? `${ordinal}`;

  return `Every ${ordinalLabel} ${weekdayLabel} of the month`;
}

function copyTime(from: Date, to: Date): Date {
  const result = new Date(to);
  result.setHours(
    from.getHours(),
    from.getMinutes(),
    from.getSeconds(),
    from.getMilliseconds(),
  );
  return result;
}

function getNthWeekdayOfMonth(
  year: number,
  month: number,
  weekday: number,
  ordinal: number,
  timeSource: Date,
): Date | null {
  if (ordinal === -1) {
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    for (let day = daysInMonth; day >= 1; day -= 1) {
      const candidate = new Date(year, month, day);
      if (candidate.getDay() === weekday) {
        return copyTime(timeSource, candidate);
      }
    }
    return null;
  }

  let matches = 0;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  for (let day = 1; day <= daysInMonth; day += 1) {
    const candidate = new Date(year, month, day);
    if (candidate.getDay() !== weekday) {
      continue;
    }
    matches += 1;
    if (matches === ordinal) {
      return copyTime(timeSource, candidate);
    }
  }

  return null;
}

export function expandCalendarOccurrences(input: {
  startsAt: Date;
  endsAt?: Date | null;
  repeat: CalendarRepeatInput;
}): CalendarOccurrence[] {
  const durationMs =
    input.endsAt != null ? input.endsAt.getTime() - input.startsAt.getTime() : null;

  if (input.repeat.kind === 'none') {
    return [
      {
        startsAt: new Date(input.startsAt),
        endsAt: input.endsAt ? new Date(input.endsAt) : null,
      },
    ];
  }

  const count = clampOccurrenceCount(input.repeat.occurrenceCount);
  const occurrences: CalendarOccurrence[] = [];

  if (input.repeat.kind === 'weekly') {
    for (let index = 0; index < count; index += 1) {
      const startsAt = new Date(input.startsAt);
      startsAt.setDate(startsAt.getDate() + index * 7);
      occurrences.push({
        startsAt,
        endsAt:
          durationMs != null && durationMs >= 0
            ? new Date(startsAt.getTime() + durationMs)
            : null,
      });
    }
    return occurrences;
  }

  const weekday = input.startsAt.getDay();
  const ordinal = input.repeat.ordinal;
  let year = input.startsAt.getFullYear();
  let month = input.startsAt.getMonth();

  for (let index = 0; index < count; index += 1) {
    const startsAt = getNthWeekdayOfMonth(year, month, weekday, ordinal, input.startsAt);
    if (!startsAt) {
      break;
    }

    occurrences.push({
      startsAt,
      endsAt:
        durationMs != null && durationMs >= 0
          ? new Date(startsAt.getTime() + durationMs)
          : null,
    });

    month += 1;
    if (month > 11) {
      month = 0;
      year += 1;
    }
  }

  return occurrences;
}

export function clampOccurrenceCount(value: number): number {
  if (!Number.isFinite(value)) {
    return CALENDAR_DEFAULT_OCCURRENCE_COUNT;
  }

  return Math.min(
    CALENDAR_MAX_OCCURRENCE_COUNT,
    Math.max(1, Math.round(value)),
  );
}
