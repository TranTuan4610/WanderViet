export function getTodayDateInputValue(now = new Date()) {
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function isPastDateValue(value: string, today = getTodayDateInputValue()) {
  return Boolean(value) && value < today;
}

export function getDateTimeFromDateAndTime(dateValue: string, timeValue: string) {
  const [year, month, day] = dateValue.split("-").map(Number);
  const [hours, minutes] = timeValue.split(":").map(Number);
  return new Date(year, month - 1, day, hours, minutes, 0, 0);
}

export function isFlightDepartingMoreThanOneHourFromNow(dateValue: string, departTime: string, now = new Date()) {
  if (!dateValue) return true;
  const departureAt = getDateTimeFromDateAndTime(dateValue, departTime);
  return departureAt.getTime() > now.getTime() + 60 * 60 * 1000;
}