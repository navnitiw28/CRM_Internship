import { useState, type FormEvent } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { apiRequest } from "../services/api";

const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const token = searchParams.get("token");

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!token) {
      setError("Reset token is missing.");
      return;
    }
    try {
      const response = await apiRequest("/api/auth/reset-password", { method: "POST", body: { token, password } });
      setMessage(response.message);
      setPassword("");
    } catch (err) {
      setError((err as Error).message);
    }
  };

  return (
    <div className="card auth-card">
      <h2>Reset Password</h2>
      <form className="form-grid" onSubmit={handleSubmit}>
        <label>
          New Password
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        </label>
        <button type="submit">Reset Password</button>
      </form>
      {message && <p className="form-success">{message}</p>}
      {error && <p className="form-error">{error}</p>}
      <p>
        <Link to="/login">Return to login</Link>
      </p>
    </div>
  );
};

export default ResetPassword;
