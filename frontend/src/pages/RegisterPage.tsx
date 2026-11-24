import { useState, type FormEvent } from "react";
import { useMutation } from "@apollo/client";
import { Link, useNavigate } from "react-router-dom";

import eyeClosedIcon from "../assets/eye-closed.svg";
import loginIcon from "../assets/log-in.svg";
import lockIcon from "../assets/lock.svg";
import mailIcon from "../assets/mail.svg";
import userIcon from "../assets/user.svg";
import { saveAuthToken } from "../auth/auth-storage";
import styles from "../components/auth/AuthForm.module.css";
import { AuthLayout } from "../components/auth/AuthLayout";
import { REGISTER_MUTATION } from "../graphql/auth";

type RegisterResult = { register: { token: string } };

export function RegisterPage() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [register, { loading, error }] = useMutation<RegisterResult>(REGISTER_MUTATION);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const { data } = await register({ variables: { input: { name, email, password } } });

    if (data) {
      saveAuthToken(data.register.token, true);
      navigate("/dashboard", { replace: true });
    }
  }

  return (
    <AuthLayout title="Criar conta" subtitle="Comece a controlar suas finanças ainda hoje">
      <form className={styles.form} onSubmit={handleSubmit}>
        <div className={styles.fields}>
          <div className={styles.field}>
            <label htmlFor="name">Nome completo</label>
            <div className={styles.inputBox}>
              <img src={userIcon} alt="" />
              <input id="name" placeholder="Seu nome completo" value={name} onChange={(event) => setName(event.target.value)} required />
            </div>
          </div>
          <div className={styles.field}>
            <label htmlFor="register-email">E-mail</label>
            <div className={styles.inputBox}>
              <img src={mailIcon} alt="" />
              <input id="register-email" type="email" placeholder="mail@exemplo.com" value={email} onChange={(event) => setEmail(event.target.value)} required />
            </div>
          </div>
          <div className={styles.field}>
            <label htmlFor="register-password">Senha</label>
            <div className={styles.inputBox}>
              <img src={lockIcon} alt="" />
              <input id="register-password" type={showPassword ? "text" : "password"} placeholder="Digite sua senha" minLength={8} value={password} onChange={(event) => setPassword(event.target.value)} required />
              <button className={styles.iconButton} type="button" onClick={() => setShowPassword((value) => !value)} aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}>
                <img src={eyeClosedIcon} alt="" />
              </button>
            </div>
            <p className={styles.helper}>A senha deve ter no mínimo 8 caracteres</p>
          </div>
        </div>
        {error && <p className={styles.error}>{error.message}</p>}
        <button className={styles.primaryButton} type="submit" disabled={loading}>{loading ? "Cadastrando..." : "Cadastrar"}</button>
        <div className={styles.divider}>ou</div>
        <div className={styles.footer}>
          <p className={styles.footerText}>Já tem uma conta?</p>
          <Link className={styles.secondaryButton} to="/login"><img src={loginIcon} alt="" />Fazer login</Link>
        </div>
      </form>
    </AuthLayout>
  );
}
