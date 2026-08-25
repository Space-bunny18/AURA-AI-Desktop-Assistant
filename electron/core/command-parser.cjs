class CommandParser {

  constructor() {

    this.applicationAliases = {

      chrome: [
        "chrome",
        "google chrome",
        "browser",
      ],

      notepad: [
        "notepad",
        "text editor",
      ],

      calculator: [
        "calculator",
        "calc",
      ],

      explorer: [
        "file explorer",
        "explorer",
        "files",
        "file manager",
      ],

    };


    // =====================================================
    // WEBSITE ALIASES
    // =====================================================

    this.websiteAliases = {

      youtube: [
        "youtube",
        "you tube",
      ],

      google: [
        "google",
      ],

      github: [
        "github",
        "git hub",
      ],

      chatgpt: [
        "chatgpt",
        "chat gpt",
      ],

      spotify: [
        "spotify",
      ],

      gmail: [
        "gmail",
        "google mail",
      ],

      instagram: [
        "instagram",
        "insta",
      ],

      facebook: [
        "facebook",
      ],

      whatsapp: [
        "whatsapp",
        "whatsapp web",
      ],

    };


    // =====================================================
    // OPEN COMMANDS
    // =====================================================

    this.openWords = [
      "open",
      "launch",
      "start",
      "run",
      "show",
      "bring up",
      "bring",
      "get",
      "load",
    ];


    // =====================================================
    // CLOSE COMMANDS
    // =====================================================

    this.closeWords = [
      "close",
      "exit",
      "quit",
      "stop",
      "shut",
      "terminate",
      "end",
    ];

  }


  // =====================================================
  // MAIN PARSER
  // =====================================================

  parse(message) {

    if (
      !message ||
      typeof message !== "string"
    ) {
      return null;
    }


    const text =
      this.cleanText(message);


    if (!text) {
      return null;
    }


    console.log(
      `COMMAND PARSER → "${text}"`
    );


    // ===================================================
    // DETECT ACTION FIRST
    // ===================================================

    const action =
      this.detectAction(text);


    if (!action) {
      return null;
    }


    // ===================================================
    // DETECT APPLICATION
    // ===================================================

    const application =
      this.detectApplication(text);


    if (application) {

      const command = {

        type:
          "application",

        action,

        application,

      };


      console.log(
        `COMMAND PARSER → ${action.toUpperCase()} ${application}`
      );


      return command;
    }


    // ===================================================
    // DETECT WEBSITE
    // ===================================================

    const website =
      this.detectWebsite(text);


    if (website) {

      const command = {

        type:
          "website",

        action,

        website,

      };


      console.log(
        `COMMAND PARSER → ${action.toUpperCase()} ${website}`
      );


      return command;
    }


    return null;
  }


  // =====================================================
  // CLEAN USER MESSAGE
  // =====================================================

  cleanText(message) {

    return message
      .toLowerCase()
      .trim()
      .replace(
        /[?!.,;:]+/g,
        ""
      )
      .replace(
        /\s+/g,
        " "
      );

  }


  // =====================================================
  // ACTION DETECTION
  // =====================================================

  detectAction(text) {

    // ---------------------------------------------------
    // CLOSE HAS PRIORITY
    // ---------------------------------------------------

    const hasCloseAction =
      this.containsCommandWord(
        text,
        this.closeWords
      );


    if (hasCloseAction) {
      return "close";
    }


    // ---------------------------------------------------
    // OPEN
    // ---------------------------------------------------

    const hasOpenAction =
      this.containsCommandWord(
        text,
        this.openWords
      );


    if (hasOpenAction) {
      return "open";
    }


    return null;
  }


  // =====================================================
  // COMMAND WORD MATCHING
  // =====================================================

  containsCommandWord(
    text,
    words
  ) {

    return words.some(
      (word) => {

        const escaped =
          word.replace(
            /[.*+?^${}()|[\]\\]/g,
            "\\$&"
          );


        const pattern =
          new RegExp(
            `\\b${escaped}\\b`,
            "i"
          );


        return pattern.test(
          text
        );

      }
    );

  }


  // =====================================================
  // APPLICATION DETECTION
  // =====================================================

  detectApplication(text) {

    // ---------------------------------------------------
    // Check longer aliases first
    // ---------------------------------------------------

    const applications =
      Object.entries(
        this.applicationAliases
      );


    applications.sort(
      (
        [, aliasesA],
        [, aliasesB]
      ) => {

        const longestA =
          Math.max(
            ...aliasesA.map(
              (alias) =>
                alias.length
            )
          );


        const longestB =
          Math.max(
            ...aliasesB.map(
              (alias) =>
                alias.length
            )
          );


        return (
          longestB -
          longestA
        );

      }
    );


    // ---------------------------------------------------
    // Search aliases
    // ---------------------------------------------------

    for (
      const [
        application,
        aliases,
      ]
      of applications
    ) {

      for (
        const alias
        of aliases
      ) {

        const escaped =
          alias.replace(
            /[.*+?^${}()|[\]\\]/g,
            "\\$&"
          );


        const pattern =
          new RegExp(
            `\\b${escaped}\\b`,
            "i"
          );


        if (
          pattern.test(text)
        ) {

          return application;

        }

      }

    }


    return null;
  }


  // =====================================================
  // WEBSITE DETECTION
  // =====================================================

  detectWebsite(text) {

    const websites =
      Object.entries(
        this.websiteAliases
      );


    // ---------------------------------------------------
    // Check longer aliases first
    // ---------------------------------------------------

    websites.sort(
      (
        [, aliasesA],
        [, aliasesB]
      ) => {

        const longestA =
          Math.max(
            ...aliasesA.map(
              (alias) =>
                alias.length
            )
          );


        const longestB =
          Math.max(
            ...aliasesB.map(
              (alias) =>
                alias.length
            )
          );


        return (
          longestB -
          longestA
        );

      }
    );


    // ---------------------------------------------------
    // Search website aliases
    // ---------------------------------------------------

    for (
      const [
        website,
        aliases,
      ]
      of websites
    ) {

      for (
        const alias
        of aliases
      ) {

        const escaped =
          alias.replace(
            /[.*+?^${}()|[\]\\]/g,
            "\\$&"
          );


        const pattern =
          new RegExp(
            `\\b${escaped}\\b`,
            "i"
          );


        if (
          pattern.test(text)
        ) {

          return website;

        }

      }

    }


    return null;
  }


  // =====================================================
  // GET SUPPORTED APPLICATIONS
  // =====================================================

  getSupportedApplications() {

    return Object.keys(
      this.applicationAliases
    );

  }


  // =====================================================
  // GET APPLICATION ALIASES
  // =====================================================

  getApplicationAliases(
    application
  ) {

    if (!application) {
      return [];
    }


    return (
      this.applicationAliases[
        application
      ] || []
    );

  }

}


module.exports =
  CommandParser;