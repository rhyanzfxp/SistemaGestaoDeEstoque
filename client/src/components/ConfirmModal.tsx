import { AlertTriangle, X } from 'lucide-react'

interface ConfirmModalProps {
  isOpen: boolean
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  onConfirm: () => void
  onCancel: () => void
  variant?: 'danger' | 'warning' | 'info'
}

export default function ConfirmModal({
  isOpen,
  title,
  message,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  onConfirm,
  onCancel,
  variant = 'danger'
}: ConfirmModalProps) {
  if (!isOpen) return null

  const variantColors = {
    danger: {
      icon: '#dc2626',
      iconBg: 'rgba(244, 63, 94, 0.12)',
      iconBorder: 'rgba(244, 63, 94, 0.2)',
      confirmBg: 'linear-gradient(135deg, #dc2626, #b91c1c)',
      confirmHover: '#b91c1c'
    },
    warning: {
      icon: '#f59e0b',
      iconBg: 'rgba(245, 158, 11, 0.12)',
      iconBorder: 'rgba(245, 158, 11, 0.2)',
      confirmBg: 'linear-gradient(135deg, #f59e0b, #d97706)',
      confirmHover: '#d97706'
    },
    info: {
      icon: '#2563eb',
      iconBg: 'rgba(37, 99, 235, 0.12)',
      iconBorder: 'rgba(37, 99, 235, 0.2)',
      confirmBg: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
      confirmHover: '#1d4ed8'
    }
  }

  const colors = variantColors[variant]

  return (
    <>
      <style>{confirmModalStyles}</style>
      <div className="confirm-modal-overlay" onClick={onCancel}>
        <div className="confirm-modal" onClick={(e) => e.stopPropagation()}>
          <div className="confirm-modal__header">
            <div
              className="confirm-modal__icon"
              style={{
                background: colors.iconBg,
                borderColor: colors.iconBorder
              }}
            >
              <AlertTriangle size={28} color={colors.icon} strokeWidth={2.5} />
            </div>
            <button onClick={onCancel} className="confirm-modal__close">
              <X size={20} />
            </button>
          </div>

          <div className="confirm-modal__content">
            <h2 className="confirm-modal__title">{title}</h2>
            <p className="confirm-modal__message">{message}</p>
          </div>

          <div className="confirm-modal__actions">
            <button
              onClick={onCancel}
              className="confirm-modal__btn confirm-modal__btn--cancel"
            >
              {cancelText}
            </button>
            <button
              onClick={() => {
                onConfirm()
                onCancel()
              }}
              className="confirm-modal__btn confirm-modal__btn--confirm"
              style={{ background: colors.confirmBg }}
            >
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </>
  )
}

const confirmModalStyles = `
  @import url('https://fonts.googleapis.com/css2?family=Sora:wght@600;700&family=DM+Sans:wght@400;500;600&display=swap');

  .confirm-modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.6);
    backdrop-filter: blur(4px);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 2000;
    animation: confirm-fadeIn 0.2s ease;
  }

  @keyframes confirm-fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }

  .confirm-modal {
    background: #ffffff;
    border-radius: 20px;
    box-shadow: 0 25px 70px rgba(0, 0, 0, 0.35);
    max-width: 440px;
    width: 90%;
    animation: confirm-slideUp 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
    overflow: hidden;
  }

  @keyframes confirm-slideUp {
    from { opacity: 0; transform: translateY(30px) scale(0.95); }
    to { opacity: 1; transform: translateY(0) scale(1); }
  }

  .confirm-modal__header {
    position: relative;
    padding: 28px 24px 20px;
    display: flex;
    justify-content: center;
  }

  .confirm-modal__icon {
    width: 72px;
    height: 72px;
    border-radius: 18px;
    border: 2px solid;
    display: flex;
    align-items: center;
    justify-content: center;
    animation: confirm-iconPulse 0.5s ease;
  }

  @keyframes confirm-iconPulse {
    0%, 100% { transform: scale(1); }
    50% { transform: scale(1.05); }
  }

  .confirm-modal__close {
    position: absolute;
    top: 20px;
    right: 20px;
    width: 36px;
    height: 36px;
    border: none;
    background: rgba(100, 116, 139, 0.1);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 10px;
    transition: background 0.15s;
    color: #64748b;
  }

  .confirm-modal__close:hover {
    background: rgba(100, 116, 139, 0.2);
  }

  .confirm-modal__content {
    padding: 0 32px 28px;
    text-align: center;
  }

  .confirm-modal__title {
    font-family: 'Sora', sans-serif;
    font-size: 22px;
    font-weight: 700;
    color: #0f172a;
    margin-bottom: 12px;
    letter-spacing: -0.02em;
  }

  .confirm-modal__message {
    font-family: 'DM Sans', sans-serif;
    font-size: 15px;
    color: #64748b;
    line-height: 1.6;
  }

  .confirm-modal__actions {
    display: flex;
    gap: 12px;
    padding: 0 24px 24px;
  }

  .confirm-modal__btn {
    flex: 1;
    padding: 13px 20px;
    border: none;
    border-radius: 12px;
    font-family: 'DM Sans', sans-serif;
    font-size: 15px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.18s;
  }

  .confirm-modal__btn--cancel {
    background: rgba(100, 116, 139, 0.1);
    color: #475569;
  }

  .confirm-modal__btn--cancel:hover {
    background: rgba(100, 116, 139, 0.18);
  }

  .confirm-modal__btn--confirm {
    color: #ffffff;
    box-shadow: 0 4px 14px rgba(220, 38, 38, 0.35);
  }

  .confirm-modal__btn--confirm:hover {
    transform: translateY(-1px);
    box-shadow: 0 6px 20px rgba(220, 38, 38, 0.4);
  }

  @media (max-width: 480px) {
    .confirm-modal {
      width: 95%;
      max-width: none;
    }

    .confirm-modal__content {
      padding: 0 24px 24px;
    }

    .confirm-modal__title {
      font-size: 20px;
    }

    .confirm-modal__message {
      font-size: 14px;
    }

    .confirm-modal__actions {
      flex-direction: column;
    }
  }
`
