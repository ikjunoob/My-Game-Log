// src/components/ProtectRoute.jsx
import { Navigate, Outlet } from "react-router-dom";

export default function ProtectRoute({ isAuthed, redirect = "/login" }) {
    if (!isAuthed) return <Navigate to={redirect} replace />;
    return <Outlet />;
}
