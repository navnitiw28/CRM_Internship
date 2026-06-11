import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { apiRequest } from "../services/api";

const VerifyEmail = () => {
  const [searchParams] = useSearchParams();
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = searchParams.get("token");
    if (!token) {
      setError("Verification token is missing.");
      return;
    }

    apiRequest(`/api/auth/verify-email?token=${encodeURIComponent(token)}`)
      .then((response) => setMessage(response.message))
      .catch((err) => setError((err as Error).message));
  }, [searchParams]);

  return (
    <div className="card auth-card">
      <h2>Email Verification</h2>
      {message && <p className="form-success">{message}</p>}
      {error && <p className="form-error">{error}</p>}
      <p>
        <Link to="/login">Return to login</Link>
      </p>
    </div>
  );
};

export default VerifyEmail;
