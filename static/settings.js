import { ShowError } from "./util.js";

// メイン設定
document.addEventListener("DOMContentLoaded", () => {
  const settingsButton = document.getElementById("settings-button");
  const settingsModal = document.getElementById("settings-modal");
  const modelSelect = document.getElementById("model-select");
  const apiKeyInput = document.getElementById("api-key-input");
  const saveSettingsButton = document.getElementById("save-settings-button");

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
          ShowError(`Error: ${error}`);
        });
    } else {
      ShowError("APIキーを入力してください");
    }
  });

  // 設定ボタンをクリックで設定画面を表示
  settingsButton.addEventListener("click", () => {
    settingsModal.style.display = "block";
  });

  fetch("/get_settings")
    .then((response) => response.json())
    .then((settings) => {
      apiKeyInput.value = settings.api_key || "";
      modelSelect.value = settings.chat_model || "o1-preview";
    })
    .catch((error) => ShowError(`Error fetching settings: ${error}`));
});
