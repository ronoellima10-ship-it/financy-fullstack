import { useMutation, useQuery } from "@apollo/client";
import { FormEvent, useState, type CSSProperties } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";

import arrowUpDownIcon from "../assets/categories/arrow-up-down.svg";
import baggageIcon from "../assets/categories/baggage-claim.svg";
import bookIcon from "../assets/categories/book-open.svg";
import dumbbellIcon from "../assets/categories/dumbbell.svg";
import giftIcon from "../assets/categories/gift.svg";
import healthIcon from "../assets/categories/heart-pulse.svg";
import houseIcon from "../assets/categories/house.svg";
import mailboxIcon from "../assets/categories/mailbox.svg";
import pawIcon from "../assets/categories/paw-print.svg";
import receiptIcon from "../assets/categories/receipt-text.svg";
import tagIcon from "../assets/categories/tag.svg";
import ticketIcon from "../assets/categories/ticket.svg";
import toolCaseIcon from "../assets/categories/tool-case.svg";
import briefcaseIcon from "../assets/dashboard/briefcase.svg";
import carIcon from "../assets/dashboard/car.svg";
import logo from "../assets/dashboard/logo.svg";
import piggyBankIcon from "../assets/dashboard/piggy-bank.svg";
import plusIcon from "../assets/dashboard/plus.svg";
import shoppingCartIcon from "../assets/dashboard/shopping-cart.svg";
import utensilsIcon from "../assets/dashboard/utensils.svg";
import {
  CATEGORIES_QUERY, CREATE_CATEGORY_MUTATION, DELETE_CATEGORY_MUTATION, UPDATE_CATEGORY_MUTATION,
} from "../graphql/categories";
import { DASHBOARD_QUERY } from "../graphql/dashboard";
import { TRANSACTIONS_QUERY } from "../graphql/transactions";
import styles from "./CategoriesPage.module.css";

type Category = {
  id: string; name: string; description?: string | null; icon: string; color: string; transactionCount: number;
};
type CategoriesData = { me: { id: string; name: string }; categories: Category[] };
type FormState = { name: string; description: string; icon: string; color: string };

const icons = [
  ["briefcase-business", briefcaseIcon], ["car-front", carIcon], ["heart-pulse", healthIcon],
  ["piggy-bank", piggyBankIcon], ["shopping-cart", shoppingCartIcon], ["ticket", ticketIcon],
  ["tool-case", toolCaseIcon], ["utensils", utensilsIcon], ["paw-print", pawIcon], ["house", houseIcon],
  ["gift", giftIcon], ["dumbbell", dumbbellIcon], ["book-open", bookIcon], ["baggage-claim", baggageIcon],
  ["mailbox", mailboxIcon], ["receipt-text", receiptIcon],
] as const;
const iconMap = Object.fromEntries(icons) as Record<string, string>;
const colors = ["#16A34A", "#2563EB", "#9333EA", "#DB2777", "#DC2626", "#EA580C", "#CA8A04"];
const emptyForm: FormState = { name: "", description: "", icon: "briefcase-business", color: colors[0] };

function initials(name: string) {
  return name.trim().split(/\s+/).slice(0, 2).map((part) => part[0]?.toUpperCase()).join("");
}
function categoryStyle(color: string): CSSProperties {
  const safe = /^#[0-9a-f]{6}$/i.test(color) ? color : "#2563eb";
  return { "--category-color": safe, "--category-background": `${safe}1f` } as CSSProperties;
}

