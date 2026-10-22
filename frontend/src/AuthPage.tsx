import { useState, type FormEvent } from "react";
import "./AuthPage.css";

export interface SignedInUser {
  id: string;
  name: string;
  email: string;
  role: "user" | "admin";
}

export interface AuthSession {
  token: string;
  user: SignedInUser;
}

interface AuthPageProps {
  onAuthenticated: (session: AuthSession) => void;
}
const API =`${import.meta.env.VITE_API_URL}/api/auth`;
function AuthPage({ onAuthenticated }: AuthPageProps) {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [role, setRole] = useState<"user" | "admin">("user");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage("");
    setBusy(true);
    try {
      const endpoint = mode === "register" ? "register" : "login";
      const body = mode === "register"
        ? { name, email, password }
        : { email, password, role };
      const response = await fetch(`${API}/${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Authentication failed.");
      onAuthenticated({ token: data.token, user: data.user });
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to connect to AstroTrack.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="auth-page">
      <div className="auth-stars" aria-hidden="true">✦·✧··</div>
      <section className="auth-card">
        <div className="auth-brand-mark">🌌</div>
        <p className="auth-eyebrow">SPACE • DATA • DISCOVERY</p>
        <h1>AstroTrack</h1>
        <p className="auth-subtitle">Your gateway to the universe.</p>

        <div className="auth-mode-switch" role="tablist" aria-label="Authentication mode">
          <button type="button" className={mode === "login" ? "selected" : ""} onClick={() => { setMode("login"); setMessage(""); }}>Sign in</button>
          <button type="button" className={mode === "register" ? "selected" : ""} onClick={() => { setMode("register"); setRole("user"); setMessage(""); }}>Create account</button>
        </div>

        {mode === "login" && (
          <div className="role-picker" aria-label="Choose account type">
            <button type="button" className={role === "user" ? "active" : ""} onClick={() => setRole("user")}>👤 User</button>
            <button type="button" className={role === "admin" ? "active" : ""} onClick={() => setRole("admin")}>🛡️ Admin</button>
          </div>
        )}

        <form onSubmit={submit} className="auth-form">
          {mode === "register" && (
            <label>
              Full name
              <input autoComplete="name" value={name} onChange={(event) => setName(event.target.value)} placeholder="Enter your name" required maxLength={80} />
            </label>
          )}
          <label>
            Email address
            <input type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" required />
          </label>
          <label>
            Password
            <input type="password" autoComplete={mode === "register" ? "new-password" : "current-password"} value={password} onChange={(event) => setPassword(event.target.value)} placeholder={mode === "register" ? "At least 8 characters" : "Enter your password"} minLength={mode === "register" ? 8 : 1} required />
          </label>
          {message && <div className="auth-error" role="alert">{message}</div>}
          <button className="auth-submit" type="submit" disabled={busy}>
            {busy ? "Please wait…" : mode === "register" ? "Create user account →" : `Sign in as ${role === "admin" ? "Admin" : "User"} →`}
          </button>
        </form>
        {mode === "register" ? (
          <p className="auth-footnote">New accounts receive regular user access. Admin accounts are created securely by the system administrator.</p>
        ) : (
          <p className="auth-footnote">Secure access • Your observations stay associated with your account.</p>
        )}
      </section>
      <p className="auth-copyright">© 2026 AstroTrack · Explore. Observe. Discover.</p>
    </main>
  );
}

export default AuthPage;
