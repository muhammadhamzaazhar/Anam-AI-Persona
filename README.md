# Real-Time Emotive Personas for Human-Like Interactions

A demo application that integrates Anam AI’s real-time digital personas to create engaging, human-like conversational experiences. The showcased persona acts as a digital clone: whatever you type or say through your microphone is echoed back word-for-word in natural speech and synchronized facial animation, demonstrating Anam’s sub-second latency and photorealistic expression technology.

## 🚀 Features

- Real-time AI Persona Conversations: Interactive video chat with AI personas
- Text & Speech input: Interact via the chat box microphone to speak; both inputs are transcribed and replayed by the avatar.
- Chat History: Track conversation flow between user and AI

## 🛠️ Installation

1. Clone the repository:

   ```bash
   git clone <repository-url>
   cd Anam-AI-Persona
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Set up environment variables:
   Create a `.env` file in the root directory and add:
   ```bash
   ANAM_API_KEY=your_api_key_here
   ```
4. Run the application:
   Create a `.env` file in the root directory and add:
   ```bash
   node server.js
   ```

## 🧠 Enable Autonomous Conversation with a Custom LLM

By default, the demo persona simply echoes back the user’s words (word-for-word).  
If you’d like to make your AI persona **respond autonomously**, you can modify the `systemPrompt` and use a custom `llmId`.

Below is an example of a `personaConfig` that acts as a conversational agent.

> **Note:** `personaConfig` is defined in `server.js`.

You can also customize the avatar and voice:

- **Avatar Gallery:** [View Available Avatars](https://docs.anam.ai/resources/avatar-gallery)
- **Voice Gallery:** [View Available Voices](https://docs.anam.ai/resources/voice-gallery)

---

### Example: Conversational Persona Configuration

```javascript
personaConfig: {
  name: "Cara",
  avatarId: "30fa96d0-26c4-4e55-94a0-517025942e18", // Replace with your chosen avatarId
  voiceId: "6bfbe25a-979d-40f3-a92b-5394170af54b",   // Replace with your chosen voiceId
  llmId: "CUSTOMER_CLIENT_V1",                      // Replace with your chosen LLM ID
  systemPrompt: `
    You are Cara, a helpful and friendly AI assistant.
    - Respond to user input naturally and conversationally.
    - Keep responses concise unless more detail is requested.
    - Maintain a warm, human-like tone.
  `,
}
```
