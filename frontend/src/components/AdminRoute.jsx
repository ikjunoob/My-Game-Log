// src/components/AdminRoute.jsx
import { Navigate, Outlet } from "react-router-dom";

export default function AdminRoute({ isAuthed, user, redirect = "/dashboard" }) {
    if (!isAuthed) return <Navigate to="/login" replace />;
    if (user?.role !== "admin") return <Navigate to={redirect} replace />;
    return <Outlet />;
}
