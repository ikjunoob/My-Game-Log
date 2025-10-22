// src/pages/Auth/Login.jsx
import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { login, me } from "../../api/users";

export default function Login({ onAuthed }) {
    const nav = useNavigate();
    const [form, setForm] = useState({ username: "", password: "" });
    const [loading, setLoading] = useState(false);
    const [err, setErr] = useState("");

    const onChange = (e) => setForm((s) => ({ ...s, [e.target.name]: e.target.value }));

    const onSubmit = async (e) => {
        e.preventDefault();
        setErr(""); setLoading(true);
        try {
            const { token } = await login(form);
            localStorage.setItem("token", token);
            // 최신 사용자 정보 확보
            const user = await me();
            localStorage.setItem("user", JSON.stringify(user));
            onAuthed?.({ token, user });
            // 역할에 따라 이동
            if (user.role === "admin") nav("/admin", { replace: true });
            else nav("/dashboard", { replace: true });
        } catch (error) {
            setErr(error?.response?.data?.message || "로그인 실패");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="container" style={{ padding: "2rem" }}>
            <h2>로그인</h2>
            <form onSubmit={onSubmit} className="card" style={{ padding: "1rem", maxWidth: 420 }}>
                <label>아이디</label>
                <input name="username" value={form.username} onChange={onChange} required />
                <label>비밀번호</label>
                <input name="password" type="password" value={form.password} onChange={onChange} required />
                {err && <p style={{ color: "var(--danger)" }}>{err}</p>}
                <button className="btn" disabled={loading} style={{ marginTop: "1rem" }}>
                    {loading ? "로그인 중..." : "로그인"}
                </button>
                <p style={{ marginTop: "1rem" }}>
                    계정이 없으신가요? <Link to="/register">회원가입</Link>
                </p>
            </form>
        </div>
    );
}
