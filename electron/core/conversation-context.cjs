/* =========================================================
   AURA CONVERSATION CONTEXT
========================================================= */

class ConversationContext {

  constructor() {

    this.lastAction = null;

    this.lastApplication = null;

    this.lastWebsite = null;

    this.lastFolder = null;

  }


  /* =======================================================
     STORE ACTION
  ======================================================= */

  remember(action = {}) {

    if (!action || typeof action !== "object") {
      return;
    }


    if (action.type === "application") {

      if (action.application) {

        this.lastApplication =
          action.application;

      }

      this.lastAction = {
        type:
          "application",

        action:
          action.action ||
          "open",

        application:
          action.application,
      };

      return;
    }


    if (action.type === "website") {

      if (action.website) {

        this.lastWebsite =
          action.website;

      }

      this.lastAction = {
        type:
          "website",

        action:
          action.action ||
          "open",

        website:
          action.website,
      };

      return;
    }


    if (action.type === "file-system") {

      if (action.folder) {

        this.lastFolder =
          action.folder;

      }

      this.lastAction = {
        type:
          "file-system",

        action:
          action.action ||
          "open",

        folder:
          action.folder,
      };

      return;
    }


    if (action.type === "system") {

      this.lastAction = {
        type:
          "system",

        action:
          action.action,
      };

    }

  }


  /* =======================================================
     GET LAST ACTION
  ======================================================= */

  getLastAction() {

    return this.lastAction;

  }


  /* =======================================================
     RESOLVE "IT"
  ======================================================= */

  resolveReference(reference) {

    if (
      !reference ||
      typeof reference !== "string"
    ) {

      return null;

    }


    const text =
      reference
        .toLowerCase()
        .trim();


    if (
      text === "it" ||
      text === "that" ||
      text === "this" ||
      text === "the app" ||
      text === "the application" ||
      text === "the website"
    ) {

      return this.lastAction;

    }


    return null;

  }


  /* =======================================================
     CLEAR CONTEXT
  ======================================================= */

  clear() {

    this.lastAction =
      null;

    this.lastApplication =
      null;

    this.lastWebsite =
      null;

    this.lastFolder =
      null;

  }

}


module.exports =
  ConversationContext;