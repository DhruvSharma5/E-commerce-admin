import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api.js';
import { useAuth } from '../AuthContext.jsx';

const money = (n) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(n);

export default function Products() {
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('loading'); // loading | ready | error
  const [error, setError] = useState('');

  // Re-fetch whenever the page or (debounced) search changes
  useEffect(() => {
    setStatus('loading');
    const t = setTimeout(async () => {
      try {
        const qs = new URLSearchParams({ page, limit: 6, ...(search && { search }) });
        const res = await api(`/products?${qs}`, { auth: false });
        setItems(res.data);
        setPagination(res.pagination);
        setStatus('ready');
      } catch (err) { setError(err.message); setStatus('error'); }
    }, 250);
    return () => clearTimeout(t);
  }, [page, search]);

  const remove = async (p) => {
    if (!window.confirm(`Delete "${p.name}"?`)) return;
    try {
      await api(`/products/${p._id}`, { method: 'DELETE' });
      setItems((list) => list.filter((x) => x._id !== p._id)); // update UI without refetching
    } catch (err) { alert(err.message); }
  };

  return (
    <>
      <div className="row">
        <h1>Products</h1>
        <input className="search" placeholder="Search by name" value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
      </div>

      {status === 'error' && <p className="err banner">{error}</p>}
      {status === 'ready' && items.length === 0 && (
        <p className="muted">{search ? 'No products match that search.' : 'No products yet. Log in and add the first one.'}</p>
      )}

      <div className="grid">
        {items.map((p) => (
          <article key={p._id} className="card">
            {p.imageUrl ? (
              <img className="product-image" src={p.imageUrl} alt={p.name} onError={(e) => { e.currentTarget.style.display = 'none'; }} />
            ) : (
              <div className="product-image placeholder">No image</div>
            )}
            <p className="muted">{p.category}</p>
            <h2>{p.name}</h2>
            <p>{p.description || 'No description.'}</p>
            <p className="price">{money(p.price)} <span className={p.stock ? 'muted' : 'err'}>{p.stock ? `${p.stock} in stock` : 'Out of stock'}</span></p>
            {user?.id === p.createdBy && (
              <div className="row">
                <Link className="btn ghost" to={`/products/${p._id}/edit`}>Edit</Link>
                <button className="btn danger" onClick={() => remove(p)}>Delete</button>
              </div>
            )}
          </article>
        ))}
      </div>

      {pagination.pages > 1 && (
        <div className="row pager">
          <button className="btn ghost" disabled={page <= 1} onClick={() => setPage(page - 1)}>Previous</button>
          <span className="muted">Page {pagination.page} of {pagination.pages}</span>
          <button className="btn ghost" disabled={page >= pagination.pages} onClick={() => setPage(page + 1)}>Next</button>
        </div>
      )}
    </>
  );
}
