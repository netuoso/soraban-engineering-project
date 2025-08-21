import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { logout } from '../services/api';

const Navigation = () => {
  const { user, logout: authLogout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    authLogout();
    navigate('/login');
  };

  return (
    <nav className="navbar navbar-expand-lg navbar-dark bg-dark">
      <div className="container">
        <Link className="navbar-brand" to="/">Soraban</Link>
        <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav">
          <span className="navbar-toggler-icon"></span>
        </button>
        <div className="collapse navbar-collapse" id="navbarNav">
          <ul className="navbar-nav me-auto">
            {user ? (
              <>
                <li className="nav-item">
                  <Link className="nav-link" to="/">Home</Link>
                </li>
                <li className="nav-item">
                  <Link className="nav-link" to="/transactions">Transactions</Link>
                </li>
                <li className="nav-item">
                  <Link className="nav-link" to="/rules">Rules</Link>
                </li>
                <li className="nav-item">
                  <Link className="nav-link" to="/categories">Categories</Link>
                </li>
              </>
            ) : null}
          </ul>
          <ul className="navbar-nav">
            {user ? (
              <li className="nav-item">
                <button className="nav-link btn btn-link" onClick={handleLogout}>
                  Logout
                </button>
              </li>
            ) : (
              <>
                <li className="nav-item">
                  <Link className="nav-link" to="/login">Login</Link>
                </li>
                <li className="nav-item">
                  <Link className="nav-link" to="/register">Register</Link>
                </li>
              </>
            )}
          </ul>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;
