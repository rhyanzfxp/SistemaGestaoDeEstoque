import { useState, FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { Mail, Lock, Package, ArrowRight, ShieldCheck, Clock3, Boxes, Eye, EyeOff } from 'lucide-react'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const { login } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)
    try {
      await login(email, password)
      navigate('/dashboard')
    } catch {
      setError('E-mail ou senha inválidos. Tente novamente.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="login-root">
      {/* Background layers */}
      <div className="login-bg-gradient" />
      <div className="login-bg-grid" />
      <div className="login-bg-orb login-bg-orb--1" />
      <div className="login-bg-orb login-bg-orb--2" />
      <div className="login-bg-orb login-bg-orb--3" />

      <div className="login-wrapper">
        {/* Left — hero copy */}
        <section className="login-hero">
          <div className="login-hero__badge">
            <span className="login-hero__badge-dot" />
            Sistema de gestão de estoque escolar
          </div>

          <h1 className="login-hero__title">
            Controle inteligente
            <span className="login-hero__title-sub">para o almoxarifado da escola</span>
          </h1>

          <p className="login-hero__description">
            Centralize entradas, saídas, validade dos produtos e relatórios
            em uma interface clara, moderna e fácil de usar.
          </p>

          <div className="login-hero__stats">
            <div className="login-stat">
              <div className="login-stat__icon login-stat__icon--violet">
                <ShieldCheck size={20} />
              </div>
              <p className="login-stat__value">Seguro</p>
              <span className="login-stat__label">Controle por perfil</span>
            </div>
            <div className="login-stat">
              <div className="login-stat__icon login-stat__icon--cyan">
                <Clock3 size={20} />
              </div>
              <p className="login-stat__value">24h</p>
              <span className="login-stat__label">Acesso em tempo real</span>
            </div>
            <div className="login-stat">
              <div className="login-stat__icon login-stat__icon--pink">
                <Boxes size={20} />
              </div>
              <p className="login-stat__value">Estoque</p>
              <span className="login-stat__label">Movimentações rastreáveis</span>
            </div>
          </div>
        </section>

        {/* Right — login card */}
        <section className="login-card-wrapper">
          <div className="login-card">
            {/* Card glow border effect */}
            <div className="login-card__glow" />

            <div className="login-card__inner">
              {/* Logo */}
              <div className="login-card__logo">
                <div className="login-card__logo-icon">
                  <Package size={28} strokeWidth={2.2} color="white" />
                </div>
              </div>

              <div className="login-card__header">
                <h2 className="login-card__title">Bem-vindo de volta</h2>
                <p className="login-card__subtitle">
                  Faça login para acessar o sistema de controle de estoque.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="login-form">
                {/* Email */}
                <div className="login-field">
                  <label className="login-field__label">E-mail</label>
                  <div className="login-field__input-wrapper">
                    <Mail size={18} className="login-field__icon" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      placeholder="seu@email.com"
                      className="login-field__input"
                      autoComplete="email"
                    />
                  </div>
                </div>

                {/* Password */}
                <div className="login-field">
                  <label className="login-field__label">Senha</label>
                  <div className="login-field__input-wrapper">
                    <Lock size={18} className="login-field__icon" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      placeholder="Digite sua senha"
                      className="login-field__input login-field__input--password"
                      autoComplete="current-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="login-field__toggle"
                      aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                {/* Error */}
                {error && (
                  <div className="login-error" role="alert">
                    <span className="login-error__dot" />
                    {error}
                  </div>
                )}

                {/* Submit */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="login-submit"
                >
                  {isLoading ? (
                    <span className="login-submit__loading">
                      <span className="login-submit__spinner" />
                      Entrando...
                    </span>
                  ) : (
                    <span className="login-submit__content">
                      Entrar no sistema
                      <ArrowRight size={18} className="login-submit__arrow" />
                    </span>
                  )}
                </button>
              </form>

              <div className="login-card__footer">
                <span className="login-card__footer-school">Escola Yolanda Queiroz</span>
              </div>
            </div>
          </div>
        </section>
      </div>

      <style>{`
        /* ─── Google Font ─── */
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700;800&family=DM+Sans:wght@400;500;600&display=swap');

        /* ─── Root ─── */
        .login-root {
          position: relative;
          min-height: 100svh;
          overflow: hidden;
          background: #04061a;
          font-family: 'DM Sans', sans-serif;
        }

        /* ─── Background ─── */
        .login-bg-gradient {
          position: absolute;
          inset: 0;
          background:
            radial-gradient(ellipse 70% 50% at 15% 10%, rgba(99,102,241,0.18) 0%, transparent 60%),
            radial-gradient(ellipse 60% 45% at 85% 5%, rgba(168,85,247,0.15) 0%, transparent 55%),
            radial-gradient(ellipse 50% 60% at 50% 95%, rgba(236,72,153,0.10) 0%, transparent 55%);
        }

        .login-bg-grid {
          position: absolute;
          inset: 0;
          opacity: 0.04;
          background-image:
            linear-gradient(rgba(255,255,255,0.8) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.8) 1px, transparent 1px);
          background-size: 48px 48px;
        }

        .login-bg-orb {
          position: absolute;
          border-radius: 50%;
          filter: blur(80px);
          pointer-events: none;
        }
        .login-bg-orb--1 {
          width: 500px; height: 500px;
          top: -100px; left: -150px;
          background: rgba(99,102,241,0.12);
        }
        .login-bg-orb--2 {
          width: 400px; height: 400px;
          top: -80px; right: -100px;
          background: rgba(168,85,247,0.12);
        }
        .login-bg-orb--3 {
          width: 600px; height: 300px;
          bottom: -100px; left: 50%;
          transform: translateX(-50%);
          background: rgba(236,72,153,0.08);
        }

        /* ─── Layout wrapper ─── */
        .login-wrapper {
          position: relative;
          z-index: 10;
          display: grid;
          grid-template-columns: 1fr;
          min-height: 100svh;
          max-width: 1280px;
          margin: 0 auto;
          padding: 24px 20px;
          align-items: center;
          gap: 40px;
        }

        @media (min-width: 1024px) {
          .login-wrapper {
            grid-template-columns: 1fr 480px;
            padding: 48px 48px;
            gap: 64px;
          }
        }

        @media (min-width: 1280px) {
          .login-wrapper {
            padding: 48px 64px;
          }
        }

        /* ─── Hero (left) ─── */
        .login-hero {
          display: none;
          color: #fff;
        }

        @media (min-width: 1024px) {
          .login-hero {
            display: flex;
            flex-direction: column;
            gap: 0;
          }
        }

        .login-hero__badge {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 6px 14px;
          border-radius: 999px;
          border: 1px solid rgba(255,255,255,0.12);
          background: rgba(255,255,255,0.05);
          backdrop-filter: blur(12px);
          font-size: 12.5px;
          font-weight: 500;
          color: rgba(255,255,255,0.75);
          letter-spacing: 0.02em;
          margin-bottom: 28px;
          width: fit-content;
        }

        .login-hero__badge-dot {
          width: 7px; height: 7px;
          border-radius: 50%;
          background: #34d399;
          box-shadow: 0 0 8px rgba(52,211,153,0.8);
          flex-shrink: 0;
        }

        .login-hero__title {
          font-family: 'Sora', sans-serif;
          font-size: clamp(2.4rem, 3.5vw, 3.5rem);
          font-weight: 800;
          line-height: 1.12;
          letter-spacing: -0.03em;
          color: #fff;
          margin-bottom: 20px;
        }

        .login-hero__title-sub {
          display: block;
          color: rgba(255,255,255,0.55);
          font-weight: 600;
        }

        .login-hero__description {
          font-size: 16px;
          line-height: 1.75;
          color: rgba(255,255,255,0.55);
          max-width: 440px;
          margin-bottom: 40px;
        }

        .login-hero__stats {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 14px;
        }

        .login-stat {
          padding: 20px 18px;
          border-radius: 18px;
          border: 1px solid rgba(255,255,255,0.08);
          background: rgba(255,255,255,0.04);
          backdrop-filter: blur(16px);
          transition: border-color 0.2s, background 0.2s;
        }

        .login-stat:hover {
          border-color: rgba(255,255,255,0.15);
          background: rgba(255,255,255,0.07);
        }

        .login-stat__icon {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 38px; height: 38px;
          border-radius: 10px;
          margin-bottom: 14px;
        }
        .login-stat__icon--violet {
          background: rgba(139,92,246,0.2);
          color: #a78bfa;
        }
        .login-stat__icon--cyan {
          background: rgba(6,182,212,0.2);
          color: #67e8f9;
        }
        .login-stat__icon--pink {
          background: rgba(236,72,153,0.2);
          color: #f9a8d4;
        }

        .login-stat__value {
          font-family: 'Sora', sans-serif;
          font-size: 20px;
          font-weight: 700;
          color: #fff;
          margin-bottom: 4px;
        }

        .login-stat__label {
          font-size: 12px;
          color: rgba(255,255,255,0.45);
          line-height: 1.4;
        }

        /* ─── Card wrapper (right) ─── */
        .login-card-wrapper {
          display: flex;
          justify-content: center;
          align-items: center;
          width: 100%;
        }

        /* ─── Card ─── */
        .login-card {
          position: relative;
          width: 100%;
          max-width: 440px;
          border-radius: 28px;
          overflow: hidden;
        }

        /* Animated glow border */
        .login-card__glow {
          position: absolute;
          inset: -1px;
          border-radius: 29px;
          background: linear-gradient(135deg,
            rgba(99,102,241,0.6) 0%,
            rgba(168,85,247,0.5) 30%,
            rgba(236,72,153,0.4) 60%,
            rgba(99,102,241,0.3) 100%
          );
          z-index: 0;
          opacity: 0.7;
        }

        .login-card__inner {
          position: relative;
          z-index: 1;
          background: rgba(255,255,255,0.97);
          border-radius: 27px;
          padding: 36px 32px 32px;
        }

        @media (min-width: 480px) {
          .login-card__inner {
            padding: 40px 40px 36px;
          }
        }

        /* ─── Card logo ─── */
        .login-card__logo {
          margin-bottom: 24px;
        }

        .login-card__logo-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 60px; height: 60px;
          border-radius: 18px;
          background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 50%, #a21caf 100%);
          box-shadow:
            0 8px 24px rgba(124,58,237,0.35),
            0 2px 8px rgba(79,70,229,0.2);
        }

        /* ─── Card header ─── */
        .login-card__title {
          font-family: 'Sora', sans-serif;
          font-size: 26px;
          font-weight: 800;
          letter-spacing: -0.025em;
          color: #0f172a;
          margin-bottom: 6px;
        }

        .login-card__subtitle {
          font-size: 13.5px;
          color: #64748b;
          line-height: 1.6;
          margin-bottom: 28px;
        }

        /* ─── Form ─── */
        .login-form {
          display: flex;
          flex-direction: column;
          gap: 18px;
        }

        .login-field {
          display: flex;
          flex-direction: column;
          gap: 7px;
        }

        .login-field__label {
          font-size: 13px;
          font-weight: 600;
          color: #334155;
          letter-spacing: 0.01em;
        }

        .login-field__input-wrapper {
          position: relative;
          display: flex;
          align-items: center;
        }

        .login-field__icon {
          position: absolute;
          left: 14px;
          color: #94a3b8;
          pointer-events: none;
          flex-shrink: 0;
        }

        .login-field__input {
          width: 100%;
          padding: 13px 16px 13px 44px;
          border-radius: 14px;
          border: 1.5px solid #e2e8f0;
          background: #f8fafc;
          color: #0f172a;
          font-family: 'DM Sans', sans-serif;
          font-size: 14.5px;
          outline: none;
          transition: border-color 0.18s, background 0.18s, box-shadow 0.18s;
          -webkit-appearance: none;
        }

        .login-field__input--password {
          padding-right: 44px;
        }

        .login-field__input::placeholder {
          color: #94a3b8;
        }

        .login-field__input:focus {
          border-color: #7c3aed;
          background: #fff;
          box-shadow: 0 0 0 4px rgba(124,58,237,0.09);
        }

        .login-field__toggle {
          position: absolute;
          right: 14px;
          color: #94a3b8;
          background: none;
          border: none;
          cursor: pointer;
          padding: 4px;
          display: flex;
          align-items: center;
          border-radius: 6px;
          transition: color 0.15s;
        }

        .login-field__toggle:hover {
          color: #475569;
        }

        /* ─── Error ─── */
        .login-error {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 12px 16px;
          border-radius: 12px;
          border: 1px solid #fecaca;
          background: #fff1f2;
          color: #be123c;
          font-size: 13.5px;
          font-weight: 500;
        }

        .login-error__dot {
          width: 6px; height: 6px;
          border-radius: 50%;
          background: #f43f5e;
          flex-shrink: 0;
        }

        /* ─── Submit button ─── */
        .login-submit {
          width: 100%;
          padding: 15px 20px;
          border-radius: 14px;
          border: none;
          background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 50%, #a21caf 100%);
          color: #fff;
          font-family: 'Sora', sans-serif;
          font-size: 15px;
          font-weight: 700;
          letter-spacing: 0.01em;
          cursor: pointer;
          transition: opacity 0.2s, transform 0.15s, box-shadow 0.2s;
          box-shadow: 0 6px 20px rgba(124,58,237,0.35);
          margin-top: 4px;
        }

        .login-submit:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 10px 28px rgba(124,58,237,0.45);
          opacity: 0.93;
        }

        .login-submit:active:not(:disabled) {
          transform: translateY(0);
        }

        .login-submit:disabled {
          cursor: not-allowed;
          opacity: 0.65;
        }

        .login-submit__content,
        .login-submit__loading {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
        }

        .login-submit__arrow {
          transition: transform 0.2s;
        }

        .login-submit:hover .login-submit__arrow {
          transform: translateX(3px);
        }

        .login-submit__spinner {
          width: 18px; height: 18px;
          border-radius: 50%;
          border: 2px solid rgba(255,255,255,0.3);
          border-top-color: #fff;
          animation: spin 0.7s linear infinite;
          flex-shrink: 0;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        /* ─── Footer ─── */
        .login-card__footer {
          margin-top: 24px;
          padding-top: 18px;
          border-top: 1px solid #f1f5f9;
          text-align: center;
        }

        .login-card__footer-school {
          font-size: 12.5px;
          color: #94a3b8;
          letter-spacing: 0.03em;
          font-weight: 500;
        }

        /* ─── Mobile-only: show compact badge above card ─── */
        @media (max-width: 1023px) {
          .login-wrapper {
            justify-items: center;
          }
        }
      `}</style>
    </div>
  )
}