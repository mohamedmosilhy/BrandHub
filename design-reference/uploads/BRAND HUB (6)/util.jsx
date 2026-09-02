/* ───────────────── BRANDHUB · shared flow utilities ─────────────────
   Toast hook + component reused by checkout / wishlist / search /
   login / account / confirmation pages. Loaded after icons.jsx. */

function useToasts() {
  const [toasts, setToasts] = React.useState([]);
  const toast = React.useCallback((msg) => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, msg }]);
    setTimeout(() => setToasts((prev) => prev.filter((x) => x.id !== id)), 1900);
  }, []);
  return [toasts, toast];
}

function Toasts({ items }) {
  return (
    <div className="toast-wrap">
      {items.map((t) => (
        <div className="toast" key={t.id}>
          <span className="ic"><Icon name="check" size={16} /></span>{t.msg}
        </div>
      ))}
    </div>
  );
}

Object.assign(window, { useToasts, Toasts });
