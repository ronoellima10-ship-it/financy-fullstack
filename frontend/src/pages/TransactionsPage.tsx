import { useMutation, useQuery } from "@apollo/client";
import { FormEvent, useEffect, useMemo, useState, type CSSProperties } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";

import expenseIcon from "../assets/dashboard/circle-arrow-down-small.svg";
import incomeIcon from "../assets/dashboard/circle-arrow-up-small.svg";
import logo from "../assets/dashboard/logo.svg";
import plusIcon from "../assets/dashboard/plus.svg";
import { DASHBOARD_QUERY } from "../graphql/dashboard";
import {
  CREATE_TRANSACTION_MUTATION,
  DELETE_TRANSACTION_MUTATION,
  TRANSACTIONS_QUERY,
  UPDATE_TRANSACTION_MUTATION,
} from "../graphql/transactions";
import styles from "./TransactionsPage.module.css";

type Category = { id: string; name: string; icon: string; color: string };
type Transaction = {
  id: string; title: string; amount: number; type: "INCOME" | "EXPENSE";
  date: string; description?: string | null; category: Category;
};
type TransactionsData = {
  me: { id: string; name: string };
  categories: Category[];
  transactions: Transaction[];
};
type FormState = {
  title: string; amount: string; type: "INCOME" | "EXPENSE";
  date: string; description: string; categoryId: string;
};

const emptyForm: FormState = {
  title: "", amount: "", type: "EXPENSE", date: new Date().toISOString().slice(0, 10),
  description: "", categoryId: "",
};
const currency = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const dateFormatter = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit", year: "2-digit", timeZone: "UTC" });

function initials(name: string) {
  return name.trim().split(/\s+/).slice(0, 2).map((part) => part[0]?.toUpperCase()).join("");
}

function categoryStyle(color: string): CSSProperties {
  const safe = /^#[0-9a-f]{6}$/i.test(color) ? color : "#2563eb";
  return { "--category-color": safe, "--category-background": `${safe}1f` } as CSSProperties;
}

