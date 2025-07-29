const express = require("express");
const app = express();

require("dotenv").config();

app.use(express.json());
app.use(express.static("public"));
port = 8000;

app.post("/api/session-token", async (req, res) => {
  try {
    const response = await fetch("https://api.anam.ai/v1/auth/session-token", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.ANAM_API_KEY}`,
      },
      body: JSON.stringify({
        personaConfig: {
          name: "Cara",
          avatarId: "30fa96d0-26c4-4e55-94a0-517025942e18",
          voiceId: "6bfbe25a-979d-40f3-a92b-5394170af54b",
          // brainType: "ANAM_GPT_4O_MINI_V1",
          systemPrompt: `
            You are a text-to-speech digital clone.
            Your only task is to repeat exactly what the user types, word-for-word.
            - Do not say anything yourself.
            - Do not add greetings, explanations, or extra words.
            - Do not translate or summarize.
            Your goal is to perfectly mirror the text input in spoken form.
            `,
          // personaBehavior: {
          //   autoStart: false, // <-- Important (turn off auto talking)
          //   idleResponses: false, // <-- Prevents "User has been silent" messages
          // },
        },
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();

      switch (response.status) {
        case 401:
          console.error("Invalid API key");
          return res.status(500).json({ error: "Authentication failed" });
        case 400:
          console.error("Invalid persona config:", errorData);
          return res.status(400).json({ error: "Invalid configuration" });
        default:
          console.error("Unexpected error:", errorData);
          return res.status(500).json({ error: "Service unavailable" });
      }
    }

    const data = await response.json();
    res.json({ sessionToken: data.sessionToken });
  } catch (error) {
    res.status(500).json({ error: "Failed to create session" });
  }
});

app.listen(port, () => {
  console.log("Server running on port: ", port);
});
