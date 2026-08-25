const OpenAI = require("openai");

async function createOpenAIBrain() {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY is missing.");
  }

  const client = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });

  return {
    name: "OpenAI",

    capabilities: [
      "conversation",
      "reasoning",
      "coding",
      "general knowledge",
    ],

    async ask(message) {
      const response = await client.responses.create({
        model: "gpt-4o-mini",
        input: [
          {
            role: "system",
            content:
              "You are the OpenAI brain powering AURA, a personal Windows desktop AI assistant. Answer naturally, accurately, and concisely. AURA is the assistant's identity; never introduce yourself as OpenAI unless specifically asked.",
          },
          {
            role: "user",
            content: message,
          },
        ],
      });

      return response.output_text;
    },
  };
}

module.exports = {
  createOpenAIBrain,
};