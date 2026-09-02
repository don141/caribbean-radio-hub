import styles from "./page.module.css";
import { getAllStations, getGenres, getCountries } from "@/lib/stations";
import { getFeaturedStations } from "@/lib/stations/featured";
import { StationList } from "@/components/stations/StationList";
import { FeaturedRail } from "@/components/stations/FeaturedRail";

// Home = the browse view. Server Component: fetch the catalog on the server and
// hand it to the client components, which own filtering + play interactions.
export default function Home() {
  const stations = getAllStations();
  const featured = getFeaturedStations();
  const genres = getGenres();
  const countries = getCountries();

  return (
    <main className={styles.main}>
      <section className={styles.hero}>
        <p className={styles.kicker}>Caribbean Radio Hub</p>
        <h1 className={styles.title}>Island Waves</h1>
        <p className={styles.tagline}>
          Find a station, press play, and keep the island vibes going while you
          browse. {stations.length} stations across the Caribbean.
        </p>
      </section>

      {featured.length > 0 && (
        <section className={styles.catalog}>
          <FeaturedRail stations={featured} />
        </section>
      )}

      <section className={styles.catalog}>
        <StationList
          stations={stations}
          genres={genres}
          countries={countries}
        />
      </section>
    </main>
  );
}
