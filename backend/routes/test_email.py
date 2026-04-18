from flask import Blueprint, request, jsonify
from services.email_service import send_email

test_email_bp = Blueprint("test_email", __name__)

@test_email_bp.route("/api/test-email", methods=["POST"])
def test_email():
    data = request.get_json() or {}
    to = data.get("to")
    subject = data.get("subject", "Test Email from Aviate Admin")
    html = data.get("html", "<h2>This is a test email from Aviate Admin backend.</h2>")
    if not to:
        return jsonify({"error": "Missing 'to' field in request body."}), 400
    try:
        send_email(to, subject, html)
        return jsonify({"success": True, "message": f"Test email sent to {to}"})
    except Exception as e:
        return jsonify({"error": str(e)}), 500
