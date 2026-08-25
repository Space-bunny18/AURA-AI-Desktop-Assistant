/* =========================================================
   AURA FOLLOW-UP PARSER
========================================================= */

class FollowUpParser {

  constructor(conversationContext) {

    this.conversationContext =
      conversationContext;

  }


  /* =======================================================
     PARSE FOLLOW-UP
  ======================================================= */

  parse(message) {

    if (
      !message ||
      typeof message !== "string"
    ) {

      return null;

    }


    const text =
      message
        .trim()
        .toLowerCase();


    if (!text) {

      return null;

    }


    /* =====================================================
       REPLACEMENT / CORRECTION
    ===================================================== */

    const replacementPatterns = [

      /^actually\s+(.+)$/i,

      /^instead\s+(.+)$/i,

      /^no[, ]+(.+)$/i,

      /^rather\s+(.+)$/i,

    ];


    for (
      const pattern of replacementPatterns
    ) {

      const match =
        text.match(pattern);


      if (match) {

        return {

          type:
            "replacement",

          request:
            match[1].trim(),

        };

      }

    }


    /* =====================================================
       ADDITIONAL ACTION
    ===================================================== */

    const additionPatterns = [

      /^also\s+(.+)$/i,

      /^and\s+(.+)$/i,

      /^then\s+(.+)$/i,

      /^now\s+(.+)$/i,

    ];


    for (
      const pattern of additionPatterns
    ) {

      const match =
        text.match(pattern);


      if (match) {

        return {

          type:
            "additional",

          request:
            match[1].trim(),

        };

      }

    }


    /* =====================================================
       CANCEL / STOP
    ===================================================== */

    if (
      text === "cancel" ||
      text === "never mind" ||
      text === "nevermind" ||
      text === "stop"
    ) {

      return {

        type:
          "cancel",

      };

    }


    return null;

  }

}


module.exports =
  FollowUpParser;