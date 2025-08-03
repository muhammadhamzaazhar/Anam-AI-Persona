import { createClient } from "https://esm.sh/@anam-ai/js-sdk@latest";
import { AnamEvent } from "https://esm.sh/@anam-ai/js-sdk@latest/dist/module/types";

let anamClient = null;
let chatMessages = [];
let isConnected = false;

const startButton = document.getElementById("start-button");
const stopButton = document.getElementById("stop-button");
// const videoElement = document.getElementById("persona-video");
const chatHistory = document.getElementById("chat-history");
const messageInput = document.getElementById("message-input");
const sendButton = document.getElementById("send-message");
const statusDot = document.getElementById("status-dot");
const statusText = document.getElementById("status-text");
const videoOverlay = document.getElementById("video-overlay");
const clearChatBtn = document.getElementById("clear-chat");

document.getElementById("year").textContent = new Date().getFullYear();

document.addEventListener("DOMContentLoaded", function () {
  initializeApp();
  setupEventListeners();
  setupKeyboardShortcuts();
});

function initializeApp() {
  updateConnectionStatus(false);
  updateTalkControls(false);
  updateChatHistory();
}

function setupEventListeners() {
  if (startButton) {
    startButton.addEventListener("click", startChat);
  }

  if (stopButton) {
    stopButton.addEventListener("click", stopChat);
  }

  if (sendButton) {
    sendButton.addEventListener("click", sendTalkMessage);
  }

  if (clearChatBtn) {
    clearChatBtn.addEventListener("click", clearChatHistory);
  }

  document.querySelectorAll(".nav-link").forEach((link) => {
    link.addEventListener("click", function (e) {
      e.preventDefault();
      const targetId = this.getAttribute("href").substring(1);
      const targetElement = document.getElementById(targetId);

      if (targetElement) {
        targetElement.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });

        document
          .querySelectorAll(".nav-link")
          .forEach((l) => l.classList.remove("active"));
        this.classList.add("active");
      }
    });
  });

  const navToggle = document.querySelector(".nav-toggle");
  const navMenu = document.querySelector(".nav-menu");

  if (navToggle && navMenu) {
    navToggle.addEventListener("click", function () {
      navMenu.classList.toggle("active");
    });
  }

  if (messageInput) {
    messageInput.addEventListener("input", autoResizeTextarea);
  }
}

function setupKeyboardShortcuts() {
  if (messageInput) {
    messageInput.addEventListener("keydown", function (e) {
      if (e.ctrlKey && e.key === "Enter") {
        e.preventDefault();
        sendTalkMessage();
      }
    });
  }

  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && messageInput) {
      messageInput.value = "";
    }
  });
}

async function startChat() {
  try {
    startButton.disabled = true;
    startButton.innerHTML =
      '<i class="fas fa-spinner fa-spin"></i> Connecting...';

    const response = await fetch("/api/session-token", {
      method: "POST",
    });
    const { sessionToken } = await response.json();

    anamClient = createClient(sessionToken,{
      disableInputAudio: true 
    });

    anamClient.addListener(AnamEvent.CONNECTION_ESTABLISHED, () => {
      console.log("Connection established");
      updateConnectionStatus(true);
      hideVideoOverlay();
    });

    anamClient.addListener(AnamEvent.CONNECTION_CLOSED, () => {
      console.log("Connection closed");
      anamClient = null;
      updateConnectionStatus(false);
      showVideoOverlay();
    });

    anamClient.addListener(AnamEvent.MESSAGE_HISTORY_UPDATED, (messages) => {
      console.log("Conversation updated:", messages);
      updateChatHistory(messages);
    });

    await anamClient.streamToVideoElement("persona-video");

    chatMessages = chatMessages.filter(
      (msg) =>
        !(
          msg.role === "system" &&
          (msg.content === "AI Persona connected successfully." ||
            msg.content === "AI Persona disconnected.")
        )
    );
    addSystemMessage("AI Persona connected successfully.");
  } catch (error) {
    console.error("Failed to start chat:", error);
    showNotification("Failed to connect. Please try again.", "error");
    updateConnectionStatus(false);
  } finally {
    startButton.disabled = false;
    startButton.innerHTML = '<i class="fas fa-play"></i> Start Chat';
  }
}

async function stopChat() {
  if (!anamClient) return;

  try {
    stopButton.innerHTML =
      '<i class="fas fa-spinner fa-spin"></i> Disconnecting...';

    await anamClient.stopStreaming();
    anamClient = null;

    chatMessages = chatMessages.filter(
      (msg) =>
        !(
          msg.role === "system" &&
          msg.content === "AI Persona connected successfully."
        )
    );
    addSystemMessage("AI Persona disconnected.");
    updateConnectionStatus(false);
    showVideoOverlay();
  } catch (error) {
    console.error("Failed to stop chat:", error);
    showNotification("Error disconnecting. Please refresh the page.", "error");
  } finally {
    stopButton.disabled = true;
    stopButton.innerHTML = '<i class="fas fa-stop"></i> Stop Chat';
  }
}

async function sendTalkMessage() {
  if (!anamClient || !messageInput) return;

  const message = messageInput.value.trim();
  if (!message) {
    showNotification("Please enter a message", "warning");
    return;
  }

  try {
    sendButton.disabled = true;
    sendButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';

    await anamClient.talk(message);
    messageInput.value = "";
    autoResizeTextarea();
  } catch (error) {
    console.error("Failed to send message:", error);
    showNotification("Failed to send message. Please try again.", "error");
  } finally {
    sendButton.disabled = false;
    sendButton.innerHTML = '<i class="fas fa-paper-plane"></i>';
  }
}

