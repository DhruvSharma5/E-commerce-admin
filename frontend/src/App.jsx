import { Link, NavLink, Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from './AuthContext.jsx';
import Products from './pages/Products.jsx';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import ProductForm from './pages/ProductForm.jsx';

// Only lets logged-in users through; others are sent to /login
function Protected({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <p className="muted">Loading…</p>;
  return user ? children : <Navigate to="/login" replace />;
}

export default function App() {
  const { user, logout } = useAuth();
  return (
    <>
      <header className="bar">
        <Link to="/" className="brand">Stockroom</Link>
        <nav>
          <NavLink to="/">Products</NavLink>
          {user ? (
            <>
              <NavLink to="/products/new">Add product</NavLink>
              <span className="muted">{user.name}</span>
              <button className="btn ghost" onClick={logout}>Log out</button>
            </>
          ) : (
            <>
              <NavLink to="/login">Log in</NavLink>
              <NavLink to="/register">Register</NavLink>
            </>
          )}
        </nav>
      </header>
      <main>
        <Routes>
          <Route path="/" element={<Products />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/products/new" element={<Protected><ProductForm /></Protected>} />
          <Route path="/products/:id/edit" element={<Protected><ProductForm /></Protected>} />
          <Route path="*" element={<p>Page not found.</p>} />
        </Routes>
      </main>
    </>
  );
}
