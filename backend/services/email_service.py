
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import os

# SMTP configuration from environment variables or config
SMTP_HOST = os.getenv("SMTP_HOST")
SMTP_PORT = int(os.getenv("SMTP_PORT", 587))
SMTP_USER = os.getenv("SMTP_USER")
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD")
EMAIL_FROM = os.getenv("EMAIL_FROM")

def send_email(to, subject, html):
    """
    Send an email using SMTP with HTML content.
    Supports both STARTTLS (port 587) and SSL (port 465).
    Args:
        to (str): Recipient email address
        subject (str): Email subject
        html (str): HTML content of the email
    """
    print("[DEBUG] Preparing to send email...")
    print(f"[DEBUG] SMTP_HOST={SMTP_HOST}")
    print(f"[DEBUG] SMTP_PORT={SMTP_PORT}")
    print(f"[DEBUG] SMTP_USER={SMTP_USER}")
    print(f"[DEBUG] EMAIL_FROM={EMAIL_FROM}")
    msg = MIMEMultipart()
    msg["From"] = EMAIL_FROM
    msg["To"] = to
    msg["Subject"] = subject
    msg.attach(MIMEText(html, "html"))

    try:
        if int(SMTP_PORT) == 465:
            print("[DEBUG] Using SMTP_SSL (port 465)")
            with smtplib.SMTP_SSL(SMTP_HOST, int(SMTP_PORT)) as server:
                print("[DEBUG] Connected via SMTP_SSL")
                server.login(SMTP_USER, SMTP_PASSWORD)
                print("[DEBUG] Logged in successfully")
                server.sendmail(EMAIL_FROM, to, msg.as_string())
                print(f"[DEBUG] Email sent to {to}")
        else:
            print("[DEBUG] Using SMTP with STARTTLS (port 587)")
            with smtplib.SMTP(SMTP_HOST, int(SMTP_PORT)) as server:
                print("[DEBUG] Connected via SMTP")
                server.ehlo()
                server.starttls()
                print("[DEBUG] STARTTLS initiated")
                server.ehlo()
                server.login(SMTP_USER, SMTP_PASSWORD)
                print("[DEBUG] Logged in successfully")
                server.sendmail(EMAIL_FROM, to, msg.as_string())
                print(f"[DEBUG] Email sent to {to}")
    except Exception as e:
        print(f"[ERROR] Failed to send email to {to}: {e}")
        import traceback
        traceback.print_exc()