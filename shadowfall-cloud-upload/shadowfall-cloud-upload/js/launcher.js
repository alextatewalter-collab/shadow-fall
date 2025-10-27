diff --git a/shadowfall-cloud-upload/js/launcher.js b/shadowfall-cloud-upload/js/launcher.js
new file mode 100644
index 0000000000000000000000000000000000000000..68d1195d85390726dd67aff0cde15d1d793aadc9
--- /dev/null
+++ b/shadowfall-cloud-upload/js/launcher.js
@@ -0,0 +1,120 @@
+window.addEventListener("DOMContentLoaded", () => {
+  const installBtn = document.getElementById("install");
+  const resumeBtn = document.getElementById("resume");
+  const wrap = document.getElementById("wrap");
+  const progress = document.getElementById("progress");
+  const statusText = document.getElementById("status");
+  const gameOverlay = document.getElementById("gameOverlay");
+  const gameFrame = document.getElementById("gameFrame");
+  const backBtn = document.getElementById("back");
+
+  let hasLaunched = window.localStorage.getItem("shadowfall-resume") === "1";
+  let launchTimers = [];
+  let isLaunching = false;
+
+  if (hasLaunched) {
+    resumeBtn.classList.remove("hidden");
+    installBtn.textContent = "Install Again";
+  }
+
+  function clearLaunchTimers() {
+    launchTimers.forEach((timer) => clearTimeout(timer));
+    launchTimers = [];
+  }
+
+  function showProgressPanel() {
+    progress.classList.remove("hidden");
+    statusText.textContent = "Decrypting archive…";
+  }
+
+  function startGame() {
+    isLaunching = false;
+    clearLaunchTimers();
+    wrap.classList.add("hidden");
+    progress.classList.add("hidden");
+    gameOverlay.classList.remove("hidden");
+    gameFrame.src = "game/index.html";
+    hasLaunched = true;
+    window.localStorage.setItem("shadowfall-resume", "1");
+    resumeBtn.classList.remove("hidden");
+    installBtn.classList.remove("hidden");
+    installBtn.textContent = "Install Again";
+  }
+
+  function runInstallSequence() {
+    if (isLaunching) return;
+    isLaunching = true;
+    clearLaunchTimers();
+    installBtn.classList.add("hidden");
+    resumeBtn.classList.add("hidden");
+    showProgressPanel();
+
+    const steps = [
+      ["Decrypting archive…", 1100],
+      ["Weaving campfire sparks…", 1400],
+      ["Summoning forest fog…", 1200],
+      ["Drawing pathfinding glyphs…", 900]
+    ];
+
+    let accumulated = 0;
+    steps.forEach(([text, delay]) => {
+      launchTimers.push(
+        setTimeout(() => {
+          statusText.textContent = text;
+        }, accumulated)
+      );
+      accumulated += delay;
+    });
+
+    launchTimers.push(setTimeout(startGame, accumulated));
+  }
+
+  function resumeGame() {
+    wrap.classList.add("hidden");
+    progress.classList.add("hidden");
+    gameOverlay.classList.remove("hidden");
+    gameFrame.src = "game/index.html";
+  }
+
+  function leaveCamp() {
+    clearLaunchTimers();
+    isLaunching = false;
+    gameOverlay.classList.add("hidden");
+    wrap.classList.remove("hidden");
+    progress.classList.add("hidden");
+    gameFrame.src = "about:blank";
+    if (hasLaunched) {
+      resumeBtn.classList.remove("hidden");
+      installBtn.classList.remove("hidden");
+      installBtn.textContent = "Install Again";
+    } else {
+      installBtn.classList.remove("hidden");
+      installBtn.textContent = "Install & Play";
+    }
+    statusText.textContent = "Preparing…";
+  }
+
+  installBtn.addEventListener("click", runInstallSequence);
+  resumeBtn.addEventListener("click", resumeGame);
+  backBtn.addEventListener("click", leaveCamp);
+
+  window.addEventListener("keydown", (event) => {
+    if (event.key === "Enter" && gameOverlay.classList.contains("hidden")) {
+      event.preventDefault();
+      if (hasLaunched) {
+        resumeGame();
+      } else {
+        runInstallSequence();
+      }
+    }
+
+    if (event.key === "Escape" && !gameOverlay.classList.contains("hidden")) {
+      event.preventDefault();
+      leaveCamp();
+    }
+  });
+
+  window.addEventListener("beforeunload", () => {
+    clearLaunchTimers();
+  });
+});
