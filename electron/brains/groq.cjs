async function createGroqBrain() {
  if (!process.env.GROQ_API_KEY) {
    return {
      name: "Groq",
      enabled: false,
      ask: async () => {
        throw new Error(
          "GROQ_API_KEY is missing."
        );
      },
    };
  }

  const OpenAI = require("openai");

  const client = new OpenAI({
    apiKey: process.env.GROQ_API_KEY,
    baseURL:
      "https://api.groq.com/openai/v1",
  });

  return {
    name: "Groq",
    enabled: true,

    capabilities: [
      "fast",
      "general",
      "coding",
    ],

    async ask(message) {
      console.log(
        "AURA → Groq brain"
      );

      const response =
        await client.chat.completions.create({
          model: "openai/gpt-oss-120b",

          messages: [
            {
              role: "system",
              content: `
You are AURA, a personal Windows desktop AI assistant.

Your identity is AURA.

Groq is only the AI engine powering AURA.

Personality:
- Fast
- Intelligent
- Calm
- Helpful
- Concise
- Slightly futuristic

Rules:
- Never introduce yourself as Groq.
- Never pretend a computer action happened unless a tool performed it.
- Keep answers concise unless detail is requested.
              `,
            },

            {
              role: "user",
              content: message,
            },
          ],
        });

      return (
        response.choices?.[0]?.message
          ?.content || ""
      );
    },
  };
}

module.exports = {
  createGroqBrain,
};