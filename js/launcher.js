window.addEventListener("DOMContentLoaded", () => {
  const installBtn = document.getElementById("install");
  const progress = document.getElementById("progress");
  const statusText = document.getElementById("status");
  const gameOverlay = document.getElementById("gameOverlay");
  const gameFrame = document.getElementById("gameFrame");
  const backBtn = document.getElementById("back");

  installBtn.addEventListener("click", () => {
    installBtn.classList.add("hidden");
    progress.classList.remove("hidden");
    statusText.textContent = "Loading assets...";

    setTimeout(() => {
      statusText.textContent = "Starting game...";
      setTimeout(() => {
        document.getElementById("wrap").classList.add("hidden");
        gameOverlay.classList.remove("hidden");
        gameFrame.src = "game/index.html";
      }, 1000);
    }, 2000);
  });

  backBtn.addEventListener("click", () => {
    gameOverlay.classList.add("hidden");
    document.getElementById("wrap").classList.remove("hidden");
    installBtn.classList.remove("hidden");
    progress.classList.add("hidden");
    gameFrame.src = "about:blank";
  });
});