export function TransactionsPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { data, loading, error } = useQuery<TransactionsData>(TRANSACTIONS_QUERY);
  const [createTransaction, createState] = useMutation(CREATE_TRANSACTION_MUTATION);
  const [updateTransaction, updateState] = useMutation(UPDATE_TRANSACTION_MUTATION);
  const [deleteTransaction] = useMutation(DELETE_TRANSACTION_MUTATION);
  const [search, setSearch] = useState("");
  const [type, setType] = useState("ALL");
  const [categoryId, setCategoryId] = useState("ALL");
  const [period, setPeriod] = useState("ALL");
  const [editing, setEditing] = useState<Transaction | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [formError, setFormError] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 8;
  const modalOpen = location.pathname.endsWith("/nova") || Boolean(editing);

  useEffect(() => setPage(1), [search, type, categoryId, period]);

  const periods = useMemo(() => {
    const values = new Set((data?.transactions ?? []).map((item) => item.date.slice(0, 7)));
    return [...values].sort().reverse();
  }, [data]);

  const filtered = useMemo(() => (data?.transactions ?? []).filter((item) => {
    const matchesSearch = item.title.toLocaleLowerCase("pt-BR").includes(search.toLocaleLowerCase("pt-BR"));
    return matchesSearch && (type === "ALL" || item.type === type) &&
      (categoryId === "ALL" || item.category.id === categoryId) &&
      (period === "ALL" || item.date.startsWith(period));
  }), [data, search, type, categoryId, period]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const visible = filtered.slice((page - 1) * pageSize, page * pageSize);

  function openEdit(transaction: Transaction) {
    setEditing(transaction);
    setForm({
      title: transaction.title, amount: String(transaction.amount), type: transaction.type,
      date: transaction.date.slice(0, 10), description: transaction.description ?? "",
      categoryId: transaction.category.id,
    });
    setFormError("");
  }

  function closeModal() {
    setEditing(null); setForm(emptyForm); setFormError("");
    if (location.pathname.endsWith("/nova")) navigate("/transacoes", { replace: true });
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const amount = Number(form.amount.replace(",", "."));
    if (!form.title.trim() || !form.categoryId || !Number.isFinite(amount) || amount <= 0) {
      setFormError("Preencha a descrição, o valor e a categoria."); return;
    }
    const variables = { input: { ...form, title: form.title.trim(), amount, date: `${form.date}T12:00:00.000Z` } };
    try {
      const refresh = {
        refetchQueries: [{ query: TRANSACTIONS_QUERY }, { query: DASHBOARD_QUERY }],
        awaitRefetchQueries: true,
      };
      if (editing) await updateTransaction({ variables: { id: editing.id, ...variables }, ...refresh });
      else await createTransaction({ variables, ...refresh });
      closeModal();
    } catch (mutationError) {
      setFormError(mutationError instanceof Error ? mutationError.message : "Não foi possível salvar a transação.");
    }
  }

  async function handleDelete(transaction: Transaction) {
    if (!window.confirm(`Excluir a transação “${transaction.title}”?`)) return;
    await deleteTransaction({
      variables: { id: transaction.id },
      refetchQueries: [{ query: TRANSACTIONS_QUERY }, { query: DASHBOARD_QUERY }],
      awaitRefetchQueries: true,
    });
  }

  if (loading) return <main className={styles.status}>Carregando transações...</main>;
  if (error || !data) return <main className={styles.status}>Não foi possível carregar as transações.</main>;

  return (
    <div className={styles.page}>
      <header className={styles.navbar}>
        <img className={styles.logo} src={logo} alt="Financy" width="100" height="24" />
        <nav aria-label="Navegação principal">
          <Link to="/dashboard">Dashboard</Link><Link className={styles.activeLink} to="/transacoes">Transações</Link><Link to="/categorias">Categorias</Link>
        </nav>
        <Link className={styles.profile} to="/perfil" aria-label="Abrir perfil">{initials(data.me.name)}</Link>
      </header>

      <main className={styles.content}>
        <header className={styles.pageHeader}>
          <div><h1>Transações</h1><p>Gerencie todas as suas transações financeiras</p></div>
          <Link className={styles.primaryButton} to="/transacoes/nova"><img src={plusIcon} alt="" />Nova transação</Link>
        </header>

        <section className={styles.filters} aria-label="Filtros de transações">
          <label>Buscar<input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar por descrição" /></label>
          <label>Tipo<select value={type} onChange={(e) => setType(e.target.value)}><option value="ALL">Todos</option><option value="INCOME">Entrada</option><option value="EXPENSE">Saída</option></select></label>
          <label>Categoria<select value={categoryId} onChange={(e) => setCategoryId(e.target.value)}><option value="ALL">Todas</option>{data.categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select></label>
          <label>Período<select value={period} onChange={(e) => setPeriod(e.target.value)}><option value="ALL">Todos os períodos</option>{periods.map((value) => <option key={value} value={value}>{new Date(`${value}-02T12:00:00Z`).toLocaleDateString("pt-BR", { month: "long", year: "numeric", timeZone: "UTC" })}</option>)}</select></label>
        </section>

        <section className={styles.tableCard}>
          <div className={styles.tableScroll}><table><thead><tr><th>Descrição</th><th>Data</th><th>Categoria</th><th>Tipo</th><th>Valor</th><th>Ações</th></tr></thead>
            <tbody>{visible.map((transaction) => { const income = transaction.type === "INCOME"; return <tr key={transaction.id}>
              <td><span className={styles.description}><span className={styles.categoryIcon} style={categoryStyle(transaction.category.color)}>{transaction.category.name.slice(0, 1).toUpperCase()}</span><strong>{transaction.title}</strong></span></td>
              <td>{dateFormatter.format(new Date(transaction.date))}</td>
              <td><span className={styles.categoryTag} style={categoryStyle(transaction.category.color)}>{transaction.category.name}</span></td>
              <td><span className={income ? styles.income : styles.expense}><img src={income ? incomeIcon : expenseIcon} alt="" />{income ? "Entrada" : "Saída"}</span></td>
              <td className={styles.value}>{income ? "+" : "-"} {currency.format(transaction.amount)}</td>
              <td><span className={styles.actions}><button onClick={() => handleDelete(transaction)} aria-label={`Excluir ${transaction.title}`}>⌫</button><button onClick={() => openEdit(transaction)} aria-label={`Editar ${transaction.title}`}>✎</button></span></td>
            </tr>; })}</tbody></table></div>
          {visible.length === 0 && <p className={styles.empty}>Nenhuma transação encontrada.</p>}
          <footer className={styles.tableFooter}><span>{filtered.length ? (page - 1) * pageSize + 1 : 0} a {Math.min(page * pageSize, filtered.length)} | {filtered.length} resultados</span><div className={styles.pagination}><button disabled={page === 1} onClick={() => setPage(page - 1)}>‹</button>{Array.from({ length: pageCount }, (_, index) => <button className={page === index + 1 ? styles.currentPage : ""} key={index} onClick={() => setPage(index + 1)}>{index + 1}</button>)}<button disabled={page === pageCount} onClick={() => setPage(page + 1)}>›</button></div></footer>
        </section>
      </main>

      {modalOpen && <div className={styles.backdrop} role="presentation" onMouseDown={(e) => e.target === e.currentTarget && closeModal()}>
        <section className={styles.modal} role="dialog" aria-modal="true" aria-labelledby="transaction-modal-title">
          <header><div><h2 id="transaction-modal-title">{editing ? "Editar transação" : "Nova transação"}</h2><p>{editing ? "Atualize os dados da movimentação" : "Registre uma nova movimentação financeira"}</p></div><button onClick={closeModal} aria-label="Fechar">×</button></header>
          <form onSubmit={handleSubmit}>
            <label>Descrição<input autoFocus value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Ex.: Compras no mercado" /></label>
            <div className={styles.formRow}><label>Valor (R$)<input inputMode="decimal" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} placeholder="0,00" /></label><label>Data<input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} /></label></div>
            <fieldset><legend>Tipo</legend><div className={styles.typeChoices}><button type="button" className={form.type === "INCOME" ? styles.selectedIncome : ""} onClick={() => setForm({ ...form, type: "INCOME" })}>↑ Entrada</button><button type="button" className={form.type === "EXPENSE" ? styles.selectedExpense : ""} onClick={() => setForm({ ...form, type: "EXPENSE" })}>↓ Saída</button></div></fieldset>
            <label>Categoria<select value={form.categoryId} onChange={(e) => setForm({ ...form, categoryId: e.target.value })}><option value="">Selecione uma categoria</option>{data.categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select></label>
            <label>Observação <span>(opcional)</span><textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Adicione uma observação" /></label>
            {formError && <p className={styles.formError}>{formError}</p>}
            <footer><button type="button" onClick={closeModal}>Cancelar</button><button className={styles.saveButton} disabled={createState.loading || updateState.loading}>{createState.loading || updateState.loading ? "Salvando..." : editing ? "Salvar alterações" : "Criar transação"}</button></footer>
          </form>
        </section>
      </div>}
    </div>
  );
}
