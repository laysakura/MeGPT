// ページロード時の処理
document.addEventListener("DOMContentLoaded", () => {
  // ============ 共通の操作 =======================
  const closeButton = document.querySelector(".close-button");

  // モーダルの閉じるボタンをクリックで非表示
  for (const button of document.querySelectorAll(".modal .close-button")) {
    button.addEventListener("click", () => {
      button.closest(".modal").style.display = "none";
    });
  }

  // モーダルの外をクリックで非表示
  window.addEventListener("click", (event) => {
    if (event.target.classList.contains("modal")) {
      event.target.style.display = "none";
    }
  });

  // ============ サイドバーのボット操作 ============
  const botList = document.getElementById("bot-list");
  const addBotButton = document.getElementById("add-bot-button");
  const addBotModal = document.getElementById("add-bot-modal");
  const saveBotButton = document.getElementById("save-bot-button");
  const botNameInput = document.getElementById("bot-name-input");
  const systemPromptInput = document.getElementById("system-prompt-input");
  const botResponseInput = document.getElementById("bot-response-input");
  const botSettingsButton = document.getElementById("bot-settings-button");
  const botDetailsLink = document.getElementById("bot-details-link");
  const botDetails = document.getElementById("bot-details");
  const selectedBotName = document.getElementById("selected-bot-name");
  const selectedBotSystemPrompt = document.getElementById(
    "selected-bot-system-prompt"
  );
  const selectedBotResponse = document.getElementById("selected-bot-response");

  addBotButton.addEventListener("click", () => {
    addBotModal.style.display = "block";
  });

  function addBotToSidebar(bot) {
    const botLink = document.createElement("div");
    botLink.className = "bot-link";

    const botName = document.createElement("a");
    botName.className = "bot-link";
    botName.href = "#";
    botName.textContent = bot.name;
    botName.addEventListener("click", () => {
      selectBot(bot);
    });
    botLink.appendChild(botName);

    const botSettingsButton = document.createElement("button");
    botSettingsButton.className = "bot-settings-button";
    botSettingsButton.textContent = "設定";
    botSettingsButton.addEventListener("click", () => {
      openBotSettingsModal(bot);
    });
    botLink.appendChild(botSettingsButton);

    botList.appendChild(botLink);
  }

  botDetailsLink.addEventListener("click", (event) => {
    event.preventDefault();
    console.log("Bot details link clicked");
    botDetails.style.display =
      botDetails.style.display === "none" ? "block" : "none";
  });

  function updateSelectedBotInfo(bot) {
    document.getElementById("selected-bot-id").value = bot.id;
    selectedBotName.textContent = bot.name;
    selectedBotSystemPrompt.textContent = bot.system_prompt;
    selectedBotResponse.textContent = bot.response;
  }

  saveBotButton.addEventListener("click", () => {
    const botName = botNameInput.value.trim();
    const systemPrompt = systemPromptInput.value.trim();
    const botResponse = botResponseInput.value.trim();

    if (botName && systemPrompt && botResponse) {
      fetch("/create_bot", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: 0, // unused
          name: botName,
          system_prompt: systemPrompt,
          response: botResponse,
        }),
      })
        .then((response) => response.json())
        .then((data) => {
          if (data.status === "Bot created") {
            alert("ボットが追加されました");
            location.reload(); // ページをリロードして新しいボットを表示
          }
        })
        .catch((error) => showError(`Error adding bot: ${error}`));
    } else {
      showError("すべてのフィールドを入力してください");
    }
  });

  // ============ メイン設定 =======================
  const settingsButton = document.getElementById("settings-button");
  const settingsModal = document.getElementById("settings-modal");
  const modelSelect = document.getElementById("model-select");
  const apiKeyInput = document.getElementById("api-key-input");
  const saveSettingsButton = document.getElementById("save-settings-button");
  const clearHistoryButton = document.getElementById("clear-history-button");

  // ============ チャット画面の操作 =================
  const userInput = document.getElementById("user-input");
  const submitButton = document.getElementById("submit-button");
  const chatHistory = document.getElementById("chat-history");

  fetch("/get_bots")
    .then((response) => response.json())
    .then((bots) => {
      for (const bot of bots) {
        addBotToSidebar(bot);
      }
    })
    .catch((error) => showError(`Error fetching bots: ${error}`));

  fetch("/get_settings")
    .then((response) => response.json())
    .then((settings) => {
      apiKeyInput.value = settings.api_key || "";
      modelSelect.value = settings.chat_model || "o1-preview";
    })
    .catch((error) => showError(`Error fetching settings: ${error}`));

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

  function selectBot(bot) {
    console.log(`Selected bot: ${bot.name}`);

    fetch(`/get_conversation_history/${bot.id}`)
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
  }

  function openBotSettingsModal(bot) {
    const botSettingsModal = document.getElementById("bot-settings-modal");
    const botNameInput = document.getElementById("bot-name-input");
    const systemPromptInput = document.getElementById("system-prompt-input");
    const botResponseInput = document.getElementById("bot-response-input");
    const saveBotSettingsButton = document.getElementById(
      "save-bot-settings-button"
    );

    console.log(`Opening settings for bot: ${bot.name}`);
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
