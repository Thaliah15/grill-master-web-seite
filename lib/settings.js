export function parseHHMM(s) {
  const m = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(String(s || "").trim());
  if (!m) return null;
  return { h: Number(m[1]), m: Number(m[2]) };
}

export function minutesOfDay(hhmm) {
  const p = parseHHMM(hhmm);
  if (!p) return null;
  return p.h * 60 + p.m;
}

export function berlinNowMinutes() {
  const parts = new Intl.DateTimeFormat("de-DE", {
    timeZone: "Europe/Berlin",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(new Date());
  const h = Number(parts.find(p => p.type === "hour")?.value ?? 0);
  const m = Number(parts.find(p => p.type === "minute")?.value ?? 0);
  return h * 60 + m;
}

export function isOpenNow(settings) {
  const openMin = minutesOfDay(settings.openTime);
  const closeMin = minutesOfDay(settings.closeTime);
  if (openMin == null || closeMin == null) return true;

  const now = berlinNowMinutes();
  // if close after midnight
  if (closeMin <= openMin) {
    return now >= openMin || now < closeMin;
  }
  return now >= openMin && now < closeMin;
}
