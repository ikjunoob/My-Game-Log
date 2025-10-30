import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { login, me } from "../../api/users";
import "./Login.scss";

export default function Login({ onAuthed }) {
    const nav = useNavigate();
    const [form, setForm] = useState({ username: "", password: "" });
    const [loading, setLoading] = useState(false);
    const [err, setErr] = useState("");

    const onChange = (e) =>
        setForm((s) => ({ ...s, [e.target.name]: e.target.value }));

    const onSubmit = async (e) => {
        e.preventDefault();
        setErr("");
        setLoading(true);
        try {
            const { token } = await login(form);
            localStorage.setItem("token", token);
            const user = await me();
            localStorage.setItem("user", JSON.stringify(user));
            onAuthed?.({ token, user });
            if (user.role === "admin") nav("/admin", { replace: true });
            else nav("/dashboard", { replace: true });
        } catch (error) {
            setErr(error?.response?.data?.message || "로그인 실패");
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            {/* 배경 + 그라데이션 오버레이 */}
            <div className="login-page" />

            <div className="login-layer">
                {/* ✅ 네온사인 브랜드 */}
                <div className="neon-brand">My – GameLog</div>

                <div className="login-box">
                    <h2 className="login-title">로그인</h2>

                    <form onSubmit={onSubmit} className="login-form">
                        <label htmlFor="username">아이디</label>
                        <input
                            id="username"
                            name="username"
                            className="login-input"
                            value={form.username}
                            onChange={onChange}
                            autoFocus
                            required
                        />

                        <label htmlFor="password">비밀번호</label>
                        <input
                            id="password"
                            name="password"
                            type="password"
                            className="login-input"
                            value={form.password}
                            onChange={onChange}
                            required
                        />

                        {err && <p className="login-error">{err}</p>}

                        <div className="login-actions">
                            <button className="btn-login" disabled={loading} type="submit">
                                {loading ? "로그인 중..." : "LOGIN"}
                            </button>
                        </div>

                        <p className="login-meta">
                            계정이 없으신가요? <Link to="/register">회원가입</Link>
                        </p>
                    </form>
                </div>
            </div>
        </>
    );
}
