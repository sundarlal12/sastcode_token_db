import os
from dotenv import load_dotenv
import mysql.connector
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import Optional
from fastapi.middleware.cors import CORSMiddleware

# Load .env values
load_dotenv()

# DB config: prefer DB_USER, but fall back to DB_USERNAME for convenience
DB_USER = os.getenv("DB_USER") or os.getenv("DB_USERNAME")
DB_PASSWORD = os.getenv("DB_PASSWORD")
DB_HOST = os.getenv("DB_HOST")
DB_NAME = os.getenv("DB_NAME")
DB_PORT = int(os.getenv("DB_PORT", 3306))

if not all([DB_USER, DB_PASSWORD, DB_HOST, DB_NAME]):
    raise SystemExit("Missing required DB environment variables (DB_USER/DB_USERNAME, DB_PASSWORD, DB_HOST, DB_NAME)")

DB_CONFIG = {
    "user": DB_USER,
    "password": DB_PASSWORD,
    "host": DB_HOST,
    "database": DB_NAME,
    "port": DB_PORT,
    "raise_on_warnings": True,
    "autocommit": True
}

app = FastAPI(title="VAPTlabs Token Service (Simple)")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # change to your frontend domain in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Pydantic schemas
class StoreTokenIn(BaseModel):
    client_id: str
    git_secret: str
    email: str
    client_access_token: str
    user_name: str
    code: str

class GetTokenIn(BaseModel):
    username: str
    platform: Optional[str] = None  # maps to git_client_secret in DB

# Helpers
def get_db_connection():
    return mysql.connector.connect(**DB_CONFIG)

# Routes
@app.get("/")
def root():
    return {
        "message": "🔐 Welcome to VAPTlabs – Your Code, Secured.",
        "description": "Simple FastAPI token service",
        "contact": "contact@vaptlabs.com",
    }

@app.get("/health")
def health():
    try:
        db = get_db_connection()
        cur = db.cursor()
        cur.execute("SELECT 1")
        cur.close()
        db.close()
        return {"ok": True}
    except Exception as e:
        raise HTTPException(status_code=500, detail="DB unreachable: " + str(e))

@app.post("/storeToken")
def store_token(payload: StoreTokenIn):
    db = get_db_connection()
    cur = db.cursor(dictionary=True)
    try:
        insert_sql = """
            INSERT INTO github_user_details
            (git_client_id, git_client_secret, email, client_access_token, user_name, code)
            VALUES (%s, %s, %s, %s, %s, %s)
        """
        cur.execute(insert_sql, (
            payload.client_id,
            payload.git_secret,
            payload.email,
            payload.client_access_token,
            payload.user_name,
            payload.code,
        ))
        insert_id = cur.lastrowid

        cur.execute("SELECT id, user_name, created_at, code FROM github_user_details WHERE id = %s", (insert_id,))
        row = cur.fetchone()
        if not row:
            raise HTTPException(status_code=500, detail="Stored but failed to read back record")

        return {"message": "Stored", "data": row}
    except mysql.connector.Error as merr:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"MySQL error: {merr.msg if hasattr(merr,'msg') else str(merr)}")
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        cur.close()
        db.close()

@app.post("/getToken")
def get_token(payload: GetTokenIn):
    if not payload.username:
        raise HTTPException(status_code=400, detail="Username is required")

    db = get_db_connection()
    cur = db.cursor(dictionary=True)
    try:
        sql = """
            SELECT client_access_token, code, user_name, email
            FROM github_user_details
            WHERE user_name = %s AND git_client_secret = %s
            ORDER BY id DESC
            LIMIT 1
        """
        cur.execute(sql, (payload.username, payload.platform))
        row = cur.fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="User not found")
        return {"message": "User found", "data": row}
    except mysql.connector.Error as merr:
        raise HTTPException(status_code=500, detail=f"MySQL error: {merr.msg if hasattr(merr,'msg') else str(merr)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        cur.close()
        db.close()
