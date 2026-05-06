const getKey = (): string => {
  const key = process.env.GOOGLE_MAP_API?.trim() ?? "";
  if (!key) throw new Error("GOOGLE_MAP_API is missing from .env");
  return key;
};

export interface PlaceSuggestion {
  placeId: string;
  name: string;
  address: string;
  category: string;
}

export interface PlaceDetails {
  placeId: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  category: string;
  city: string;
  country: string;
}

export const searchPlaces = async (
  query: string,
  sessionToken?: string,
): Promise<PlaceSuggestion[]> => {
  const key = getKey();
  const params = new URLSearchParams({ input: query, key, language: "en" });
  if (sessionToken) params.set("sessiontoken", sessionToken);

  // NO types parameter — returns everything (cities, businesses, landmarks)
  const url = `https://maps.googleapis.com/maps/api/place/autocomplete/json?${params}`;
  console.log("📍 Places autocomplete:", query);

  const res = await fetch(url);
  if (!res.ok)
    throw new Error(`Places autocomplete HTTP error [${res.status}]`);

  const data = (await res.json()) as {
    status: string;
    predictions: Array<{
      place_id: string;
      description: string;
      structured_formatting: { main_text: string; secondary_text: string };
      types: string[];
    }>;
    error_message?: string;
  };

  console.log("📍 Places status:", data.status);

  if (data.status === "ZERO_RESULTS") return [];
  if (data.status !== "OK") {
    throw new Error(
      `Places API error: ${data.status}${data.error_message ? " — " + data.error_message : ""}`,
    );
  }

  return data.predictions.map((p) => ({
    placeId: p.place_id,
    name: p.structured_formatting.main_text,
    address: p.structured_formatting.secondary_text,
    category: inferCategory(p.types),
  }));
};

export const getPlaceDetails = async (
  placeId: string,
): Promise<PlaceDetails> => {
  const key = getKey();
  const params = new URLSearchParams({
    place_id: placeId,
    fields: "name,geometry,formatted_address,address_components,types",
    key,
    language: "en",
  });

  const url = `https://maps.googleapis.com/maps/api/place/details/json?${params}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Place details HTTP error [${res.status}]`);

  const data = (await res.json()) as {
    status: string;
    result: {
      name: string;
      formatted_address: string;
      geometry: { location: { lat: number; lng: number } };
      address_components: Array<{ long_name: string; types: string[] }>;
      types: string[];
    };
    error_message?: string;
  };

  if (data.status !== "OK") {
    throw new Error(
      `Place details error: ${data.status}${data.error_message ? " — " + data.error_message : ""}`,
    );
  }

  const r = data.result;
  const city =
    r.address_components.find(
      (c) =>
        c.types.includes("locality") ||
        c.types.includes("administrative_area_level_1"),
    )?.long_name ?? "";
  const country =
    r.address_components.find((c) => c.types.includes("country"))?.long_name ??
    "";

  return {
    placeId,
    name: r.name,
    address: r.formatted_address,
    lat: r.geometry.location.lat,
    lng: r.geometry.location.lng,
    category: inferCategory(r.types),
    city,
    country,
  };
};

/** Reverse geocode lat/lng → place label + city using Google Geocoding API */
export const reverseGeocode = async (
  lat: number,
  lng: number,
): Promise<{ label: string; city: string; country: string }> => {
  const url =
    `https://maps.googleapis.com/maps/api/geocode/json` +
    `?latlng=${lat},${lng}&key=${process.env.GOOGLE_MAP_API}`;

  const res = await fetch(url);
  const data = (await res.json()) as {
    status: string;
    results: {
      formatted_address: string;
      address_components: { long_name: string; types: string[] }[];
    }[];
  };

  if (data.status !== "OK" || !data.results.length) {
    throw new Error(`Geocoding failed: ${data.status}`);
  }

  const components = data.results[0].address_components;

  const get = (...types: string[]) =>
    components.find((c) => types.some((t) => c.types.includes(t)))?.long_name ??
    "";

  const neighbourhood = get(
    "sublocality_level_1",
    "neighborhood",
    "sublocality",
  );
  const city = get(
    "locality",
    "administrative_area_level_2",
    "administrative_area_level_1",
  );
  const country = get("country");
  const label =
    neighbourhood && city
      ? `${neighbourhood} · ${city}`
      : city || data.results[0].formatted_address.split(",")[0];

  return { label, city, country };
};

const inferCategory = (types: string[]): string => {
  if (
    types.some((t) =>
      ["locality", "administrative_area_level_1", "country"].includes(t),
    )
  )
    return "city";
  if (
    types.some((t) =>
      ["natural_feature", "landmark", "point_of_interest"].includes(t),
    )
  )
    return "landmark";
  if (
    types.some((t) =>
      ["restaurant", "food", "cafe", "bar", "bakery"].includes(t),
    )
  )
    return "food";
  if (
    types.some((t) => ["shopping_mall", "store", "clothing_store"].includes(t))
  )
    return "shopping";
  if (
    types.some((t) => ["airport", "transit_station", "bus_station"].includes(t))
  )
    return "transit";
  if (
    types.some((t) =>
      ["park", "beach", "campground", "zoo", "amusement_park"].includes(t),
    )
  )
    return "nature";
  if (
    types.some((t) =>
      ["hospital", "school", "university", "library"].includes(t),
    )
  )
    return "institution";
  if (types.includes("establishment")) return "business";
  return "place";
};
