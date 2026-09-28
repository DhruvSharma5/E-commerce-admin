import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext.jsx';
import Field from '../components/Field.jsx';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '' });
  const [errors, setErrors] = useState({}); // {fieldName: message} from the API
  const [message, setMessage] = useState('');

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const onSubmit = async (e) => {
    e.preventDefault();
    setErrors({}); setMessage('');
    try {
      await register(form);
      navigate('/login', { state: { registered: true } }); // register returns no tokens, so go log in
    } catch (err) {
      setErrors(err.fields || {});
      setMessage(err.message);
    }
  };

  return (
    <form className="card narrow" onSubmit={onSubmit} noValidate>
      <h1>Create account</h1>
      {message && <p className="err banner">{message}</p>}
      <Field label="Name" name="name" value={form.name} onChange={onChange} error={errors.name} autoComplete="name" />
      <Field label="Email" name="email" type="email" value={form.email} onChange={onChange} error={errors.email} autoComplete="email" />
      <Field label="Password" name="password" type="password" value={form.password} onChange={onChange} error={errors.password} autoComplete="new-password" />
      <Field label="Confirm password" name="confirmPassword" type="password" value={form.confirmPassword} onChange={onChange} error={errors.confirmPassword} autoComplete="new-password" />
      <button className="btn">Create account</button>
      <p className="muted">Already registered? <Link to="/login">Log in</Link></p>
    </form>
  );
}
