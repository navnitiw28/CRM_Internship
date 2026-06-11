import { useEffect, useState, type ChangeEvent } from "react";
import { useAppSelector } from "../app/hooks";
import { apiRequest } from "../services/api";

interface UserRecord {
  id: number;
  name: string;
  email: string;
  role: string;
  verified: boolean;
  createdAt: string;
}

const AdminPanel = () => {
  const { token } = useAppSelector((state) => state.auth);
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [error, setError] = useState<string | null>(null);

  const loadUsers = () => {
    if (!token) return;
    apiRequest("/api/users/admin", { token })
      .then((response) => setUsers(response.users))
      .catch((err) => setError((err as Error).message));
  };

  useEffect(() => {
    loadUsers();
  }, [token]);

  const handleRoleChange = async (event: ChangeEvent<HTMLSelectElement>, userId: number) => {
    if (!token) return;
    try {
      await apiRequest(`/api/users/${userId}/role`, { method: "PATCH", body: { role: event.target.value }, token });
      loadUsers();
    } catch (err) {
      setError((err as Error).message);
    }
  };

  return (
    <div className="card">
      <h2>Admin Panel</h2>
      <p>Only admins can see this page.</p>
      {error && <p className="form-error">{error}</p>}
      <div className="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Verified</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id}>
                <td>{user.id}</td>
                <td>{user.name}</td>
                <td>{user.email}</td>
                <td>
                  <select defaultValue={user.role} onChange={(event) => handleRoleChange(event, user.id)}>
                    <option value="EMPLOYEE">Employee</option>
                    <option value="MANAGER">Manager</option>
                    <option value="HR">HR</option>
                    <option value="ADMIN">Admin</option>
                  </select>
                </td>
                <td>{user.verified ? "Yes" : "No"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminPanel;
