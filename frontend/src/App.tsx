import styles from "./App.module.css";

export function App() {
  return (
    <main className={styles.page}>
      <section className={styles.card}>
        <span className={styles.brand}>Financy</span>
        <h1>Organize suas finanças</h1>
        <p>A estrutura inicial está pronta para receber as telas do Figma.</p>
      </section>
    </main>
  );
}
