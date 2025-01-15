export { showError };

// エラーメッセージを表示する共通関数
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
