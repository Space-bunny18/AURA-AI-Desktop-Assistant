/* =========================================================
   AURA MULTI-ACTION PARSER
========================================================= */

class MultiActionParser {

  constructor() {

    /* =====================================================
       APPLICATION ALIASES
    ===================================================== */

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

      spotify: [
        "spotify",
      ],

      vscode: [
        "vs code",
        "visual studio code",
        "vscode",
        "code",
      ],
    };


    /* =====================================================
       WEBSITE ALIASES
    ===================================================== */

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


    /* =====================================================
       ACTION WORDS
    ===================================================== */

    this.openWords = [
      "open",
      "launch",
      "start",
      "run",
      "show",
      "bring up",
    ];


    this.closeWords = [
      "close",
      "exit",
      "quit",
      "stop",
      "shut",
      "terminate",
    ];
  }


  /* =========================================================
     PARSE
  ========================================================= */

  parse(message) {

    if (
      !message ||
      typeof message !== "string"
    ) {
      return [];
    }


    const text =
      this.cleanText(message);


    if (!text) {
      return [];
    }


    /*
      Split common multi-action connectors.

      Example:

      "open chrome and spotify"

      becomes:

      [
        "open chrome",
        "spotify"
      ]
    */

    const parts =
      text
        .split(
          /\s+(?:and then|then|and)\s+|,\s*/
        )
        .map(
          (part) =>
            part.trim()
        )
        .filter(Boolean);


    if (
      parts.length <= 1
    ) {

      return [];
    }


    const actions = [];


    let inheritedAction = null;


    for (
      const part of parts
    ) {

      const action =
        this.detectAction(part);


      /*
        If the current part has an explicit action,
        remember it for the next parts.

        Example:

        "open chrome and spotify"

        "open chrome" → open
        "spotify"     → inherit open
      */

      if (action) {

        inheritedAction =
          action;
      }


      const application =
        this.detectApplication(part);


      if (application) {

        actions.push({

          type:
            "application",

          action:
            action ||
            inheritedAction ||
            "open",

          application,

        });

        continue;
      }


      const website =
        this.detectWebsite(part);


      if (website) {

        actions.push({

          type:
            "website",

          action:
            "open",

          website,

        });

        continue;
      }
    }


    /*
      Only return a multi-action result when
      we actually found multiple actions.
    */

    if (
      actions.length < 2
    ) {

      return [];
    }


    return actions;
  }


  /* =========================================================
     CLEAN TEXT
  ========================================================= */

  cleanText(message) {

    return message
      .toLowerCase()
      .trim()
      .replace(
        /[?!;:]+/g,
        ""
      )
      .replace(
        /\s+/g,
        " "
      );
  }


  /* =========================================================
     DETECT ACTION
  ========================================================= */

  detectAction(text) {

    /*
      CLOSE HAS PRIORITY
    */

    for (
      const word of this.closeWords
    ) {

      if (
        this.containsWord(
          text,
          word
        )
      ) {

        return "close";
      }
    }


    /*
      OPEN
    */

    for (
      const word of this.openWords
    ) {

      if (
        this.containsWord(
          text,
          word
        )
      ) {

        return "open";
      }
    }


    return null;
  }


  /* =========================================================
     DETECT APPLICATION
  ========================================================= */

  detectApplication(text) {

    const applications =
      Object.entries(
        this.applicationAliases
      );


    /*
      Longest aliases first.
    */

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

        if (
          this.containsWord(
            text,
            alias
          )
        ) {

          return application;
        }
      }
    }


    return null;
  }


  /* =========================================================
     DETECT WEBSITE
  ========================================================= */

  detectWebsite(text) {

    const websites =
      Object.entries(
        this.websiteAliases
      );


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

        if (
          this.containsWord(
            text,
            alias
          )
        ) {

          return website;
        }
      }
    }


    return null;
  }


  /* =========================================================
     WORD MATCHING
  ========================================================= */

  containsWord(
    text,
    word
  ) {

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
}


module.exports =
  MultiActionParser;