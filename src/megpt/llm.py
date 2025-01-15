import openai

from megpt.models import Conversation, ConversationHistory, Message, Settings


class LlmClient:
    def __init__(self, settings: Settings):
        self.client = openai.OpenAI(
            api_key=settings.api_key,
        )
        self.chat_model = settings.chat_model

    def chat(self, history: ConversationHistory, message: Message) -> Conversation:
        messages = history.get_openai_messages() + [message.get_openai_message()]

        chat_completion = self.client.chat.completions.create(
            messages=messages,
            model=self.chat_model,
        )
        ai_response = chat_completion.choices[0].message.content

        return Conversation(
            message=message,
            ai_response=ai_response,
        )
