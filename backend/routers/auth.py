from fastapi import APIRouter, Header, HTTPException
import uuid

router = APIRouter(prefix="/api/auth")


# Temporary in-memory storage (later replace with DB)
users_db = {}
tokens_db = {}


# -----------------------------
# Request Access
# -----------------------------
@router.post("/request-access")
async def request_access(data: dict):

    email = data.get("email")

    return {
        "message": "Access request submitted",
        "email": email
    }


# -----------------------------
# Signup
# -----------------------------
@router.post("/signup")
async def signup(data: dict):

    email = data.get("email")
    password = data.get("password")
    name = data.get("name", email.split("@")[0])

    if email in users_db:
        raise HTTPException(status_code=400, detail="User already exists")

    # Save user
    users_db[email] = {
        "name": name,
        "email": email,
        "password": password,
        "role": "VLSI Engineer",
        "simulations": 0,
        "designs": 0
    }

    # Generate token
    token = str(uuid.uuid4())
    tokens_db[token] = email

    safe_user = {k: v for k, v in users_db[email].items() if k != "password"}
    return {
        "token": token,
        "user": safe_user
    }


# -----------------------------
# Login
# -----------------------------
@router.post("/login")
async def login(data: dict):

    email = data.get("email")
    password = data.get("password")

    user = users_db.get(email)

    if not user or user["password"] != password:
        raise HTTPException(status_code=401, detail="Invalid credentials")

    # Generate token
    token = str(uuid.uuid4())
    tokens_db[token] = email

    safe_user = {k: v for k, v in user.items() if k != "password"}
    return {
        "token": token,
        "user": safe_user
    }


# -----------------------------
# Get Logged In User
# -----------------------------
@router.get("/me")
async def get_current_user(authorization: str = Header(None)):

    if not authorization:
        raise HTTPException(status_code=401, detail="Not authenticated")

    token = authorization.replace("Bearer ", "")

    email = tokens_db.get(token)

    if not email:
        raise HTTPException(status_code=401, detail="Invalid token")

    return {k: v for k, v in users_db[email].items() if k != "password"}