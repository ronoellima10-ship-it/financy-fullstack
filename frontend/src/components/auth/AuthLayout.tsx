import type { ReactNode } from "react";

import logo from "../../assets/logo.svg";
import styles from "./AuthLayout.module.css";

type AuthLayoutProps = {
  title: string;
  subtitle: string;
  children: ReactNode;
};

export function AuthLayout({ title, subtitle, children }: AuthLayoutProps) {
  return (
    <main className={styles.page}>
      <img className={styles.logo} src={logo} alt="Financy" width="134" height="32" />
      <section className={styles.card}>
        <header className={styles.header}>
          <h1>{title}</h1>
          <p>{subtitle}</p>
        </header>
        {children}
      </section>
    </main>
  );
}
