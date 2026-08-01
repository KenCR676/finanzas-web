export type PeriodMode = "monthly" | "fortnightly";

const costaRicaDate = new Intl.DateTimeFormat("en-CA", {
  timeZone: "America/Costa_Rica",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

const periodLabel = new Intl.DateTimeFormat("es-CR", {
  month: "short",
  year: "2-digit",
  timeZone: "UTC",
});

function dateParts(date: Date) {
  const parts = costaRicaDate.formatToParts(date);
  const value = (type: Intl.DateTimeFormatPartTypes) =>
    Number(parts.find((part) => part.type === type)?.value);
  return { year: value("year"), month: value("month"), day: value("day") };
}

function iso(date: Date) {
  return date.toISOString().slice(0, 10);
}

function rangeForDate(mode: PeriodMode, reference: Date) {
  const { year, month, day } = dateParts(reference);
  const lastDay = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const startDay = mode === "monthly" ? 1 : day <= 15 ? 1 : 16;
  const endDay = mode === "monthly" ? lastDay : day <= 15 ? 15 : lastDay;
  const startDate = new Date(Date.UTC(year, month - 1, startDay));
  const endDate = new Date(Date.UTC(year, month - 1, endDay));
  const monthName = new Intl.DateTimeFormat("es-CR", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(startDate);

  return {
    start: iso(startDate),
    end: iso(endDate),
    startDate,
    endDate,
    label:
      mode === "monthly"
        ? monthName
        : `${startDay}–${endDay} de ${monthName}`,
  };
}

export function currentPeriod(mode: PeriodMode) {
  return rangeForDate(mode, new Date());
}

export function todayInCostaRica() {
  return costaRicaDate.format(new Date());
}

export function recentPeriods(mode: PeriodMode, count = 6) {
  const periods = [];
  let reference = new Date();

  for (let index = 0; index < count; index += 1) {
    const range = rangeForDate(mode, reference);
    periods.unshift({
      ...range,
      key: `${range.start}:${range.end}`,
      shortLabel:
        mode === "monthly"
          ? periodLabel.format(range.startDate).replace(".", "")
          : `${range.startDate.getUTCDate()}–${range.endDate.getUTCDate()} ${new Intl.DateTimeFormat(
              "es-CR",
              { month: "short", timeZone: "UTC" },
            )
              .format(range.startDate)
              .replace(".", "")}`,
    });
    // Noon UTC maps safely to the previous calendar day in Costa Rica.
    reference = new Date(range.startDate.getTime() - 12 * 60 * 60 * 1000);
  }

  return periods;
}

export function normalizePeriodMode(value: unknown): PeriodMode {
  return value === "fortnightly" ? "fortnightly" : "monthly";
}