function updateConnectionStatus(connected) {
  isConnected = connected;

  if (statusDot && statusText) {
    if (connected) {
      statusDot.className = "status-dot online";
      statusText.textContent = "Online";
    } else {
      statusDot.className = "status-dot offline";
      statusText.textContent = "Offline";
    }
  }

  updateTalkControls(connected);

  if (startButton && stopButton) {
    startButton.disabled = connected;
    stopButton.disabled = !connected;
  }
}

function updateTalkControls(connected) {
  if (sendButton) {
    sendButton.disabled = !connected;
  }

  if (messageInput) {
    messageInput.disabled = !connected;
    messageInput.placeholder = connected
      ? "Type your message here..."
      : "Connect to start chatting...";
  }
}

function updateChatHistory(messages = []) {
  if (!chatHistory) return;

  chatHistory.innerHTML = "";

  const allMessages = [...chatMessages, ...messages];

  if (allMessages.length === 0) {
    chatHistory.innerHTML = `
      <div class="welcome-message">
        <div class="welcome-icon">
          <i class="fas fa-robot"></i>
        </div>
        <h4>Welcome to AI Persona Chat</h4>
        <p>Start a conversation to see your chat history appear here. Your AI companion is ready to assist you!</p>
      </div>
    `;
    return;
  }

  allMessages.forEach((message) => {
    const messageDiv = document.createElement("div");

    if (message.role === "system") {
      messageDiv.className = `chat-message system system-${
        message.type || "info"
      }`;
      messageDiv.innerHTML = `
        <div class="message-content system-message">
          <i class="fas fa-${getSystemMessageIcon(message.type)}"></i>
          ${escapeHtml(message.content)}
        </div>
      `;
    } else {
      messageDiv.className = `chat-message ${
        message.role === "user" ? "user" : "ai"
      }`;

      const senderName = message.role === "user" ? "You" : "AI";
      const messageContent = message.content || message.message || "";

      messageDiv.innerHTML = `
        <div class="message-content"><strong>${senderName}:</strong> ${escapeHtml(
        messageContent
      )}</div>
      `;
    }

    chatHistory.appendChild(messageDiv);
  });

  chatHistory.scrollTop = chatHistory.scrollHeight;
}

function addSystemMessage(content, type = "info") {
  const systemMessage = {
    role: "system",
    content: content,
    type: type,
  };

  chatMessages.push(systemMessage);
  updateChatHistory();
}

function clearChatHistory() {
  if (confirm("Are you sure you want to clear the chat history?")) {
    chatMessages = [];
    updateChatHistory();
    showNotification("Chat history cleared", "success");
  }
}

function hideVideoOverlay() {
  if (videoOverlay) {
    videoOverlay.style.opacity = "0";
    setTimeout(() => {
      videoOverlay.style.display = "none";
    }, 300);
  }
}

function showVideoOverlay() {
  if (videoOverlay) {
    videoOverlay.style.display = "flex";
    videoOverlay.style.opacity = "1";
  }
}

function autoResizeTextarea() {
  if (messageInput) {
    messageInput.style.height = "auto";
    messageInput.style.height = Math.min(messageInput.scrollHeight, 150) + "px";
  }
}

function showNotification(message, type = "info") {
  const notification = document.createElement("div");
  notification.className = `notification notification-${type}`;
  notification.innerHTML = `
        <i class="fas fa-${getNotificationIcon(type)}"></i>
        <span>${message}</span>
    `;

  document.body.appendChild(notification);

  setTimeout(() => notification.classList.add("show"), 100);

  setTimeout(() => {
    notification.classList.remove("show");
    setTimeout(() => notification.remove(), 300);
  }, 3000);
}

function getNotificationIcon(type) {
  const icons = {
    success: "check-circle",
    error: "exclamation-triangle",
    warning: "exclamation-circle",
    info: "info-circle",
  };
  return icons[type] || icons.info;
}

function getSystemMessageIcon(type) {
  const icons = {
    success: "check-circle",
    error: "exclamation-triangle",
    warning: "exclamation-circle",
    info: "info-circle",
  };
  return icons[type] || icons.info;
}

function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

const notificationStyles = `
    .notification {
        position: fixed;
        top: 100px;
        right: 20px;
        background: var(--glass-bg);
        backdrop-filter: blur(20px);
        border: 1px solid var(--glass-border);
        border-radius: var(--radius-lg);
        padding: var(--space-md) var(--space-lg);
        color: var(--text-primary);
        display: flex;
        align-items: center;
        gap: var(--space-sm);
        box-shadow: var(--shadow-xl);
        transform: translateX(400px);
        opacity: 0;
        transition: all 0.3s ease;
        z-index: 10000;
        max-width: 350px;
    }
    
    .notification.show {
        transform: translateX(0);
        opacity: 1;
    }
    
    .notification-success {
        border-left: 4px solid var(--accent-success);
    }
    
    .notification-error {
        border-left: 4px solid var(--accent-danger);
    }
    
    .notification-warning {
        border-left: 4px solid var(--accent-warning);
    }
    
    .notification-info {
        border-left: 4px solid var(--primary);
    }
`;

const styleSheet = document.createElement("style");
styleSheet.textContent = notificationStyles;
document.head.appendChild(styleSheet);
