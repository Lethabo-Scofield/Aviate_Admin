# SMTP configuration (set these environment variables in your deployment environment)
# SMTP_HOST: SMTP server hostname (e.g., smtp.gmail.com)
# SMTP_PORT: SMTP server port (default 587)
# SMTP_USER: SMTP username
# SMTP_PASSWORD: SMTP password
# EMAIL_FROM: Sender email address (e.g., noreply@yourdomain.com)
import os
import tempfile


# Use Neon/Postgres if available, otherwise fallback to SQLite for local testing
NEON_DATABASE_URL = os.environ.get("NEON_DATABASE_URL")
if not NEON_DATABASE_URL:
    # Fallback to SQLite for local development
    NEON_DATABASE_URL = f"sqlite:///{os.path.abspath(os.path.join(os.path.dirname(__file__), 'data.db'))}"

JWT_SECRET = os.environ.get("JWT_SECRET")
if not JWT_SECRET:
    JWT_SECRET = os.urandom(32).hex()
    print("WARNING: JWT_SECRET not set, using random secret. Tokens will not persist across restarts.")

ALLOWED_ORIGINS = os.environ.get("ALLOWED_ORIGINS", "*")

UPLOAD_FOLDER = os.path.join(tempfile.gettempdir(), "aiviate_uploads")
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
