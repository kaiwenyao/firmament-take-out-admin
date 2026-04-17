import { Navigate, Outlet } from "react-router-dom";

/**
 * Route guard component
 * Checks if user is logged in, redirects to login page if not
 */
export default function ProtectedLayout() {
  const token = localStorage.getItem("token");
  
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  
  return <Outlet />;
}

