
import { Navigate } from "react-router-dom";
import { getSession } from "../lib/api";

export default function ProtectedRoute({ role, children }) {
  const session = getSession();

  // Not logged in
  if (!session?.user || !session?.token) {
    return <Navigate to="/login" replace />;
  }

  // Redirect destinations for each role
  const roleRoutes = {
    jobseeker: "/job-seeker",
    employer: "/company",
    admin: "/admin",
  };

  // Logged in, but wrong role
  if (session.user.role !== role) {
    const destination = roleRoutes[session.user.role] || "/login";

    return <Navigate to={destination} replace />;
  }

  // Authorized role
  return children;
}
