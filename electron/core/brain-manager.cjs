class BrainManager {
  constructor() {
    this.brains = new Map();

    // Temporarily avoid brains that recently failed.
    this.cooldowns = new Map();

    // Default cooldown duration.
    this.cooldownDuration = 30 * 1000;
  }

  // =====================================================
  // REGISTER BRAIN
  // =====================================================

  registerBrain(brain) {
    if (
      !brain ||
      !brain.name ||
      typeof brain.ask !== "function"
    ) {
      throw new Error(
        "Invalid brain registration."
      );
    }

    const normalizedBrain = {
      ...brain,

      capabilities:
        Array.isArray(brain.capabilities)
          ? brain.capabilities
          : ["conversation"],

      enabled:
        brain.enabled !== false,
    };

    this.brains.set(
      normalizedBrain.name,
      normalizedBrain
    );

    console.log(
      `AURA BRAIN REGISTERED → ${normalizedBrain.name}`
    );
  }

  // =====================================================
  // GET BRAIN
  // =====================================================

  getBrain(name) {
    if (!name) {
      return null;
    }

    return (
      this.brains.get(name) || null
    );
  }

  // =====================================================
  // AVAILABLE BRAINS
  // =====================================================

  getAvailableBrains() {
    return Array.from(
      this.brains.values()
    ).filter(
      (brain) =>
        brain.enabled !== false &&
        !this.isOnCooldown(brain.name)
    );
  }

  // =====================================================
  // ALL REGISTERED BRAINS
  // =====================================================

  getAllBrains() {
    return Array.from(
      this.brains.values()
    );
  }

  // =====================================================
  // COOLDOWN
  // =====================================================

  isOnCooldown(name) {
    const cooldownUntil =
      this.cooldowns.get(name);

    if (!cooldownUntil) {
      return false;
    }

    if (Date.now() >= cooldownUntil) {
      this.cooldowns.delete(name);

      console.log(
        `AURA → ${name} cooldown expired.`
      );

      return false;
    }

    return true;
  }

  setCooldown(
    name,
    duration = this.cooldownDuration
  ) {
    this.cooldowns.set(
      name,
      Date.now() + duration
    );
  }

  clearCooldown(name) {
    this.cooldowns.delete(name);
  }

  // =====================================================
  // CAPABILITY MATCHING
  // =====================================================

  getCapabilityScore(
    brain,
    message
  ) {
    const text =
      message.toLowerCase();

    const capabilities =
      brain.capabilities || [];

    let score = 0;

    // -----------------------------------------
    // GENERAL CONVERSATION
    // -----------------------------------------

    if (
      capabilities.includes(
        "conversation"
      )
    ) {
      score += 1;
    }

    // -----------------------------------------
    // CODING
    // -----------------------------------------

    const codingKeywords = [
      "code",
      "coding",
      "program",
      "programming",
      "javascript",
      "typescript",
      "python",
      "java",
      "c++",
      "react",
      "node",
      "nodejs",
      "html",
      "css",
      "debug",
      "bug",
      "function",
      "component",
      "api",
      "database",
      "sql",
      "github",
      "npm",
      "electron",
    ];

    if (
      codingKeywords.some(
        (keyword) =>
          text.includes(keyword)
      ) &&
      capabilities.includes("coding")
    ) {
      score += 5;
    }

    // -----------------------------------------
    // REASONING
    // -----------------------------------------

    const reasoningKeywords = [
      "why",
      "explain",
      "analyze",
      "analyse",
      "compare",
      "reason",
      "solve",
      "problem",
      "difference",
      "should i",
      "which is better",
      "pros and cons",
      "advantages",
      "disadvantages",
      "step by step",
    ];

    if (
      reasoningKeywords.some(
        (keyword) =>
          text.includes(keyword)
      ) &&
      capabilities.includes("reasoning")
    ) {
      score += 4;
    }

    // -----------------------------------------
    // GENERAL KNOWLEDGE
    // -----------------------------------------

    if (
      capabilities.includes(
        "general knowledge"
      )
    ) {
      score += 2;
    }

    // -----------------------------------------
    // CREATIVE
    // -----------------------------------------

    const creativeKeywords = [
      "write",
      "story",
      "creative",
      "idea",
      "ideas",
      "design",
      "script",
      "poem",
      "lyrics",
      "brainstorm",
    ];

    if (
      creativeKeywords.some(
        (keyword) =>
          text.includes(keyword)
      ) &&
      capabilities.includes("creative")
    ) {
      score += 4;
    }

    // -----------------------------------------
    // FAST RESPONSE
    // -----------------------------------------

    if (
      capabilities.includes(
        "fast"
      )
    ) {
      score += 1;
    }

    return score;
  }

  // =====================================================
  // RANK BRAINS
  // =====================================================

  rankBrains(
    message,
    preferredBrain = null
  ) {
    const available =
      this.getAvailableBrains();

    const ranked =
      available.map((brain) => {
        let score =
          this.getCapabilityScore(
            brain,
            message
          );

        // Explicit preferred brain
        // receives very high priority.
        if (
          preferredBrain &&
          brain.name.toLowerCase() ===
            preferredBrain.toLowerCase()
        ) {
          score += 100;
        }

        return {
          brain,
          score,
        };
      });

    ranked.sort(
      (a, b) =>
        b.score - a.score
    );

    console.log(
      "AURA BRAIN SCORES →",
      ranked.map(
        (item) =>
          `${item.brain.name}:${item.score}`
      ).join(" | ")
    );

    return ranked.map(
      (item) => item.brain
    );
  }

  // =====================================================
  // TEMPORARY FAILURE DETECTION
  // =====================================================

  isTemporaryFailure(error) {
    const message =
      String(
        error?.message ||
        error ||
        ""
      ).toLowerCase();

    return (
      message.includes("429") ||
      message.includes("quota") ||
      message.includes("rate limit") ||
      message.includes("503") ||
      message.includes("502") ||
      message.includes("500") ||
      message.includes("unavailable") ||
      message.includes("overloaded") ||
      message.includes("temporarily") ||
      message.includes("timeout") ||
      message.includes("network") ||
      message.includes("fetch failed") ||
      message.includes("econnreset")
    );
  }

  // =====================================================
  // ASK AURA
  // =====================================================

  async ask(
    message,
    preferredBrain = null
  ) {
    if (
      !message ||
      typeof message !== "string"
    ) {
      throw new Error(
        "AURA received an invalid message."
      );
    }

    const trimmedMessage =
      message.trim();

    if (!trimmedMessage) {
      throw new Error(
        "AURA cannot process an empty message."
      );
    }

    // -----------------------------------------
    // GET AVAILABLE BRAINS
    // -----------------------------------------

    let available =
      this.getAvailableBrains();

    /*
      If every brain is on cooldown,
      clear cooldowns and give them
      another chance.
    */

    if (available.length === 0) {
      console.log(
        "AURA → All brains are on cooldown."
      );

      console.log(
        "AURA → Resetting cooldowns and retrying."
      );

      this.cooldowns.clear();

      available =
        this.getAvailableBrains();
    }

    if (available.length === 0) {
      throw new Error(
        "AURA has no available AI brains."
      );
    }

    // -----------------------------------------
    // RANK BRAINS
    // -----------------------------------------

    const rankedBrains =
      this.rankBrains(
        trimmedMessage,
        preferredBrain
      );

    console.log(
      "AURA BRAIN ORDER →",
      rankedBrains
        .map(
          (brain) => brain.name
        )
        .join(" → ")
    );

    // -----------------------------------------
    // TRY BRAINS
    // -----------------------------------------

    let lastError = null;

    for (
      const brain of rankedBrains
    ) {
      try {
        console.log(
          `AURA → Asking ${brain.name}`
        );

        const startTime =
          Date.now();

        const result =
          await brain.ask(
            trimmedMessage
          );

        const duration =
          Date.now() -
          startTime;

        // ---------------------------------------
        // VALID RESPONSE
        // ---------------------------------------

        if (
          typeof result === "string" &&
          result.trim()
        ) {
          this.clearCooldown(
            brain.name
          );

          console.log(
            `AURA ← ${brain.name} responded in ${duration}ms`
          );

          return {
            text:
              result.trim(),

            brain:
              brain.name,

            duration,
          };
        }

        // Empty response
        throw new Error(
          `${brain.name} returned an empty response.`
        );

      } catch (error) {
        lastError = error;

        console.error(
          `AURA → ${brain.name} failed:`,
          error?.message ||
            error
        );

        // ---------------------------------------
        // COOLDOWN FAILED BRAIN
        // ---------------------------------------

        if (
          this.isTemporaryFailure(
            error
          )
        ) {
          this.setCooldown(
            brain.name
          );

          console.log(
            `AURA → ${brain.name} temporarily disabled for ${this.cooldownDuration / 1000}s`
          );
        } else {
          /*
            Even permanent-looking failures
            get a short cooldown so AURA doesn't
            hammer a broken API repeatedly.
          */

          this.setCooldown(
            brain.name,
            10 * 1000
          );

          console.log(
            `AURA → ${brain.name} temporarily skipped for 10s`
          );
        }

        /*
          IMPORTANT:
          Continue to the next brain.
        */

        continue;
      }
    }

    // =================================================
    // EVERYTHING FAILED
    // =================================================

    console.error(
      "AURA → Every available brain failed."
    );

    throw new Error(
      lastError?.message ||
        "All available AURA brains failed."
    );
  }

  // =====================================================
  // BRAIN STATUS
  // =====================================================

  getBrainStatus() {
    return this.getAllBrains()
      .map((brain) => ({
        name:
          brain.name,

        enabled:
          brain.enabled !== false,

        available:
          brain.enabled !== false &&
          !this.isOnCooldown(
            brain.name
          ),

        coolingDown:
          this.isOnCooldown(
            brain.name
          ),

        capabilities:
          brain.capabilities || [],
      }));
  }
}

module.exports = BrainManager;