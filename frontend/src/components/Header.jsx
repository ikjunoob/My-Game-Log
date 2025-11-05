// src/components/Header.jsx
import { Link, useNavigate } from "react-router-dom";

export default function Header({ user, onLogout }) {
    const nav = useNavigate();
    const handleLogout = () => {
        onLogout?.(); // ← App.jsx의 handleLogout 호출
        nav("/login", { replace: true });
        // 👇 이 if 문을 추가합니다.
        if (window.confirm("로그아웃 하시겠습니까?")) {
            onLogout?.(); // ← App.jsx의 handleLogout 호출
            nav("/login", { replace: true });
        }
        // '취소'를 누르면 아무 일도 일어나지 않습니다.
    };

    return (
        <header style={{
            position: "sticky", top: 0, zIndex: 10,
            background: "var(--card)", borderBottom: "1px solid var(--border)", boxShadow: "var(--shadow)",
        }}>
            <div className="container" style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 0" }}>
                <Link to="/dashboard" style={{ fontWeight: 700 }}>나의 게임 기록</Link>
                <nav style={{ marginLeft: "auto", display: "flex", gap: 12 }}>
                    <Link className="btn" to="/feed">공개피드</Link>
                    <Link className="btn" to="/dashboard">나의 대시보드</Link>
                    {user?.role === "admin" && <Link className="btn" to="/admin">관리자</Link>}
                    <span style={{ alignSelf: "center", color: "var(--muted)" }}>{user?.username}</span>
                    <button className="btn" onClick={handleLogout}>로그아웃</button>
                </nav>
            </div>
        </header>
    );
}
