import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const GATEWAY_URL = "https://connector-gateway.lovable.dev/google_maps";

function distanceMiles(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const R = 3958.8;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const la1 = (a.lat * Math.PI) / 180;
  const la2 = (b.lat * Math.PI) / 180;
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(la1) * Math.cos(la2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { latitude, longitude, keywords, gate, gateName } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const GOOGLE_MAPS_API_KEY = Deno.env.get("GOOGLE_MAPS_API_KEY");
    if (!LOVABLE_API_KEY || !GOOGLE_MAPS_API_KEY) {
      throw new Error("Missing Google Maps connector credentials");
    }
    if (typeof latitude !== "number" || typeof longitude !== "number") {
      return new Response(JSON.stringify({ error: "latitude and longitude are required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const queries: string[] = Array.isArray(keywords) && keywords.length
      ? keywords.slice(0, 4)
      : ["park"];

    const origin = { lat: latitude, lng: longitude };
    const seen = new Set<string>();
    const places: any[] = [];

    for (const q of queries) {
      const res = await fetch(`${GATEWAY_URL}/places/v1/places:searchText`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "X-Connection-Api-Key": GOOGLE_MAPS_API_KEY,
          "Content-Type": "application/json",
          "X-Goog-FieldMask":
            "places.id,places.displayName,places.formattedAddress,places.location,places.primaryTypeDisplayName,places.rating",
        },
        body: JSON.stringify({
          textQuery: String(q),
          maxResultCount: 4,
          locationBias: {
            circle: { center: { latitude, longitude }, radius: 25000 },
          },
        }),
      });

      if (res.status === 403) {
        const details: Array<{ reason?: string }> = (await res.json())?.error?.details ?? [];
        const reason = details.find((d) => d.reason)?.reason;
        if (reason === "API_KEY_HTTP_REFERRER_BLOCKED") {
          throw new Error(
            'Google Maps server key is referrer-restricted. Set the server key\'s application restrictions to "None" or "IP addresses".'
          );
        }
        if (reason === "API_KEY_SERVICE_BLOCKED") {
          throw new Error(
            "Google Maps server key does not allow the Places API. Add it to the key's allowed-APIs list."
          );
        }
        throw new Error("Google Maps request was denied (403).");
      }

      if (!res.ok) {
        const errorBody = await res.text();
        console.error(`Gateway request failed [${res.status}]: ${errorBody}`);
        return new Response(
          JSON.stringify({ error: "Places request failed", status: res.status, details: errorBody }),
          { status: res.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const data = await res.json();
      for (const p of data.places ?? []) {
        if (!p.id || seen.has(p.id)) continue;
        seen.add(p.id);
        const loc = p.location ?? {};
        places.push({
          id: p.id,
          name: p.displayName?.text ?? "Unnamed place",
          type: p.primaryTypeDisplayName?.text ?? q,
          address: p.formattedAddress ?? "",
          rating: p.rating ?? null,
          tag: q,
          distance:
            typeof loc.latitude === "number"
              ? Number(distanceMiles(origin, { lat: loc.latitude, lng: loc.longitude }).toFixed(1))
              : null,
          alignment: gate
            ? `Matches Gate ${gate}${gateName ? ` — ${gateName}` : ""}`
            : "Matches your nodal environment",
          mapsUrl: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
            p.displayName?.text ?? ""
          )}&query_place_id=${p.id}`,
          directionsUrl: `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
            p.formattedAddress ?? p.displayName?.text ?? ""
          )}&destination_place_id=${p.id}`,
        });
      }
    }

    places.sort((a, b) => (a.distance ?? 999) - (b.distance ?? 999));

    return new Response(JSON.stringify({ places: places.slice(0, 8) }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("nodal-spots error:", err);
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
