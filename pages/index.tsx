import Head from "next/head";
import Image from "next/image";
import Link from "next/link";
import styles from "../styles/Home.module.css";

export default function Home() {
  return (
    <div className={styles.container}>
      <Head>
        <title>Colby{"'"}s RC Playground</title>
        <meta
          name="description"
          content="Colby's random projects at Recurse Center."
        />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <header className={styles.header}>
        <h1 className={styles.title}>Colby{"'"}s RC Playground</h1>
      </header>

      <main className={styles.main}>
        <div className={styles.item}>
          <h3>
            <Link href="/whistlee">
              <a>Whistlee</a>
            </Link>
          </h3>
          <p>Detecting whistles with web audio.</p>
        </div>
      </main>

      <footer className={styles.footer}>
        <div className="rc-scout" />
        <script
          async
          defer
          src="https://www.recurse-scout.com/loader.js?t=abe5ef4a835099ffbe68c65e0cfdde18"
        ></script>
      </footer>
    </div>
  );
}
