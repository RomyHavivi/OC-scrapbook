import { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { ADMIN_EMAIL, firebaseReady } from "../../lib/firebase";
import { auth } from "../../lib/firebaseAdmin";

export default function AdminLogin({ onSuccess }) {
  const [email, setEmail] = useState(ADMIN_EMAIL);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (!firebaseReady) {
      setError("Firebase isn't configured yet — fill in .env first (see .env.example).");
      return;
    }
    if (!email.trim()) {
      setError("Enter the administrator email address.");
      return;
    }

    setIsSubmitting(true);
    try {
      await signInWithEmailAndPassword(auth, email.trim(), password);
      onSuccess();
    } catch {
      setError("Sign-in failed. Check the email and password, and confirm Email/Password sign-in is enabled in Firebase.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="admin-card admin-login">
      <h1>Scrapbook admin</h1>
      <label>
        Email
        <input
          type="email"
          autoComplete="username"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
        />
      </label>
      <label>
        Password
        <input
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(event) => setPassword(event.target.value)}
        />
      </label>
      <button type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Signing in..." : "Log in"}
      </button>
      {error && <p className="admin-message admin-message--error" role="alert">{error}</p>}
    </form>
  );
}
