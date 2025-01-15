from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from pydantic import BaseModel
import sqlite3

app = FastAPI()


# SQLiteデータベースの接続
def get_db_connection():
    conn = sqlite3.connect("database.db")
    conn.row_factory = sqlite3.Row
    return conn


# データベースの初期化
def init_db():
    conn = get_db_connection()
    with conn:
        conn.execute("""
            CREATE TABLE IF NOT EXISTS settings (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                key TEXT NOT NULL,
                value TEXT NOT NULL
            )
        """)
        conn.execute("""
            CREATE TABLE IF NOT EXISTS conversation_history (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_input TEXT NOT NULL,
                response TEXT NOT NULL,
                timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        """)
    conn.close()


class Message(BaseModel):
    user_input: str


class Settings(BaseModel):
    api_key: str
    chat_model: str


@app.post("/save_settings")
async def save_settings(settings: Settings):
    conn = get_db_connection()
    with conn:
        conn.execute(
            "INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value=excluded.value",
            ("openai_api_key", settings.api_key),
            ("openai_chat_model", settings.chat_model),
        )
    conn.close()
    return JSONResponse(content={"status": "API key saved"}, status_code=200)


async def save_message(message: Message):
    conn = get_db_connection()
    with conn:
        conn.execute(
            "INSERT INTO conversation_history (user_input, response) VALUES (?, ?)",
            (message.user_input, ""),
        )
    conn.close()
    return JSONResponse(content={"status": "success"}, status_code=200)


async def startup_event():
    init_db()


@app.get("/")
async def read_root():
    return {"message": "Hello, World!"}


# サーバーの起動
if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="127.0.0.1", port=12345)
