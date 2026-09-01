import styles from "./page.module.css";
import { getAllStations, getGenres } from "@/lib/stations";
import { StationList } from "@/components/stations/StationList";

// Home = the browse view. Server Component: fetch the catalog on the server and
// hand it to the client StationList, which owns filtering + play interactions.
export default function Home() {
  const stations = getAllStations();
  const genres = getGenres();

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

      <section className={styles.catalog}>
        <StationList stations={stations} genres={genres} />
      </section>
    </main>
  );
}
