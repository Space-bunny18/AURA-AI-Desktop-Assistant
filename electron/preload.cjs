const {
  contextBridge,
  ipcRenderer,
} = require("electron");


/* =========================================================
   AURA PRELOAD BRIDGE
========================================================= */

contextBridge.exposeInMainWorld(
  "aura",
  {

    /* =======================================================
       MAIN AURA REQUEST
       
       Returns only the response text to the frontend.
       
       AURA Core still decides:
       - OpenAI
       - Gemini
       - Groq
       - computer actions
       - memory
       - tools
    ======================================================= */

    ask: async (message) => {

      const result =
        await ipcRenderer.invoke(
          "aura:ask",
          message
        );

      if (
        result &&
        typeof result === "object" &&
        typeof result.text === "string"
      ) {
        return result.text;
      }

      return String(
        result ?? ""
      );
    },


    /* =======================================================
       LEGACY GEMINI REQUEST
       
       Your existing App.jsx may still call:

       window.aura.askGemini(...)

       We keep this function so the frontend
       doesn't break.

       IMPORTANT:
       It now uses AURA Core instead of directly
       calling Gemini.
    ======================================================= */

    askGemini: async (message) => {

      const result =
        await ipcRenderer.invoke(
          "aura:ask",
          message
        );

      if (
        result &&
        typeof result === "object" &&
        typeof result.text === "string"
      ) {
        return result.text;
      }

      return String(
        result ?? ""
      );
    },


    /* =======================================================
       OPEN APPLICATION
    ======================================================= */

    openApplication: (appName) =>
      ipcRenderer.invoke(
        "aura:open-app",
        appName
      ),


    /* =======================================================
       LEGACY COMMAND
       
       Existing App.jsx can continue using:

       window.aura.command(...)
    ======================================================= */

    command: async (message) => {

      const result =
        await ipcRenderer.invoke(
          "aura:command",
          message
        );

      return result;
    },


    /* =======================================================
       AURA WAKE
    ======================================================= */

    onWake: (callback) => {

      const listener = (
        _event,
        ...args
      ) => {
        callback(...args);
      };


      ipcRenderer.on(
        "aura:wake",
        listener
      );


      return () => {

        ipcRenderer.removeListener(
          "aura:wake",
          listener
        );

      };
    },

  }
);