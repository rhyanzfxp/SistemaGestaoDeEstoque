import nodemailer from 'nodemailer'

export async function enviarEmailRecuperacao(destinatario: string, link: string): Promise<void> {
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  })

  await transporter.sendMail({
    from: `"Sistema de Estoque" <${process.env.EMAIL_USER}>`,
    to: destinatario,
    subject: 'Recuperação de Senha – Sistema de Estoque',
    html: `
      <html>
        <body style="font-family: Arial, sans-serif; background: #f4f6fb; padding: 32px;">
          <div style="max-width: 480px; margin: 0 auto; background: #fff; border-radius: 12px; padding: 36px; box-shadow: 0 2px 12px rgba(0,0,0,0.08);">
            <h2 style="color: #1d4ed8; margin-bottom: 8px;">Recuperação de Senha</h2>
            <p style="color: #334155; font-size: 15px;">Olá! Recebemos uma solicitação para redefinir a senha da sua conta no <strong>Sistema de Gestão de Estoque</strong>.</p>
            <p style="color: #334155; font-size: 15px;">Clique no botão abaixo para criar uma nova senha. O link é válido por <strong>1 hora</strong>.</p>
            <div style="text-align: center; margin: 32px 0;">
              <a href="${link}" style="background: #2563eb; color: #fff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-size: 15px; font-weight: bold; display: inline-block;">Redefinir minha senha</a>
            </div>
            <p style="color: #64748b; font-size: 13px;">Se o botão não funcionar, copie e cole este link no navegador:</p>
            <p style="color: #3b82f6; font-size: 13px; word-break: break-all;">${link}</p>
            <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
            <p style="color: #94a3b8; font-size: 12px;">Se você não solicitou a recuperação de senha, ignore este e-mail. Sua senha permanece a mesma.</p>
          </div>
        </body>
      </html>
    `,
  })
}
