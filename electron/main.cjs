const {
  app,
  BrowserWindow,
  globalShortcut,
  ipcMain,
} = require("electron");

const path = require("path");
const { execFile } = require("child_process");
const fs = require("fs");
const dotenv = require("dotenv");

const AURACore =
  require("./core/aura-core.cjs");

const ToolManager =
  require("./core/tool-manager.cjs");

const createApplicationTool =
  require("./tools/application-tool.cjs");
const createWebsiteTool =
  require("./tools/website-tool.cjs");
const createFileSystemTool =
  require("./tools/file-system-tool.cjs");
  const createSystemTool =
  require("./tools/system-tool.cjs");

/* =========================================================
   ENVIRONMENT
========================================================= */

dotenv.config({
  path: path.join(__dirname, "..", ".env"),
});


/* =========================================================
   GLOBAL STATE
========================================================= */

let mainWindow = null;
let auraCore = null;
let toolManager = null;


/* =========================================================
   OPEN APPLICATION
========================================================= */

function openApplication(appName) {
  return new Promise((resolve, reject) => {

    const normalizedName =
      String(appName || "")
        .toLowerCase()
        .trim();


    const applications = {

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


    const possibleExecutables =
      applications[normalizedName];


    if (!possibleExecutables) {

      reject(
        new Error(
          "This application is not available yet."
        )
      );

      return;
    }


    let executable = null;


    for (
      const candidate
      of possibleExecutables
    ) {

      /*
        Full Windows path
      */

      if (
        candidate.endsWith(".exe") &&
        fs.existsSync(candidate)
      ) {

        executable = candidate;

        break;
      }


      /*
        Windows system executable
      */

      if (
        !candidate.includes("\\") &&
        !candidate.includes("/")
      ) {

        executable = candidate;

        break;
      }
    }


    if (!executable) {

      reject(
        new Error(
          `I couldn't find ${appName} installed on this computer.`
        )
      );

      return;
    }


    execFile(
      executable,
      (error) => {

        if (error) {

          reject(error);

          return;
        }


        resolve(
          `Opened ${appName}.`
        );
      }
    );
  });
}


/* =========================================================
   CLOSE APPLICATION
========================================================= */

function closeApplication(appName) {

  return new Promise(
    (resolve, reject) => {

      const normalizedName =
        String(appName || "")
          .toLowerCase()
          .trim();


      const processes = {

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
        processes[normalizedName];


      if (!processName) {

        reject(
          new Error(
            "This application cannot be closed yet."
          )
        );

        return;
      }


      execFile(
        "taskkill",
        [
          "/IM",
          processName,
          "/F",
        ],
        (error, stdout, stderr) => {

          if (error) {

            /*
              Explorer can sometimes return
              a non-zero exit code depending
              on the current Windows state.
            */

            reject(
              new Error(
                `I couldn't close ${appName}.`
              )
            );

            return;
          }


          console.log(
            `Closed ${appName}:`,
            stdout || stderr
          );


          resolve(
            `Closed ${appName}.`
          );
        }
      );
    }
  );
}


/* =========================================================
   CREATE AURA TOOLS
========================================================= */

function createAURATools() {

  toolManager =
    new ToolManager();


  /*
    Application Tool

    The tool receives the Electron functions
    that actually control Windows.
  */

  const applicationTool =
    createApplicationTool({
      openApplication,
      closeApplication,
    });


  toolManager.registerTool(
    applicationTool
  );

    /*
  =========================================================
     Website Tool
  =========================================================
  */

  const websiteTool =
  createWebsiteTool();

toolManager.registerTool(
  websiteTool
);


/* =========================================================
   File System Tool
========================================================= */

const fileSystemTool =
  createFileSystemTool();

toolManager.registerTool(
  fileSystemTool
);
toolManager.registerTool(
  createSystemTool()
);

console.log(
  "AURA TOOLS READY"
);

  console.log(
    "Available tools:",
    toolManager
      .getAvailableTools()
      .map(
        (tool) => tool.name
      )
      .join(", ")
  );


  return toolManager;
}


/* =========================================================
   CREATE AURA WINDOW
========================================================= */

function createWindow() {

  mainWindow =
    new BrowserWindow({

      width: 760,

      height: 460,

      minWidth: 760,

      minHeight: 460,

      frame: false,

      transparent: true,

      resizable: false,

      alwaysOnTop: true,

      backgroundColor:
        "#00000000",

      webPreferences: {

        preload:
          path.join(
            __dirname,
            "preload.cjs"
          ),

        contextIsolation: true,

        nodeIntegration: false,
      },
    });


  mainWindow.loadURL(
    "http://localhost:5173"
  );


  mainWindow.on(
    "closed",
    () => {

      mainWindow = null;

    }
  );
}


/* =========================================================
   TOGGLE AURA
========================================================= */

function toggleAURA() {

  if (!mainWindow) {
    return;
  }


  if (mainWindow.isVisible()) {

    mainWindow.hide();

  } else {

    mainWindow.show();

    mainWindow.focus();
  }
}


/* =========================================================
   AURA ASK
========================================================= */

ipcMain.handle(
  "aura:ask",
  async (_event, message) => {

    try {

      if (
        !message ||
        typeof message !== "string"
      ) {

        throw new Error(
          "Invalid AURA request."
        );
      }


      const trimmedMessage =
        message.trim();


      if (!trimmedMessage) {

        throw new Error(
          "AURA request cannot be empty."
        );
      }


      if (
        trimmedMessage.length > 10000
      ) {

        throw new Error(
          "Message is too long."
        );
      }


      if (!auraCore) {

        throw new Error(
          "AURA Core is not ready yet."
        );
      }


      const result =
        await auraCore.ask(
          trimmedMessage
        );


      return result;

    } catch (error) {

      console.error(
        "AURA request error:",
        error
      );


      throw new Error(
        error?.message ||
        "AURA could not process the request."
      );
    }
  }
);


/* =========================================================
   OPEN APPLICATION IPC
========================================================= */

ipcMain.handle(
  "aura:open-app",
  async (_event, appName) => {

    try {

      return await openApplication(
        appName
      );

    } catch (error) {

      console.error(
        "Application launch error:",
        error
      );


      throw new Error(
        error?.message ||
        "Unable to open the application."
      );
    }
  }
);


/* =========================================================
   CLOSE APPLICATION IPC
========================================================= */

ipcMain.handle(
  "aura:close-app",
  async (_event, appName) => {

    try {

      return await closeApplication(
        appName
      );

    } catch (error) {

      console.error(
        "Application close error:",
        error
      );


      throw new Error(
        error?.message ||
        "Unable to close the application."
      );
    }
  }
);


/* =========================================================
   LEGACY COMMAND IPC
========================================================= */

ipcMain.handle(
  "aura:command",
  async (_event, message) => {

    try {

      if (
        !message ||
        typeof message !== "string"
      ) {

        throw new Error(
          "Invalid command."
        );
      }


      const trimmedMessage =
        message.trim();


      if (!trimmedMessage) {

        throw new Error(
          "Command cannot be empty."
        );
      }


      if (!auraCore) {

        throw new Error(
          "AURA Core is not ready yet."
        );
      }


      const result =
        await auraCore.ask(
          trimmedMessage
        );


      return {

        handled:
          result?.type === "action",

        response:
          result?.text || "",

      };

    } catch (error) {

      console.error(
        "AURA command error:",
        error
      );


      throw new Error(
        error?.message ||
        "Unable to execute the command."
      );
    }
  }
);


/* =========================================================
   ELECTRON START
========================================================= */

app.whenReady().then(
  async () => {

    console.log("");

    console.log(
      "================================="
    );

    console.log(
      "          STARTING AURA"
    );

    console.log(
      "================================="
    );


    /* =====================================================
       CREATE TOOL SYSTEM
    ===================================================== */

    const tools =
      createAURATools();


    /* =====================================================
       CREATE AURA CORE
    ===================================================== */

    auraCore =
      new AURACore(
        tools
      );


    /* =====================================================
       INITIALIZE AURA
    ===================================================== */

    try {

      await auraCore.initialize();

    } catch (error) {

      console.error(
        "AURA Core initialization failed:",
        error
      );
    }


    /* =====================================================
       CREATE UI
    ===================================================== */

    createWindow();


    /* =====================================================
       GLOBAL WAKE SHORTCUT
    ===================================================== */

    const registered =
      globalShortcut.register(
        "CommandOrControl+Shift+Space",
        toggleAURA
      );


    if (!registered) {

      console.log(
        "Could not register AURA shortcut."
      );

    } else {

      console.log(
        "AURA shortcut registered."
      );
    }


    /* =====================================================
       MAC / LINUX WINDOW REACTIVATION
    ===================================================== */

    app.on(
      "activate",
      () => {

        if (
          BrowserWindow
            .getAllWindows()
            .length === 0
        ) {

          createWindow();

        }

      }
    );
  }
);


/* =========================================================
   CLEANUP
========================================================= */

app.on(
  "will-quit",
  () => {

    globalShortcut.unregisterAll();

  }
);


app.on(
  "window-all-closed",
  () => {

    if (
      process.platform !== "darwin"
    ) {

      app.quit();

    }
  }
);