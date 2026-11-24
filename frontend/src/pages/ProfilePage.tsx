import { useMutation, useQuery } from "@apollo/client";
import { FormEvent, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import logoutIcon from "../assets/profile/log-out.svg";
import mailIcon from "../assets/profile/mail.svg";
import userIcon from "../assets/profile/user-round.svg";
import logo from "../assets/dashboard/logo.svg";
import { clearAuthToken } from "../auth/auth-storage";
import { apolloClient } from "../graphql/apollo-client";
import { PROFILE_QUERY, UPDATE_PROFILE_MUTATION } from "../graphql/profile";
import styles from "./ProfilePage.module.css";

type ProfileData = { me: { id: string; name: string; email: string } };

function initials(name: string) {
  return name.trim().split(/\s+/).slice(0, 2).map((part) => part[0]?.toUpperCase()).join("");
}

export function ProfilePage() {
  const navigate = useNavigate();
  const { data, loading, error } = useQuery<ProfileData>(PROFILE_QUERY);
  const [updateProfile, updateState] = useMutation(UPDATE_PROFILE_MUTATION);
  const [name, setName] = useState("");
  const [feedback, setFeedback] = useState("");
  const [formError, setFormError] = useState("");

  useEffect(() => { if (data?.me.name) setName(data.me.name); }, [data]);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault(); setFeedback(""); setFormError("");
    if (name.trim().length < 2) { setFormError("Informe um nome com pelo menos 2 caracteres."); return; }
    try {
      await updateProfile({ variables: { input: { name: name.trim() } }, refetchQueries: [{ query: PROFILE_QUERY }], awaitRefetchQueries: true });
      setFeedback("Perfil atualizado com sucesso.");
    } catch (mutationError) {
      setFormError(mutationError instanceof Error ? mutationError.message : "Não foi possível atualizar o perfil.");
    }
  }

  async function handleLogout() {
    clearAuthToken();
    await apolloClient.clearStore();
    navigate("/login", { replace: true });
  }

  if (loading) return <main className={styles.status}>Carregando perfil...</main>;
  if (error || !data) return <main className={styles.status}>Não foi possível carregar o perfil.</main>;

  return <div className={styles.page}>
    <header className={styles.navbar}>
      <img src={logo} alt="Financy" width="100" height="24" />
      <nav aria-label="Navegação principal"><Link to="/dashboard">Dashboard</Link><Link to="/transacoes">Transações</Link><Link to="/categorias">Categorias</Link></nav>
      <span className={styles.profile}>{initials(data.me.name)}</span>
    </header>
    <main className={styles.main}>
      <section className={styles.card}>
        <header className={styles.cardHeader}><span className={styles.avatar}>{initials(data.me.name)}</span><div><h1>{data.me.name}</h1><p>{data.me.email}</p></div></header>
        <div className={styles.divider} />
        <form onSubmit={handleSubmit}>
          <label>Nome completo<span className={styles.inputBox}><img src={userIcon} alt="" /><input value={name} onChange={(event) => setName(event.target.value)} /></span></label>
          <label>E-mail<span className={`${styles.inputBox} ${styles.disabledInput}`}><img src={mailIcon} alt="" /><input value={data.me.email} disabled /></span><small>O e-mail não pode ser alterado</small></label>
          {formError && <p className={styles.error}>{formError}</p>}{feedback && <p className={styles.success}>{feedback}</p>}
          <button className={styles.saveButton} disabled={updateState.loading}>{updateState.loading ? "Salvando..." : "Salvar alterações"}</button>
          <button className={styles.logoutButton} type="button" onClick={handleLogout}><img src={logoutIcon} alt="" />Sair da conta</button>
        </form>
      </section>
    </main>
  </div>;
}
