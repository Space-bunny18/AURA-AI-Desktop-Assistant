/* =========================================================
   AURA WEBSITE TOOL
========================================================= */

const { shell } = require("electron");


function createWebsiteTool() {

  return {

    name: "website",

    enabled: true,

    capabilities: [
      "open website",
      "launch website",
      "web browsing",
    ],


    async execute(input = {}) {

      const {
        url,
      } = input;


      if (!url) {

        throw new Error(
          "Website URL was not specified."
        );

      }


      let finalUrl =
        url.trim();


      /*
      =======================================================
      ADD HTTPS IF NEEDED
      =======================================================
      */

      if (
        !finalUrl.startsWith("http://") &&
        !finalUrl.startsWith("https://")
      ) {

        finalUrl =
          `https://${finalUrl}`;

      }


      /*
      =======================================================
      OPEN WEBSITE
      =======================================================
      */

      await shell.openExternal(
        finalUrl
      );


      return `Opened ${finalUrl}.`;
    },
  };
}


module.exports =
  createWebsiteTool;