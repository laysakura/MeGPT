from fastapi import FastAPI, Request
from fastapi.responses import HTMLResponse, JSONResponse
from fastapi.staticfiles import StaticFiles

from megpt.db import init_db
from megpt.llm import LlmClient
from megpt.models import Bot, Conversation, ConversationHistory, Message, Settings

app = FastAPI()


@app.get("/get_bots")
async def get_bots():
    bots = Bot.from_db()
    return JSONResponse(content=[bot.dict() for bot in bots], status_code=200)


@app.post("/create_bot")
async def create_bot(bot: Bot):
    bot.save()
    return JSONResponse(content={"status": "Bot created"}, status_code=200)


@app.post("/update_bot/{bot_id}")
async def update_bot(bot: Bot):
    bot = Bot(id=bot.id, name=bot.name, system_prompt=bot.system_prompt, response=bot.response)
    bot.update()
    return JSONResponse(content={"status": "Bot updated"}, status_code=200)


@app.get("/get_settings")
async def get_settings():
    settings = Settings.from_db()
    return JSONResponse(content=settings.to_json(), status_code=200)


@app.get("/get_conversation_history/{bot_id}")
async def get_conversation_history(bot_id: int):
    history = ConversationHistory.from_db(bot_id)
    return JSONResponse(content=history.to_json(), status_code=200)


@app.post("/save_settings")
async def save_settings(settings: Settings):
    settings.save()
    return JSONResponse(content={"status": "Settings saved"}, status_code=200)


@app.post("/save_conversation/{bot_id}")
async def save_conversation(bot_id: int, conversation: Conversation):
    history = ConversationHistory.from_db(bot_id)
    history.insert_conversation(conversation)
    return JSONResponse(content={"status": "success"}, status_code=200)


@app.post("/chat")
async def chat(bot_id: int, message: Message):
    history = ConversationHistory.from_db(bot_id)

    client = LlmClient(Settings.from_db())
    conversation = client.chat(history, message)

    return JSONResponse(content={"ai_response": conversation.ai_response}, status_code=200)


@app.post("/clear_conversation_history/{bot_id}")
async def clear_conversation_history(bot_id: int):
    ConversationHistory.clear_from_db(bot_id)
    return JSONResponse(content={"status": "success"}, status_code=200)


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
