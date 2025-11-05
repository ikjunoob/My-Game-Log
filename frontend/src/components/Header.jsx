import { NavLink, useNavigate } from "react-router-dom"; // ✅ Link -> NavLink로 변경
import "./Header.scss";

export default function Header({ user, onLogout }) {
    const nav = useNavigate();

    const handleLogout = () => {
        if (window.confirm("로그아웃 하시겠습니까?")) {
            onLogout?.();
            nav("/login", { replace: true });
        }
    };

    return (
        <header className="site-header">
            <div className="container site-header__inner">

                <NavLink to="/dashboard" className="site-header__logo"> {/* ✅ 로고도 NavLink로 변경 */}
                    <img src="/images/logo.png" alt="My-GameLog 로고" />
                </NavLink>

                {/* ✅ [수정] NavLink와 동적 className 적용 */}
                <nav className="site-header__nav">
                    <NavLink
                        className={({ isActive }) => isActive ? "btn" : "btn btn--secondary"}
                        to="/feed"
                    >
                        공개피드
                    </NavLink>
                    <NavLink
                        className={({ isActive }) => isActive ? "btn" : "btn btn--secondary"}
                        to="/dashboard"
                    >
                        나의 대시보드
                    </NavLink>
                    {user?.role === "admin" && (
                        <NavLink
                            className={({ isActive }) => isActive ? "btn" : "btn btn--secondary"}
                            to="/admin"
                        >
                            관리자
                        </NavLink>
                    )}
                </nav>

                <div className="site-header__user">
                    <span>{user?.username}</span>
                    <button className="btn btn--danger" onClick={handleLogout}>
                        로그아웃
                    </button>
                </div>
            </div>
        </header>
    );
}