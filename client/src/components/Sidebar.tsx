import { NavLink, Link } from 'react-router-dom'
import { LayoutDashboard, Package, Users, LogOut, ChevronRight, Tags, Sun, Moon, Bell } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { useTheme } from '../contexts/ThemeContext'
import { useEffect, useState } from 'react'
import { useRealtime } from '../hooks/useRealtime'

export default function Sidebar() {
  const { user, logout, token } = useAuth()
  const { isDark, toggleTheme } = useTheme()
  const [alertCount, setAlertCount] = useState(0)

  const fetchAlertCount = async () => {
    if (!token) return
    try {
      const res = await fetch('/api/alertas/count', {
        headers: { Authorization: `Bearer ${token}` }
      })
      const data = await res.json()
      setAlertCount(data.count ?? 0)
    } catch {
      setAlertCount(0)
    }
  }

  useRealtime('alertas_atualizados', fetchAlertCount)
  useRealtime('estoque_atualizado', fetchAlertCount)

  useEffect(() => {
    fetchAlertCount()
  }, [token])

  const initials = user?.nome
    ? user.nome.split(' ').map((n: string) => n[0]).slice(0, 2).join('').toUpperCase()
    : '??'

  const profileColor =
    user?.perfil === 'ADMIN'
      ? { bg: 'rgba(59,130,246,0.15)', text: isDark ? '#818cf8' : '#1e40af' }
      : { bg: 'rgba(16,185,129,0.15)', text: isDark ? '#34d399' : '#059669' }

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
          background: var(--bg-sidebar);
          border-right: 1px solid var(--border-sidebar);
          position: relative;
          overflow: hidden;
          font-family: 'DM Sans', sans-serif;
          box-shadow: var(--shadow-sidebar);
        }

        .sb-root::before {
          content: '';
          position: absolute;
          top: -80px; left: -80px;
          width: 300px; height: 300px;
          border-radius: 50%;
          background: radial-gradient(circle, var(--orb-1) 0%, transparent 70%);
          pointer-events: none;
        }
        .sb-root::after {
          content: '';
          position: absolute;
          bottom: -60px; right: -60px;
          width: 240px; height: 240px;
          border-radius: 50%;
          background: radial-gradient(circle, var(--orb-2) 0%, transparent 70%);
          pointer-events: none;
        }

        .sb-header {
          padding: 24px 20px 20px;
          border-bottom: 1px solid var(--border-sidebar);
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
          color: var(--text-primary);
          line-height: 1.2;
          letter-spacing: -0.01em;
        }

        .sb-school {
          font-size: 11.5px;
          color: var(--text-secondary);
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
          color: var(--text-muted);
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
          color: var(--text-secondary);
          text-decoration: none;
          transition: color 0.18s, background 0.18s;
          position: relative;
          overflow: hidden;
        }

        .sb-link:hover {
          color: var(--text-primary);
          background: var(--bg-hover);
        }

        .sb-link--active {
          color: var(--text-link-active) !important;
          background: var(--bg-active) !important;
        }

        .sb-link--active::before {
          content: '';
          position: absolute;
          left: 0; top: 20%; bottom: 20%;
          width: 3px;
          border-radius: 0 4px 4px 0;
          background: linear-gradient(180deg, var(--accent-primary), var(--accent-hover));
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
          color: var(--text-muted);
        }

        .sb-link:hover .sb-link__chevron,
        .sb-link--active .sb-link__chevron {
          opacity: 1;
          transform: translateX(0);
        }

        .sb-alert-badge {
          margin-left: auto;
          min-width: 20px;
          height: 20px;
          border-radius: 999px;
          background: linear-gradient(135deg, #f43f5e, #e11d48);
          color: #fff;
          font-size: 10px;
          font-weight: 700;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 0 5px;
          box-shadow: 0 2px 8px rgba(244,63,94,0.45);
          animation: sb-pulse 2s ease-in-out infinite;
        }

        @keyframes sb-pulse {
          0%, 100% { box-shadow: 0 2px 8px rgba(244,63,94,0.45); }
          50% { box-shadow: 0 2px 14px rgba(244,63,94,0.75); }
        }

        /* ── Theme toggle ── */
        .sb-theme-toggle {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 11px 14px;
          margin: 0 0 6px 0;
          border-radius: 12px;
          border: 1px solid var(--border-sidebar);
          background: var(--bg-badge);
          cursor: pointer;
          transition: background 0.18s, border-color 0.18s;
          width: 100%;
        }

        .sb-theme-toggle:hover {
          background: var(--bg-hover);
        }

        .sb-theme-toggle__label {
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 14px;
          font-weight: 500;
          color: var(--text-secondary);
          flex: 1;
        }

        .sb-theme-toggle__switch {
          width: 40px;
          height: 22px;
          border-radius: 999px;
          background: var(--toggle-bg);
          position: relative;
          transition: background 0.25s;
          flex-shrink: 0;
          margin-left: 12px;
        }

        .sb-theme-toggle__switch--on {
          background: var(--accent-primary);
        }

        .sb-theme-toggle__knob {
          position: absolute;
          top: 3px;
          left: 3px;
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: #ffffff;
          transition: transform 0.25s cubic-bezier(0.34,1.56,0.64,1);
          box-shadow: 0 1px 4px rgba(0,0,0,0.3);
        }

        .sb-theme-toggle__knob--on {
          transform: translateX(18px);
        }

        /* ── Footer ── */
        .sb-footer {
          padding: 12px;
          border-top: 1px solid var(--border-sidebar);
          position: relative;
          z-index: 1;
        }

        .sb-user {
          display: flex;
          align-items: center;
          gap: 11px;
          padding: 10px 12px;
          border-radius: 14px;
          background: var(--bg-badge);
          border: 1px solid var(--border-sidebar);
          margin-bottom: 6px;
          text-decoration: none;
        }

        .sb-user__avatar {
          width: 38px; height: 38px;
          border-radius: 50%;
          background: linear-gradient(135deg, #2563eb, #1d4ed8);
          display: flex; align-items: center; justify-content: center;
          font-family: 'Sora', sans-serif;
          font-size: 13px;
          font-weight: 700;
          color: #fff;
          flex-shrink: 0;
          letter-spacing: 0.02em;
          overflow: hidden;
          border: 2px solid rgba(99,102,241,0.25);
          box-shadow: 0 0 0 2px var(--bg-sidebar), 0 2px 8px rgba(37,99,235,0.18);
        }

        .sb-user__avatar img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          border-radius: 50%;
          display: block;
        }

        .sb-user__info {
          flex: 1;
          min-width: 0;
        }

        .sb-user__name {
          font-size: 13px;
          font-weight: 600;
          color: var(--text-primary);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          line-height: 1.3;
        }

        .sb-user__email {
          font-size: 11px;
          color: var(--text-secondary);
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

          <NavLink to="/dashboard" className={({ isActive }) => `sb-link ${isActive ? 'sb-link--active' : ''}`}>
            <LayoutDashboard size={18} className="sb-link__icon" strokeWidth={2} />
            <span>Dashboard</span>
            <ChevronRight size={14} className="sb-link__chevron" />
          </NavLink>

          <NavLink to="/produtos" className={({ isActive }) => `sb-link ${isActive ? 'sb-link--active' : ''}`}>
            <Package size={18} className="sb-link__icon" strokeWidth={2} />
            <span>Produtos</span>
            <ChevronRight size={14} className="sb-link__chevron" />
          </NavLink>

          <NavLink to="/categorias" className={({ isActive }) => `sb-link ${isActive ? 'sb-link--active' : ''}`}>
            <Tags size={18} className="sb-link__icon" strokeWidth={2} />
            <span>Categorias</span>
            <ChevronRight size={14} className="sb-link__chevron" />
          </NavLink>

          <NavLink to="/alertas" className={({ isActive }) => `sb-link ${isActive ? 'sb-link--active' : ''}`}>
            <Bell size={18} className="sb-link__icon" strokeWidth={2} />
            <span>Alertas</span>
            {alertCount > 0 && (
              <span className="sb-alert-badge">{alertCount > 99 ? '99+' : alertCount}</span>
            )}
            <ChevronRight size={14} className="sb-link__chevron" />
          </NavLink>

          {user?.perfil === 'ADMIN' && (
            <NavLink to="/usuarios" className={({ isActive }) => `sb-link ${isActive ? 'sb-link--active' : ''}`}>
              <Users size={18} className="sb-link__icon" strokeWidth={2} />
              <span>Usuários</span>
              <ChevronRight size={14} className="sb-link__chevron" />
            </NavLink>
          )}
        </nav>

        <div className="sb-footer">
          {/* Theme toggle */}
          <button className="sb-theme-toggle" onClick={toggleTheme} title={isDark ? 'Mudar para claro' : 'Mudar para escuro'}>
            <span className="sb-theme-toggle__label">
              {isDark
                ? <Moon size={15} strokeWidth={2} />
                : <Sun size={15} strokeWidth={2} />
              }
              {isDark ? 'Modo escuro' : 'Modo claro'}
            </span>
            <div className={`sb-theme-toggle__switch ${isDark ? 'sb-theme-toggle__switch--on' : ''}`}>
              <div className={`sb-theme-toggle__knob ${isDark ? 'sb-theme-toggle__knob--on' : ''}`} />
            </div>
          </button>

          <Link to="/profile" className="sb-user">
            <div className="sb-user__avatar">
              {user?.avatar_url
                ? <img src={user.avatar_url} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
                : initials
              }
            </div>
            <div className="sb-user__info">
              <p className="sb-user__name">{user?.nome}</p>
              <p className="sb-user__email">{user?.email}</p>
            </div>
            <span className="sb-user__badge" style={{ background: profileColor.bg, color: profileColor.text }}>
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
