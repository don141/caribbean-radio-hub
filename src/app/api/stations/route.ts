import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getCountries, getGenres, queryStations } from "@/lib/stations";
import type { Genre } from "@/lib/stations";

// Station catalog endpoint. Returns the verified Caribbean station list, with
// optional filtering so the browse UI can query the server instead of shipping
// filter logic to every client.
//
//   GET /api/stations                     -> full catalog
//   GET /api/stations?country=JM          -> stations from Jamaica
//   GET /api/stations?genre=soca          -> stations tagged soca
//   GET /api/stations?q=irie              -> free-text search
//
// Facets (`countries`, `genres`) are always returned to power filter chips.
export function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const country = params.get("country") ?? undefined;
  const genre = (params.get("genre") as Genre | null) ?? undefined;
  const search = params.get("q") ?? undefined;

  const stations = queryStations({ countryCode: country, genre, search });

  return NextResponse.json({
    count: stations.length,
    stations,
    facets: {
      countries: getCountries(),
      genres: getGenres(),
    },
  });
}
