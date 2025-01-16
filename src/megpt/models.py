import enum
from typing import Optional

from pydantic import BaseModel

from megpt.db import get_db_connection


class InputRoleEnum(str, enum.Enum):
    USER = "user"
    SYSTEM = "system"


class Message(BaseModel):
    input_role: InputRoleEnum
    user_input: str

    def get_openai_message(self) -> dict[str, str]:
        return {"role": self.input_role, "content": self.user_input}


class Conversation(BaseModel):
    message: Message
    ai_response: str

    def get_openai_message(self) -> list[dict[str, str]]:
        return [self.message.get_openai_message(), {"role": "assistant", "content": self.ai_response}]


class Bot(BaseModel):
    id: int | None
    name: str
    system_prompt: str
    response: str

    @staticmethod
    def all_from_db() -> list["Bot"]:
        conn = get_db_connection()
        cursor = conn.execute("SELECT id, name, system_prompt, response FROM bots")
        bots = [
            Bot(id=row["id"], name=row["name"], system_prompt=row["system_prompt"], response=row["response"])
            for row in cursor.fetchall()
        ]
        conn.close()
        return bots

    @staticmethod
    def find_from_db(bot_id: int) -> "Bot":
        conn = get_db_connection()
        cursor = conn.execute("SELECT id, name, system_prompt, response FROM bots WHERE id = ?", [bot_id])
        bot = Bot(**cursor.fetchone())
        conn.close()
        return bot

    def get_system_prompt(self) -> Conversation:
        return Conversation(
            message=Message(input_role=InputRoleEnum.SYSTEM, user_input=self.system_prompt), ai_response=self.response
        )

    def save(self):
        conn = get_db_connection()
        with conn:
            conn.execute(
                "INSERT INTO bots (name, system_prompt, response) VALUES (?, ?, ?) ON CONFLICT(id) DO UPDATE SET name=excluded.name, system_prompt=excluded.system_prompt, response=excluded.response",
                (self.name, self.system_prompt, self.response),
            )
        conn.close()

    def update(self):
        conn = get_db_connection()
        with conn:
            conn.execute(
                "UPDATE bots SET name = ?, system_prompt = ?, response = ? WHERE id = ?",
                (self.name, self.system_prompt, self.response, self.id),
            )
        conn.close()


class Settings(BaseModel):
    api_key: Optional[str]
    chat_model: str | None

    @staticmethod
    def from_db() -> "Settings":
        conn = get_db_connection()
        cursor = conn.execute("SELECT key, value FROM settings")
        settings = {row["key"]: row["value"] for row in cursor.fetchall()}
        conn.close()

        return Settings(
            api_key=settings.get("openai_api_key"),
            chat_model=settings.get("openai_chat_model"),
        )

    def save(self):
        conn = get_db_connection()
        with conn:
            conn.executemany(
                "INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value=excluded.value",
                [
                    ("openai_api_key", self.api_key),
                    ("openai_chat_model", self.chat_model),
                ],
            )
        conn.close()

    def to_json(self) -> dict[str, str]:
        return self.model_dump()


class ConversationHistory(BaseModel):
    bot_id: int
    history: list[Conversation]

    @staticmethod
    def from_db(bot_id: int) -> "ConversationHistory":
        conn = get_db_connection()
        cursor = conn.execute(
            "SELECT input_role, user_input, response FROM conversations WHERE bot_id = ? ORDER BY timestamp ASC",
            [bot_id],
        )
        history = [
            Conversation(
                message=Message(input_role=row["input_role"], user_input=row["user_input"]), ai_response=row["response"]
            )
            for row in cursor.fetchall()
        ]
        conn.close()

        return ConversationHistory(history=history, bot_id=bot_id)

    @staticmethod
    def clear_from_db(bot_id: int):
        conn = get_db_connection()
        with conn:
            conn.execute("DELETE FROM conversations WHERE bot_id = ?", [bot_id])
        conn.close()

    def get_openai_messages(self) -> list[dict[str, str]]:
        return sum([conversation.get_openai_message() for conversation in self.history], [])

    def add_conversation(self, conversation: Conversation):
        self.history.append(conversation)

    def insert_conversation(self, conversation: Conversation):
        conn = get_db_connection()
        with conn:
            conn.execute(
                "INSERT INTO conversations (bot_id, input_role, user_input, response) VALUES (?, ?, ?, ?)",
                (
                    self.bot_id,
                    conversation.message.input_role,
                    conversation.message.user_input,
                    conversation.ai_response,
                ),
            )
        conn.close()

    def to_json(self) -> dict[str, str]:
        return self.model_dump()
