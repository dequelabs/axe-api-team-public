export function getWeekNumber(date: Date): number {
  const firstDayOfYear: Date = new Date(date.getTime())
  firstDayOfYear.setMonth(0, 1)
  const dayOfYear =
    Math.floor(
      (date.getTime() - firstDayOfYear.getTime()) / (24 * 60 * 60 * 1000)
    ) + 1
  const weekNumber = Math.ceil((firstDayOfYear.getDay() + dayOfYear) / 7)

  return weekNumber
}

export function isReleaseWeek(weekNumber: number, oddWeek: boolean): boolean {
  const offset = oddWeek ? 1 : 0

  return (weekNumber + offset) % 2 === 0
}
