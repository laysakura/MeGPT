import { ShowConversationHistory } from "./chat.js";
import { ShowError } from "./util.js";

// サイドバーのボット操作
document.addEventListener("DOMContentLoaded", () => {
  const botList = document.getElementById("bot-list");
  const addBotButton = document.getElementById("add-bot-button");
  const addBotModal = document.getElementById("add-bot-modal");
  const saveBotButton = document.getElementById("save-bot-button");
  const botNameInput = document.getElementById("bot-name-input");
  const systemPromptInput = document.getElementById("system-prompt-input");
  const botResponseInput = document.getElementById("bot-response-input");
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
        .catch((error) => ShowError(`Error adding bot: ${error}`));
    } else {
      ShowError("すべてのフィールドを入力してください");
    }
  });

  function addBotToSidebar(bot) {
    const botItem = document.createElement("div");
    botItem.className = "bot-item";

    const botLink = document.createElement("a");
    botLink.className = "bot-link";
    botLink.href = "#";
    botLink.textContent = bot.name;
    botLink.dataset.id = bot.id;
    botLink.dataset.name = bot.name;
    botLink.dataset.systemPrompt = bot.system_prompt;
    botLink.dataset.response = bot.response;

    botLink.addEventListener("click", (event) => {
      const dataset = event.target.dataset;

      updateSelectedBotElems({
        id: dataset.id,
        name: dataset.name,
        system_prompt: dataset.systemPrompt,
        response: dataset.response,
      });
      selectBot(bot);
    });
    botItem.appendChild(botLink);

    const botSettingsButton = document.createElement("button");
    botSettingsButton.className = "bot-settings-button";
    botSettingsButton.textContent = "設定";
    botSettingsButton.addEventListener("click", () => {
      openBotSettingsModal(bot);
    });
    botItem.appendChild(botSettingsButton);

    botList.appendChild(botItem);
  }

  function selectBot(bot) {
    const chatHistory = document.getElementById("chat-history");
    ShowConversationHistory(chatHistory, bot.id);
  }

  function openBotSettingsModal(bot) {
    const modal = document.getElementById("update-bot-modal");
    const closeButton = modal.querySelector(".close-button");
    const submitButton = modal.querySelector(
      "#update-bot-modal--update-bot-button"
    );
    const botName = modal.querySelector("#update-bot-modal--bot-name");
    const systemPrompt = modal.querySelector(
      "#update-bot-modal--system-prompt"
    );
    const response = modal.querySelector("#update-bot-modal--bot-response");

    modal.style.display = "block";

    closeButton.addEventListener("click", () => {
      modal.style.display = "none";
    });

    botName.value = bot.name;
    systemPrompt.value = bot.system_prompt;
    response.value = bot.response;

    submitButton.addEventListener("click", () => {
      const updatedName = botName.value.trim();
      const updatedSystemPrompt = systemPrompt.value.trim();
      const updatedResponse = response.value.trim();

      fetch(`/update_bot/${bot.id}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: bot.id,
          name: updatedName,
          system_prompt: updatedSystemPrompt,
          response: updatedResponse,
        }),
      })
        .then((response) => response.json())
        .then((data) => {
          if (data.status === "Bot updated") {
            alert("ボットが更新されました");
            modal.style.display = "none";
            location.reload(); // ページをリロードして更新を反映
          }
        })
        .catch((error) => ShowError(`Error updating bot: ${error}`));
    });
  }

  function updateSelectedBotElems(bot) {
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
    .catch((error) => ShowError(`Error fetching bots: ${error}`));
});
