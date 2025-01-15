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

  fetch("/get_settings")
    .then((response) => response.json())
    .then((settings) => {
      apiKeyInput.value = settings.api_key || "";
      modelSelect.value = settings.chat_model || "o1-preview";
    })
    .catch((error) => showError(`Error fetching settings: ${error}`));

  fetch("/get_conversation_history")
    .then((response) => response.json())
    .then((history) => {
      history.forEach((entry) => {
        const messageElement = document.createElement("div");
        messageElement.textContent = entry.user_input;
        messageElement.className = "user-message";
        chatHistory.appendChild(messageElement);
      });
      chatHistory.scrollTop = chatHistory.scrollHeight;
    })
    .catch((error) =>
      showError(`Error fetching conversation history: ${error}`)
    );

  submitButton.addEventListener("click", sendMessage);
  userInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      sendMessage();
    }
  });

  // APIキーを保存するボタンをクリックでサーバーに送信
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

  function sendMessage() {
    const message = userInput.value.trim();

    if (!message) {
      return;
    }

    // ユーザーのメッセージを表示
    const messageElement = document.createElement("div");
    messageElement.textContent = message;
    messageElement.className = "user-message";
    chatHistory.appendChild(messageElement);
    userInput.value = "";
    chatHistory.scrollTop = chatHistory.scrollHeight;

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

        // UIにAIの返答を表示
        const aiMessageElement = document.createElement("div");
        aiMessageElement.textContent = ai_response;
        aiMessageElement.className = "assistant-message";
        chatHistory.appendChild(aiMessageElement);
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
