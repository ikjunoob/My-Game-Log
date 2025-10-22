// src/pages/Auth/Register.jsx
import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { register } from "../../api/users";

export default function Register() {
    const nav = useNavigate();
    const [form, setForm] = useState({ username: "", password: "" });
    const [loading, setLoading] = useState(false);
    const [err, setErr] = useState("");
    const [ok, setOk] = useState("");

    const onChange = (e) => setForm((s) => ({ ...s, [e.target.name]: e.target.value }));

    const onSubmit = async (e) => {
        e.preventDefault();
        setErr(""); setOk(""); setLoading(true);
        try {
            await register(form);
            setOk("회원가입 완료! 로그인해 주세요.");
            setTimeout(() => nav("/login", { replace: true }), 600);
        } catch (error) {
            setErr(error?.response?.data?.message || "회원가입 실패");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="container" style={{ padding: "2rem" }}>
            <h2>회원가입</h2>
            <form onSubmit={onSubmit} className="card" style={{ padding: "1rem", maxWidth: 420 }}>
                <label>아이디</label>
                <input name="username" value={form.username} onChange={onChange} required />
                <label>비밀번호</label>
                <input name="password" type="password" value={form.password} onChange={onChange} required />
                {err && <p style={{ color: "var(--danger)" }}>{err}</p>}
                {ok && <p style={{ color: "var(--accent)" }}>{ok}</p>}
                <button className="btn" disabled={loading} style={{ marginTop: "1rem" }}>
                    {loading ? "처리 중..." : "가입하기"}
                </button>
                <p style={{ marginTop: "1rem" }}>
                    이미 계정이 있나요? <Link to="/login">로그인</Link>
                </p>
            </form>
        </div>
    );
}
