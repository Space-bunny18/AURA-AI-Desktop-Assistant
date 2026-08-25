const BrainManager =
  require("./brain-manager.cjs");

const BrainRouter =
  require("./brain-router.cjs");

const AURAOrchestrator =
  require("./orchestrator.cjs");

const {
  createOpenAIBrain,
} = require("../brains/openai.cjs");

const {
  createGeminiBrain,
} = require("../brains/gemini.cjs");

const {
  createGroqBrain,
} = require("../brains/groq.cjs");


class AURACore {

  constructor(toolManager = null) {

    /* =========================================================
       BRAIN SYSTEM
    ========================================================= */

    this.brainManager =
      new BrainManager();

    this.brainRouter =
      new BrainRouter();


    /* =========================================================
       TOOL SYSTEM
    ========================================================= */

    this.toolManager =
      toolManager;


    /* =========================================================
       SESSION MEMORY
    ========================================================= */

    this.memory = [];

    this.maxMemoryItems = 12;


    /* =========================================================
       ORCHESTRATOR
    ========================================================= */

    this.orchestrator =
        new AURAOrchestrator({

            brainManager:
            this.brainManager,

            brainRouter:
            this.brainRouter,

            memory: this,

            toolManager:
            this.toolManager,

            tools: {},
        });


    this.initialized = false;
  }


  /* =========================================================
     INITIALIZE AURA
  ========================================================= */

  async initialize() {

    if (this.initialized) {
      return;
    }


    console.log(
      "================================="
    );

    console.log(
      "       INITIALIZING AURA CORE"
    );

    console.log(
      "================================="
    );


    /* =======================================================
       REGISTER AI BRAINS
    ======================================================= */

    const openAI =
      await createOpenAIBrain();

    const gemini =
      await createGeminiBrain();

    const groq =
      await createGroqBrain();


    this.brainManager.registerBrain(
      openAI
    );

    this.brainManager.registerBrain(
      gemini
    );

    this.brainManager.registerBrain(
      groq
    );


    /* =======================================================
       AURA READY
    ======================================================= */

    this.initialized = true;


    console.log(
      "AURA CORE READY"
    );


    console.log(
      "Available brains:",
      this.brainManager
        .getAvailableBrains()
        .map(
          (brain) => brain.name
        )
        .join(", ")
    );


    /* =======================================================
       TOOL STATUS
    ======================================================= */

    if (
      this.toolManager &&
      typeof this.toolManager
        .getAvailableTools ===
        "function"
    ) {

      console.log(
        "Available tools:",
        this.toolManager
          .getAvailableTools()
          .map(
            (tool) => tool.name
          )
          .join(", ")
      );

    } else {

      console.log(
        "AURA TOOLS → No ToolManager connected."
      );
    }


    /* =======================================================
       MEMORY
    ======================================================= */

    console.log(
      "AURA MEMORY → READY"
    );

    console.log(
      `AURA MEMORY → Capacity: ${this.maxMemoryItems} messages`
    );
  }


  /* =========================================================
     HANDLE USER REQUEST
  ========================================================= */

  async ask(message) {

    if (!this.initialized) {
      await this.initialize();
    }


    if (
      !message ||
      typeof message !== "string"
    ) {

      throw new Error(
        "Invalid AURA request."
      );
    }


    const trimmedMessage =
      message.trim();


    if (!trimmedMessage) {

      throw new Error(
        "AURA request cannot be empty."
      );
    }


    /* =======================================================
       SAVE USER MESSAGE
    ======================================================= */

    this.addMemory(
      "user",
      trimmedMessage
    );


    /* =======================================================
       GET RECENT MEMORY
    ======================================================= */

    const recentMemory =
      this.getRecentMemory(8);


    console.log(
      "AURA MEMORY → Context:",
      recentMemory.length,
      "messages"
    );


    /* =======================================================
       SEND REQUEST TO ORCHESTRATOR
    ======================================================= */

    const result =
      await this.orchestrator.handle(
        trimmedMessage,
        recentMemory
      );


    /* =======================================================
       SAVE AURA RESPONSE
    ======================================================= */

    if (
      result &&
      typeof result.text === "string" &&
      result.text.trim()
    ) {

      this.addMemory(
        "assistant",
        result.text.trim()
      );
    }


    return result;
  }


  /* =========================================================
     ADD MEMORY
  ========================================================= */

  addMemory(
    role,
    content
  ) {

    if (
      !role ||
      !content
    ) {
      return;
    }


    this.memory.push({

      role,

      content,

      timestamp:
        Date.now(),

    });


    /* =======================================================
       KEEP MEMORY WITHIN LIMIT
    ======================================================= */

    if (
      this.memory.length >
      this.maxMemoryItems
    ) {

      this.memory =
        this.memory.slice(
          -this.maxMemoryItems
        );
    }
  }


  /* =========================================================
     GET ALL MEMORY
  ========================================================= */

  getMemory() {

    return this.memory.map(
      (item) => ({

        role:
          item.role,

        content:
          item.content,

        timestamp:
          item.timestamp,

      })
    );
  }


  /* =========================================================
     GET RECENT MEMORY
  ========================================================= */

  getRecentMemory(
    limit = 6
  ) {

    const safeLimit =
      Math.max(
        1,
        Math.min(
          limit,
          this.maxMemoryItems
        )
      );


    return this.memory
      .slice(-safeLimit)
      .map(
        (item) => ({

          role:
            item.role,

          content:
            item.content,

        })
      );
  }


  /* =========================================================
     CLEAR MEMORY
  ========================================================= */

  clearMemory() {

    this.memory = [];


    console.log(
      "AURA MEMORY → CLEARED"
    );
  }


  /* =========================================================
     MEMORY STATUS
  ========================================================= */

  getMemoryStatus() {

    return {

      enabled:
        true,

      items:
        this.memory.length,

      capacity:
        this.maxMemoryItems,

    };
  }


  /* =========================================================
     BRAIN INFORMATION
  ========================================================= */

  getBrains() {

    return this.brainManager
      .getAvailableBrains()
      .map(
        (brain) => ({

          name:
            brain.name,

          capabilities:
            brain.capabilities || [],

        })
      );
  }


  /* =========================================================
     TOOL INFORMATION
  ========================================================= */

  getTools() {

    if (
      !this.toolManager ||
      typeof this.toolManager
        .getStatus !==
        "function"
    ) {

      return [];
    }


    return this.toolManager.getStatus();
  }
}


module.exports =
  AURACore;