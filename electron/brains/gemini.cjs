/* =========================================================
   AURA GEMINI BRAIN
========================================================= */

async function createGeminiBrain() {

  /* =======================================================
     CHECK API KEY
  ======================================================= */

  if (!process.env.GEMINI_API_KEY) {

    console.error(
      "AURA → GEMINI_API_KEY is missing."
    );

    return {
      name: "Gemini",

      enabled: false,

      capabilities: [
        "general",
        "multimodal",
        "vision",
      ],

      ask: async () => {

        throw new Error(
          "GEMINI_API_KEY is missing."
        );

      },
    };
  }


  /* =======================================================
     LOAD GOOGLE GENAI
  ======================================================= */

  let GoogleGenAI;

  try {

    const googleGenAI =
      await import("@google/genai");

    GoogleGenAI =
      googleGenAI.GoogleGenAI;

  } catch (error) {

    console.error(
      "AURA → Failed to load @google/genai:",
      error?.message || error
    );

    return {
      name: "Gemini",

      enabled: false,

      capabilities: [
        "general",
        "multimodal",
        "vision",
      ],

      ask: async () => {

        throw new Error(
          "Google GenAI SDK could not be loaded."
        );

      },
    };
  }


  /* =======================================================
     CREATE GEMINI CLIENT
  ======================================================= */

  const client =
    new GoogleGenAI({
      apiKey:
        process.env.GEMINI_API_KEY,
    });


  /* =======================================================
     GEMINI BRAIN
  ======================================================= */

  return {

    name: "Gemini",

    enabled: true,

    capabilities: [
      "conversation",
      "general",
      "general knowledge",
      "reasoning",
      "multimodal",
      "vision",
    ],


    /* =====================================================
       ASK GEMINI
    ===================================================== */

    async ask(message) {

      if (
        !message ||
        typeof message !== "string"
      ) {

        throw new Error(
          "Gemini received an invalid message."
        );

      }


      const trimmedMessage =
        message.trim();


      if (!trimmedMessage) {

        throw new Error(
          "Gemini cannot process an empty message."
        );

      }


      console.log(
        "AURA → Gemini brain"
      );


      /* ===================================================
         CURRENT STABLE GEMINI MODEL
         
         Google currently lists:
         
         gemini-2.5-flash-lite
         
         as a stable Gemini API model.
      =================================================== */

      const response =
        await client.models.generateContent({

          model:
            "gemini-3.5-flash-lite",

          contents: `
You are AURA, a personal Windows desktop AI assistant.

Your identity is AURA.

Gemini is only the AI engine powering AURA.

Personality:
- Intelligent
- Calm
- Helpful
- Concise
- Natural
- Slightly futuristic

Rules:
- Never introduce yourself as Gemini.
- Never claim that you opened, closed, modified,
  deleted, or controlled something on the computer
  unless an actual AURA tool performed that action.
- Keep normal answers concise.
- Answer naturally.
- If the user is simply greeting you or thanking you,
  respond naturally and briefly.

User request:

${trimmedMessage}
          `,
        });


      /* ===================================================
         EXTRACT RESPONSE
      =================================================== */

      const text =
        response?.text;


      if (
        typeof text !== "string" ||
        !text.trim()
      ) {

        throw new Error(
          "Gemini returned an empty response."
        );

      }


      console.log(
        "AURA ← Gemini responded"
      );


      return text.trim();
    },
  };
}


module.exports = {
  createGeminiBrain,
};