import { useEffect, useState } from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";

import Landing from "./pages/Landing";
import Login from "./pages/Auth/Login";
import Register from "./pages/Auth/Register";
import Dashboard from "./pages/Dashboard";
import Admin from "./pages/Admin";
import Create from "./pages/Log/Create";
import Edit from "./pages/Log/Edit";
import Feed from "./pages/Feed";

import ProtectRoute from "./components/ProtectRoute";
import AdminRoute from "./components/AdminRoute";
import Header from "./components/Header";
import "./App.scss";

export default function App() {
  // 토큰/유저 상태
  const [token, setToken] = useState(() => localStorage.getItem("token"));
  const [user, setUser] = useState(() => {
    const raw = localStorage.getItem("user");
    return raw ? JSON.parse(raw) : null;
  });
  const isAuthed = !!token;
  const location = useLocation();

  // 로그인 성공 시 콜백(로그인 페이지에서 호출)
  const handleAuthed = ({ token, user }) => {
    setToken(token || null);
    setUser(user || null);
    if (token) localStorage.setItem("token", token); else localStorage.removeItem("token");
    if (user) localStorage.setItem("user", JSON.stringify(user)); else localStorage.removeItem("user");
  };

  // 로그아웃 동작(상태/스토리지 정리)
  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setToken(null);
    setUser(null);
  };

  // 헤더를 숨길 페이지(랜딩/로그인/회원가입) // 로그인/회원가입/랜딩에서는 헤더 숨김
  const hideHeaderOn = new Set(["/", "/login", "/register"]);
  const showHeader = isAuthed && !hideHeaderOn.has(location.pathname);

  useEffect(() => { }, []);

  return (
    <>
      {/* ✨ 1. 슬라이드 div를 7개로 늘립니다. */}
      <div className="background-slideshow">
        <div className="slide"></div>
        <div className="slide"></div>
        <div className="slide"></div>
        <div className="slide"></div>
        <div className="slide"></div>
        <div className="slide"></div>
        <div className="slide"></div>
      </div>

      {/* ✅ 로그인되어 있고(=토큰 있음) 숨김 페이지가 아니면 헤더 렌더*/}
      {showHeader && <Header user={user} onLogout={handleLogout} />}

      <Routes>
        <Route path="/" element={<Landing />} />

        {/* 로그인/회원가입 */}
        <Route
          path="/login"
          element={isAuthed ? <Navigate to="/dashboard" replace /> : <Login onAuthed={handleAuthed} />}
        />
        <Route
          path="/register"
          element={isAuthed ? <Navigate to="/dashboard" replace /> : <Register />}
        />

        {/* ✅ 공개 피드: 누구나 접근 가능 */}
        <Route path="/feed" element={<Feed />} />

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
    </>
  );
}