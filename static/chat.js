import { ShowError } from "./util.js";

export { ShowConversationHistory };

// チャット画面の操作
document.addEventListener("DOMContentLoaded", () => {
  const userInput = document.getElementById("user-input");
  const submitButton = document.getElementById("submit-button");
  const chatHistory = document.getElementById("chat-history");
  const clearHistoryButton = document.getElementById("clear-history-button");

  // 会話を送信するキー・ボタンのイベントリスナーを追加
  submitButton.addEventListener("click", sendMessage);
  userInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter" && !event.shiftKey && !event.isComposing) {
      event.preventDefault();
      sendMessage();
    }
  });

  // 会話履歴を削除するボタンのイベントリスナーを追加
  clearHistoryButton.addEventListener("click", () => {
    const botId = readBotId();

    chatHistory.innerHTML = "";
    fetch(`/clear_conversation_history/${botId}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.status === "success") {
          console.log("Conversation history cleared successfully");
        }
      })
      .catch((error) => {
        ShowError(`Error clearing conversation history: ${error}`);
      });
  });

  function readBotId() {
    const selectedBotId = document.getElementById("selected-bot-id").value;
    return selectedBotId ? Number.parseInt(selectedBotId, 10) : null;
  }

  function sendMessage() {
    const botId = readBotId();
    const message = userInput.value.trim();

    if (!message || !botId) {
      console.log(`Message: ${message}, Bot ID: ${botId}`);
      return;
    }

    showUserMessage(message);
    chatHistory.scrollTop = chatHistory.scrollHeight;
    userInput.value = "";

    // APIを使ってAIと会話
    fetch(`/chat/${botId}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        input_role: "user",
        user_input: message,
      }),
    })
      .then((response) => response.json())
      .then((data) => {
        const ai_response = data.ai_response;

        showAiResponse(ai_response);
        chatHistory.scrollTop = chatHistory.scrollHeight;

        // ユーザーのメッセージ・AIの返答をサーバーに保存
        fetch("/save_conversation", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            message: { input_role: "user", user_input: message },
            ai_response,
          }),
        })
          .then((response) => response.json())
          .then((data) => {
            if (data.status === "success") {
              console.log("Message saved successfully");
            }
          })
          .catch((error) => {
            showError(`Error saving message: ${error}`);
          });
      })
      .catch((error) => {
        showError(`Error fetching AI response: ${error}`);
      });
  }

  function showUserMessage(messageText) {
    const messageElement = document.createElement("div");
    messageElement.innerHTML = textToHTML(messageText); // NOTE: stored-XSS
    messageElement.className = "user-message";
    chatHistory.appendChild(messageElement);
  }

  function showAiResponse(aiResponseText) {
    const aiResponseElement = document.createElement("div");
    aiResponseElement.innerHTML = textToHTML(aiResponseText); // NOTE: stored-XSS
    aiResponseElement.className = "assistant-message";
    chatHistory.appendChild(aiResponseElement);
  }

  function textToHTML(text) {
    return text.replace(/\x0A/g, "<br>");
  }
});

function ShowConversationHistory(botId) {
  fetch(`/get_conversation_history/${botId}`)
    .then((response) => response.json())
    .then((data) => {
      const history = data.history;
      for (const conversation of history) {
        showUserMessage(conversation.message.user_input);
        showAiResponse(conversation.ai_response);
      }
      chatHistory.scrollTop = chatHistory.scrollHeight;
    })
    .catch((error) =>
      ShowError(`Error fetching conversation history: ${error}`)
    );
}
