import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext.jsx';
import Field from '../components/Field.jsx';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const { state } = useLocation();
  const [form, setForm] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState('');

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const onSubmit = async (e) => {
    e.preventDefault();
    setErrors({}); setMessage('');
    try {
      await login(form.email, form.password);
      navigate('/');
    } catch (err) {
      setErrors(err.fields || {});
      setMessage(err.message);
    }
  };

  return (
    <form className="card narrow" onSubmit={onSubmit} noValidate>
      <h1>Log in</h1>
      {state?.registered && <p className="ok banner">Account created. Log in to continue.</p>}
      {message && <p className="err banner">{message}</p>}
      <Field label="Email" name="email" type="email" value={form.email} onChange={onChange} error={errors.email} autoComplete="email" />
      <Field label="Password" name="password" type="password" value={form.password} onChange={onChange} error={errors.password} autoComplete="current-password" />
      <button className="btn">Log in</button>
      <p className="muted">No account? <Link to="/register">Register</Link></p>
    </form>
  );
}
