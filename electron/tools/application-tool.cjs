/* =========================================================
   AURA APPLICATION TOOL
========================================================= */

function createApplicationTool({
  openApplication,
  closeApplication,
}) {
  return {
    name: "application",

    enabled: true,

    capabilities: [
      "open application",
      "close application",
      "launch application",
      "computer control",
    ],

    async execute(input = {}) {
      const {
        action,
        application,
      } = input;

      if (!action) {
        throw new Error(
          "Application action was not specified."
        );
      }

      if (!application) {
        throw new Error(
          "Application name was not specified."
        );
      }

      /* =====================================================
         OPEN
      ===================================================== */

      if (action === "open") {
        if (
          typeof openApplication !==
          "function"
        ) {
          throw new Error(
            "Application opening is not connected."
          );
        }

        return await openApplication(
          application
        );
      }

      /* =====================================================
         CLOSE
      ===================================================== */

      if (action === "close") {
        if (
          typeof closeApplication !==
          "function"
        ) {
          throw new Error(
            "Application closing is not connected."
          );
        }

        return await closeApplication(
          application
        );
      }

      throw new Error(
        `Unknown application action: ${action}`
      );
    },
  };
}

module.exports =
  createApplicationTool;