export function CategoriesPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { data, loading, error } = useQuery<CategoriesData>(CATEGORIES_QUERY);
  const [createCategory, createState] = useMutation(CREATE_CATEGORY_MUTATION);
  const [updateCategory, updateState] = useMutation(UPDATE_CATEGORY_MUTATION);
  const [deleteCategory] = useMutation(DELETE_CATEGORY_MUTATION);
  const [editing, setEditing] = useState<Category | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [formError, setFormError] = useState("");
  const [pageError, setPageError] = useState("");
  const modalOpen = location.pathname.endsWith("/nova") || Boolean(editing);

  function openEdit(category: Category) {
    setEditing(category);
    setForm({ name: category.name, description: category.description ?? "", icon: category.icon, color: category.color });
    setFormError("");
  }
  function closeModal() {
    setEditing(null); setForm(emptyForm); setFormError("");
    if (location.pathname.endsWith("/nova")) navigate("/categorias", { replace: true });
  }
  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!form.name.trim()) { setFormError("Informe o título da categoria."); return; }
    const input = { ...form, name: form.name.trim(), description: form.description.trim() || null };
    const refresh = {
      refetchQueries: [{ query: CATEGORIES_QUERY }, { query: TRANSACTIONS_QUERY }, { query: DASHBOARD_QUERY }],
      awaitRefetchQueries: true,
    };
    try {
      if (editing) await updateCategory({ variables: { id: editing.id, input }, ...refresh });
      else await createCategory({ variables: { input }, ...refresh });
      closeModal();
    } catch (mutationError) {
      setFormError(mutationError instanceof Error ? mutationError.message : "Não foi possível salvar a categoria.");
    }
  }
  async function handleDelete(category: Category) {
    if (!window.confirm(`Excluir a categoria “${category.name}”?`)) return;
    setPageError("");
    try {
      await deleteCategory({ variables: { id: category.id }, refetchQueries: [{ query: CATEGORIES_QUERY }, { query: DASHBOARD_QUERY }], awaitRefetchQueries: true });
    } catch (mutationError) {
      setPageError(mutationError instanceof Error ? mutationError.message : "Não foi possível excluir a categoria.");
    }
  }

  if (loading) return <main className={styles.status}>Carregando categorias...</main>;
  if (error || !data) return <main className={styles.status}>Não foi possível carregar as categorias.</main>;

  const totalTransactions = data.categories.reduce((total, category) => total + category.transactionCount, 0);
  const mostUsed = [...data.categories].sort((a, b) => b.transactionCount - a.transactionCount)[0];

  return <div className={styles.page}>
    <header className={styles.navbar}>
      <img src={logo} alt="Financy" width="100" height="24" />
      <nav aria-label="Navegação principal"><Link to="/dashboard">Dashboard</Link><Link to="/transacoes">Transações</Link><Link className={styles.activeLink} to="/categorias">Categorias</Link></nav>
      <Link className={styles.profile} to="/perfil" aria-label="Abrir perfil">{initials(data.me.name)}</Link>
    </header>
    <main className={styles.content}>
      <header className={styles.pageHeader}><div><h1>Categorias</h1><p>Organize suas transações por categorias</p></div><Link className={styles.primaryButton} to="/categorias/nova"><img src={plusIcon} alt="" />Nova categoria</Link></header>
      <section className={styles.summaryGrid} aria-label="Resumo das categorias">
        <article><span className={styles.summaryIcon}><img src={tagIcon} alt="" /></span><div><strong>{data.categories.length}</strong><small>Total de categorias</small></div></article>
        <article><span className={styles.summaryIcon}><img src={arrowUpDownIcon} alt="" /></span><div><strong>{totalTransactions}</strong><small>Total de transações</small></div></article>
        <article><span className={styles.summaryIcon} style={mostUsed ? categoryStyle(mostUsed.color) : undefined}><img src={mostUsed ? iconMap[mostUsed.icon] ?? tagIcon : tagIcon} alt="" /></span><div><strong>{mostUsed?.name ?? "—"}</strong><small>Categoria mais utilizada</small></div></article>
      </section>
      {pageError && <p className={styles.pageError}>{pageError}</p>}
      <section className={styles.categoryGrid} aria-label="Categorias cadastradas">
        {data.categories.map((category) => <article className={styles.categoryCard} key={category.id}>
          <header><span className={styles.categoryIcon} style={categoryStyle(category.color)}><img src={iconMap[category.icon] ?? tagIcon} alt="" /></span><span className={styles.actions}><button onClick={() => handleDelete(category)} aria-label={`Excluir ${category.name}`}>⌫</button><button onClick={() => openEdit(category)} aria-label={`Editar ${category.name}`}>✎</button></span></header>
          <div className={styles.cardText}><h2>{category.name}</h2><p>{category.description || "Sem descrição"}</p></div>
          <footer><span className={styles.tag} style={categoryStyle(category.color)}>{category.name}</span><span>{category.transactionCount} {category.transactionCount === 1 ? "item" : "itens"}</span></footer>
        </article>)}
        {data.categories.length === 0 && <p className={styles.empty}>Nenhuma categoria cadastrada.</p>}
      </section>
    </main>

    {modalOpen && <div className={styles.backdrop} role="presentation" onMouseDown={(event) => event.target === event.currentTarget && closeModal()}>
      <section className={styles.modal} role="dialog" aria-modal="true" aria-labelledby="category-modal-title">
        <header><div><h2 id="category-modal-title">{editing ? "Editar categoria" : "Nova categoria"}</h2><p>Organize suas transações com categorias</p></div><button onClick={closeModal} aria-label="Fechar">×</button></header>
        <form onSubmit={handleSubmit}>
          <label>Título<input autoFocus value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} placeholder="Ex. Alimentação" /></label>
          <label>Descrição<input value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} placeholder="Descrição da categoria" /><small>Opcional</small></label>
          <fieldset><legend>Ícone</legend><div className={styles.iconPicker}>{icons.map(([name, source]) => <button type="button" className={form.icon === name ? styles.selectedIcon : ""} onClick={() => setForm({ ...form, icon: name })} key={name} aria-label={name}><img src={source} alt="" /></button>)}</div></fieldset>
          <fieldset><legend>Cor</legend><div className={styles.colorPicker}>{colors.map((color) => <button type="button" className={form.color.toUpperCase() === color ? styles.selectedColor : ""} style={{ "--swatch": color } as CSSProperties} onClick={() => setForm({ ...form, color })} key={color} aria-label={`Cor ${color}`}><span /></button>)}</div></fieldset>
          {formError && <p className={styles.formError}>{formError}</p>}
          <button className={styles.saveButton} disabled={createState.loading || updateState.loading}>{createState.loading || updateState.loading ? "Salvando..." : "Salvar"}</button>
        </form>
      </section>
    </div>}
  </div>;
}
