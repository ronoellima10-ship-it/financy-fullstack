import { useState, type FormEvent } from "react";
import { useMutation } from "@apollo/client";
import { Link, useNavigate } from "react-router-dom";

import eyeClosedIcon from "../assets/eye-closed.svg";
import lockIcon from "../assets/lock.svg";
import mailIcon from "../assets/mail.svg";
import userPlusIcon from "../assets/user-plus.svg";
import { saveAuthToken } from "../auth/auth-storage";
import { AuthLayout } from "../components/auth/AuthLayout";
import styles from "../components/auth/AuthForm.module.css";
import { LOGIN_MUTATION } from "../graphql/auth";

type LoginResult = { login: { token: string } };

export function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [login, { loading, error }] = useMutation<LoginResult>(LOGIN_MUTATION);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const { data } = await login({ variables: { input: { email, password } } });

    if (data) {
      saveAuthToken(data.login.token, remember);
      navigate("/dashboard", { replace: true });
    }
  }

  return (
    <AuthLayout title="Fazer login" subtitle="Entre na sua conta para continuar">
      <form className={styles.form} onSubmit={handleSubmit}>
        <div className={styles.fields}>
          <div className={styles.field}>
            <label htmlFor="email">E-mail</label>
            <div className={styles.inputBox}>
              <img src={mailIcon} alt="" />
              <input id="email" type="email" placeholder="mail@exemplo.com" value={email} onChange={(event) => setEmail(event.target.value)} required />
            </div>
          </div>
          <div className={styles.field}>
            <label htmlFor="password">Senha</label>
            <div className={styles.inputBox}>
              <img src={lockIcon} alt="" />
              <input id="password" type={showPassword ? "text" : "password"} placeholder="Digite sua senha" value={password} onChange={(event) => setPassword(event.target.value)} required />
              <button className={styles.iconButton} type="button" onClick={() => setShowPassword((value) => !value)} aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}>
                <img src={eyeClosedIcon} alt="" />
              </button>
            </div>
          </div>
          <div className={styles.options}>
            <label className={styles.remember}>
              <input type="checkbox" checked={remember} onChange={(event) => setRemember(event.target.checked)} />
              Lembrar-me
            </label>
            <a className={styles.link} href="mailto:suporte@financy.local">Recuperar senha</a>
          </div>
        </div>
        {error && <p className={styles.error}>{error.message}</p>}
        <button className={styles.primaryButton} type="submit" disabled={loading}>{loading ? "Entrando..." : "Entrar"}</button>
        <div className={styles.divider}>ou</div>
        <div className={styles.footer}>
          <p className={styles.footerText}>Ainda não tem uma conta?</p>
          <Link className={styles.secondaryButton} to="/cadastro"><img src={userPlusIcon} alt="" />Criar conta</Link>
        </div>
      </form>
    </AuthLayout>
  );
}
