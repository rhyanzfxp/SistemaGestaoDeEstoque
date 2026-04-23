import { useState, useEffect, type FormEvent } from 'react'
import { Link, useSearchParams, useNavigate } from 'react-router-dom'
import { Lock, Package, ArrowLeft, CheckCircle, AlertCircle } from 'lucide-react'

type Estado = 'validando' | 'token-invalido' | 'formulario' | 'erro-api'

export default function RedefinirSenha() {
    const [searchParams] = useSearchParams()
    const navigate = useNavigate()
    const token = searchParams.get('token') ?? ''

    const [estado, setEstado] = useState<Estado>('validando')
    const [novaSenha, setNovaSenha] = useState('')
    const [confirmacaoSenha, setConfirmacaoSenha] = useState('')
    const [erroCliente, setErroCliente] = useState('')
    const [erroApi, setErroApi] = useState('')
    const [isLoading, setIsLoading] = useState(false)

    useEffect(() => {
        if (!token) { setEstado('token-invalido'); return }
        fetch(`/api/auth/validar-token?token=${encodeURIComponent(token)}`)
            .then((res) => { setEstado(res.ok ? 'formulario' : 'token-invalido') })
            .catch(() => setEstado('token-invalido'))
    }, [token])

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault()
        setErroCliente('')
        if (novaSenha !== confirmacaoSenha) { setErroCliente('As senhas não coincidem.'); return }
        setIsLoading(true)
        try {
            const res = await fetch('/api/auth/redefinir-senha', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token, novaSenha }),
            })
            if (res.ok) {
                navigate('/login', { state: { mensagem: 'Senha redefinida com sucesso!' } })
            } else {
                const data = await res.json().catch(() => ({}))
                setErroApi(data.erro ?? 'Erro ao redefinir a senha. Tente novamente.')
                setEstado('erro-api')
            }
        } catch {
            setErroApi('Erro de conexão. Tente novamente.')
            setEstado('erro-api')
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="login-root">
            <div className="login-bg-gradient" />
            <div className="login-bg-grid" />
            <div className="login-bg-orb login-bg-orb--1" />
            <div className="login-bg-orb login-bg-orb--2" />
            <div className="login-bg-orb login-bg-orb--3" />

            <div className="login-wrapper redef-wrapper">
                <section className="login-card-wrapper">
                    <div className="login-card">
                        <div className="login-card__glow" />
                        <div className="login-card__inner">
                            <div className="login-card__logo">
                                <div className="login-card__logo-icon">
                                    <Package size={28} strokeWidth={2.2} color="white" />
                                </div>
                            </div>

                            <div className="login-card__header">
                                <h2 className="login-card__title">Redefinir senha</h2>
                                <p className="login-card__subtitle">
                                    {estado === 'validando' ? 'Validando seu link de recuperação...'
                                        : estado === 'token-invalido' ? 'Link inválido ou expirado.'
                                            : 'Escolha uma nova senha para sua conta.'}
                                </p>
                            </div>

                            {estado === 'validando' && (
                                <div className="redef-loading"><span className="redef-spinner" /></div>
                            )}

                            {estado === 'token-invalido' && (
                                <div className="redef-error-box">
                                    <AlertCircle size={22} className="redef-error-box__icon" />
                                    <p className="redef-error-box__text">Este link de recuperação é inválido ou já expirou.</p>
                                    <Link to="/esqueci-senha" className="redef-error-box__link">Solicitar novo link de recuperação</Link>
                                </div>
                            )}

                            {(estado === 'formulario' || estado === 'erro-api') && (
                                <form onSubmit={handleSubmit} className="login-form">
                                    {estado === 'erro-api' && (
                                        <div className="redef-api-error"><AlertCircle size={16} />{erroApi}</div>
                                    )}
                                    <div className="login-field">
                                        <label className="login-field__label">Nova senha</label>
                                        <div className="login-field__input-wrapper">
                                            <Lock size={18} className="login-field__icon" />
                                            <input type="password" value={novaSenha} onChange={(e) => setNovaSenha(e.target.value)}
                                                required minLength={6} placeholder="Mínimo 6 caracteres"
                                                className="login-field__input" autoComplete="new-password" />
                                        </div>
                                    </div>
                                    <div className="login-field">
                                        <label className="login-field__label">Confirmar nova senha</label>
                                        <div className="login-field__input-wrapper">
                                            <Lock size={18} className="login-field__icon" />
                                            <input type="password" value={confirmacaoSenha} onChange={(e) => setConfirmacaoSenha(e.target.value)}
                                                required placeholder="Repita a nova senha"
                                                className="login-field__input" autoComplete="new-password" />
                                        </div>
                                        {erroCliente && <span className="redef-field-error">{erroCliente}</span>}
                                    </div>
                                    <button type="submit" disabled={isLoading} className="login-submit">
                                        {isLoading ? (
                                            <span className="login-submit__loading"><span className="login-submit__spinner" />Salvando...</span>
                                        ) : (
                                            <span className="login-submit__content">Redefinir senha<CheckCircle size={17} className="login-submit__arrow" /></span>
                                        )}
                                    </button>
                                </form>
                            )}

                            <div className="login-card__footer">
                                <Link to="/login" className="esqueci-back-link">
                                    <ArrowLeft size={15} />Voltar para o login
                                </Link>
                            </div>
                        </div>
                    </div>
                </section>
            </div>

            <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700;800&family=DM+Sans:wght@400;500;600&display=swap');
        .login-root{position:relative;min-height:100svh;overflow:hidden;background:linear-gradient(135deg,#0f172a 0%,#1e293b 50%,#0f172a 100%);font-family:'DM Sans',sans-serif}
        .login-bg-gradient{position:absolute;inset:0;background:radial-gradient(ellipse 80% 60% at 20% 15%,rgba(59,130,246,.25) 0%,transparent 65%),radial-gradient(ellipse 70% 55% at 80% 10%,rgba(96,165,250,.20) 0%,transparent 60%),radial-gradient(ellipse 60% 70% at 50% 90%,rgba(37,99,235,.15) 0%,transparent 60%)}
        .login-bg-grid{position:absolute;inset:0;opacity:.06;background-image:linear-gradient(rgba(59,130,246,.3) 1px,transparent 1px),linear-gradient(90deg,rgba(59,130,246,.3) 1px,transparent 1px);background-size:48px 48px}
        .login-bg-orb{position:absolute;border-radius:50%;filter:blur(90px);pointer-events:none}
        .login-bg-orb--1{width:550px;height:550px;top:-120px;left:-180px;background:rgba(59,130,246,.18)}
        .login-bg-orb--2{width:450px;height:450px;top:-100px;right:-120px;background:rgba(96,165,250,.16)}
        .login-bg-orb--3{width:650px;height:350px;bottom:-120px;left:50%;transform:translateX(-50%);background:rgba(37,99,235,.12)}
        .login-wrapper{position:relative;z-index:10;display:grid;grid-template-columns:1fr;min-height:100svh;max-width:1280px;margin:0 auto;padding:24px 20px;align-items:center;gap:40px}
        .redef-wrapper{justify-items:center}
        .login-card-wrapper{display:flex;justify-content:center;align-items:center;width:100%}
        .login-card{position:relative;width:100%;max-width:440px;border-radius:28px;overflow:hidden}
        .login-card__glow{position:absolute;inset:-1px;border-radius:29px;background:linear-gradient(135deg,rgba(59,130,246,.7) 0%,rgba(37,99,235,.6) 50%,rgba(59,130,246,.5) 100%);z-index:0;opacity:.8}
        .login-card__inner{position:relative;z-index:1;background:rgba(255,255,255,.97);border-radius:27px;padding:36px 32px 32px}
        @media(min-width:480px){.login-card__inner{padding:40px 40px 36px}}
        .login-card__logo{margin-bottom:24px}
        .login-card__logo-icon{display:flex;align-items:center;justify-content:center;width:60px;height:60px;border-radius:18px;background:linear-gradient(135deg,#2563eb 0%,#1d4ed8 50%,#1e40af 100%);box-shadow:0 8px 24px rgba(37,99,235,.4),0 2px 8px rgba(29,78,216,.3)}
        .login-card__title{font-family:'Sora',sans-serif;font-size:26px;font-weight:800;letter-spacing:-.025em;color:#0f172a;margin-bottom:6px}
        .login-card__subtitle{font-size:13.5px;color:#64748b;line-height:1.6;margin-bottom:28px}
        .login-form{display:flex;flex-direction:column;gap:18px}
        .login-field{display:flex;flex-direction:column;gap:7px}
        .login-field__label{font-size:13px;font-weight:600;color:#334155;letter-spacing:.01em}
        .login-field__input-wrapper{position:relative;display:flex;align-items:center}
        .login-field__icon{position:absolute;left:14px;color:#94a3b8;pointer-events:none;flex-shrink:0}
        .login-field__input{width:100%;padding:13px 16px 13px 44px;border-radius:14px;border:1.5px solid #e2e8f0;background:#f8fafc;color:#0f172a;font-family:'DM Sans',sans-serif;font-size:14.5px;outline:none;transition:border-color .18s,background .18s,box-shadow .18s;-webkit-appearance:none}
        .login-field__input::placeholder{color:#94a3b8}
        .login-field__input:focus{border-color:#3b82f6;background:#fff;box-shadow:0 0 0 4px rgba(59,130,246,.12)}
        .login-submit{width:100%;padding:15px 20px;border-radius:14px;border:none;background:linear-gradient(135deg,#2563eb 0%,#1d4ed8 50%,#1e40af 100%);color:#fff;font-family:'Sora',sans-serif;font-size:15px;font-weight:700;letter-spacing:.01em;cursor:pointer;transition:opacity .2s,transform .15s,box-shadow .2s;box-shadow:0 6px 20px rgba(37,99,235,.4);margin-top:4px}
        .login-submit:hover:not(:disabled){transform:translateY(-1px);box-shadow:0 10px 28px rgba(37,99,235,.5);opacity:.93}
        .login-submit:active:not(:disabled){transform:translateY(0)}
        .login-submit:disabled{cursor:not-allowed;opacity:.65}
        .login-submit__content,.login-submit__loading{display:flex;align-items:center;justify-content:center;gap:8px}
        .login-submit__arrow{transition:transform .2s}
        .login-submit:hover .login-submit__arrow{transform:translateX(3px)}
        .login-submit__spinner{width:18px;height:18px;border-radius:50%;border:2px solid rgba(255,255,255,.3);border-top-color:#fff;animation:spin .7s linear infinite;flex-shrink:0}
        @keyframes spin{to{transform:rotate(360deg)}}
        .redef-loading{display:flex;justify-content:center;padding:24px 0}
        .redef-spinner{display:block;width:36px;height:36px;border-radius:50%;border:3px solid #e2e8f0;border-top-color:#3b82f6;animation:spin .7s linear infinite}
        .redef-error-box{display:flex;flex-direction:column;align-items:center;gap:12px;padding:24px 16px;border-radius:16px;border:1px solid #fecaca;background:#fef2f2;text-align:center}
        .redef-error-box__icon{color:#dc2626}
        .redef-error-box__text{font-size:14px;color:#b91c1c;line-height:1.6;font-weight:500}
        .redef-error-box__link{font-size:13px;font-weight:600;color:#3b82f6;text-decoration:none;transition:color .15s}
        .redef-error-box__link:hover{color:#1d4ed8}
        .redef-api-error{display:flex;align-items:center;gap:8px;padding:12px 14px;border-radius:12px;border:1px solid #fecaca;background:#fef2f2;color:#b91c1c;font-size:13.5px;font-weight:500}
        .redef-field-error{font-size:12.5px;color:#dc2626;font-weight:500}
        .login-card__footer{margin-top:24px;padding-top:18px;border-top:1px solid #f1f5f9;text-align:center}
        .esqueci-back-link{display:inline-flex;align-items:center;gap:6px;font-size:13px;font-weight:600;color:#3b82f6;text-decoration:none;transition:color .15s}
        .esqueci-back-link:hover{color:#1d4ed8}
      `}</style>
        </div>
    )
}
