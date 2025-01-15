import { showError } from "./util.js";

// サイドバーのボット操作
document.addEventListener("DOMContentLoaded", () => {
  const botList = document.getElementById("bot-list");
  const addBotButton = document.getElementById("add-bot-button");
  const addBotModal = document.getElementById("add-bot-modal");
  const saveBotButton = document.getElementById("save-bot-button");
  const botNameInput = document.getElementById("bot-name-input");
  const systemPromptInput = document.getElementById("system-prompt-input");
  const botResponseInput = document.getElementById("bot-response-input");
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
    botDetails.style.display =
      botDetails.style.display === "none" ? "block" : "none";
  });

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

  fetch("/get_bots")
    .then((response) => response.json())
    .then((bots) => {
      for (const bot of bots) {
        addBotToSidebar(bot);
      }
    })
    .catch((error) => showError(`Error fetching bots: ${error}`));
});
