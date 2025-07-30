import { createClient } from "https://esm.sh/@anam-ai/js-sdk@latest";
import { AnamEvent } from "https://esm.sh/@anam-ai/js-sdk@latest/dist/module/types";

let anamClient = null;

const startButton = document.getElementById("start-button");
const stopButton = document.getElementById("stop-button");
const videoElement = document.getElementById("persona-video");
const chatHistory = document.getElementById("chat-history");

async function sendTalkMessage() {
  const messageInput = document.getElementById("message-input");
  const sendButton = document.getElementById("send-message");

  if (!anamClient || !messageInput) return;

  const message = messageInput.value.trim();
  if (!message) {
    alert("Please enter a message");
    return;
  }

  try {
    sendButton.disabled = true;
    sendButton.textContent = "Sending...";

    await anamClient.talk(message);

    messageInput.value = "";
  } catch (error) {
    console.error("Failed to send message:", error);
    alert("Failed to send message. Please try again.");
  } finally {
    sendButton.disabled = false;
    sendButton.textContent = "Send Message";
  }
}

function updateTalkControls(connected) {
  const sendButton = document.getElementById("send-message");
  const messageInput = document.getElementById("message-input");

  if (sendButton) {
    sendButton.disabled = !connected;
    sendButton.style.opacity = connected ? "1" : "0.5";
  }

  if (messageInput) {
    messageInput.disabled = !connected;
    messageInput.placeholder = connected
      ? "Type a message..."
      : "Connect to start chatting...";
  }
}

function updateChatHistory(messages) {
  if (!chatHistory) return;

  chatHistory.innerHTML = "";
  if (messages.length === 0) {
    chatHistory.innerHTML =
      "<p>Start a conversation to see your chat history</p>";
    return;
  }

  messages.forEach((message) => {
    const messageDiv = document.createElement("div");
    messageDiv.style.marginBottom = "10px";
    messageDiv.style.padding = "5px";
    messageDiv.style.borderRadius = "5px";
    if (message.role === "user") {
      messageDiv.className = "chat-message user";
      messageDiv.innerHTML = `<strong>You:</strong> ${message.content}`;
    } else {
      messageDiv.className = "chat-message ai";
      messageDiv.innerHTML = `<strong>Cara:</strong> ${message.content}`;
    }

    chatHistory.appendChild(messageDiv);
  });

  chatHistory.scrollTop = chatHistory.scrollHeight;
}

async function startChat() {
  try {
    startButton.disabled = true;

    const response = await fetch("/api/session-token", {
      method: "POST",
    });
    const { sessionToken } = await response.json();

    anamClient = createClient(sessionToken);

    anamClient.addListener(AnamEvent.SESSION_READY, () => {
      console.log("Session is ready!");
      anamClient.muteInputAudio();
      startButton.disabled = true;
      stopButton.disabled = false;
      updateTalkControls(true);
    });

    anamClient.addListener(AnamEvent.MESSAGE_HISTORY_UPDATED, (messages) => {
      console.log("Conversation updated:", messages);
      updateChatHistory(messages);
    });

    anamClient.addListener(AnamEvent.MESSAGE_STREAM_EVENT_RECEIVED, (event) => {
      const liveTranscript = document.getElementById("live-transcript");
      const transcriptText = document.getElementById("transcript-text");

      console.log("event", event);

      if (event.role === "persona") {
        if (liveTranscript && transcriptText) {
          transcriptText.textContent =
            transcriptText.textContent + event.content;
        }
      } else if (event.role === "user") {
        if (liveTranscript && transcriptText) {
          transcriptText.textContent = "";
        }
      }
    });

    await anamClient.streamToVideoElement("persona-video");

    console.log("Chat started successfully!");
  } catch (error) {
    console.error("Failed to start chat:", error);
    startButton.disabled = false;
  }
}

function stopChat() {
  if (anamClient) {
    anamClient.stopStreaming();
    anamClient = null;

    videoElement.srcObject = null;
    updateChatHistory([]);

    startButton.disabled = false;
    stopButton.disabled = true;

    console.log("Chat stopped.");
  }
}

startButton.addEventListener("click", startChat);
stopButton.addEventListener("click", stopChat);
document.addEventListener("DOMContentLoaded", () => {
  const sendButton = document.getElementById("send-message");
  const messageInput = document.getElementById("message-input");

  if (sendButton) {
    sendButton.addEventListener("click", sendTalkMessage);
  }

  if (messageInput) {
    messageInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        sendTalkMessage();
      }
    });
  }
});
