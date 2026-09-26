"""
Email Dispatcher Service.
Sends branded 6-digit OTP verification emails via Gmail SMTP / Azure Communication Services.
Includes local development console fallback for robust execution.
"""

import smtplib
import ssl
import asyncio
import logging
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import Tuple

from app.config import settings

logger = logging.getLogger("email_service")


def _generate_otp_html(otp: str, recipient_name: str, is_student: bool) -> str:
    """Generates an aesthetic, responsive, branded HTML email template for UniVoice OTP."""
    role_badge = "🎓 Verified Chitkara University Student Pass" if is_student else "🌐 Verified Campus Visitor Pass"
    role_color = "#3b82f6" if is_student else "#10b981"
    daily_quota = f"{settings.STUDENT_DAILY_QUOTA} Queries / Day (Full Ordinances, Exams & Library)" if is_student else f"{settings.VISITOR_DAILY_QUOTA} Queries / Day (Admissions & Campus FAQs)"
    
    return f"""<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>UniVoice Verification Code</title>
</head>
<body style="margin: 0; padding: 0; background-color: #06091a; font-family: 'Jost', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #06091a; padding: 40px 10px;">
    <tr>
      <td align="center">
        <table width="100%" max-width="540" border="0" cellspacing="0" cellpadding="0" style="max-width: 540px; background-color: #0f1630; border: 1px solid rgba(59, 130, 246, 0.3); border-radius: 20px; overflow: hidden; box-shadow: 0 25px 60px rgba(0,0,0,0.7), 0 0 30px rgba(37,99,235,0.2);">
          
          <!-- Header Bar -->
          <tr>
            <td style="padding: 36px 32px 24px; text-align: center; background: linear-gradient(180deg, #131a38 0%, #0f1630 100%); border-bottom: 1px solid rgba(255, 255, 255, 0.08);">
              <!-- Top Pill Badge -->
              <div style="display: inline-block; padding: 6px 16px; background: rgba(37, 99, 235, 0.18); border: 1px solid rgba(59, 130, 246, 0.35); border-radius: 9999px; margin-bottom: 16px;">
                <span style="color: #60a5fa; font-size: 12px; font-weight: 700; letter-spacing: 0.8px; text-transform: uppercase;">🎙️ UniVoice · AI Voice Assistant</span>
              </div>
              <h1 style="margin: 0 0 6px; color: #f8fafc; font-size: 26px; font-weight: 800; letter-spacing: -0.02em;">
                Identity Verification
              </h1>
              <p style="margin: 0; color: #94a3b8; font-size: 14px;">
                Chitkara University Multilingual Voice Gateway
              </p>
            </td>
          </tr>

          <!-- Body Content -->
          <tr>
            <td style="padding: 32px 32px 28px;">
              <p style="margin: 0 0 14px; color: #cbd5e1; font-size: 15px; line-height: 1.6;">
                Hello <strong style="color: #60a5fa; font-size: 16px;">{recipient_name}</strong>,
              </p>
              <p style="margin: 0 0 24px; color: #94a3b8; font-size: 14px; line-height: 1.6;">
                You are requesting access to the <strong>UniVoice Multilingual Voice Assistant</strong>. Use the 6-digit verification code below to authenticate your session:
              </p>
              
              <!-- OTP Box -->
              <div style="background: linear-gradient(135deg, rgba(37,99,235,0.15) 0%, rgba(139,92,246,0.15) 100%); border: 2px solid rgba(96,165,250,0.4); border-radius: 16px; padding: 24px 20px; text-align: center; margin: 24px 0; box-shadow: inset 0 0 20px rgba(37,99,235,0.1);">
                <div style="color: #94a3b8; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 8px;">
                  One-Time Verification Code
                </div>
                <div style="font-family: 'JetBrains Mono', Consolas, 'Liberation Mono', Menlo, monospace; font-size: 40px; font-weight: 800; letter-spacing: 10px; color: #38bdf8; text-shadow: 0 0 16px rgba(56,189,248,0.5); padding-left: 10px;">
                  {otp}
                </div>
                <div style="margin-top: 12px; color: #64748b; font-size: 12px; display: flex; align-items: center; justify-content: center; gap: 6px;">
                  <span>⏱️ Code expires in <strong>5 minutes</strong></span>
                </div>
              </div>

              <!-- Identity & Quota Info Card -->
              <div style="background-color: #0b0f22; border: 1px solid rgba(99,120,200,0.18); border-radius: 12px; padding: 16px 18px; margin: 24px 0; border-left: 4px solid {role_color};">
                <div style="color: #f1f5f9; font-size: 14px; font-weight: 700; margin-bottom: 4px;">
                  {role_badge}
                </div>
                <div style="color: #8b9cc8; font-size: 12px; line-height: 1.5;">
                  ⚡ Daily Quota: <strong style="color: #38bdf8;">{daily_quota}</strong>
                </div>
              </div>

              <!-- Security Notice -->
              <p style="margin: 20px 0 0; color: #64748b; font-size: 12px; line-height: 1.5;">
                🔒 <strong>Security Tip:</strong> Never share this OTP with anyone. If you did not initiate this request, you can safely ignore this email.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 24px 32px; background-color: #070a16; text-align: center; border-top: 1px solid rgba(255, 255, 255, 0.06);">
              <div style="color: #60a5fa; font-size: 12px; font-weight: 700; margin-bottom: 4px;">
                UniVoice · Multilingual AI University Assistant
              </div>
              <p style="margin: 0; color: #475569; font-size: 11px;">
                Powered by Microsoft Azure AI Search, Azure OpenAI & Sarvam AI · Chitkara University
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
"""


