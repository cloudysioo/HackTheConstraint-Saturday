import nodemailer from 'nodemailer';

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { email, role, name } = req.body || {};
    if (!email || typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ error: 'Valid email address is required.' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const otp = String(Math.floor(100000 + Math.random() * 900000));
    const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes

    const displayName = name || 'there';
    const roleName = role === 'physician' ? 'Physician' : 'Patient';
    const subject = `Your medTrace Verification Code: ${otp}`;
    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>medTrace Verification Code</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f7fafc; margin: 0; padding: 24px;">
  <div style="max-width: 520px; margin: 0 auto; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
    <div style="background-color: #1F4E5B; padding: 24px; text-align: center;">
      <h1 style="color: #ffffff; font-size: 22px; margin: 0; font-weight: 800;">medTrace</h1>
      <p style="color: #2BC4C6; font-size: 12px; margin: 4px 0 0; text-transform: uppercase; letter-spacing: 1.5px; font-weight: 600;">Clinical Continuity & Safety</p>
    </div>
    <div style="padding: 28px 24px;">
      <h2 style="color: #1a202c; font-size: 18px; margin-top: 0; font-weight: 700;">Account Verification Code</h2>
      <p style="color: #4a5568; font-size: 14px; line-height: 1.6; margin: 12px 0;">Hello <strong>${displayName}</strong>,</p>
      <p style="color: #4a5568; font-size: 14px; line-height: 1.6; margin: 12px 0;">
        You are registering for the <strong>medTrace ${roleName} Portal</strong>. Please use the 6-digit one-time security code below to complete your registration:
      </p>
      <div style="background-color: #f1f8f8; border: 2px dashed #2BC4C6; border-radius: 10px; padding: 20px; text-align: center; margin: 24px 0;">
        <span style="font-family: 'SF Mono', Monaco, Consolas, monospace; font-size: 36px; font-weight: 800; letter-spacing: 8px; color: #1F4E5B;">${otp}</span>
      </div>
      <p style="color: #718096; font-size: 12px; line-height: 1.5; margin: 16px 0 0;">
        ⏳ This code is valid for <strong>10 minutes</strong>. Never share this code with anyone.
      </p>
    </div>
  </div>
</body>
</html>
    `;

    let serviceUsed = 'In-Memory Simulation';
    let previewUrl: string | undefined = undefined;

    // 1. Try Brevo REST API
    if (process.env.BREVO_API_KEY) {
      try {
        const brevoRes = await fetch('https://api.brevo.com/v3/smtp/email', {
          method: 'POST',
          headers: {
            'api-key': process.env.BREVO_API_KEY,
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
          body: JSON.stringify({
            sender: {
              name: process.env.EMAIL_FROM_NAME || 'medTrace Clinical Security',
              email: process.env.BREVO_SENDER_EMAIL || process.env.GMAIL_USER || 'security@medtrace.health',
            },
            to: [{ email: cleanEmail, name: displayName }],
            subject,
            htmlContent: html,
          }),
        });
        if (brevoRes.ok) {
          serviceUsed = 'Brevo API';
        }
      } catch (e) {
        console.warn('Brevo error:', e);
      }
    }

    // 2. Try Resend REST API
    if (serviceUsed === 'In-Memory Simulation' && process.env.RESEND_API_KEY) {
      try {
        const resendRes = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: process.env.RESEND_FROM || 'medTrace Security <onboarding@resend.dev>',
            to: [cleanEmail],
            subject,
            html,
          }),
        });
        if (resendRes.ok) {
          serviceUsed = 'Resend API';
        }
      } catch (e) {
        console.warn('Resend error:', e);
      }
    }

    // 3. Try Gmail SMTP
    if (serviceUsed === 'In-Memory Simulation' && process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD) {
      try {
        const transporter = nodemailer.createTransport({
          service: 'gmail',
          auth: {
            user: process.env.GMAIL_USER,
            pass: process.env.GMAIL_APP_PASSWORD,
          },
        });
        await transporter.sendMail({
          from: `"medTrace Security" <${process.env.GMAIL_USER}>`,
          to: cleanEmail,
          subject,
          html,
        });
        serviceUsed = 'Gmail SMTP';
      } catch (e) {
        console.warn('Gmail error:', e);
      }
    }

    // 4. Try Ethereal Sandbox if nothing else succeeded
    if (serviceUsed === 'In-Memory Simulation') {
      try {
        const testAccount = await nodemailer.createTestAccount();
        const testTransporter = nodemailer.createTransport({
          host: testAccount.smtp.host,
          port: testAccount.smtp.port,
          secure: testAccount.smtp.secure,
          auth: {
            user: testAccount.user,
            pass: testAccount.pass,
          },
        });
        const info = await testTransporter.sendMail({
          from: '"medTrace Security" <security@medtrace.health>',
          to: cleanEmail,
          subject,
          html,
        });
        previewUrl = nodemailer.getTestMessageUrl(info) || undefined;
        serviceUsed = 'Ethereal Sandbox';
      } catch (e) {
        console.warn('Ethereal fallback error:', e);
      }
    }

    return res.status(200).json({
      success: true,
      message: `Verification code sent to ${cleanEmail}`,
      expiresAt,
      otp,
      previewOtp: otp,
      devOtp: otp,
      previewUrl,
      serviceUsed,
    });
  } catch (err: any) {
    console.error('send-otp serverless error:', err);
    return res.status(500).json({ error: 'Failed to dispatch verification code.' });
  }
}
