const {
  execFile,
  exec,
} = require("child_process");

const path = require("path");
const fs = require("fs");


class WindowsTool {

  constructor() {

    this.name =
      "Windows";

    this.enabled =
      true;

    this.capabilities = [

      "open_application",

      "close_application",

      "system_information",

    ];


    this.applications = {

      chrome: [

        path.join(
          process.env.PROGRAMFILES || "",
          "Google",
          "Chrome",
          "Application",
          "chrome.exe"
        ),

        path.join(
          process.env["PROGRAMFILES(X86)"] || "",
          "Google",
          "Chrome",
          "Application",
          "chrome.exe"
        ),

        path.join(
          process.env.LOCALAPPDATA || "",
          "Google",
          "Chrome",
          "Application",
          "chrome.exe"
        ),

      ],


      notepad: [
        "notepad.exe",
      ],


      calculator: [
        "calc.exe",
      ],


      explorer: [
        "explorer.exe",
      ],
    };
  }


  /* =========================================================
     TOOL EXECUTOR
  ========================================================= */

  async execute(input = {}) {

    const action =
      String(
        input.action || ""
      )
        .toLowerCase()
        .trim();


    const target =
      String(
        input.target || ""
      )
        .toLowerCase()
        .trim();


    if (!action) {

      throw new Error(
        "Windows tool action is missing."
      );
    }


    switch (action) {

      case "open_application":

        return await this.openApplication(
          target
        );


      case "close_application":

        return await this.closeApplication(
          target
        );


      case "system_information":

        return await this.getSystemInfo();


      default:

        throw new Error(
          `Windows tool does not support "${action}".`
        );
    }
  }


  /* =========================================================
     OPEN APPLICATION
  ========================================================= */

  async openApplication(
    appName
  ) {

    const normalizedName =
      String(appName || "")
        .toLowerCase()
        .trim();


    const possibleExecutables =
      this.applications[
        normalizedName
      ];


    if (!possibleExecutables) {

      throw new Error(
        `I don't know how to open ${appName} yet.`
      );
    }


    let executable = null;


    for (
      const candidate
      of possibleExecutables
    ) {

      if (
        candidate.endsWith(".exe") &&
        fs.existsSync(candidate)
      ) {

        executable =
          candidate;

        break;
      }


      if (
        !candidate.includes("\\") &&
        !candidate.includes("/")
      ) {

        executable =
          candidate;

        break;
      }
    }


    if (!executable) {

      throw new Error(
        `I couldn't find ${appName} installed on this computer.`
      );
    }


    return new Promise(
      (resolve, reject) => {

        execFile(
          executable,
          (error) => {

            if (error) {

              reject(
                new Error(
                  `Unable to open ${appName}.`
                )
              );

              return;
            }


            resolve(
              `Opened ${appName}.`
            );
          }
        );
      }
    );
  }


  /* =========================================================
     CLOSE APPLICATION
  ========================================================= */

  async closeApplication(
    appName
  ) {

    const normalizedName =
      String(appName || "")
        .toLowerCase()
        .trim();


    const processNames = {

      chrome:
        "chrome.exe",

      notepad:
        "notepad.exe",

      calculator:
        "CalculatorApp.exe",

      explorer:
        "explorer.exe",

    };


    const processName =
      processNames[
        normalizedName
      ];


    if (!processName) {

      throw new Error(
        `I don't know how to close ${appName} yet.`
      );
    }


    return new Promise(
      (resolve, reject) => {

        exec(
          `taskkill /IM "${processName}" /F`,
          (error, stdout, stderr) => {

            if (error) {

              const output =
                `${stdout || ""} ${stderr || ""}`
                  .toLowerCase();


              if (
                output.includes(
                  "not found"
                ) ||
                output.includes(
                  "no running instance"
                )
              ) {

                resolve(
                  `${appName} is not currently running.`
                );

                return;
              }


              reject(
                new Error(
                  `Unable to close ${appName}.`
                )
              );

              return;
            }


            resolve(
              `Closed ${appName}.`
            );
          }
        );
      }
    );
  }


  /* =========================================================
     SYSTEM INFORMATION
  ========================================================= */

  async getSystemInfo() {

    return {

      platform:
        process.platform,

      architecture:
        process.arch,

      nodeVersion:
        process.version,

      homeDirectory:
        process.env.USERPROFILE ||
        process.env.HOME ||
        null,

      computerName:
        process.env.COMPUTERNAME ||
        null,

    };
  }
}


function createWindowsTool() {

  return new WindowsTool();
}


module.exports = {
  WindowsTool,
  createWindowsTool,
};