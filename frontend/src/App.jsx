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
import "./App.scss";

export default function App() {
  const [token, setToken] = useState(() => localStorage.getItem("token"));
  const [user, setUser] = useState(() => {
    const raw = localStorage.getItem("user");
    return raw ? JSON.parse(raw) : null;
  });
  const isAuthed = !!token;
  const location = useLocation();

  // 로그인/로그아웃 시 localStorage 동기화
  const handleAuthed = ({ token, user }) => {
    setToken(token || null);
    setUser(user || null);
    if (token) localStorage.setItem("token", token);
    else localStorage.removeItem("token");
    if (user) localStorage.setItem("user", JSON.stringify(user));
    else localStorage.removeItem("user");
  };

  // 새로고침 시에도 localStorage 값으로 유지됨
  useEffect(() => {
    // 추가 동작이 필요하면 여기서
  }, []);

  return (
    <div className="page">
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
