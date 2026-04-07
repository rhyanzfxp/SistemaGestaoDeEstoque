import { useEffect } from 'react'
import { Check, AlertTriangle, X, Info } from 'lucide-react'

interface ToastProps {
  message: string
  type: 'success' | 'error' | 'info' | 'warning'
  onClose: () => void
  duration?: number
}

export default function Toast({ message, type, onClose, duration = 5000 }: ToastProps) {
  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(onClose, duration)
      return () => clearTimeout(timer)
    }
  }, [duration, onClose])

  const config = {
    success: {
      icon: Check,
      bg: 'rgba(16, 185, 129, 0.95)',
      border: '#10b981',
      iconBg: 'rgba(255, 255, 255, 0.2)'
    },
    error: {
      icon: AlertTriangle,
      bg: 'rgba(244, 63, 94, 0.95)',
      border: '#f43f5e',
      iconBg: 'rgba(255, 255, 255, 0.2)'
    },
    warning: {
      icon: AlertTriangle,
      bg: 'rgba(245, 158, 11, 0.95)',
      border: '#f59e0b',
      iconBg: 'rgba(255, 255, 255, 0.2)'
    },
    info: {
      icon: Info,
      bg: 'rgba(59, 130, 246, 0.95)',
      border: '#3b82f6',
      iconBg: 'rgba(255, 255, 255, 0.2)'
    }
  }

  const { icon: Icon, bg, border, iconBg } = config[type]

  return (
    <>
      <style>{toastStyles}</style>
      <div className="toast" style={{ background: bg, borderColor: border }}>
        <div className="toast__icon" style={{ background: iconBg }}>
          <Icon size={20} color="#ffffff" strokeWidth={2.5} />
        </div>
        <p className="toast__message">{message}</p>
        <button onClick={onClose} className="toast__close">
          <X size={18} color="#ffffff" />
        </button>
      </div>
    </>
  )
}

const toastStyles = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@500;600&display=swap');

  .toast {
    position: fixed;
    top: 24px;
    right: 24px;
    z-index: 3000;
    display: flex;
    align-items: center;
    gap: 14px;
    padding: 16px 20px;
    border-radius: 14px;
    border: 2px solid;
    box-shadow: 0 12px 40px rgba(0, 0, 0, 0.25);
    backdrop-filter: blur(10px);
    min-width: 320px;
    max-width: 480px;
    animation: toast-slideIn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
  }

  @keyframes toast-slideIn {
    from {
      opacity: 0;
      transform: translateX(100%) translateY(-10px);
    }
    to {
      opacity: 1;
      transform: translateX(0) translateY(0);
    }
  }

  .toast__icon {
    width: 40px;
    height: 40px;
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  .toast__message {
    flex: 1;
    font-family: 'DM Sans', sans-serif;
    font-size: 15px;
    font-weight: 600;
    color: #ffffff;
    line-height: 1.4;
    margin: 0;
  }

  .toast__close {
    width: 32px;
    height: 32px;
    border: none;
    background: rgba(255, 255, 255, 0.15);
    border-radius: 8px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: background 0.15s;
    flex-shrink: 0;
  }

  .toast__close:hover {
    background: rgba(255, 255, 255, 0.25);
  }

  @media (max-width: 640px) {
    .toast {
      top: 16px;
      right: 16px;
      left: 16px;
      min-width: auto;
      max-width: none;
    }
  }
`
