import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../api.js';
import Field from '../components/Field.jsx';

const empty = { name: '', description: '', imageUrl: '', price: '', stock: '', category: 'General' };

// Same component handles "add" (no :id in URL) and "edit" (:id present)
export default function ProductForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState(empty);
  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!id) return;
    api(`/products/${id}`, { auth: false })
      .then(({ data }) => setForm({ ...data, price: String(data.price), stock: String(data.stock) }))
      .catch((err) => setMessage(err.message));
  }, [id]);

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const onSubmit = async (e) => {
    e.preventDefault();
    setErrors({}); setMessage('');
    // Inputs give strings; the API requires real numbers, so convert before sending.
    // Number('') is 0, so keep blanks as NaN-ish to let the API report them.
    const body = {
      name: form.name, description: form.description, imageUrl: form.imageUrl.trim(), category: form.category,
      price: form.price === '' ? null : Number(form.price),
      stock: form.stock === '' ? null : Number(form.stock),
    };
    try {
      await api(id ? `/products/${id}` : '/products', { method: id ? 'PUT' : 'POST', body });
      navigate('/');
    } catch (err) {
      setErrors(err.fields || {});
      setMessage(err.message);
    }
  };

  return (
    <form className="card narrow" onSubmit={onSubmit} noValidate>
      <h1>{id ? 'Edit product' : 'Add product'}</h1>
      {message && <p className="err banner">{message}</p>}
      <Field label="Name" name="name" value={form.name} onChange={onChange} error={errors.name} />
      <Field label="Description" name="description" as="textarea" rows="3" value={form.description} onChange={onChange} error={errors.description} />
      <Field label="Image URL" name="imageUrl" type="url" placeholder="https://example.com/product.jpg" value={form.imageUrl} onChange={onChange} error={errors.imageUrl} />
      <Field label="Category" name="category" value={form.category} onChange={onChange} error={errors.category} />
      <Field label="Price (INR)" name="price" type="number" step="0.01" min="0" value={form.price} onChange={onChange} error={errors.price} />
      <Field label="Stock" name="stock" type="number" step="1" min="0" value={form.stock} onChange={onChange} error={errors.stock} />
      <button className="btn">{id ? 'Save changes' : 'Add product'}</button>
    </form>
  );
}
