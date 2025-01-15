document.addEventListener('DOMContentLoaded', () => {
    const userInput = document.getElementById('user-input');
    const submitButton = document.getElementById('submit-button');
    const chatHistory = document.getElementById('chat-history');
    const settingsButton = document.getElementById('settings-button');
    const settingsModal = document.getElementById('settings-modal');
    const closeButton = document.querySelector('.close-button');
    const apiKeyInput = document.getElementById('api-key-input');
    const saveSettingsButton = document.getElementById('save-settings-button');

    // 送信ボタンまたはEnterキーでメッセージを送信
    submitButton.addEventListener('click', sendMessage);
    userInput.addEventListener('keydown', (event) => {
        if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault();
            sendMessage();
        }
    });

    // APIキーを保存するボタンをクリックでサーバーに送信
    saveSettingsButton.addEventListener('click', () => {
        const apiKey = apiKeyInput.value.trim();
        const model = document.getElementById('model-select').value;
        if (apiKey && model) {
            fetch('/save_api_key', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ api_key: apiKey, model: model }),
            })
            .then(response => response.json())
            .then(data => {
                if (data.status === 'API key saved') {
                    alert('APIキーが保存されました');
                    settingsModal.style.display = 'none';
                }
            })
            .catch(error => {
                console.error('Error:', error);
            });
        }
    });

    // 設定ボタンをクリックで設定画面を表示
    settingsButton.addEventListener('click', () => {
        settingsModal.style.display = 'block';
    });

    // 設定画面の閉じるボタンをクリックで非表示
    closeButton.addEventListener('click', () => {
        settingsModal.style.display = 'none';
    });

    // 設定画面の外をクリックで非表示
    window.addEventListener('click', (event) => {
        if (event.target === settingsModal) {
            settingsModal.style.display = 'none';
        }
    });

    function sendMessage() {
        const message = userInput.value.trim();
        if (message) {
            const messageElement = document.createElement('div');
            messageElement.textContent = message;
            messageElement.className = 'user-message';
            chatHistory.appendChild(messageElement);
            userInput.value = '';
            chatHistory.scrollTop = chatHistory.scrollHeight;
        }
    }
});
