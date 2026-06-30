// Human Design chart calculation via Human Design Hub (HDHub) API.
// API key is read from the HDHUB_API_KEY secret — never exposed to clients.
// Docs: https://humandesignhub.app/en/docs
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const HDHUB_BASE = "https://api.humandesignhub.app/v2";

// HDHub center label → internal CenterId used by the UI.
const CENTER_MAP: Record<string, string> = {
  "Head": "head",
  "Ajna": "ajna",
  "Throat": "throat",
  "G": "g",
  "G Center": "g",
  "Identity": "g",
  "Self": "g",
  "Heart": "heart",
  "Ego": "heart",
  "Will": "heart",
  "Sacral": "sacral",
  "Spleen": "splenic",
  "Splenic": "splenic",
  "Solar Plexus": "solar",
  "Emotional": "solar",
  "Root": "root",
};

function normalizeCenters(centers: string[] = []): string[] {
  return centers
    .map((c) => CENTER_MAP[c] ?? CENTER_MAP[c?.trim?.()] ?? null)
    .filter((c): c is string => !!c);
}

function haversine(lat1: number, lon1: number, lat2: number, lon2: number) {
  const toR = (d: number) => (d * Math.PI) / 180;
  const dLat = toR(lat2 - lat1);
  const dLon = toR(lon2 - lon1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toR(lat1)) * Math.cos(toR(lat2)) * Math.sin(dLon / 2) ** 2;
  return 2 * Math.asin(Math.min(1, Math.sqrt(a)));
}

async function hdhub<T>(path: string, init: RequestInit, apiKey: string): Promise<T> {
  // HDHub free tier limits to 5 req/min. Retry on 429 with backoff.
  for (let attempt = 0; attempt < 4; attempt++) {
    const res = await fetch(`${HDHUB_BASE}${path}`, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        "X-API-KEY": apiKey,
        ...(init.headers ?? {}),
      },
    });
    if (res.ok) return res.json() as Promise<T>;
    const body = await res.text();
    const isRateLimit = res.status === 429 || /rate limit/i.test(body);
    if (isRateLimit && attempt < 3) {
      const waitMs = 13000 * (attempt + 1); // 13s, 26s, 39s
      console.log(`[hdhub] 429 on ${path}, waiting ${waitMs}ms (attempt ${attempt + 1})`);
      await new Promise((r) => setTimeout(r, waitMs));
      continue;
    }
    throw new Error(`HDHub ${path} ${res.status}: ${body}`);
  }
  throw new Error(`HDHub ${path}: exhausted retries`);
}


serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { birth_date, birth_time, birth_location, latitude, longitude } = await req.json();
    const apiKey = Deno.env.get("HDHUB_API_KEY");
    if (!apiKey) throw new Error("HDHUB_API_KEY is not configured");
    if (!birth_date || !birth_time || !birth_location) {
      throw new Error("birth_date, birth_time, and birth_location are required");
    }

    // 1) Resolve IANA timezone. Prefer the lat/lon the client already
    //    resolved via Nominatim — that works for ANY place (county, region,
    //    neighborhood) without depending on HDHub's narrower location index.
    //    Only fall back to HDHub's /locations/search when no coords were sent.
    type LocResult = { latitude: number; longitude: number; timezone: string; label: string };
    let lat = typeof latitude === "number" ? latitude : 0;
    let lon = typeof longitude === "number" ? longitude : 0;
    let timezone: string | undefined;

    if (lat !== 0 || lon !== 0) {
      try {
        const tzRes = await fetch(
          `https://timeapi.io/api/TimeZone/coordinate?latitude=${lat}&longitude=${lon}`,
        );
        if (tzRes.ok) {
          const tzJson = await tzRes.json();
          timezone = tzJson.timeZone;
        }
      } catch (e) {
        console.warn("[calculate-chart] timeapi.io failed:", e);
      }
    }

    if (!timezone) {
      const queryVariants = Array.from(new Set([
        birth_location,
        birth_location.split(",").slice(0, 2).join(",").trim(),
        birth_location.split(",")[0].trim(),
      ].filter(Boolean)));
      let results: LocResult[] = [];
      for (const q of queryVariants) {
        const search = await hdhub<{ results: LocResult[] }>(
          `/locations/search?query=${encodeURIComponent(q)}`,
          { method: "GET" },
          apiKey,
        );
        if (search.results?.length) { results = search.results; break; }
      }
      if (!results.length) throw new Error(`Location not found: ${birth_location}`);
      const best = (lat !== 0 || lon !== 0)
        ? results.reduce((acc, r) =>
            haversine(lat, lon, r.latitude, r.longitude) <
            haversine(lat, lon, acc.latitude, acc.longitude) ? r : acc)
        : results[0];
      timezone = best.timezone;
      lat = lat || best.latitude;
      lon = lon || best.longitude;
    }

    // 2) Resolve the local date/time + IANA tz into an offset-bearing ISO string.
    const time = birth_time.length === 5 ? birth_time : birth_time.slice(0, 5);
    const tzResolved = await hdhub<{ datetime: string }>(
      "/timezone/resolve",
      { method: "POST", body: JSON.stringify({ date: birth_date, time, timezone }) },
      apiKey,
    );

    // 3) Fetch the full bodygraph (Standard plan). Fall back to the free
    //    simple-bodygraph if the API key isn't on Standard yet.
    let raw: any;
    try {
      raw = await hdhub<any>(
        "/bodygraph",
        { method: "POST", body: JSON.stringify({ datetime: tzResolved.datetime, verbose: true }) },
        apiKey,
      );
    } catch (err) {
      const msg = String(err);
      if (msg.includes("403") || msg.includes("402") || msg.includes("Standard plan")) {
        raw = await hdhub<any>(
          "/simple-bodygraph",
          { method: "POST", body: JSON.stringify({ datetime: tzResolved.datetime }) },
          apiKey,
        );
      } else {
        throw err;
      }
    }

    // 4) Normalize for our UI.
    // IMPORTANT: defined_gates must come ONLY from gate_and_line. HDHub's
    // `raw.gates` can include "gate.line" strings (e.g. "13.4"), which when
    // coerced via Number() produce floats like 13.4 — never matching any real
    // gate number and inflating the set with garbage. Trust the planet activations.
    const personality = raw.gate_and_line?.personality ?? {};
    const design = raw.gate_and_line?.design ?? {};
    const toGate = (v: any) => {
      const raw0 = Array.isArray(v) ? v[0] : v;
      const n = typeof raw0 === "string" ? parseInt(raw0, 10) : Number(raw0);
      return Number.isInteger(n) && n >= 1 && n <= 64 ? n : null;
    };
    const personalityGates = Object.values(personality).map(toGate).filter((g): g is number => g !== null);
    const designGates = Object.values(design).map(toGate).filter((g): g is number => g !== null);
    const definedGates = Array.from(new Set<number>([...personalityGates, ...designGates]));

    const definedCenters = normalizeCenters(raw.centers ?? []);

    // Variables → flatten into the simple gate.line numbers our Bodygraph component expects.
    // PHS arrow mapping (Design = top, Personality = bottom):
    //   digestion   = Design Sun/Earth color   (top-left  arrow)
    //   environment = Design Node color        (top-right arrow)
    //   motivation  = Personality Sun/Earth    (bottom-left arrow)
    //   perspective = Personality Node color   (bottom-right arrow)
    const v = raw.variables ?? {};
    const flat = (entry: any) =>
      entry && typeof entry.color === "number" ? entry.color + (entry.tone ?? 0) / 10 : undefined;
    const variables = {
      digestion: flat(v?.design?.["sun/earth"]),
      environment: flat(v?.design?.node),
      motivation: flat(v?.personal?.["sun/earth"]),
      perspective: flat(v?.personal?.node),
      // Back-compat alias for older UI fields.
      awareness: flat(v?.personal?.["sun/earth"]),
    };

    const chart = {
      energy_type: raw.type ?? null,
      authority: raw.authority ?? null,
      profile: raw.profile ?? null,
      strategy: raw.strategy ?? null,
      not_self_theme: raw.not_self_theme ?? null,
      signature: raw.signature ?? null,
      definition: raw.definition ?? null,
      incarnation_cross: raw.incarnation_cross ?? null,
      defined_gates: definedGates,
      defined_centers: definedCenters,
      personality_gates: personalityGates,
      design_gates: designGates,
      personality_planets: Object.entries(personality).map(([planet, gl]: [string, any]) => ({ planet, gate: gl[0], line: gl[1] })),
      design_planets: Object.entries(design).map(([planet, gl]: [string, any]) => ({ planet, gate: gl[0], line: gl[1] })),
      variables,
      raw,
    };

    return new Response(JSON.stringify(chart), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("calculate-chart error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
