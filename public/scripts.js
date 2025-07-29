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
    });

    // Listen for MESSAGE_HISTORY_UPDATED to update chat history
    anamClient.addListener(AnamEvent.MESSAGE_HISTORY_UPDATED, (messages) => {
      console.log("Conversation updated:", messages);
      updateChatHistory(messages);
    });

    // Start streaming to the video element
    await anamClient.streamToVideoElement("persona-video");

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
