/* =========================================================
   AURA FILE SYSTEM TOOL
========================================================= */

const {
  shell,
  app,
} = require("electron");

const path =
  require("path");

const os =
  require("os");

const fs =
  require("fs/promises");


function createFileSystemTool() {

  return {

    name:
      "file-system",

    enabled:
      true,

    capabilities: [

      "open folder",

      "open directory",

      "create folder",

      "file system",

      "folder access",

    ],


    async execute(input = {}) {

      const {
        action,
        folder,
        name,
      } = input;


      if (!action) {

        throw new Error(
          "File system action was not specified."
        );

      }


      /* =====================================================
         CREATE FOLDER
      ===================================================== */

      if (action === "create") {

        if (
          !name ||
          typeof name !== "string"
        ) {

          throw new Error(
            "Folder name was not specified."
          );

        }


        const folderName =
          name.trim();


        if (!folderName) {

          throw new Error(
            "Folder name cannot be empty."
          );

        }


        /*
          AURA creates new folders on the
          user's Desktop by default.
        */

        let desktopPath;


        try {

          /*
            Electron provides the actual
            Windows Desktop location.

            This is safer than assuming:

            C:\\Users\\User\\Desktop
          */

          if (
            app &&
            typeof app.getPath === "function"
          ) {

            desktopPath =
              app.getPath("desktop");

          }

        } catch (error) {

          console.log(
            "Electron desktop path unavailable."
          );

        }


        /*
          Fallback for environments where
          Electron app.getPath() is unavailable.
        */

        if (!desktopPath) {

          desktopPath =
            path.join(
              os.homedir(),
              "Desktop"
            );

        }


        const targetPath =
          path.join(
            desktopPath,
            folderName
          );


        console.log(
          `FILE SYSTEM → CREATE FOLDER: ${targetPath}`
        );


        /*
          recursive:true makes this safe even
          if the parent directory doesn't exist.
        */

        await fs.mkdir(
          targetPath,
          {
            recursive: true,
          }
        );


        return `Created folder "${folderName}" on your Desktop.`;

      }

      /* =====================================================
   CREATE FILE
===================================================== */

if (action === "create-file") {

  if (
    !name ||
    typeof name !== "string"
  ) {

    throw new Error(
      "File name was not specified."
    );

  }


  const fileName =
    name.trim();


  if (!fileName) {

    throw new Error(
      "File name cannot be empty."
    );

  }


  /*
    Files are created on the Desktop
    by default.
  */

  let desktopPath;


  try {

    if (
      app &&
      typeof app.getPath === "function"
    ) {

      desktopPath =
        app.getPath("desktop");

    }

  } catch (error) {

    desktopPath = null;

  }


  /*
    Fallback if Electron's desktop path
    is unavailable.
  */

  if (!desktopPath) {

    desktopPath =
      path.join(
        os.homedir(),
        "Desktop"
      );

  }


  const targetPath =
    path.join(
      desktopPath,
      fileName
    );


  console.log(
    `FILE SYSTEM → CREATE FILE: ${targetPath}`
  );


  /*
    Create an empty file.

    flag: "wx" means:
    - create the file if it doesn't exist
    - fail instead of overwriting an existing file
  */

  await fs.writeFile(
    targetPath,
    "",
    {
      flag: "wx",
    }
  );


  return `Created file "${fileName}" on your Desktop.`;

}

      /* =====================================================
         OPEN FOLDER
      ===================================================== */

      if (action === "open") {

        if (!folder) {

          throw new Error(
            "Folder was not specified."
          );

        }


        let targetPath;


        const normalizedFolder =
          folder
            .toLowerCase()
            .trim();


        /* ===================================================
           WINDOWS SPECIAL FOLDERS
        =================================================== */

        if (
          normalizedFolder ===
          "desktop"
        ) {

          try {

            if (
              app &&
              typeof app.getPath === "function"
            ) {

              targetPath =
                app.getPath("desktop");

            }

          } catch (error) {

            targetPath = null;

          }


          if (!targetPath) {

            targetPath =
              path.join(
                os.homedir(),
                "Desktop"
              );

          }

        }


        else if (
          normalizedFolder ===
            "downloads" ||
          normalizedFolder ===
            "download"
        ) {

          try {

            if (
              app &&
              typeof app.getPath === "function"
            ) {

              targetPath =
                app.getPath("downloads");

            }

          } catch (error) {

            targetPath = null;

          }


          if (!targetPath) {

            targetPath =
              path.join(
                os.homedir(),
                "Downloads"
              );

          }

        }


        else if (
          normalizedFolder ===
            "documents" ||
          normalizedFolder ===
            "document"
        ) {

          try {

            if (
              app &&
              typeof app.getPath === "function"
            ) {

              targetPath =
                app.getPath("documents");

            }

          } catch (error) {

            targetPath = null;

          }


          if (!targetPath) {

            targetPath =
              path.join(
                os.homedir(),
                "Documents"
              );

          }

        }


        else if (
          normalizedFolder ===
            "pictures" ||
          normalizedFolder ===
            "picture"
        ) {

          targetPath =
            path.join(
              os.homedir(),
              "Pictures"
            );

        }


        else if (
          normalizedFolder ===
            "videos" ||
          normalizedFolder ===
            "video"
        ) {

          targetPath =
            path.join(
              os.homedir(),
              "Videos"
            );

        }


        else if (
          normalizedFolder ===
          "music"
        ) {

          targetPath =
            path.join(
              os.homedir(),
              "Music"
            );

        }


        else {

          /*
            Allow an actual folder path.
          */

          targetPath =
            folder.trim();

        }


        /* ===================================================
           OPEN FOLDER
        =================================================== */

        console.log(
          `FILE SYSTEM → OPEN: ${targetPath}`
        );


        const error =
          await shell.openPath(
            targetPath
          );


        if (error) {

          throw new Error(
            `Unable to open folder: ${error}`
          );

        }


        return `Opened ${folder}.`;

      }


      /* =====================================================
         UNKNOWN ACTION
      ===================================================== */

      throw new Error(
        `Unknown file system action: ${action}`
      );

    },

  };

}


module.exports =
  createFileSystemTool;