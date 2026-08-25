/* =========================================================
   AURA SYSTEM TOOL
========================================================= */

const { exec, spawn } = require("child_process");


function createSystemTool() {

  return {

    name: "system",

    enabled: true,

    capabilities: [
      "system control",
      "lock computer",
      "show desktop",
      "open task manager",
      "mute computer",
      "volume control",
    ],


    async execute(input = {}) {

      const {
        action,
      } = input;


      if (!action) {

        throw new Error(
          "System action was not specified."
        );

      }


      /* =====================================================
         LOCK COMPUTER
      ===================================================== */

      if (action === "lock") {

        await runCommand(
          "rundll32.exe user32.dll,LockWorkStation"
        );

        return "Locked the computer.";
      }


      /* =====================================================
         SHOW DESKTOP
      ===================================================== */

      if (action === "show-desktop") {

        await runCommand(
          'powershell -NoProfile -Command "(New-Object -ComObject Shell.Application).MinimizeAll()"'
        );

        return "Showing the desktop.";
      }


      /* =====================================================
         OPEN TASK MANAGER
      ===================================================== */

      if (action === "task-manager") {

        /*
          Task Manager is a GUI application.

          We launch it independently instead of using exec(),
          because exec() waits for the process and can report
          a false failure even though Task Manager opened.
        */

        spawn(
          "taskmgr.exe",
          [],
          {
            detached: true,
            stdio: "ignore",
            windowsHide: false,
          }
        ).unref();


        return "Opened Task Manager.";
      }


      /* =====================================================
         UNKNOWN ACTION
      ===================================================== */

      throw new Error(
        `Unknown system action: ${action}`
      );
    },
  };
}


/* =========================================================
   RUN WINDOWS COMMAND
========================================================= */

function runCommand(command) {

  return new Promise(
    (resolve, reject) => {

      exec(
        command,
        (error) => {

          if (error) {

            reject(error);

            return;
          }

          resolve();
        }
      );
    }
  );
}


module.exports =
  createSystemTool;