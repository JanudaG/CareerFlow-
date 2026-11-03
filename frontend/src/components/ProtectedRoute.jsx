import { Navigate } from "react-router-dom";
import { getSession } from "../lib/api";

export default function ProtectedRoute({ role, children }) {
  const session = getSession();
  if (!session) return <Navigate to="/login" replace />;
  if (session.user.role !== role) {
    return <Navigate to={session.user.role === "employer" ? "/company" : "/job-seeker"} replace />;
  }
  return children;
}
