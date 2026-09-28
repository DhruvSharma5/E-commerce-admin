// One labelled input + its field-level error message from the API
export default function Field({ label, name, error, as: Tag = 'input', ...props }) {
  return (
    <label className="field">
      <span>{label}</span>
      <Tag name={name} aria-invalid={!!error} {...props} />
      {error && <small className="err">{error}</small>}
    </label>
  );
}
