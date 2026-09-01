import Link from "next/link";
import { notFound } from "next/navigation";
import { getAllStations, getStationById } from "@/lib/stations";
import { StationPlayButton } from "@/components/stations/StationPlayButton";
import styles from "./page.module.css";

// Pre-render a detail page per station (the catalog is static seed data).
export function generateStaticParams() {
  return getAllStations().map((s) => ({ id: s.id }));
}

// Detail / "now playing" deep link. Also serves as the second route that proves
// audio keeps playing across navigation: start a station on the home grid, open
// this page, and the bottom bar keeps streaming.
export default async function StationPage({
  params,
}: PageProps<"/station/[id]">) {
  const { id } = await params;
  const station = getStationById(id);
  if (!station) notFound();

  return (
    <main className={styles.main}>
      <Link href="/" className={styles.back}>
        ← All stations
      </Link>

      <div className={styles.header}>
        <div className={styles.artwork} aria-hidden>
          {station.logoUrl ? (
            // Plain <img>: station logos come from arbitrary remote hosts and
            // aren't worth Next's image pipeline.
            // eslint-disable-next-line @next/next/no-img-element
            <img src={station.logoUrl} alt="" className={styles.artworkImg} />
          ) : (
            <span className={styles.artworkFallback}>
              {station.name.charAt(0)}
            </span>
          )}
        </div>
        <div className={styles.headText}>
          <h1 className={styles.name}>{station.name}</h1>
          <p className={styles.location}>
            {station.city ? `${station.city}, ` : ""}
            {station.country} · {station.language}
          </p>
          <ul className={styles.genres}>
            {station.genres.map((g) => (
              <li key={g} className={styles.genre}>
                {g}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <StationPlayButton station={station} />

      <p className={styles.description}>{station.description}</p>

      <dl className={styles.facts}>
        <div className={styles.fact}>
          <dt>Format</dt>
          <dd>{station.streamFormat.toUpperCase()}</dd>
        </div>
        {station.bitrateKbps ? (
          <div className={styles.fact}>
            <dt>Bitrate</dt>
            <dd>{station.bitrateKbps} kbps</dd>
          </div>
        ) : null}
        {station.website ? (
          <div className={styles.fact}>
            <dt>Website</dt>
            <dd>
              <a
                href={station.website}
                target="_blank"
                rel="noreferrer noopener"
                className={styles.link}
              >
                Visit site ↗
              </a>
            </dd>
          </div>
        ) : null}
      </dl>
    </main>
  );
}
