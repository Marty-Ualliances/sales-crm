import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.ethereal.email',
    port: Number(process.env.SMTP_PORT) || 587,
    secure: false,
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
});

const FROM = process.env.SMTP_FROM || 'noreply@teamunited.com';
const APP_URL = process.env.APP_URL || 'http://localhost:8080';

export async function sendWelcomeEmail(
    to: string,
    name: string,
    password: string,
    role: string,
    loginUrl?: string
) {
    const url = loginUrl || `${APP_URL}/login`;
    const roleLabel = role === 'leadgen' ? 'Lead Gen' : role.charAt(0).toUpperCase() + role.slice(1);

    const html = `
    <div style="font-family: 'Inter', Arial, sans-serif; max-width: 520px; margin: 0 auto; padding: 32px; background: #fff; border-radius: 12px;">
      <h2 style="color: #0F2A44; margin-bottom: 4px;">Welcome to TeamUnited, ${name}!</h2>
      <p style="color: #5a6a7c; font-size: 14px;">Your account has been created with the role <strong>${roleLabel}</strong>.</p>
      <div style="background: #FFF6EE; border: 1px solid #e8ddd3; border-radius: 8px; padding: 16px; margin: 20px 0;">
        <p style="margin: 0 0 8px; font-size: 13px; color: #5a6a7c;"><strong>Email:</strong> ${to}</p>
        <p style="margin: 0; font-size: 13px; color: #5a6a7c;"><strong>Temporary Password:</strong> ${password}</p>
      </div>
      <p style="font-size: 13px; color: #5a6a7c;">Please sign in and change your password at your earliest convenience.</p>
      <a href="${url}" style="display: inline-block; background: #F5A623; color: #fff; text-decoration: none; padding: 10px 24px; border-radius: 6px; font-size: 14px; font-weight: 600; margin-top: 12px;">Sign In</a>
      <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;" />
      <p style="font-size: 11px; color: #aaa;">This is an automated message from TeamUnited CRM.</p>
    </div>
  `;

    try {
        const info = await transporter.sendMail({
            from: FROM,
            to,
            subject: `Welcome to TeamUnited — Your Account is Ready`,
            html,
        });
        console.log(`Welcome email sent to ${to}: ${info.messageId}`);
        return info;
    } catch (err) {
        console.error(`Failed to send welcome email to ${to}:`, err);
        throw err;
    }
}

export async function sendPasswordResetEmail(
    to: string,
    name: string,
    resetToken: string
) {
    const resetUrl = `${APP_URL}/reset-password?token=${resetToken}`;

    const html = `
    <div style="font-family: 'Inter', Arial, sans-serif; max-width: 520px; margin: 0 auto; padding: 32px; background: #fff; border-radius: 12px;">
      <h2 style="color: #0F2A44; margin-bottom: 4px;">Password Reset Request</h2>
      <p style="color: #5a6a7c; font-size: 14px;">Hi ${name}, we received a request to reset your password.</p>
      <p style="font-size: 13px; color: #5a6a7c;">Click the button below to set a new password. This link expires in <strong>1 hour</strong>.</p>
      <a href="${resetUrl}" style="display: inline-block; background: #F5A623; color: #fff; text-decoration: none; padding: 10px 24px; border-radius: 6px; font-size: 14px; font-weight: 600; margin: 16px 0;">Reset Password</a>
      <p style="font-size: 12px; color: #888; margin-top: 16px;">If you didn't request this, you can safely ignore this email.</p>
      <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;" />
      <p style="font-size: 11px; color: #aaa;">This is an automated message from TeamUnited CRM.</p>
    </div>
  `;

    try {
        const info = await transporter.sendMail({
            from: FROM,
            to,
            subject: `TeamUnited — Password Reset`,
            html,
        });
        console.log(`Reset email sent to ${to}: ${info.messageId}`);
        return info;
    } catch (err) {
        console.error(`Failed to send reset email to ${to}:`, err);
        throw err;
    }
}
