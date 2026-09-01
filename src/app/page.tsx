import styles from "./page.module.css";

const GENRES = [
  "Reggae",
  "Soca",
  "Dancehall",
  "Zouk",
  "Kompa",
  "Chutney",
  "Island Talk & News",
];

export default function Home() {
  return (
    <main className={styles.main}>
      <section className={styles.hero}>
        <p className={styles.kicker}>Caribbean Radio Hub</p>
        <h1 className={styles.title}>Island Waves</h1>
        <p className={styles.tagline}>
          One place to discover and play Caribbean internet radio. Find a
          station, press play, and keep the island vibes going while you browse.
        </p>
        <ul className={styles.genres}>
          {GENRES.map((genre) => (
            <li key={genre} className={styles.genre}>
              {genre}
            </li>
          ))}
        </ul>
        <p className={styles.note}>
          🎧 Skeleton app — station catalog, browse, and playback are on the
          way.
        </p>
      </section>
    </main>
  );
}
