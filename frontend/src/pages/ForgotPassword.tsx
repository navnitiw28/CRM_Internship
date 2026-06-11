import { useState, type FormEvent } from "react";
import { apiRequest } from "../services/api";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage(null);
    setError(null);
    try {
      const response = await apiRequest("/api/auth/forgot-password", { method: "POST", body: { email } });
      setMessage(response.message);
    } catch (err) {
      setError((err as Error).message);
    }
  };

  return (
    <div className="card auth-card">
      <h2>Forgot Password</h2>
      <form className="form-grid" onSubmit={handleSubmit}>
        <label>
          Email
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </label>
        <button type="submit">Send Reset Link</button>
      </form>
      {message && <p className="form-success">{message}</p>}
      {error && <p className="form-error">{error}</p>}
    </div>
  );
};

export default ForgotPassword;
