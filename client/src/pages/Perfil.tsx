import { useAuth } from '../contexts/AuthContext';
import { User, Mail, ShieldCheck, UserCheck, Calendar } from 'lucide-react';

export default function Perfil() {
  const { user } = useAuth();

  return (
    <>
      <style>{perfilStyles}</style>
      <div className="perfil-root">
        <div className="perfil-content-wrapper">
          <div className="perfil-header">
            <h1 className="perfil-title">Meu Perfil</h1>
            <p className="perfil-subtitle">Informações da conta e credenciais de acesso ao sistema</p>
          </div>

          <div className="perfil-grid">
            {/* Card de Identidade */}
            <div className="perfil-card perfil-card--identity">
              <div className="perfil-banner" />
              <div className="perfil-identity-content">
                <div className="perfil-avatar-wrapper">
                  <div className="perfil-avatar">
                    {user?.nome?.charAt(0).toUpperCase()}
                  </div>
                </div>
                <h2 className="perfil-name">{user?.nome}</h2>
                <p className="perfil-email-sub">{user?.email}</p>
                
                <div className={`perfil-badge ${user?.perfil === 'ADMIN' ? 'perfil-badge--admin' : 'perfil-badge--gestor'}`}>
                  <ShieldCheck size={14} />
                  {user?.perfil === 'ADMIN' ? 'Administrador' : 'Gestor'}
                </div>
              </div>
            </div>

            {/* Área de Detalhes */}
            <div className="perfil-card perfil-card--details">
              <div className="perfil-card-header">
                <h3 className="perfil-card-title">Informações Pessoais</h3>
              </div>
              
              <div className="perfil-info-grid">
                <div className="perfil-info-group">
                  <label className="perfil-label">Nome Completo</label>
                  <div className="perfil-static-field">
                    <User size={18} className="perfil-field-icon" />
                    <span>{user?.nome}</span>
                  </div>
                </div>

                <div className="perfil-info-group">
                  <label className="perfil-label">E-mail Institucional</label>
                  <div className="perfil-static-field">
                    <Mail size={18} className="perfil-field-icon" />
                    <span>{user?.email}</span>
                  </div>
                </div>

                <div className="perfil-info-group">
                  <label className="perfil-label">Status da Conta</label>
                  <div className="perfil-status-field">
                    <UserCheck size={18} />
                    <span>ATIVO NO SISTEMA</span>
                  </div>
                </div>

                <div className="perfil-info-group">
                  <label className="perfil-label">Membro Desde</label>
                  <div className="perfil-static-field">
                    <Calendar size={18} className="perfil-field-icon" />
                    <span>Abril, 2026</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

const perfilStyles = `
  .perfil-root {
    flex: 1;
    min-height: 100vh;
    background: linear-gradient(135deg, #f8fafc 0%, #e0e7ff 50%, #dbeafe 100%);
    font-family: 'DM Sans', sans-serif;
    padding: 40px;
    display: flex;
    flex-direction: column;
    /* REMOVIDO margin-left para não duplicar o espaço da sidebar global */
    margin-left: 0; 
    width: 100%;
    align-items: flex-start;
  }

  .perfil-content-wrapper {
    width: 100%;
    /* Max-width para não esticar demais em telas ultra-wide */
    max-width: 1200px; 
  }

  .perfil-header {
    margin-bottom: 32px;
  }

  .perfil-title {
    font-family: 'Sora', sans-serif;
    font-size: 32px;
    font-weight: 800;
    color: #0f172a;
    margin-bottom: 8px;
  }

  .perfil-subtitle {
    font-size: 15px;
    color: #64748b;
  }

  .perfil-grid {
    display: grid;
    grid-template-columns: 350px 1fr;
    gap: 32px;
    width: 100%;
  }

  .perfil-card {
    background: #ffffff;
    border-radius: 24px;
    border: 1px solid rgba(59, 130, 246, 0.1);
    box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.05);
    overflow: hidden;
  }

  .perfil-banner {
    height: 120px;
    background: #2563eb;
  }

  .perfil-identity-content {
    padding: 0 24px 40px;
    text-align: center;
  }

  .perfil-avatar-wrapper {
    margin-top: -60px;
    margin-bottom: 20px;
    display: inline-block;
  }

  .perfil-avatar {
    width: 120px;
    height: 120px;
    border-radius: 30px;
    background: #fff;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 48px;
    font-weight: 800;
    color: #2563eb;
    border: 6px solid #fff;
    box-shadow: 0 15px 30px rgba(0,0,0,0.1);
  }

  .perfil-name {
    font-size: 22px;
    font-weight: 700;
    color: #0f172a;
    margin-bottom: 4px;
  }

  .perfil-email-sub {
    font-size: 14px;
    color: #64748b;
    margin-bottom: 24px;
  }

  .perfil-badge {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 8px 16px;
    border-radius: 12px;
    font-size: 12px;
    font-weight: 700;
  }

  .perfil-badge--admin { background: #eff6ff; color: #2563eb; }
  .perfil-badge--gestor { background: #ecfdf5; color: #10b981; }

  .perfil-card-header {
    padding: 24px 32px;
    border-bottom: 1px solid #f1f5f9;
  }

  .perfil-card-title {
    font-size: 18px;
    font-weight: 700;
    color: #0f172a;
  }

  .perfil-info-grid {
    padding: 32px;
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 24px;
  }

  .perfil-label {
    font-size: 12px;
    font-weight: 600;
    color: #94a3b8;
    text-transform: uppercase;
    margin-bottom: 8px;
    display: block;
  }

  .perfil-static-field {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 14px;
    background: #f8fafc;
    border-radius: 12px;
    color: #334155;
    font-size: 14px;
  }

  .perfil-field-icon { color: #cbd5e1; }

  .perfil-status-field {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 14px;
    background: #ecfdf5;
    border-radius: 12px;
    color: #059669;
    font-weight: 700;
    font-size: 12px;
  }

  @media (max-width: 1024px) {
    .perfil-grid { grid-template-columns: 1fr; }
    .perfil-root { padding: 20px; }
  }
`;