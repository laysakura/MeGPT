from fastapi import FastAPI, Request, HTTPException
from fastapi.responses import HTMLResponse
from fastapi.staticfiles import StaticFiles
from fastapi.responses import JSONResponse
from pydantic import BaseModel
import sqlite3
import openai

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

    @staticmethod
    def from_db():
        conn = get_db_connection()
        cursor = conn.execute("SELECT key, value FROM settings")
        settings = {row["key"]: row["value"] for row in cursor.fetchall()}
        conn.close()

        return Settings(
            api_key=settings.get("openai_api_key"),
            chat_model=settings.get("openai_chat_model"),
        )

class ConversationHistory(BaseModel):
    history: list

    @staticmethod
    def from_db():
        conn = get_db_connection()
        cursor = conn.execute("SELECT user_input, response FROM conversation_history ORDER BY timestamp ASC")
        history = [{"user_input": row["user_input"], "response": row["response"]} for row in cursor.fetchall()]
        conn.close()

        return ConversationHistory(history=history)

def gen_openai_client(settings: Settings):
    client = openai.OpenAI(
        api_key=settigs.api_key,
    )
    return client

@app.get("/get_settings")
async def get_settings():
    settings = Settings.from_db()

    return JSONResponse(content=settings, status_code=200)


@app.get("/get_conversation_history")
async def get_conversation_history():
    history = ConversationHistory.from_db()
    return JSONResponse(content=history.history, status_code=200)


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


@app.post("/save_message")
async def save_message(message: Message):
    settings = Settings.from_db()
    client = gen_openai_client(settings)

    history = ConversationHistory.from_db()
    messages = history + [{"role": "user", "content": message.user_input}]

    try:
        # ChatGPT APIを呼び出して応答を取得
        chat_completion = client.chat.completions.create(
            messages=messages,
            model=settings.chat_model,
        )
        # 応答を取得
        ai_response = chat_completion.choices[0].message.content

        # メッセージ履歴にAIの応答を追加
        messages.append({"role": "assistant", "content": ai_response})
    except Exception as e:
        print(f"エラーが発生しました: {e}")
        raise e


    try:
        response = openai.Completion.create(
            engine=settings.get("openai_chat_model"),
            prompt=message.user_input,
            max_tokens=150,
        )
        reply = response.choices[0].text.strip()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

    conn = get_db_connection()
    with conn:
        conn.execute(
            "INSERT INTO conversation_history (user_input, response) VALUES (?, ?)",
            (message.user_input, ai_response),
        )
    conn.close()
    return JSONResponse(content={"response": reply}, status_code=200)


@app.on_event("startup")
async def startup_event():
    init_db()


app.mount("/static", StaticFiles(directory="static"), name="static")


@app.get("/", response_class=HTMLResponse)
async def read_root(request: Request):
    with open("llm-chat-app/index.html", "r") as file:
        html_content = file.read()
    return HTMLResponse(content=html_content, status_code=200)


# サーバーの起動
if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="127.0.0.1", port=12345)
