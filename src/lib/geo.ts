// Calculate distance between two coordinate points in kilometers using Haversine formula
export function calculateDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Radius of earth in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

// Obfuscate coordinates slightly for user privacy (approx 150-300m radius jitter)
export function fuzzCoordinates(lat: number, lon: number): { lat: number; lon: number } {
  const seed = (Math.sin(lat * 1000 + lon * 2000) * 10000) % 1;
  const latOffset = (seed - 0.5) * 0.003; // ~150-300 meters
  const lonOffset = (Math.cos(lat * 1000 + lon * 2000) - 0.5) * 0.003;
  return {
    lat: Number((lat + latOffset).toFixed(5)),
    lon: Number((lon + lonOffset).toFixed(5)),
  };
}

// Dynamic Search for ANY place/city/thana/area in Bangladesh via OpenStreetMap Nominatim
export async function searchLocationsBD(query: string): Promise<Array<{ name: string; lat: number; lon: number }>> {
  if (!query || query.trim().length < 2) return [];
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
        query.trim()
      )}&countrycodes=bd&limit=6&addressdetails=1`,
      {
        headers: {
          "Accept-Language": "bn,en",
        },
      }
    );
    if (!res.ok) return [];
    const data = await res.json();
    return data.map((item: any) => {
      const parts = item.display_name.split(", ");
      const shortName = parts.slice(0, 3).join(", ");
      return {
        name: shortName || item.display_name,
        lat: parseFloat(item.lat),
        lon: parseFloat(item.lon),
      };
    });
  } catch (err) {
    console.warn("Geocoding search failed:", err);
    return [];
  }
}

// Dynamic Reverse Geocode (GPS Coordinates -> Exact Human Readable Landmark/Street/City Address)
export async function reverseGeocodeBD(lat: number, lon: number): Promise<string> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=18&addressdetails=1`,
      {
        headers: {
          "Accept-Language": "bn,en",
          "User-Agent": "BoiBinimoy-App/1.0",
        },
      }
    );
    if (!res.ok) return `${lat.toFixed(4)}, ${lon.toFixed(4)}`;
    const data = await res.json();
    const addr = data.address || {};

    const components: string[] = [];

    // 1. Specific Spot/Road/Landmark
    const spot =
      addr.amenity ||
      addr.building ||
      addr.road ||
      addr.neighbourhood ||
      addr.residential ||
      addr.suburb ||
      addr.village ||
      addr.hamlet;
    if (spot) components.push(spot);

    // 2. Thana / Sub-district / Town
    const thana =
      addr.subdistrict ||
      addr.city_district ||
      addr.municipality ||
      addr.town ||
      addr.borough ||
      addr.county;
    if (thana && !components.includes(thana) && thana !== spot) {
      components.push(thana);
    }

    // 3. District / Major City
    const district = addr.city || addr.district || addr.state_district;
    if (district && !components.includes(district) && district !== thana && district !== spot) {
      components.push(district);
    }

    if (components.length > 0) {
      return components.slice(0, 3).join(", ");
    }

    // Fallback to top 2 parts of display_name
    return data.display_name?.split(", ").slice(0, 3).join(", ") || "আমার বর্তমান অবস্থান";
  } catch (err) {
    return "আমার বর্তমান অবস্থান";
  }
}

// IP-based Dynamic Location Fallback (Works on HTTP / non-localhost without triggering browser permission blocks)
export async function detectLocationFromIP(): Promise<{ name: string; lat: number; lon: number } | null> {
  try {
    const res = await fetch("https://ipapi.co/json/");
    if (!res.ok) return null;
    const data = await res.json();
    if (data.latitude && data.longitude) {
      return {
        name: data.city ? `${data.city}, ${data.region || "বাংলাদেশ"}` : "আমার শহর",
        lat: parseFloat(data.latitude),
        lon: parseFloat(data.longitude),
      };
    }
  } catch (e) {
    // Ignore error silently
  }
  return null;
}

export const POPULAR_LOCATIONS = [
  { name: "বগুড়া শহর ও আজিজুল হক কলেজ (Bogura)", lat: 24.8465, lon: 89.3777 },
  { name: "ঢাকা বিশ্ববিদ্যালয় (DU)", lat: 23.734, lon: 90.392 },
  { name: "বুয়েট ক্যাম্পাস (BUET)", lat: 23.726, lon: 90.398 },
  { name: "ঢাকা মেডিকেল কলেজ (DMC)", lat: 23.725, lon: 90.397 },
  { name: "মিরপুর ১০ (Mirpur 10)", lat: 23.807, lon: 90.368 },
  { name: "ধানমন্ডি ২৭ (Dhanmondi)", lat: 23.753, lon: 90.375 },
  { name: "ফার্মগেট (Farmgate)", lat: 23.757, lon: 90.388 },
  { name: "নীলক্ষেত বই মার্কেট (Nilkhet)", lat: 23.733, lon: 90.385 },
  { name: "রাজশাহী বিশ্ববিদ্যালয় (RU)", lat: 24.369, lon: 88.636 },
  { name: "চট্টগ্রাম বিশ্ববিদ্যালয় (CU)", lat: 22.471, lon: 91.787 },
  { name: "জাহাঙ্গীরনগর বিশ্ববিদ্যালয় (JU)", lat: 23.882, lon: 90.267 },
  { name: "সিলেট শাহজালাল বিশ্ববিদ্যালয় (SUST)", lat: 24.917, lon: 91.831 },
  { name: "খুলনা বিশ্ববিদ্যালয় (KU)", lat: 22.802, lon: 89.534 },
  { name: "রংপুর বেগম রোকেয়া বিশ্ববিদ্যালয় (BRUR)", lat: 25.719, lon: 89.261 },
  { name: "ময়মনসিংহ কৃষি বিশ্ববিদ্যালয় (BAU)", lat: 24.726, lon: 90.435 },
];

export const SAFE_MEETUP_SPOTS = [
  "বগুড়া সাতমাথা চত্বর / জিলা স্কুল গেট",
  "সরকারি আজিজুল হক কলেজ ক্যাম্পাস, বগুড়া",
  "ঢাকা বিশ্ববিদ্যালয় কেন্দ্রীয় লাইব্রেরি গেট",
  "কার্জন হল প্রাঙ্গণ / ক্যাফেটেরিয়া",
  "বুয়েট ক্যাফেটেরিয়া",
  "নীলক্ষেত মোড় / পুলিশ বক্স সংলগ্ন",
  "মেট্রো স্টেশন গেট (মিরপুর ১০ / ফার্মগেট / শাহবাগ)",
  "ধানমন্ডি রবীন্দ্র সরোবর মুক্তমঞ্চ",
  "টিএসসি (TSC) চত্বর",
  "শাহবাগ জাতীয় জাদুঘর প্রবেশদ্বার",
  "রাজশাহী বিশ্ববিদ্যালয় টুকিটাকি চত্বর",
  "চট্টগ্রাম ২ নম্বর গেট",
];
