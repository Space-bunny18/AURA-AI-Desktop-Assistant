class BrainRouter {
  constructor() {
    /*
    =========================================================
    AURA BRAIN ROUTER
    ---------------------------------------------------------
    Decides which AI brain is best suited for a request.

    Current brains:
    - OpenAI → coding / technical / creation
    - Gemini → explanation / knowledge / reasoning
    - Groq   → quick / simple / conversational requests
    =========================================================
    */

    this.rules = [
      /* =====================================================
         OPENAI
         ===================================================== */

      {
        brain: "OpenAI",

        keywords: [
          // Programming
          "code",
          "coding",
          "program",
          "programming",
          "javascript",
          "typescript",
          "python",
          "java",
          "c++",
          "c#",
          "react",
          "react native",
          "node",
          "nodejs",
          "express",
          "nextjs",
          "html",
          "css",
          "tailwind",
          "api",
          "backend",
          "frontend",
          "full stack",

          // Development
          "debug",
          "debugging",
          "bug",
          "error",
          "fix this",
          "fix my code",
          "function",
          "component",
          "class",
          "database",
          "mongodb",
          "sql",
          "github",
          "git",
          "npm",
          "package",
          "terminal",

          // Software engineering
          "algorithm",
          "developer",
          "software",
          "architecture",
          "framework",
          "library",
          "deployment",
          "deploy",
          "server",
          "website",
          "web app",
          "application",

          // Creation
          "build",
          "create",
          "make an app",
          "make a website",
          "create a website",
          "write code",
          "write a program",
          "develop",
          "implement",
        ],

        /*
        Strong phrases receive more weight.
        */

        strongKeywords: [
          "write code",
          "fix my code",
          "debug this",
          "build an app",
          "build a website",
          "create a website",
          "create an application",
          "write a function",
          "write a program",
          "react component",
          "javascript code",
          "python code",
          "api integration",
        ],
      },


      /* =====================================================
         GEMINI
         ===================================================== */

      {
        brain: "Gemini",

        keywords: [
          // Explanation
          "explain",
          "explain this",
          "what is",
          "what are",
          "who is",
          "why",
          "how does",
          "how do",
          "how can",
          "tell me about",

          // Research
          "research",
          "information",
          "details",
          "facts",
          "history",
          "science",
          "technology",
          "space",
          "physics",
          "chemistry",
          "biology",

          // Mathematics
          "mathematics",
          "math",
          "calculate",
          "equation",
          "formula",
          "probability",
          "statistics",

          // Reasoning
          "analyze",
          "analysis",
          "compare",
          "comparison",
          "difference",
          "advantages",
          "disadvantages",
          "pros and cons",
          "reason",
          "reasoning",
          "solve",
          "solution",

          // Learning
          "learn",
          "teach me",
          "study",
          "lesson",
          "concept",
          "understand",
          "summarize",
          "summary",
          "explain simply",

          // General knowledge
          "meaning",
          "definition",
          "example",
          "examples",
          "theory",
          "knowledge",
        ],

        strongKeywords: [
          "explain this",
          "explain to me",
          "what is",
          "how does",
          "how does this work",
          "why does",
          "compare these",
          "what is the difference",
          "teach me",
          "analyze this",
          "explain simply",
          "give me a detailed explanation",
        ],
      },


      /* =====================================================
         GROQ
         ===================================================== */

      {
        brain: "Groq",

        keywords: [
          // Speed
          "quick",
          "quickly",
          "fast",
          "rapid",
          "immediately",
          "instant",

          // Short responses
          "short",
          "brief",
          "simple",
          "one line",
          "few words",
          "tldr",
          "tl;dr",

          // Casual conversation
          "hello",
          "hi",
          "hey",
          "good morning",
          "good afternoon",
          "good evening",
          "thanks",
          "thank you",
          "thx",
          "bye",
          "goodbye",

          // Simple commands/questions
          "yes or no",
          "just tell me",
          "just answer",
          "quick answer",
        ],

        strongKeywords: [
          "quick answer",
          "quickly tell me",
          "just tell me",
          "one line",
          "in one sentence",
          "keep it short",
          "keep it brief",
          "yes or no",
        ],
      },
    ];
  }


  /* =========================================================
     CALCULATE SCORE
  ========================================================= */

  calculateScore(rule, text) {
    let score = 0;

    /*
    -----------------------------------------
    Normal keywords
    -----------------------------------------
    */

    for (const keyword of rule.keywords) {
      if (text.includes(keyword)) {
        score += 1;
      }
    }


    /*
    -----------------------------------------
    Strong keywords
    -----------------------------------------
    */

    for (const keyword of rule.strongKeywords || []) {
      if (text.includes(keyword)) {
        score += 4;
      }
    }


    return score;
  }


  /* =========================================================
     ROUTE
  ========================================================= */

  route(message) {
    if (
      !message ||
      typeof message !== "string"
    ) {
      return null;
    }


    const text =
      message.toLowerCase().trim();


    if (!text) {
      return null;
    }


    let bestBrain = null;
    let bestScore = 0;


    /*
    -----------------------------------------
    Score every brain
    -----------------------------------------
    */

    for (const rule of this.rules) {
      const score =
        this.calculateScore(
          rule,
          text
        );


      console.log(
        `AURA ROUTER → ${rule.brain}: ${score}`
      );


      if (score > bestScore) {
        bestScore = score;
        bestBrain = rule.brain;
      }
    }


    /*
    -----------------------------------------
    No strong match
    -----------------------------------------
    */

    if (!bestBrain) {
      console.log(
        "AURA ROUTER → No preferred brain."
      );

      return null;
    }


    console.log(
      `AURA ROUTER → Selected ${bestBrain} (${bestScore})`
    );


    return bestBrain;
  }


  /* =========================================================
     GET ALL ROUTING RULES
  ========================================================= */

  getRules() {
    return this.rules.map(
      (rule) => ({
        brain: rule.brain,

        keywords: [
          ...rule.keywords,
        ],
      })
    );
  }
}


module.exports = BrainRouter;