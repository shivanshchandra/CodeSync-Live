import React, { useContext } from "react";
import { Navigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";

export default function ProtectedRoute({ children }) {
  const { user, loading } = useContext(AuthContext);

  if (loading) return <div className="p-3">Loading...</div>;
  if (!user) return <Navigate to="/login" replace />;

  return children;
}



// Why: Blocks / and /editor/:roomId unless logged in.