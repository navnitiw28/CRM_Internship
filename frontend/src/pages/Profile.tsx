import { useState, useEffect, type FormEvent } from "react";
import { useAppDispatch, useAppSelector } from "../app/hooks";
import { fetchProfile } from "../features/auth/authSlice";
import { apiRequest } from "../services/api";

const Profile = () => {
  const dispatch = useAppDispatch();
  const { user, token } = useAppSelector((state) => state.auth);
  const [name, setName] = useState(user?.name || "");
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    dispatch(fetchProfile());
  }, [dispatch]);

  useEffect(() => {
    setName(user?.name || "");
  }, [user]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!token) return;
    try {
      const response = await apiRequest("/api/users/me", { method: "PATCH", body: { name }, token });
      setMessage("Profile updated successfully.");
      console.log(response.user);
    } catch (error) {
      setMessage((error as Error).message);
    }
  };

  return (
    <div className="card auth-card">
      <h2>Profile</h2>
      <form onSubmit={handleSubmit} className="form-grid">
        <label>
          Name
          <input value={name} onChange={(e) => setName(e.target.value)} required />
        </label>
        <label>
          Email
          <input value={user?.email ?? ""} disabled />
        </label>
        <button type="submit">Save Changes</button>
      </form>
      {message && <p className="form-success">{message}</p>}
    </div>
  );
};

export default Profile;
