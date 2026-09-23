import { logout } from '@/app/admin/actions';

export default function AdminNav({ current }) {
  const linkClass = (key) =>
    `text-sm ${current === key ? 'text-[#C9A227]' : 'text-[#8A8378] hover:text-[#F5F1EA]'}`;

  return (
    <div className="flex items-center justify-between mb-8">
      <nav className="flex gap-4">
        <a href="/admin" className={linkClass('dashboard')}>Dashboard</a>
        <a href="/admin/turnos" className={linkClass('turnos')}>Turnos</a>
      </nav>
      <form action={logout}>
        <button className="text-sm text-[#8A8378] hover:text-red-400">Cerrar sesión</button>
      </form>
    </div>
  );
}
