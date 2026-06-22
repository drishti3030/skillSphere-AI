export default function CreditBadge({ amount, label }) {
  return (
    <span className="badge badge-credit" style={{ fontSize: '0.8rem', padding: '0.25rem 0.6rem' }}>
      +{amount} {label || 'credits'}
    </span>
  );
}
