// 共通の操作
document.addEventListener("DOMContentLoaded", () => {
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
});
