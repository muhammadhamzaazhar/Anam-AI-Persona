import { createClient } from "https://esm.sh/@anam-ai/js-sdk@latest";
import { AnamEvent } from "https://esm.sh/@anam-ai/js-sdk@latest/dist/module/types";

let anamClient = null;

// Get DOM elements
const startButton = document.getElementById("start-button");
const stopButton = document.getElementById("stop-button");
const videoElement = document.getElementById("persona-video");
const loadingMessage = document.getElementById("loading-message");
const chatHistory = document.getElementById("chat-history");

function showLoadingState() {
  if (loadingMessage) {
    loadingMessage.style.display = "block";
  }
}

function hideLoadingState() {
  if (loadingMessage) {
    loadingMessage.style.display = "none";
  }
}

// Add these functions to your existing script.js file

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

    // Send the message to the persona
    await anamClient.talk(message);

    // Clear the input
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
      ? "Type a message for Cara to respond to..."
      : "Connect to start chatting...";
  }
}

function updateChatHistory(messages) {
  if (!chatHistory) return;
  // Clear existing content
  chatHistory.innerHTML = "";
  if (messages.length === 0) {
    chatHistory.innerHTML =
      "<p>Start a conversation to see your chat history</p>";
    return;
  }
  // Add each message to the chat history
  messages.forEach((message) => {
    const messageDiv = document.createElement("div");
    messageDiv.style.marginBottom = "10px";
    messageDiv.style.padding = "5px";
    messageDiv.style.borderRadius = "5px";
    if (message.role === "user") {
      messageDiv.style.backgroundColor = "#e3f2fd";
      messageDiv.innerHTML = `<strong>You:</strong> ${message.content}`;
    } else {
      messageDiv.style.backgroundColor = "#f1f8e9";
      messageDiv.innerHTML = `<strong>Cara:</strong> ${message.content}`;
    }
    chatHistory.appendChild(messageDiv);
  });
  // Scroll to bottom
  chatHistory.scrollTop = chatHistory.scrollHeight;
}

async function startChat() {
  try {
    startButton.disabled = true;
    showLoadingState();

    // Get session token from your server
    const response = await fetch("/api/session-token", {
      method: "POST",
    });
    const { sessionToken } = await response.json();

    // Create the Anam client
    anamClient = createClient(sessionToken);

    // Listen for SESSION_READY event to hide loading state
    anamClient.addListener(AnamEvent.SESSION_READY, () => {
      console.log("Session is ready!");
      hideLoadingState();
      startButton.disabled = true;
      stopButton.disabled = false;
      updateTalkControls(true); // Enable talk controls
    });

    // Listen for MESSAGE_HISTORY_UPDATED to update chat history
    anamClient.addListener(AnamEvent.MESSAGE_HISTORY_UPDATED, (messages) => {
      console.log("Conversation updated:", messages);
      updateChatHistory(messages);
    });

    // Add this event listener inside your startChat function after the MESSAGE_HISTORY_UPDATED listener
    // Listen for real-time transcription events
    anamClient.addListener(AnamEvent.MESSAGE_STREAM_EVENT_RECEIVED, (event) => {
      const liveTranscript = document.getElementById("live-transcript");
      const transcriptText = document.getElementById("transcript-text");

      console.log("event", event);

      if (event.role === "persona") {
        // Show persona speaking in real-time
        if (liveTranscript && transcriptText) {
          transcriptText.textContent =
            transcriptText.textContent + event.content;
        }
      } else if (event.role === "user") {
        // clear the persona live transcript when the user speaks
        if (liveTranscript && transcriptText) {
          transcriptText.textContent = "";
        }
      }
    });

    // Start streaming to the video element
    await anamClient.streamToVideoElement("persona-video");

    console.log("Chat started successfully!");
  } catch (error) {
    console.error("Failed to start chat:", error);
    startButton.disabled = false;
    hideLoadingState();
  }
}

function stopChat() {
  if (anamClient) {
    // Disconnect the client
    anamClient.stopStreaming();
    anamClient = null;

    // Clear video element and chat history
    videoElement.srcObject = null;
    updateChatHistory([]);

    // Update button states
    startButton.disabled = false;
    stopButton.disabled = true;

    console.log("Chat stopped.");
  }
}

// Add event listeners
startButton.addEventListener("click", startChat);
stopButton.addEventListener("click", stopChat);
document.addEventListener("DOMContentLoaded", () => {
  const sendButton = document.getElementById("send-message");
  const messageInput = document.getElementById("message-input");

  if (sendButton) {
    sendButton.addEventListener("click", sendTalkMessage);
  }

  if (messageInput) {
    // Send message with Enter key (Shift+Enter for new line)
    messageInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        sendTalkMessage();
      }
    });
  }
});
