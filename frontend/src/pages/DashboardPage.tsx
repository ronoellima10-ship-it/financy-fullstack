import { useQuery } from "@apollo/client";
import { Link } from "react-router-dom";
import type { CSSProperties } from "react";

import briefcaseIcon from "../assets/dashboard/briefcase.svg";
import carIcon from "../assets/dashboard/car.svg";
import chevronRightIcon from "../assets/dashboard/chevron-right.svg";
import expenseIcon from "../assets/dashboard/circle-arrow-down.svg";
import expenseSmallIcon from "../assets/dashboard/circle-arrow-down-small.svg";
import incomeIcon from "../assets/dashboard/circle-arrow-up.svg";
import incomeSmallIcon from "../assets/dashboard/circle-arrow-up-small.svg";
import logo from "../assets/dashboard/logo.svg";
import piggyBankIcon from "../assets/dashboard/piggy-bank.svg";
import plusIcon from "../assets/dashboard/plus.svg";
import shoppingCartIcon from "../assets/dashboard/shopping-cart.svg";
import utensilsIcon from "../assets/dashboard/utensils.svg";
import walletIcon from "../assets/dashboard/wallet.svg";
import { DASHBOARD_QUERY } from "../graphql/dashboard";
import styles from "./DashboardPage.module.css";

type Category = {
  id: string;
  name: string;
  icon: string;
  color: string;
};

type Transaction = {
  id: string;
  title: string;
  amount: number;
  type: "INCOME" | "EXPENSE";
  date: string;
  category: Category;
};

type DashboardData = {
  me: { name: string };
  dashboard: {
    totalBalance: number;
    monthlyIncome: number;
    monthlyExpense: number;
    recentTransactions: Transaction[];
    categorySummary: Array<{
      transactionCount: number;
      totalAmount: number;
      category: Category;
    }>;
  };
};

const iconMap: Record<string, string> = {
  "briefcase-business": briefcaseIcon,
  "car-front": carIcon,
  "piggy-bank": piggyBankIcon,
  "shopping-cart": shoppingCartIcon,
  utensils: utensilsIcon,
};

const currency = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

const dateFormatter = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "2-digit",
  year: "2-digit",
  timeZone: "UTC",
});

function initials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

function categoryStyle(color: string): CSSProperties {
  const validColor = /^#[0-9a-f]{6}$/i.test(color) ? color : "#2563eb";
  return {
    "--category-color": validColor,
    "--category-background": `${validColor}1f`,
  } as CSSProperties;
}

function SummaryCard({ icon, label, value }: { icon: string; label: string; value: number }) {
  return (
    <article className={styles.summaryCard}>
      <div className={styles.summaryLabel}>
        <img src={icon} alt="" />
        <span>{label}</span>
      </div>
      <strong>{currency.format(value)}</strong>
    </article>
  );
}

export function DashboardPage() {
  const { data, loading, error } = useQuery<DashboardData>(DASHBOARD_QUERY);

  if (loading) {
    return <main className={styles.status}>Carregando seu dashboard...</main>;
  }

  if (error || !data) {
    return <main className={styles.status}>Não foi possível carregar o dashboard.</main>;
  }

  const { dashboard } = data;

  return (
    <div className={styles.page}>
      <header className={styles.navbar}>
        <img className={styles.logo} src={logo} alt="Financy" width="100" height="24" />
        <nav aria-label="Navegação principal">
          <Link className={styles.activeLink} to="/dashboard">Dashboard</Link>
          <Link to="/transacoes">Transações</Link>
          <Link to="/categorias">Categorias</Link>
        </nav>
        <Link className={styles.profile} to="/perfil" aria-label="Abrir perfil">
          {initials(data.me.name)}
        </Link>
      </header>

      <main className={styles.content}>
        <section className={styles.summaryGrid} aria-label="Resumo financeiro">
          <SummaryCard icon={walletIcon} label="Saldo total" value={dashboard.totalBalance} />
          <SummaryCard icon={incomeIcon} label="Receitas do mês" value={dashboard.monthlyIncome} />
          <SummaryCard icon={expenseIcon} label="Despesas do mês" value={dashboard.monthlyExpense} />
        </section>

        <section className={styles.dashboardGrid}>
          <article className={styles.panel}>
            <header className={styles.panelHeader}>
              <h2>Transações recentes</h2>
              <Link to="/transacoes">Ver todas <img src={chevronRightIcon} alt="" /></Link>
            </header>

            <div className={styles.transactionList}>
              {dashboard.recentTransactions.length === 0 && (
                <p className={styles.empty}>Nenhuma transação cadastrada.</p>
              )}
              {dashboard.recentTransactions.map((transaction) => {
                const isIncome = transaction.type === "INCOME";
                return (
                  <div className={styles.transactionRow} key={transaction.id}>
                    <div className={styles.transactionInfo}>
                      <span className={styles.iconBox} style={categoryStyle(transaction.category.color)}>
                        <img src={iconMap[transaction.category.icon] ?? walletIcon} alt="" />
                      </span>
                      <span className={styles.transactionText}>
                        <strong>{transaction.title}</strong>
                        <small>{dateFormatter.format(new Date(transaction.date))}</small>
                      </span>
                    </div>
                    <span className={styles.categoryTag} style={categoryStyle(transaction.category.color)}>
                      {transaction.category.name}
                    </span>
                    <span className={styles.amount}>
                      {isIncome ? "+" : "-"} {currency.format(transaction.amount)}
                      <img src={isIncome ? incomeSmallIcon : expenseSmallIcon} alt="" />
                    </span>
                  </div>
                );
              })}
            </div>

            <Link className={styles.newTransaction} to="/transacoes/nova">
              <img src={plusIcon} alt="" /> Nova transação
            </Link>
          </article>

          <article className={styles.panel}>
            <header className={styles.panelHeader}>
              <h2>Categorias</h2>
              <Link to="/categorias">Gerenciar <img src={chevronRightIcon} alt="" /></Link>
            </header>
            <div className={styles.categoryList}>
              {dashboard.categorySummary.length === 0 && (
                <p className={styles.empty}>Nenhuma categoria movimentada neste mês.</p>
              )}
              {dashboard.categorySummary.slice(0, 5).map((item) => (
                <div className={styles.categoryRow} key={item.category.id}>
                  <span className={styles.categoryTag} style={categoryStyle(item.category.color)}>
                    {item.category.name}
                  </span>
                  <span>{item.transactionCount} {item.transactionCount === 1 ? "item" : "itens"}</span>
                  <strong>{currency.format(item.totalAmount)}</strong>
                </div>
              ))}
            </div>
          </article>
        </section>
      </main>
    </div>
  );
}
