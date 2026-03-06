/**
 * chat.js - AI Chat Panel UI
 * Connects the chat panel DOM to the VS Code extension via postMessage.
 * Also handles messages received from the extension.
 */
(function () {
  var vscode = acquireVsCodeApi();
  var panel      = document.getElementById("chat-panel");
  var messagesEl = document.getElementById("chat-messages");
  var input      = document.getElementById("chat-input");
  var sendBtn    = document.getElementById("chat-send");
  var closeBtn   = document.getElementById("chat-close");
  var openBtn    = document.getElementById("btn-chat");

  /* ---- helpers ---- */
  function now() {
    return new Date().toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" });
  }

  function addMsg(role, text) {
    var div = document.createElement("div");
    div.className = "chat-msg " + role;
    var bubble = document.createElement("div");
    bubble.className = "chat-bubble";
    bubble.textContent = text;
    var time = document.createElement("div");
    time.className = "chat-time";
    time.textContent = now();
    div.appendChild(bubble);
    div.appendChild(time);
    messagesEl.appendChild(div);
    messagesEl.scrollTop = messagesEl.scrollHeight;
    return div;
  }

  function showTyping() {
    var div = document.createElement("div");
    div.className = "chat-msg bot";
    div.id = "typing-indicator";
    var t = document.createElement("div");
    t.className = "chat-typing";
    t.innerHTML = "<span></span><span></span><span></span>";
    div.appendChild(t);
    messagesEl.appendChild(div);
    messagesEl.scrollTop = messagesEl.scrollHeight;
  }

  function hideTyping() {
    var el = document.getElementById("typing-indicator");
    if (el) el.remove();
  }

  function sendMessage() {
    var text = input.value.trim();
    if (!text) return;
    input.value = "";
    addMsg("user", text);
    showTyping();
    vscode.postMessage({ type: "chat", text: text });
  }

  /* ---- events ---- */
  sendBtn.addEventListener("click", sendMessage);
  input.addEventListener("keydown", function (e) {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  });
  closeBtn.addEventListener("click", function () { panel.classList.add("hidden"); });
  if (openBtn) openBtn.addEventListener("click", function () { panel.classList.toggle("hidden"); });

  /* ---- greeting ---- */
  var greetings = [
    "主人好呀！有什么我可以帮你的吗？(◕ᴗ◕✿)",
    "嗨！主人来啦～今天写什么代码呢？",
    "欢迎回来！有什么想问小宠的嗳？",
    "主人！我等你好久了！✨",
  ];
  setTimeout(function () {
    addMsg("bot", greetings[Math.floor(Math.random() * greetings.length)]);
  }, 500);

  /* ---- expose API for pet.js ---- */
  window.PetChat = {
    show: function () { panel.classList.remove("hidden"); },
    hide: function () { panel.classList.add("hidden"); },
    toggle: function () { panel.classList.toggle("hidden"); },
    addMessage: function (role, text) {
      hideTyping();
      addMsg(role, text);
      if (role === "bot" && window.PetSpeech) window.PetSpeech.say(text, 4000);
    },
    showTyping: showTyping,
    hideTyping: hideTyping,
  };
})();