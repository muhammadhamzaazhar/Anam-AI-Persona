import { createClient } from "https://esm.sh/@anam-ai/js-sdk@latest";
import { AnamEvent } from "https://esm.sh/@anam-ai/js-sdk@latest/dist/module/types";

let anamClient = null;

// Get DOM elements
const startButton = document.getElementById("start-button");
const stopButton = document.getElementById("stop-button");
const videoElement = document.getElementById("persona-video");
const loadingMessage = document.getElementById("loading-message");

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

    // Clear video element
    videoElement.srcObject = null;

    // Update button states
    startButton.disabled = false;
    stopButton.disabled = true;

    console.log("Chat stopped.");
  }
}

// Add event listeners
startButton.addEventListener("click", startChat);
stopButton.addEventListener("click", stopChat);
