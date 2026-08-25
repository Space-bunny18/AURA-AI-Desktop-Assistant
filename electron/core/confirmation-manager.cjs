/* =========================================================
   AURA CONFIRMATION MANAGER
========================================================= */

class ConfirmationManager {

  constructor() {

    this.pendingConfirmation = null;

  }


  /* =======================================================
     ACTIONS THAT REQUIRE CONFIRMATION
  ======================================================= */

  requiresConfirmation(action = {}) {

    if (!action || typeof action !== "object") {

      return false;

    }


    const type =
      action.type ||
      "";


    const actionName =
      action.action ||
      "";


    /* =====================================================
       HIGH-IMPACT ACTIONS
    ===================================================== */

    if (
      type === "system" &&
      (
        actionName === "lock" ||
        actionName === "shutdown" ||
        actionName === "restart"
      )
    ) {

      return true;

    }


    /* =====================================================
       DESTRUCTIVE FILE ACTIONS
    ===================================================== */

    if (
      type === "file-system" &&
      (
        actionName === "delete" ||
        actionName === "remove"
      )
    ) {

      return true;

    }


    return false;

  }


  /* =======================================================
     CREATE CONFIRMATION
  ======================================================= */

  createConfirmation(action = {}) {

    this.pendingConfirmation =
      action;


    return {

      required:
        true,

      action,

      message:
        this.buildMessage(action),

    };

  }


  /* =======================================================
     BUILD CONFIRMATION MESSAGE
  ======================================================= */

  buildMessage(action = {}) {

    const type =
      action.type ||
      "";


    const actionName =
      action.action ||
      "";


    if (
      type === "system" &&
      actionName === "lock"
    ) {

      return "Lock the computer?";

    }


    if (
      type === "system" &&
      actionName === "shutdown"
    ) {

      return "Shut down the computer?";

    }


    if (
      type === "system" &&
      actionName === "restart"
    ) {

      return "Restart the computer?";

    }


    if (
      type === "file-system" &&
      (
        actionName === "delete" ||
        actionName === "remove"
      )
    ) {

      return "Delete this file or folder?";

    }


    return "Do you want me to continue?";

  }


  /* =======================================================
     CHECK USER CONFIRMATION
  ======================================================= */

  isConfirmation(message) {

    if (
      !message ||
      typeof message !== "string"
    ) {

      return false;

    }


    const text =
      message
        .trim()
        .toLowerCase();


    return (
      text === "yes" ||
      text === "yeah" ||
      text === "yep" ||
      text === "sure" ||
      text === "okay" ||
      text === "ok" ||
      text === "do it" ||
      text === "go ahead" ||
      text === "confirm"
    );

  }


  /* =======================================================
     CHECK USER REJECTION
  ======================================================= */

  isRejection(message) {

    if (
      !message ||
      typeof message !== "string"
    ) {

      return false;

    }


    const text =
      message
        .trim()
        .toLowerCase();


    return (
      text === "no" ||
      text === "nope" ||
      text === "don't" ||
      text === "do not" ||
      text === "cancel" ||
      text === "stop" ||
      text === "never mind" ||
      text === "nevermind"
    );

  }


  /* =======================================================
     GET PENDING ACTION
  ======================================================= */

  getPending() {

    return (
      this.pendingConfirmation
    );

  }


  /* =======================================================
     CLEAR PENDING ACTION
  ======================================================= */

  clear() {

    this.pendingConfirmation =
      null;

  }


  /* =======================================================
     CONFIRM
  ======================================================= */

  confirm() {

    const action =
      this.pendingConfirmation;


    this.clear();


    return action;

  }


  /* =======================================================
     REJECT
  ======================================================= */

  reject() {

    this.clear();

  }

}


module.exports =
  ConfirmationManager;