// ページロード時の処理
document.addEventListener("DOMContentLoaded", () => {
  const userInput = document.getElementById("user-input");
  const modelSelect = document.getElementById("model-select");
  const submitButton = document.getElementById("submit-button");
  const chatHistory = document.getElementById("chat-history");
  const settingsButton = document.getElementById("settings-button");
  const settingsModal = document.getElementById("settings-modal");
  const closeButton = document.querySelector(".close-button");
  const apiKeyInput = document.getElementById("api-key-input");
  const saveSettingsButton = document.getElementById("save-settings-button");
  const clearHistoryButton = document.getElementById("clear-history-button");

  fetch("/get_settings")
    .then((response) => response.json())
    .then((settings) => {
      apiKeyInput.value = settings.api_key || "";
      modelSelect.value = settings.chat_model || "o1-preview";
    })
    .catch((error) => showError(`Error fetching settings: ${error}`));

  fetch("/get_conversation_history")
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
      showError(`Error fetching conversation history: ${error}`)
    );

  submitButton.addEventListener("click", sendMessage);
  userInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter" && !event.shiftKey && !event.isComposing) {
      event.preventDefault();
      sendMessage();
    }
  });

  // 会話履歴を削除するボタンのイベントリスナーを追加
  clearHistoryButton.addEventListener("click", () => {
    chatHistory.innerHTML = "";
    fetch("/clear_conversation_history", {
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
        showError(`Error clearing conversation history: ${error}`);
      });
  });

  // 設定画面の保存ボタンをクリックで設定を保存
  saveSettingsButton.addEventListener("click", () => {
    const apiKey = apiKeyInput.value.trim();
    const model = document.getElementById("model-select").value;
    if (apiKey && model) {
      fetch("/save_settings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          api_key: apiKey,
          chat_model: model,
        }),
      })
        .then((response) => response.json())
        .then((data) => {
          if (data.status === "Settings saved") {
            alert("設定が保存されました");
            settingsModal.style.display = "none";
          }
        })
        .catch((error) => {
          showError(`Error: ${error}`);
        });
    } else {
      showError("APIキーを入力してください");
    }
  });

  // 設定ボタンをクリックで設定画面を表示
  settingsButton.addEventListener("click", () => {
    settingsModal.style.display = "block";
  });

  // 設定画面の閉じるボタンをクリックで非表示
  closeButton.addEventListener("click", () => {
    settingsModal.style.display = "none";
  });

  // 設定画面の外をクリックで非表示
  window.addEventListener("click", (event) => {
    if (event.target === settingsModal) {
      settingsModal.style.display = "none";
    }
  });

  function textToHTML(text) {
    return text.replace(/\x0A/g, "<br>");
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

  function sendMessage() {
    const message = userInput.value.trim();

    if (!message) {
      return;
    }

    showUserMessage(message);
    chatHistory.scrollTop = chatHistory.scrollHeight;
    userInput.value = "";

    // APIを使ってAIと会話
    fetch("/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ input_role: "user", user_input: message }),
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

  function showError(message) {
    const flashMessage = document.getElementById("flash-message");

    flashMessage.textContent = message;

    const closeFlash = document.createElement("span");
    closeFlash.id = "close-flash";
    closeFlash.textContent = "×";
    closeFlash.addEventListener("click", () => {
      flashMessage.style.display = "none";
    });
    flashMessage.appendChild(closeFlash);

    flashMessage.style.display = "block";
  }
});
