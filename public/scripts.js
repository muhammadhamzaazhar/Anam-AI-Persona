import { createClient } from "https://esm.sh/@anam-ai/js-sdk@latest";

let anamClient = null;

// Get DOM elements
const startButton = document.getElementById("start-button");
const stopButton = document.getElementById("stop-button");
const videoElement = document.getElementById("persona-video");

async function startChat() {
  try {
    startButton.disabled = true;

    // Get session token from your server
    const response = await fetch("/api/session-token", {
      method: "POST",
    });
    const { sessionToken } = await response.json();

    // Create the Anam client
    anamClient = createClient(sessionToken);

    // Start streaming to the video element
    await anamClient.streamToVideoElement("persona-video");

    // Update button states
    startButton.disabled = true;
    stopButton.disabled = false;

    console.log("Chat started successfully!");
  } catch (error) {
    console.error("Failed to start chat:", error);
    startButton.disabled = false;
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
