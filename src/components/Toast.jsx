import { createContext, useContext, useState, useCallback, useRef } from 'react';

const ToastContext = createContext(null);
let toastId = 0;

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within a ToastProvider');
  return ctx;
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const timers = useRef({});

  const removeToast = useCallback((id) => {
    clearTimeout(timers.current[id]);
    delete timers.current[id];
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback((message, type, duration) => {
    if (duration === undefined) duration = 4000;
    const id = ++toastId;
    setToasts((prev) => [...prev, { id, message, type: type || 'info' }]);
    if (duration > 0) {
      timers.current[id] = setTimeout(() => removeToast(id), duration);
    }
    return id;
  }, [removeToast]);

  const showToast = useCallback((message, type) => addToast(message, type || 'info'), [addToast]);
  const showCreditToast = useCallback((amount, reason) => addToast({ amount, reason }, 'credit'), [addToast]);

  const value = { showToast, showCreditToast, removeToast };

  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastContainer toasts={toasts} onDismiss={removeToast} />
    </ToastContext.Provider>
  );
}

function ToastContainer({ toasts, onDismiss }) {
  if (toasts.length === 0) return null;
  return (
    <div className="toast-container">
      {toasts.map((t) => (
        <ToastItem key={t.id} toast={t} onDismiss={() => onDismiss(t.id)} />
      ))}
      <style>{toastStyles}</style>
    </div>
  );
}

function ToastItem({ toast, onDismiss }) {
  const { message, type } = toast;
  const isCredit = type === 'credit';
  const amount = isCredit ? message.amount : null;
  const reason = isCredit ? message.reason : null;

  let icon, bgColor, borderColor;
  switch (type) {
    case 'success':
      icon = String.fromCharCode(10003); bgColor = 'var(--accent-light)'; borderColor = 'var(--accent)'; break;
    case 'error':
      icon = String.fromCharCode(10005); bgColor = '#FEE2E2'; borderColor = 'var(--danger)'; break;
    case 'credit':
      icon = String.fromCharCode(9679); bgColor = 'var(--accent-light)'; borderColor = 'var(--accent)'; break;
    default:
      icon = 'i'; bgColor = '#DBEAFE'; borderColor = '#3B82F6'; break;
  }

  const textColor = type === 'error' ? 'var(--danger)' : type === 'info' ? '#1D4ED8' : '#065F46';

  return (
    <div className="toast-item" style={{ background: bgColor, borderColor, color: textColor }}>
      <span className="toast-icon" style={{ background: borderColor }}>{icon}</span>
      <span className="toast-body">
        {isCredit ? (
          <><strong>+{amount}</strong> credits{reason ? String.fromCharCode(8212) + ' ' + reason : ''}</>
        ) : (
          message
        )}
      </span>
      <button className="toast-dismiss" onClick={onDismiss}>{String.fromCharCode(215)}</button>
    </div>
  );
}

const toastStyles = String.raw`
.toast-container {
  position: fixed; top: 1rem; right: 1rem; z-index: 9999;
  display: flex; flex-direction: column; gap: 0.5rem;
  max-width: 380px; pointer-events: none;
}
.toast-item {
  display: flex; align-items: center; gap: 0.6rem;
  padding: 0.65rem 1rem; border-radius: var(--radius);
  border: 1px solid; box-shadow: var(--shadow-md);
  animation: toastSlideIn 0.25s ease;
  pointer-events: auto; font-size: 0.875rem; line-height: 1.4;
}
@keyframes toastSlideIn {
  from { opacity: 0; transform: translateX(20px); }
  to { opacity: 1; transform: translateX(0); }
}
.toast-icon {
  width: 22px; height: 22px; border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  color: #fff; font-weight: 700; font-size: 0.75rem; flex-shrink: 0;
}
.toast-body { flex: 1; min-width: 0; }
.toast-dismiss {
  background: none; border: none; cursor: pointer;
  font-size: 1.1rem; line-height: 1; opacity: 0.5;
  padding: 0; color: inherit; flex-shrink: 0;
}
.toast-dismiss:hover { opacity: 1; }
@media (max-width: 480px) {
  .toast-container { left: 0.75rem; right: 0.75rem; max-width: none; }
}
`;
