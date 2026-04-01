from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="QANTYX API", description="End-to-End AI-Powered VLSI Design Platform", version="1.0.0")

# CORS setup
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    return {"message": "Welcome to QANTYX Backend API"}

import smtplib
from email.message import EmailMessage
import threading
import os

def send_email_background(to_email: str, subject: str, body: str):
    """Sends an email in the background if SMTP credentials are provided in the environment."""
    smtp_server = os.environ.get("SMTP_SERVER", "smtp.gmail.com")
    smtp_port = int(os.environ.get("SMTP_PORT", 587))
    smtp_user = os.environ.get("SMTP_USER", "")
    smtp_pass = os.environ.get("SMTP_PASS", "")

    if not smtp_user or not smtp_pass:
        print(f"[Dummy Email] To: {to_email} | Subject: {subject} | Body: {body}")
        print("Set SMTP_USER and SMTP_PASS environment variables to send real emails.")
        return

    try:
        msg = EmailMessage()
        msg.set_content(body)
        msg['Subject'] = subject
        msg['From'] = smtp_user
        msg['To'] = to_email

        server = smtplib.SMTP(smtp_server, smtp_port)
        server.starttls()
        server.login(smtp_user, smtp_pass)
        server.send_message(msg)
        server.quit()
        print(f"Email successfully sent to {to_email}")
    except Exception as e:
        print(f"Failed to send email to {to_email}: {e}")

from pydantic import BaseModel

class LoginRequest(BaseModel):
    email: str

@app.post("/api/auth/login")
async def login_user(req: LoginRequest):
    # Mock authentication
    threading.Thread(target=send_email_background, args=(
        req.email, 
        "Security Alert: New Login to QANTYX", 
        f"Hello,\n\nA new login was detected for your QANTYX workspace account ({req.email}).\n\nIf this was you, no further action is required."
    )).start()
    return {"status": "success", "message": f"Logged in and alert sent to {req.email}"}

class SignupRequest(BaseModel):
    first_name: str
    last_name: str
    email: str
    role: str

@app.post("/api/auth/request-access")
async def request_access(req: SignupRequest):
    threading.Thread(target=send_email_background, args=(
        req.email, 
        "Welcome to QANTYX - Access Request Received", 
        f"Hello {req.first_name},\n\nWe have received your access request for the QANTYX VLSI platform as a {req.role}.\nYour workspace is now being provisioned.\n\nThank you!"
    )).start()
    return {"status": "success", "message": f"Access requested and confirmation sent to {req.email}"}

@app.get("/health")
async def health_check():
    return {"status": "ok"}

