import { Link, useNavigate } from "react-router-dom";
import "./Header.scss"; // ✅ 전용 SCSS 파일 임포트

export default function Header({ user, onLogout }) {
    const nav = useNavigate();

    const handleLogout = () => {
        if (window.confirm("로그아웃 하시겠습니까?")) {
            onLogout?.();
            nav("/login", { replace: true });
        }
    };

    return (
        // ✅ BEM 클래스명 적용
        <header className="site-header">
            <div className="container site-header__inner">

                {/* ✅ [수정] 텍스트 로고를 img 태그로 변경 */}
                <Link to="/dashboard" className="site-header__logo">
                    <img src="/images/logo.png" alt="My-GameLog 로고" />
                </Link>

                <nav className="site-header__nav">
                    <Link className="btn btn--secondary" to="/feed">
                        공개피드
                    </Link>
                    <Link className="btn" to="/dashboard">
                        나의 대시보드
                    </Link>
                    {user?.role === "admin" && (
                        <Link className="btn btn--secondary" to="/admin">
                            관리자
                        </Link>
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