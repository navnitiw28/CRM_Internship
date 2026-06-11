import { Navigate, Outlet } from "react-router-dom";
import { useAppSelector } from "../app/hooks";

interface PrivateRouteProps {
  roles?: string[];
}

const PrivateRoute = ({ roles }: PrivateRouteProps) => {
  const { user } = useAppSelector((state) => state.auth);
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (roles && !roles.includes(user.role)) {
    return <div className="center-message">Access denied. You do not have permission to view this page.</div>;
  }

  return <Outlet />;
};

export default PrivateRoute;