def _send_smtp_sync(recipient_email: str, recipient_name: str, otp: str, is_student: bool) -> Tuple[bool, str]:
    """Synchronous SMTP email dispatcher."""
    if not settings.SMTP_USER or not settings.SMTP_PASSWORD:
        logger.warning(f"[DEV FALLBACK] SMTP not configured. OTP for {recipient_email}: [{otp}]")
        return True, "DEV_CONSOLE"

    msg = MIMEMultipart("alternative")
    msg["Subject"] = f"UniVoice Verification Code: {otp} (Chitkara University)"
    msg["From"] = f"{settings.SMTP_FROM_NAME} <{settings.SMTP_USER}>"
    msg["To"] = recipient_email

    # Plain text alternative
    text_content = (
        f"Hello {recipient_name},\n\n"
        f"Your UniVoice verification code is: {otp}\n\n"
        f"This code is valid for 5 minutes.\n\n"
        f"Role: {'Chitkara Student (20 queries/day)' if is_student else 'Visitor (5 queries/day)'}\n\n"
        f"UniVoice AI Team • Chitkara University"
    )
    html_content = _generate_otp_html(otp, recipient_name, is_student)

    msg.attach(MIMEText(text_content, "plain"))
    msg.attach(MIMEText(html_content, "html"))

    try:
        context = ssl.create_default_context()
        with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT, timeout=10.0) as server:
            server.starttls(context=context)
            server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
            server.sendmail(settings.SMTP_USER, recipient_email, msg.as_string())
        
        logger.info(f"Successfully sent OTP email to {recipient_email}")
        return True, "SENT"
    except Exception as e:
        logger.error(f"Failed to send email to {recipient_email} via SMTP: {e}")
        logger.info(f"[CONSOLE OTP FALLBACK] {recipient_email} -> {otp}")
        return False, str(e)


async def send_otp_email(recipient_email: str, recipient_name: str, otp: str, is_student: bool = False) -> Tuple[bool, str]:
    """
    Asynchronously dispatches an OTP email to the user.
    Runs SMTP network call in a separate background thread pool to avoid blocking FastAPI event loop.
    """
    return await asyncio.to_thread(_send_smtp_sync, recipient_email, recipient_name, otp, is_student)
