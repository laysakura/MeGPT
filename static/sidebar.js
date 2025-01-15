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

  addBotButton.addEventListener("click", () => {
    addBotModal.style.display = "block";
  });

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

  botDetailsLink.addEventListener("click", (event) => {
    event.preventDefault();

    updateSelectedBotInfo({
      id: document.getElementById("selected-bot-id").value,
      name: selectedBotName.textContent,
      system_prompt: selectedBotSystemPrompt.textContent,
      response: selectedBotResponse.textContent,
    });

    botDetails.style.display =
      botDetails.style.display === "none" ? "block" : "none";
  });

  function addBotToSidebar(bot) {
    const botLink = document.createElement("div");
    botLink.className = "bot-link";

    const botName = document.createElement("a");
    botName.className = "bot-link";
    botName.href = "#";
    botName.textContent = bot.name;
    botLink.dataset.id = bot.id;
    botLink.dataset.name = bot.name;
    botLink.dataset.systemPrompt = bot.system_prompt;
    botLink.dataset.response = bot.response;

    botName.addEventListener("click", () => {
      updateSelectedBotInfo({
        id: botLink.dataset.id,
        name: botLink.dataset.name,
        system_prompt: botLink.dataset.systemPrompt,
        response: botLink.dataset.response,
      });
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

  function selectBot(bot) {
    const chatHistory = document.getElementById("chat-history");

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
    console.log(`Opening settings for bot: ${bot.name}`);
  }

  function updateSelectedBotInfo(bot) {
    const selectedBotName = document.getElementById("selected-bot-name");
    const selectedBotSystemPrompt = document.getElementById(
      "selected-bot-system-prompt"
    );
    const selectedBotResponse = document.getElementById(
      "selected-bot-response"
    );

    document.getElementById("selected-bot-id").value = bot.id;
    selectedBotName.textContent = bot.name;
    selectedBotSystemPrompt.textContent = bot.system_prompt;
    selectedBotResponse.textContent = bot.response;
  }

  fetch("/get_bots")
    .then((response) => response.json())
    .then((bots) => {
      for (const bot of bots) {
        addBotToSidebar(bot);
      }
    })
    .catch((error) => showError(`Error fetching bots: ${error}`));
});
