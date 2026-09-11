import { useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { useAuth } from '@/store/authStore';
import { useCart } from '@/store/cartStore';

const links = [
  { to: '/marketplace', label: 'Marketplace' },
  { to: '/services', label: 'Services' },
  { to: '/courses', label: 'Courses' },
];

export default function Navbar() {
  const { user, logout } = useAuth();
  const count = useCart((s) => s.items.length);
  const [open, setOpen] = useState(false);

  const linkCls = ({ isActive }) =>
    `rounded-lg px-3 py-2 text-sm transition ${isActive ? 'text-neon' : 'text-slate-400 hover:text-white'}`;

  return (
    <header className="sticky top-0 z-50 border-b border-edge bg-void/85 backdrop-blur-md">
      <nav className="mx-auto flex max-w-6xl items-center gap-2 px-4 py-3">
        <Link to="/" className="mr-2 flex items-center gap-2">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-neon/10 text-neon shadow-neon font-display font-bold">Z</span>
          <span className="hidden font-display text-sm font-bold tracking-widest text-white sm:block">ZAFONEX</span>
        </Link>

        <div className="hidden md:flex md:items-center">
          {links.map((l) => <NavLink key={l.to} to={l.to} className={linkCls}>{l.label}</NavLink>)}
        </div>

        <div className="ml-auto flex items-center gap-2">
          <Link to="/cart" className="btn-ghost relative px-3 py-2">
            Cart
            {count > 0 && (
              <span className="absolute -right-1 -top-1 grid h-5 w-5 place-items-center rounded-full bg-ember text-[10px] font-bold text-white">
                {count}
              </span>
            )}
          </Link>

          {user ? (
            <>
              <Link to="/dashboard" className="hidden btn-ghost px-3 py-2 sm:inline-flex">Dashboard</Link>
              <button onClick={logout} className="btn-ghost px-3 py-2">Sign out</button>
            </>
          ) : (
            <>
              <Link to="/login" className="btn-ghost px-3 py-2">Log in</Link>
              <Link to="/register" className="btn-primary hidden px-3 py-2 sm:inline-flex">Join</Link>
            </>
          )}

          <button className="btn-ghost px-3 py-2 md:hidden" onClick={() => setOpen(!open)} aria-label="Menu">☰</button>
        </div>
      </nav>

      {open && (
        <div className="border-t border-edge px-4 py-2 md:hidden">
          {links.map((l) => (
            <NavLink key={l.to} to={l.to} onClick={() => setOpen(false)} className="block px-2 py-3 text-sm text-slate-300">
              {l.label}
            </NavLink>
          ))}
          {user && <Link to="/dashboard" onClick={() => setOpen(false)} className="block px-2 py-3 text-sm text-slate-300">Dashboard</Link>}
        </div>
      )}
    </header>
  );
}
