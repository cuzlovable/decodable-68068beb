// Astrology house-placement service.
//
// Primary path: POST birth data to an external astrology API
// (VITE_ASTRO_API_URL + VITE_ASTRO_API_KEY).
// Fallback: a local Placidus computation ("mock mode") used whenever the API
// key is missing or the caller forces it.

export const SIGN_NAMES = [
  "Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo",
  "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces",
];

export type BirthInput = {
  date: string;          // YYYY-MM-DD
  time: string;          // HH:MM (24h, local)
  latitude: number;
  longitude: number;
  houseSystem?: string;  // default "placidus"
  northNodeLongitude: number; // ecliptic degrees 0-360
};

export type NodePlacement = {
  longitude: number;
  sign: string;
  degreeInSign: number;
  house: number;
};

export type ChartData = {
  source: "api" | "mock";
  houseSystem: string;
  cusps: number[];        // 12 cusp longitudes, index 0 = house 1
  ascendant: number;
  midheaven: number;
  northNode: NodePlacement;
  southNode: NodePlacement;
};

const DEG = Math.PI / 180;
const norm = (d: number) => ((d % 360) + 360) % 360;
const sin = (d: number) => Math.sin(d * DEG);
const cos = (d: number) => Math.cos(d * DEG);
const tan = (d: number) => Math.tan(d * DEG);
const asin = (x: number) => Math.asin(Math.max(-1, Math.min(1, x))) / DEG;
const atan2 = (y: number, x: number) => Math.atan2(y, x) / DEG;

export const hasAstroApiKey = () => Boolean(import.meta.env.VITE_ASTRO_API_KEY);

/* ---------------- local (mock) Placidus engine ---------------- */

function julianDay(year: number, month: number, day: number, utHours: number) {
  let y = year;
  let m = month;
  if (m <= 2) { y -= 1; m += 12; }
  const a = Math.floor(y / 100);
  const b = 2 - a + Math.floor(a / 4);
  return (
    Math.floor(365.25 * (y + 4716)) +
    Math.floor(30.6001 * (m + 1)) +
    day + b - 1524.5 + utHours / 24
  );
}

function gmstDegrees(jd: number) {
  const t = (jd - 2451545.0) / 36525;
  const gmst =
    280.46061837 +
    360.98564736629 * (jd - 2451545.0) +
    0.000387933 * t * t -
    (t * t * t) / 38710000;
  return norm(gmst);
}

function obliquity(jd: number) {
  const t = (jd - 2451545.0) / 36525;
  return 23.439291 - 0.0130042 * t;
}

/** Ecliptic longitude of the point whose right ascension is `ra`. */
function longitudeFromRA(ra: number, obl: number) {
  return norm(atan2(sin(ra) / cos(obl), cos(ra)));
}

function declination(lon: number, obl: number) {
  return asin(sin(obl) * sin(lon));
}

/** Placidus intermediate cusp via semi-arc iteration. */
function placidusCusp(ramc: number, lat: number, obl: number, kind: 11 | 12 | 2 | 3) {
  let ra = ramc + (kind === 11 ? 30 : kind === 12 ? 60 : kind === 2 ? 120 : 150);
  let lon = longitudeFromRA(ra, obl);
  for (let i = 0; i < 25; i++) {
    const dec = declination(lon, obl);
    const t = tan(lat) * tan(dec);
    if (Math.abs(t) >= 1) break; // circumpolar — bail to current estimate
    const ad = asin(t);
    const dsa = 90 + ad;
    const nsa = 90 - ad;
    if (kind === 11) ra = ramc + dsa / 3;
    else if (kind === 12) ra = ramc + (2 * dsa) / 3;
    else if (kind === 2) ra = ramc + 180 - (2 * nsa) / 3;
    else ra = ramc + 180 - nsa / 3;
    const next = longitudeFromRA(ra, obl);
    if (Math.abs(norm(next - lon + 180) - 180) < 1e-6) { lon = next; break; }
    lon = next;
  }
  return norm(lon);
}

