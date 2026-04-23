import { NavLink, Link } from 'react-router-dom'
import { LayoutDashboard, Package, Users, LogOut, ChevronRight, Truck, Tags } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'

export default function Sidebar() {
  const { user, logout } = useAuth()

  const initials = user?.nome
    ? user.nome.split(' ').map((n: string) => n[0]).slice(0, 2).join('').toUpperCase()
    : '??'

  const profileColor =
    user?.perfil === 'ADMIN'
      ? { bg: 'rgba(59,130,246,0.15)', text: '#1e40af', label: 'Administrador' }
      : { bg: 'rgba(16,185,129,0.15)', text: '#059669', label: 'Gestão' }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;500;600;700;800&family=DM+Sans:wght@400;500;600&display=swap');

        .sb-root {
          width: 260px;
          min-width: 260px;
          height: 100vh;
          display: flex;
          flex-direction: column;
          background: #ffffff;
          border-right: 1px solid rgba(59,130,246,0.15);
          position: relative;
          overflow: hidden;
          font-family: 'DM Sans', sans-serif;
          box-shadow: 2px 0 12px rgba(0,0,0,0.04);
        }

        .sb-root::before {
          content: '';
          position: absolute;
          top: -80px; left: -80px;
          width: 300px; height: 300px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(59,130,246,0.06) 0%, transparent 70%);
          pointer-events: none;
        }
        .sb-root::after {
          content: '';
          position: absolute;
          bottom: -60px; right: -60px;
          width: 240px; height: 240px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(96,165,250,0.05) 0%, transparent 70%);
          pointer-events: none;
        }

        .sb-header {
          padding: 24px 20px 20px;
          border-bottom: 1px solid rgba(59,130,246,0.12);
          position: relative;
          z-index: 1;
        }

        .sb-brand {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 10px;
        }

        .sb-brand__icon {
          width: 42px; height: 42px;
          border-radius: 13px;
          background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 55%, #1e40af 100%);
          display: flex; align-items: center; justify-content: center;
          box-shadow: 0 4px 16px rgba(37,99,235,0.35);
          flex-shrink: 0;
        }

        .sb-brand__name {
          font-family: 'Sora', sans-serif;
          font-size: 14.5px;
          font-weight: 700;
          color: #0f172a;
          line-height: 1.2;
          letter-spacing: -0.01em;
        }

        .sb-school {
          font-size: 11.5px;
          color: #64748b;
          font-weight: 500;
          padding-left: 2px;
          letter-spacing: 0.02em;
        }

        .sb-nav {
          flex: 1;
          padding: 16px 12px;
          display: flex;
          flex-direction: column;
          gap: 4px;
          position: relative;
          z-index: 1;
        }

        .sb-nav__label {
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.1em;
          color: #94a3b8;
          text-transform: uppercase;
          padding: 8px 8px 6px;
          margin-bottom: 2px;
        }

        .sb-link {
          display: flex;
          align-items: center;
          gap: 11px;
          padding: 11px 14px;
          border-radius: 12px;
          font-size: 14px;
          font-weight: 500;
          color: #64748b;
          text-decoration: none;
          transition: color 0.18s, background 0.18s;
          position: relative;
          overflow: hidden;
        }

        .sb-link:hover {
          color: #0f172a;
          background: rgba(59,130,246,0.08);
        }

        .sb-link--active {
          color: #1e40af !important;
          background: rgba(59,130,246,0.12) !important;
        }

        .sb-link--active::before {
          content: '';
          position: absolute;
          left: 0; top: 20%; bottom: 20%;
          width: 3px;
          border-radius: 0 4px 4px 0;
          background: linear-gradient(180deg, #3b82f6, #2563eb);
        }

        .sb-link__icon {
          flex-shrink: 0;
          opacity: 0.7;
          transition: opacity 0.18s;
        }

        .sb-link--active .sb-link__icon,
        .sb-link:hover .sb-link__icon {
          opacity: 1;
        }

        .sb-link__chevron {
          margin-left: auto;
          opacity: 0;
          transform: translateX(-4px);
          transition: opacity 0.18s, transform 0.18s;
          color: #94a3b8;
        }

        .sb-link:hover .sb-link__chevron,
        .sb-link--active .sb-link__chevron {
          opacity: 1;
          transform: translateX(0);
        }

        .sb-footer {
          padding: 12px;
          border-top: 1px solid rgba(59,130,246,0.12);
          position: relative;
          z-index: 1;
        }

        .sb-user {
          display: flex;
          align-items: center;
          gap: 11px;
          padding: 10px 12px;
          border-radius: 14px;
          background: rgba(59,130,246,0.06);
          border: 1px solid rgba(59,130,246,0.12);
          margin-bottom: 6px;
        }

        .sb-user__avatar {
          width: 36px; height: 36px;
          border-radius: 10px;
          background: linear-gradient(135deg, #2563eb, #1d4ed8);
          display: flex; align-items: center; justify-content: center;
          font-family: 'Sora', sans-serif;
          font-size: 12px;
          font-weight: 700;
          color: #fff;
          flex-shrink: 0;
          letter-spacing: 0.02em;
        }

        .sb-user__info {
          flex: 1;
          min-width: 0;
        }

        .sb-user__name {
          font-size: 13px;
          font-weight: 600;
          color: #0f172a;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          line-height: 1.3;
        }

        .sb-user__email {
          font-size: 11px;
          color: #64748b;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          margin-top: 1px;
        }

        .sb-user__badge {
          font-size: 10px;
          font-weight: 700;
          padding: 3px 8px;
          border-radius: 6px;
          letter-spacing: 0.04em;
          flex-shrink: 0;
        }

        .sb-logout {
          display: flex;
          align-items: center;
          gap: 10px;
          width: 100%;
          padding: 10px 14px;
          border-radius: 12px;
          border: none;
          background: transparent;
          color: rgba(248,113,113,0.7);
          font-family: 'DM Sans', sans-serif;
          font-size: 13.5px;
          font-weight: 500;
          cursor: pointer;
          transition: color 0.18s, background 0.18s;
          text-align: left;
        }

        .sb-logout:hover {
          color: #f87171;
          background: rgba(248,113,113,0.08);
        }
      `}</style>

      <aside className="sb-root">
        <div className="sb-header">
          <div className="sb-brand">
            <div className="sb-brand__icon">
              <Package size={22} color="white" strokeWidth={2.2} />
            </div>
            <span className="sb-brand__name">Sistema de Estoque</span>
          </div>
          <p className="sb-school">Escola Yolanda Queiroz</p>
        </div>

        <nav className="sb-nav">
          <p className="sb-nav__label">Menu</p>

          <NavLink
            to="/dashboard"
            className={({ isActive }) => `sb-link ${isActive ? 'sb-link--active' : ''}`}
          >
            <LayoutDashboard size={18} className="sb-link__icon" strokeWidth={2} />
            <span>Dashboard</span>
            <ChevronRight size={14} className="sb-link__chevron" />
          </NavLink>

          <NavLink
            to="/produtos"
            className={({ isActive }) => `sb-link ${isActive ? 'sb-link--active' : ''}`}
          >
            <Package size={18} className="sb-link__icon" strokeWidth={2} />
            <span>Produtos</span>
            <ChevronRight size={14} className="sb-link__chevron" />
          </NavLink>

          <NavLink
            to="/categorias"
            className={({ isActive }) => `sb-link ${isActive ? 'sb-link--active' : ''}`}
          >
            <Tags size={18} className="sb-link__icon" strokeWidth={2} />
            <span>Categorias</span>
            <ChevronRight size={14} className="sb-link__chevron" />
          </NavLink>

          <NavLink
            to="/fornecedores"
            className={({ isActive }) => `sb-link ${isActive ? 'sb-link--active' : ''}`}
          >
            <Truck size={18} className="sb-link__icon" strokeWidth={2} />
            <span>Fornecedores</span>
            <ChevronRight size={14} className="sb-link__chevron" />
          </NavLink>

          {user?.perfil === 'ADMIN' && (
            <NavLink
              to="/usuarios"
              className={({ isActive }) => `sb-link ${isActive ? 'sb-link--active' : ''}`}
            >
              <Users size={18} className="sb-link__icon" strokeWidth={2} />
              <span>Usuários</span>
              <ChevronRight size={14} className="sb-link__chevron" />
            </NavLink>
          )}
        </nav>

        <div className="sb-footer">
          <Link to="/profile" className="sb-user">
            <div className="sb-user__avatar">{initials}</div>
            <div className="sb-user__info">
              <p className="sb-user__name">{user?.nome}</p>
              <p className="sb-user__email">{user?.email}</p>
            </div>
            <span
              className="sb-user__badge"
              style={{ background: profileColor.bg, color: profileColor.text }}
            >
              {user?.perfil}
            </span>
          </Link>

          <button className="sb-logout" onClick={logout}>
            <LogOut size={16} strokeWidth={2} />
            Sair
          </button>
        </div>
      </aside>
    </>
  )
}