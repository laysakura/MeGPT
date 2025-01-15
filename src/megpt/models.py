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
            conn.execute(
                "INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value=excluded.value",
                ("openai_api_key", self.api_key),
                ("openai_chat_model", self.chat_model),
            )
        conn.close()

    def to_json(self) -> dict[str, str]:
        return self.model_dump()


class ConversationHistory(BaseModel):
    history: list[Conversation]

    @staticmethod
    def from_db() -> "ConversationHistory":
        conn = get_db_connection()
        cursor = conn.execute(
            "SELECT input_role, user_input, response FROM conversation_history ORDER BY timestamp ASC"
        )
        history = [
            Conversation(
                message=Message(input_role=row["input_role"], user_input=row["user_input"]), ai_response=row["response"]
            )
            for row in cursor.fetchall()
        ]
        conn.close()

        return ConversationHistory(history=history)

    def get_openai_messages(self) -> list[dict[str, str]]:
        return sum([conversation.get_openai_message() for conversation in self.history], [])

    def add_conversation(self, conversation: Conversation):
        self.history.append(conversation)

    def insert_conversation(self, conversation: Conversation):
        conn = get_db_connection()
        with conn:
            conn.execute(
                "INSERT INTO conversation_history (input_role, user_input, response) VALUES (?, ?, ?)",
                (conversation.message.input_role, conversation.message.user_input, conversation.ai_response),
            )
        conn.close()