export function computePlacidus(input: BirthInput): Omit<ChartData, "source"> {
  const [y, m, d] = input.date.split("-").map(Number);
  const [hh, mm] = input.time.split(":").map(Number);
  // Local clock time -> UT using the longitude's mean offset.
  const utHours = hh + (mm || 0) / 60 - input.longitude / 15;
  const jd = julianDay(y, m, d, utHours);
  const obl = obliquity(jd);
  const lst = norm(gmstDegrees(jd) + input.longitude);
  const ramc = lst;

  const mc = longitudeFromRA(ramc, obl);
  const asc = norm(
    atan2(cos(ramc), -(sin(ramc) * cos(obl) + tan(input.latitude) * sin(obl)))
  );

  const cusps = new Array(12).fill(0);
  cusps[0] = asc;
  cusps[9] = mc;
  cusps[10] = placidusCusp(ramc, input.latitude, obl, 11);
  cusps[11] = placidusCusp(ramc, input.latitude, obl, 12);
  cusps[1] = placidusCusp(ramc, input.latitude, obl, 2);
  cusps[2] = placidusCusp(ramc, input.latitude, obl, 3);
  for (let i = 0; i < 6; i++) cusps[i + 6] = norm(cusps[i] + 180);

  const north = input.northNodeLongitude;
  const south = norm(north + 180);
  return {
    houseSystem: input.houseSystem || "placidus",
    cusps,
    ascendant: asc,
    midheaven: mc,
    northNode: placement(north, cusps),
    southNode: placement(south, cusps),
  };
}

export function placement(lon: number, cusps: number[]): NodePlacement {
  const l = norm(lon);
  let house = 1;
  for (let i = 0; i < 12; i++) {
    const start = cusps[i];
    const end = cusps[(i + 1) % 12];
    const span = norm(end - start);
    if (norm(l - start) < span) { house = i + 1; break; }
  }
  const signIndex = Math.floor(l / 30) % 12;
  return {
    longitude: l,
    sign: SIGN_NAMES[signIndex],
    degreeInSign: l - signIndex * 30,
    house,
  };
}

/* ---------------- external API path ---------------- */

async function fetchFromApi(input: BirthInput): Promise<Omit<ChartData, "source">> {
  const url = import.meta.env.VITE_ASTRO_API_URL || "https://json.freeastrologyapi.com/western/houses";
  const key = import.meta.env.VITE_ASTRO_API_KEY as string;
  const [y, m, d] = input.date.split("-").map(Number);
  const [hh, mm] = input.time.split(":").map(Number);

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-api-key": key },
    body: JSON.stringify({
      year: y, month: m, date: d,
      hours: hh, minutes: mm || 0, seconds: 0,
      latitude: input.latitude,
      longitude: input.longitude,
      timezone: -new Date().getTimezoneOffset() / 60,
      config: { observation_point: "topocentric", ayanamsha: "tropical", house_system: input.houseSystem || "placidus" },
    }),
  });
  if (!res.ok) throw new Error(`Astrology API error ${res.status}`);
  const json = await res.json();

  const raw = json?.output ?? json;
  const cuspList: number[] | undefined =
    raw?.Houses?.map?.((h: any) => Number(h.degree ?? h.cusp ?? h)) ??
    raw?.houses?.map?.((h: any) => Number(h.degree ?? h.cusp ?? h)) ??
    raw?.cusps;
  if (!cuspList || cuspList.length < 12) throw new Error("Unexpected astrology API response");

  const cusps = cuspList.slice(0, 12).map(norm);
  const north = norm(input.northNodeLongitude);
  return {
    houseSystem: input.houseSystem || "placidus",
    cusps,
    ascendant: cusps[0],
    midheaven: cusps[9],
    northNode: placement(north, cusps),
    southNode: placement(north + 180, cusps),
  };
}

/** Main service call. `forceMock` skips the API even when a key exists. */
export async function fetchNodeHouses(
  input: BirthInput,
  forceMock = false
): Promise<ChartData> {
  if (!forceMock && hasAstroApiKey()) {
    try {
      return { ...(await fetchFromApi(input)), source: "api" };
    } catch (err) {
      // Fall through to the local engine rather than failing the UI.
      console.warn("Astrology API failed, using local Placidus:", err);
    }
  }
  return { ...computePlacidus(input), source: "mock" };
}
