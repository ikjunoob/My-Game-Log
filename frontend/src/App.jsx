// src/App.jsx
import { useEffect, useState } from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";

import Landing from "./pages/Landing";
import Login from "./pages/Auth/Login";
import Register from "./pages/Auth/Register";
import Dashboard from "./pages/Dashboard";
import Admin from "./pages/Admin";
import Create from "./pages/Log/Create";
import Edit from "./pages/Log/Edit";

import ProtectRoute from "./components/ProtectRoute";
import AdminRoute from "./components/AdminRoute";
import Header from "./components/Header";
import "./App.scss";

export default function App() {
  const [token, setToken] = useState(() => localStorage.getItem("token"));
  const [user, setUser] = useState(() => {
    const raw = localStorage.getItem("user");
    return raw ? JSON.parse(raw) : null;
  });
  const isAuthed = !!token;
  const location = useLocation();

  const handleAuthed = ({ token, user }) => {
    setToken(token || null);
    setUser(user || null);
    if (token) localStorage.setItem("token", token); else localStorage.removeItem("token");
    if (user) localStorage.setItem("user", JSON.stringify(user)); else localStorage.removeItem("user");
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setToken(null);
    setUser(null);
  };

  // 헤더를 숨길 페이지(랜딩/로그인/회원가입)
  const hideHeaderOn = new Set(["/", "/login", "/register"]);
  const showHeader = isAuthed && !hideHeaderOn.has(location.pathname);

  useEffect(() => { }, []);

  return (
    <div className="page">
      {showHeader && <Header user={user} onLogout={handleLogout} />}

      <Routes>
        <Route path="/" element={<Landing />} />

        <Route path="/login" element={
          isAuthed ? <Navigate to="/dashboard" replace /> : <Login onAuthed={handleAuthed} />
        } />
        <Route path="/register" element={
          isAuthed ? <Navigate to="/dashboard" replace /> : <Register />
        } />

        {/* 사용자 보호 구역 */}
        <Route element={<ProtectRoute isAuthed={isAuthed} />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/logs/new" element={<Create />} />
          <Route path="/logs/:id/edit" element={<Edit />} />
        </Route>

        {/* 관리자 보호 구역 */}
        <Route element={<AdminRoute isAuthed={isAuthed} user={user} />}>
          <Route path="/admin" element={<Admin />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
}
