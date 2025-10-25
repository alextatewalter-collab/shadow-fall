const installBtn = document.getElementById("install");
const gameOverlay = document.getElementById("gameOverlay");
const gameFrame = document.getElementById("gameFrame");
const backBtn = document.getElementById("back");

installBtn.addEventListener("click", () => {
  installBtn.textContent = "Loading...";
  installBtn.disabled = true;

  // Load the game page inside the iframe
  gameFrame.src = "game/index.html";

  setTimeout(() => {
    gameOverlay.style.display = "block";
  }, 1000);
});

backBtn.addEventListener("click", () => {
  gameOverlay.style.display = "none";
  gameFrame.src = "about:blank";
  installBtn.textContent = "Install & Play";
  installBtn.disabled = false;
});
