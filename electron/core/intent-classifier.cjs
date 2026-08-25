class IntentClassifier {

  constructor() {

    this.actionWords = [
      "open",
      "launch",
      "start",
      "run",
      "show",
      "bring",
      "get",
      "load",
      "use",
      "go to",
      "take me to",
    ];

    this.questionWords = [
      "what",
      "why",
      "how",
      "when",
      "where",
      "who",
      "which",
      "can you tell me",
      "explain",
      "tell me about",
    ];
  }


  classify(message) {

    if (
      !message ||
      typeof message !== "string"
    ) {
      return {
        type: "conversation",
        confidence: 1,
      };
    }


    const text =
      message
        .toLowerCase()
        .trim();


    if (!text) {
      return {
        type: "conversation",
        confidence: 1,
      };
    }


    /* =====================================================
       QUESTION DETECTION
    ===================================================== */

    const isQuestion =
      this.questionWords.some(
        (word) =>
          text.startsWith(word) ||
          text.includes(` ${word} `)
      );


    /* =====================================================
       ACTION DETECTION
    ===================================================== */

    const hasAction =
      this.actionWords.some(
        (word) =>
          text.startsWith(word) ||
          text.includes(` ${word} `)
      );


    /* =====================================================
       QUESTION HAS PRIORITY
    ===================================================== */

    if (
      isQuestion &&
      !hasAction
    ) {

      return {
        type: "conversation",
        confidence: 0.9,
      };
    }


    /* =====================================================
       ACTION
    ===================================================== */

    if (hasAction) {

      return {
        type: "action",
        confidence: 0.8,
      };
    }


    /* =====================================================
       DEFAULT
    ===================================================== */

    return {
      type: "conversation",
      confidence: 0.7,
    };
  }
}


module.exports =
  IntentClassifier;