const IntentClassifier =
  require("./intent-classifier.cjs");

const AIIntentParser =
  require("./ai-intent-parser.cjs");

const MultiActionParser =
  require("./multi-action-parser.cjs");

const ConversationContext =
  require("./conversation-context.cjs");

const FollowUpParser =
  require("./follow-up-parser.cjs");
const ConfirmationManager =
  require("./confirmation-manager.cjs");

class AURAOrchestrator {
  constructor({
    brainManager,
    brainRouter,
    memory = null,
    toolManager = null,
    tools = {},
  }) {

    this.brainManager =
      brainManager;

    this.brainRouter =
      brainRouter;

    this.memory =
      memory;

    // New ToolManager architecture
    this.toolManager =
      toolManager;

    // Kept for compatibility with older code
    this.tools =
      tools;
    this.intentClassifier =
      new IntentClassifier();
    this.aiIntentParser =
        new AIIntentParser(
            this.brainManager
        );
    this.multiActionParser =
      new MultiActionParser();
    this.conversationContext =
      new ConversationContext();
    this.followUpParser =
      new FollowUpParser();
    this.confirmationManager =
      new ConfirmationManager();
    }


  // =========================================================
  // HANDLE USER REQUEST
  // =========================================================

  async handle(message) {

    if (
      !message ||
      typeof message !== "string"
    ) {

      throw new Error(
        "Invalid AURA request."
      );
    }


    const text =
      message.trim();

    /* =========================================================
   CHECK PENDING CONFIRMATION
========================================================= */

if (
  this.confirmationManager &&
  this.confirmationManager.getPending()
) {

  /* =======================================================
     USER CONFIRMED
  ======================================================= */

  if (
    this.confirmationManager
      .isConfirmation(text)
  ) {

    const pendingAction =
      this.confirmationManager.confirm();

    console.log(
      "AURA CONFIRMATION → APPROVED"
    );

    return await this.executeAction(
      pendingAction
    );
  }


  /* =======================================================
     USER REJECTED
  ======================================================= */

  if (
    this.confirmationManager
      .isRejection(text)
  ) {

    this.confirmationManager.reject();

    console.log(
      "AURA CONFIRMATION → CANCELLED"
    );

    return {
      type:
        "conversation",

      text:
        "Okay, cancelled.",

      cancelled:
        true,
    };
  }


  /* =======================================================
     SOMETHING ELSE WAS SAID
  ======================================================= */

  return {
    type:
      "conversation",

    text:
      "Please confirm or cancel the pending action.",

    awaitingConfirmation:
      true,
  };
}

    /* =========================================================
       NATURAL FOLLOW-UP COMMANDS
       This is the only new routing layer.
    ========================================================= */

    if (this.followUpParser) {

      const followUp =
        this.followUpParser.parse(
          text
        );

      if (followUp) {

        console.log(
          `FOLLOW-UP → ${followUp.type}`
        );

        if (
          followUp.type ===
          "cancel"
        ) {

          return {
            type:
              "conversation",

            text:
              "Okay, cancelled.",

            cancelled:
              true,
          };
        }

        if (
          followUp.type ===
          "replacement" ||
          followUp.type ===
          "additional"
        ) {

          let followUpRequest =
            followUp.request;

          /*
            "Actually open Spotify instead"
            becomes:
            "open Spotify"
          */

          followUpRequest =
            followUpRequest
              .replace(
                /\s+instead\s*$/i,
                ""
              )
              .trim();

          console.log(
            `FOLLOW-UP → ${followUpRequest}`
          );

          return await this.handle(
            followUpRequest
          );
        }
      }
    }


    /* =========================================================
       CONVERSATION CONTEXT REFERENCES
       Resolve follow-ups such as:
       "close it", "open it", "close that"
    ========================================================= */

    if (this.conversationContext) {

      const referenceMatch =
        text.match(
          /^(?:please\s+)?(open|close|launch|start|quit|exit|shut)(?:\s+the)?\s+(it|that|this|app|application|website)$/i
        );

      if (referenceMatch) {

        const requestedAction =
          referenceMatch[1].toLowerCase();

        const reference =
          referenceMatch[2].toLowerCase();

        const previous =
          this.conversationContext.resolveReference(
            reference
          );

        if (previous) {

          const normalizedAction =
            (
              requestedAction === "quit" ||
              requestedAction === "exit" ||
              requestedAction === "shut"
            )
              ? "close"
              : requestedAction;

          if (
            previous.type === "application" &&
            previous.application &&
            this.toolManager
          ) {
            
            const result =
              await this.toolManager.execute(
                "application",
                {
                  action:
                    normalizedAction,
                  application:
                    previous.application,
                }
              );

            return {
              type: "action",
              text:
                typeof result === "string"
                  ? result
                  : "Done.",
              action:
                normalizedAction,
              target:
                previous.application,
              tool:
                "application",
            };
          }

          if (
            previous.type === "website" &&
            previous.website &&
            (
              normalizedAction === "open" ||
              normalizedAction === "launch" ||
              normalizedAction === "start"
            )
          ) {

            const website =
              this.detectWebsite(
                `open ${previous.website}`
              );

            if (
              website &&
              this.toolManager
            ) {

              const result =
                await this.toolManager.execute(
                  "website",
                  {
                    url:
                      website.url,
                  }
                );

              return {
                type: "website",
                text:
                  typeof result === "string"
                    ? result
                    : "Done.",
                website:
                  previous.website,
                url:
                  website.url,
                tool:
                  "website",
              };
            }
          }
        }
      }
    }


/* =========================================================
   FAST MULTI-ACTION ROUTER
========================================================= */

if (
  this.multiActionParser &&
  this.toolManager
) {

  const multiActions =
    this.multiActionParser.parse(
      text
    );


  if (
    Array.isArray(multiActions) &&
    multiActions.length >= 2
  ) {

    console.log(
      `ORCHESTRATOR → MULTI-ACTION: ${multiActions.length} actions`
    );


    const results = [];


    for (
      const multiAction
      of multiActions
    ) {

      try {

        /* =================================================
           APPLICATION
        ================================================= */

        if (
          multiAction.type ===
          "application"
        ) {

          console.log(
            `MULTI-ACTION → APPLICATION: ${multiAction.action} → ${multiAction.application}`
          );


          const result =
            await this.toolManager.execute(
              "application",
              {
                action:
                  multiAction.action,

                application:
                  multiAction.application,
              }
            );


          results.push({

            type:
              "application",

            target:
              multiAction.application,

            action:
              multiAction.action,

            result:
              typeof result === "string"
                ? result
                : "Done.",

          });


          continue;
        }


        /* =================================================
           WEBSITE
        ================================================= */

        if (
          multiAction.type ===
          "website"
        ) {

          console.log(
            `MULTI-ACTION → WEBSITE: ${multiAction.website}`
          );


          /*
            Reuse AURA's existing website detection
            so the URL stays centralized in orchestrator.
          */

          const website =
            this.detectWebsite(
              `open ${multiAction.website}`
            );


          if (!website) {

            throw new Error(
              `Unknown website: ${multiAction.website}`
            );

          }


          const result =
            await this.toolManager.execute(
              "website",
              {
                url:
                  website.url,
              }
            );


          results.push({

            type:
              "website",

            target:
              multiAction.website,

            action:
              "open",

            result:
              typeof result === "string"
                ? result
                : "Done.",

          });


          continue;
        }

      } catch (error) {

        console.error(
          "MULTI-ACTION FAILED →",
          error?.message || error
        );


        results.push({

          type:
            multiAction.type,

          target:
            multiAction.application ||
            multiAction.website ||
            "unknown",

          action:
            multiAction.action,

          error:
            error?.message ||
            "Action failed.",

        });

      }
    }


    /* =====================================================
       BUILD NATURAL RESPONSE
    ===================================================== */

    const successful =
      results.filter(
        (item) =>
          !item.error
      );


    const failed =
      results.filter(
        (item) =>
          item.error
      );


    if (
      failed.length === 0
    ) {

      return {

        type:
          "multi-action",

        text:
          successful.length === 2
            ? "Done. Both actions are complete."
            : `Done. I completed all ${successful.length} actions.`,

        actions:
          results,

      };
    }


    if (
      successful.length > 0
    ) {

      return {

        type:
          "multi-action",

        text:
          `I completed ${successful.length} action${
            successful.length === 1
              ? ""
              : "s"
          }, but ${failed.length} failed.`,

        actions:
          results,

      };
    }


    return {

      type:
        "multi-action",

      text:
        "I couldn't complete those actions.",

      actions:
        results,

    };
  }
}


/* =========================================================
   EXISTING AURA FLOW
========================================================= */

const intent =
  this.intentClassifier.classify(
    text
  );
/*
=========================================================
FAST LOCAL COMMAND ROUTER
=========================================================

Known commands are handled locally before the AI
intent classifier.

This makes AURA much faster for simple commands such as:

- open chrome
- close chrome
- open youtube
- show my desktop
- open task manager
- lock my laptop

Normal conversation continues to the AI below.
=========================================================
*/


/* =======================================================
   FAST SYSTEM ACTION
======================================================= */

const fastSystemAction =
  this.detectSystemAction(text);

if (
  fastSystemAction &&
  this.toolManager
) {

  console.log(
    `FAST ROUTER → SYSTEM: ${fastSystemAction}`
  );


  // =====================================================
  // ACTIONS THAT REQUIRE CONFIRMATION
  // =====================================================

  const confirmationRequiredActions = [
    "lock",
  ];


  if (
    confirmationRequiredActions.includes(
      fastSystemAction
    )
  ) {

    console.log(
      `CONFIRMATION REQUIRED → SYSTEM: ${fastSystemAction}`
    );


    // Store the action so that the next
    // "yes" / "confirm" can execute it.

    if (
      this.confirmationManager
    ) {

      this.confirmationManager.setPending({

        type:
          "system",

        action:
          fastSystemAction,

      });


      return {

        type:
          "conversation",

        text:
          `Are you sure you want to ${fastSystemAction === "lock"
            ? "lock your computer"
            : fastSystemAction
          }?`,

        awaitingConfirmation:
          true,

        action:
          fastSystemAction,

      };
    }
  }


  // =====================================================
  // NORMAL SYSTEM ACTION
  // =====================================================

  try {

    const result =
      await this.toolManager.execute(
        "system",
        {
          action:
            fastSystemAction,
        }
      );


    console.log(
      `FAST SYSTEM COMPLETE → ${result}`
    );


    return {

      type:
        "system",

      text:
        typeof result === "string"
          ? result
          : "Done.",

      action:
        fastSystemAction,

      tool:
        "system",

    };

  } catch (error) {

    console.error(
      `FAST SYSTEM FAILED → ${fastSystemAction}`,
      error?.message || error
    );


    throw new Error(
      error?.message ||
        "Unable to perform system action."
    );
  }
}


/* =======================================================
   FAST APPLICATION ACTION
======================================================= */

const fastApplicationAction =
  this.detectAction(text);

if (
  fastApplicationAction &&
  this.toolManager
) {

  console.log(
    `FAST ROUTER → APPLICATION: ${fastApplicationAction.action} → ${fastApplicationAction.application}`
  );

  try {

    const result =
      await this.toolManager.execute(
        "application",
        {
          action:
            fastApplicationAction.action,

          application:
            fastApplicationAction.application,
        }
      );

    console.log(
      `FAST APPLICATION COMPLETE → ${result}`
    );

    /* =====================================================
       REMEMBER FAST APPLICATION ACTION
    ===================================================== */

    if (this.conversationContext) {

      this.conversationContext.remember({
        type:
          "application",

        action:
          fastApplicationAction.action,

        application:
          fastApplicationAction.application,
      });

      console.log(
        `CONTEXT → remembered application: ${fastApplicationAction.application}`
      );
    }

    return {
      type:
        "action",

      text:
        typeof result === "string"
          ? result
          : "Done.",

      action:
        fastApplicationAction.action,

      target:
        fastApplicationAction.application,

      tool:
        "application",
    };

  } catch (error) {

    console.error(
      `FAST APPLICATION FAILED → ${fastApplicationAction.action} ${fastApplicationAction.application}`,
      error?.message || error
    );

    throw new Error(
      error?.message ||
        "Unable to perform application action."
    );
  }
}


/* =======================================================
   FAST WEBSITE ACTION
======================================================= */

const fastWebsiteAction =
  this.detectWebsite(text);

if (
  fastWebsiteAction &&
  this.toolManager
) {

  console.log(
    `FAST ROUTER → WEBSITE: ${fastWebsiteAction.website}`
  );

  try {

    const result =
      await this.toolManager.execute(
        "website",
        {
          url:
            fastWebsiteAction.url,
        }
      );

    console.log(
      `FAST WEBSITE COMPLETE → ${result}`
    );

    /* =====================================================
       REMEMBER FAST WEBSITE ACTION
    ===================================================== */

    if (this.conversationContext) {

      this.conversationContext.remember({
        type:
          "website",

        action:
          "open",

        website:
          fastWebsiteAction.website,
      });

      console.log(
        `CONTEXT → remembered website: ${fastWebsiteAction.website}`
      );
    }

    return {
      type:
        "website",

      text:
        typeof result === "string"
          ? result
          : "Done.",

      website:
        fastWebsiteAction.website,

      url:
        fastWebsiteAction.url,

      tool:
        "website",
    };

  } catch (error) {

    console.error(
      `FAST WEBSITE FAILED → ${fastWebsiteAction.website}`,
      error?.message || error
    );

    throw new Error(
      error?.message ||
        "Unable to open website."
    );
  }
}


/*
=========================================================
NOTHING MATCHED LOCALLY

Continue with the existing AI flow.
=========================================================
*/



    console.log(
    `ORCHESTRATOR → INTENT: ${intent.type} (${intent.confidence})`
    );

let aiIntent = null;

if (
  intent.type === "action" ||
  intent.confidence < 0.8 ||
  this.looksLikeFileSystemRequest(text) ||
  this.looksLikeSystemRequest(text)
) {

  aiIntent =
    await this.aiIntentParser.parse(
      text
    );

  if (aiIntent) {

    console.log(
      "AURA AI INTENT →",
      aiIntent
    );
  }
}
        if (!text) {

        throw new Error(
            "AURA request cannot be empty."
        );
        }


        console.log("");
        console.log(
        "================================="
        );

        console.log(
        "        AURA ORCHESTRATOR"
        );

        console.log(
        "================================="
        );

        console.log(
        `USER → ${text}`
        );

    /* =========================================================
       DIRECT SYSTEM ACTION
       Handle known Windows system commands locally so they
       never get mistaken for normal conversation.
    ========================================================= */

    const systemAction =
      this.detectSystemAction(text);

    if (systemAction) {

      console.log(
        `ORCHESTRATOR → SYSTEM: ${systemAction}`
      );

      if (this.toolManager) {

        try {

          const result =
            await this.toolManager.execute(
              "system",
              {
                action: systemAction,
              }
            );

          console.log(
            `SYSTEM COMPLETE → ${result}`
          );

          return {
            type: "system",
            text:
              typeof result === "string"
                ? result
                : "Done.",
            action: systemAction,
            tool: "system",
          };

        } catch (error) {

          console.error(
            `SYSTEM FAILED → ${systemAction}`,
            error?.message || error
          );

          throw new Error(
            error?.message ||
              "Unable to perform system action."
          );
        }
      }

      return {
        type: "system",
        text:
          "I understand the system command, but the system tool is not connected yet.",
        action: systemAction,
      };
    }

/* =========================================================
   FILE SYSTEM ACTION
========================================================= */

if (
  aiIntent &&
  aiIntent.type === "file-system"
) {

  const action =
    aiIntent.action || "open";


  /* =======================================================
     OPEN FOLDER
  ======================================================= */

  if (action === "open") {

    const folder =
      aiIntent.folder;


    if (!folder) {

      throw new Error(
        "AURA could not determine which folder to open."
      );

    }


    console.log(
      `AURA FILE SYSTEM → OPEN ${folder}`
    );


    try {

      const result =
        await this.toolManager.execute(
          "file-system",
          {
            action: "open",
            folder,
          }
        );


      return {

        type: "tool",

        tool: "file-system",

        action: "open",

        folder,

        text:
          typeof result === "string"
            ? result
            : "Done.",

      };

    } catch (error) {

      console.error(
        "AURA FILE SYSTEM ERROR →",
        error?.message || error
      );


      return {

        type: "tool",

        tool: "file-system",

        action: "open",

        folder,

        text:
          `I couldn't open ${folder}: ${
            error?.message || "Unknown error"
          }`,

      };
    }
  }


  /* =======================================================
     CREATE FOLDER
  ======================================================= */

  if (action === "create") {

    const name =
      aiIntent.name;


    if (!name) {

      throw new Error(
        "AURA could not determine the folder name."
      );

    }


    console.log(
      `AURA FILE SYSTEM → CREATE FOLDER: ${name}`
    );


    try {

      const result =
        await this.toolManager.execute(
          "file-system",
          {
            action: "create",
            name,
          }
        );


      return {

        type: "tool",

        tool: "file-system",

        action: "create",

        name,

        text:
          typeof result === "string"
            ? result
            : `Created folder "${name}".`,

      };

    } catch (error) {

      console.error(
        "AURA CREATE FOLDER ERROR →",
        error?.message || error
      );


      return {

        type: "tool",

        tool: "file-system",

        action: "create",

        name,

        text:
          `I couldn't create the folder "${name}": ${
            error?.message || "Unknown error"
          }`,

      };
    }
  }


  /* =======================================================
     UNKNOWN FILE SYSTEM ACTION
  ======================================================= */

  return {

    type: "tool",

    tool: "file-system",

    text:
      `I don't know how to perform the file system action "${action}".`,

  };

}
    /* =========================================================
    SYSTEM ACTIONS
    ========================================================= */

    if (
    aiIntent &&
    aiIntent.type === "system"
    ) {

    const action =
        aiIntent.action;

    console.log(
        `AURA SYSTEM → ${action}`
    );

    try {

        const result =
        await this.toolManager.execute(
            "system",
            {
            action,
            }
        );

        return {
        text: result,
        source: "system",
        tool: "system",
        };

    } catch (error) {

        console.error(
        "AURA SYSTEM ERROR →",
        error?.message || error
        );

        return {
        text:
            `I couldn't perform that system action: ${
            error?.message || "Unknown error"
            }`,
        source: "system",
        tool: "system",
        };
    }
  }
    // =======================================================
    // 1. DIRECT COMPUTER ACTION
    // =======================================================

    const action =
      this.detectAction(text);


    if (action) {

      console.log(
        `ORCHESTRATOR → ACTION: ${action.action} → ${action.application}`
      );


      // -----------------------------------------------------
      // NEW TOOL MANAGER
      // -----------------------------------------------------

      if (this.toolManager) {

        try {

          const result =
            await this.toolManager.execute(
              "application",
              {
                action:
                  action.action,

                application:
                  action.application,
              }
            );


          console.log(
            `ACTION COMPLETE → ${result}`
          );

          if (this.conversationContext) {
            this.conversationContext.remember({
              type: "application",
              action: action.action,
              application: action.application,
            });
          }


          return {

            type:
              "action",

            text:
              result,

            action:
              action.action,

            target:
              action.application,

            tool:
              "application",

          };

        } catch (error) {

          console.error(
            `ACTION FAILED → ${action.action} ${action.application}`,
            error?.message || error
          );


          throw new Error(
            error?.message ||
              "Unable to perform application action."
          );
        }
      }


      // -----------------------------------------------------
      // OLD TOOL SYSTEM FALLBACK
      // -----------------------------------------------------

      const legacyTool =
        action.action === "open"
          ? this.tools.openApplication
          : this.tools.closeApplication;


      if (
        typeof legacyTool === "function"
      ) {

        try {

          const result =
            await legacyTool(
              action.application
            );


          return {

            type:
              "action",

            text:
              result,

            action:
              action.action,

            target:
              action.application,

          };

        } catch (error) {

          throw new Error(
            error?.message ||
              "Unable to perform application action."
          );
        }
      }


      // -----------------------------------------------------
      // NO TOOL CONNECTION
      // -----------------------------------------------------

      return {

        type:
          "action",

        text:
          "I understand the command, but the application tool is not connected yet.",

        action:
          action.action,

        target:
          action.application,

      };
    }


    // =======================================================
    // 1B. DIRECT WEBSITE ACTION
    // =======================================================

    const websiteAction =
      this.detectWebsite(text);


    if (websiteAction) {

      console.log(
        `ORCHESTRATOR → WEBSITE: ${websiteAction.website}`
      );


      // -----------------------------------------------------
      // WEBSITE TOOL MANAGER
      // -----------------------------------------------------

      if (this.toolManager) {

        try {

          const result =
            await this.toolManager.execute(
              "website",
              {
                url:
                  websiteAction.url,
              }
            );


          console.log(
            `WEBSITE COMPLETE → ${result}`
          );

          if (this.conversationContext) {
            this.conversationContext.remember({
              type: "website",
              action: "open",
              website: websiteAction.website,
            });
          }


          return {

            type:
              "website",

            text:
              result,

            website:
              websiteAction.website,

            url:
              websiteAction.url,

            tool:
              "website",

          };

        } catch (error) {

          console.error(
            `WEBSITE FAILED → ${websiteAction.website}`,
            error?.message || error
          );


          throw new Error(
            error?.message ||
              "Unable to open website."
          );
        }
      }


      // -----------------------------------------------------
      // NO WEBSITE TOOL CONNECTION
      // -----------------------------------------------------

      return {

        type:
          "website",

        text:
          "I understand the website command, but the website tool is not connected yet.",

        website:
          websiteAction.website,

        url:
          websiteAction.url,

      };
    }


    // =======================================================
    // 2. BUILD MEMORY CONTEXT
    // =======================================================

    let memoryContext =
      "";


    if (
      this.memory &&
      typeof this.memory.getRecentMemory ===
        "function"
    ) {

      const recentMemory =
        this.memory.getRecentMemory(
          6
        );


      if (
        Array.isArray(recentMemory) &&
        recentMemory.length > 0
      ) {

        memoryContext =
          this.buildMemoryContext(
            recentMemory
          );


        console.log(
          `ORCHESTRATOR → MEMORY: ${recentMemory.length} messages`
        );
      }
    }


    // =======================================================
    // 3. CREATE CONTEXT-AWARE REQUEST
    // =======================================================

    let brainMessage =
      text;


    if (memoryContext) {

      brainMessage = `

Previous conversation context:

${memoryContext}

Current user request:

${text}

Use the previous conversation only when it is relevant
to the current request.

Do not mention this internal memory context unless
the user asks about it.

`;
    }


    // =======================================================
    // 4. ROUTE TO BEST BRAIN
    // =======================================================

    let preferredBrain =
      null;


    if (this.brainRouter) {

      preferredBrain =
        this.brainRouter.route(
          brainMessage
        );
    }


    console.log(
      `ORCHESTRATOR → BRAIN: ${
        preferredBrain ||
        "AUTO"
      }`
    );


    // =======================================================
    // 5. ASK BRAIN MANAGER
    // =======================================================

    const result =
      await this.brainManager.ask(
        brainMessage,
        preferredBrain
      );


    // =======================================================
    // 6. RETURN RESPONSE
    // =======================================================

    return {

      type:
        "conversation",

      text:
        result.text,

      brain:
        result.brain,

      duration:
        result.duration,

    };
  }
    // =========================================================
  // EXECUTE CONFIRMED ACTION
  // =========================================================
  //
  // This method executes an action after the user has
  // explicitly confirmed it.
  //
  // It supports the same ToolManager architecture used
  // throughout the existing orchestrator.
  // =========================================================

  async executeAction(action) {

    if (!action) {

      throw new Error(
        "No pending action to execute."
      );
    }


    console.log(
      "AURA → EXECUTING CONFIRMED ACTION:",
      action
    );


    // =======================================================
    // APPLICATION ACTION
    // =======================================================

    if (
      action.type === "application" ||
      action.type === "action"
    ) {

      const application =
        action.application ||
        action.target;

      const normalizedAction =
        action.action || "open";


      if (
        !application
      ) {

        throw new Error(
          "No application specified for confirmed action."
        );
      }


      if (
        this.toolManager
      ) {

        try {

          const result =
            await this.toolManager.execute(
              "application",
              {
                action:
                  normalizedAction,

                application:
                  application,
              }
            );


          console.log(
            `CONFIRMED APPLICATION COMPLETE → ${normalizedAction} → ${application}`
          );


          if (
            this.conversationContext
          ) {

            this.conversationContext.remember({
              type:
                "application",

              action:
                normalizedAction,

              application:
                application,
            });
          }


          return {

            type:
              "action",

            text:
              typeof result === "string"
                ? result
                : "Done.",

            action:
              normalizedAction,

            target:
              application,

            tool:
              "application",

            confirmed:
              true,

          };

        } catch (error) {

          console.error(
            "CONFIRMED APPLICATION FAILED →",
            error?.message || error
          );


          throw new Error(
            error?.message ||
              "Unable to perform confirmed application action."
          );
        }
      }


      // -----------------------------------------------------
      // LEGACY APPLICATION TOOL FALLBACK
      // -----------------------------------------------------

      const legacyTool =
        normalizedAction === "open"
          ? this.tools?.openApplication
          : this.tools?.closeApplication;


      if (
        typeof legacyTool === "function"
      ) {

        try {

          const result =
            await legacyTool(
              application
            );


          return {

            type:
              "action",

            text:
              typeof result === "string"
                ? result
                : "Done.",

            action:
              normalizedAction,

            target:
              application,

            confirmed:
              true,

          };

        } catch (error) {

          throw new Error(
            error?.message ||
              "Unable to perform confirmed application action."
          );
        }
      }


      return {

        type:
          "action",

        text:
          "The application tool is not connected.",

        action:
          normalizedAction,

        target:
          application,

        confirmed:
          true,

      };
    }


    // =======================================================
    // WEBSITE ACTION
    // =======================================================

    if (
      action.type === "website"
    ) {

      let website =
        action.website ||
        action.target;

      let url =
        action.url;


      // -----------------------------------------------------
      // Resolve URL if only website name was provided
      // -----------------------------------------------------

      if (
        !url &&
        website
      ) {

        const detectedWebsite =
          this.detectWebsite(
            `open ${website}`
          );


        if (
          detectedWebsite
        ) {

          website =
            detectedWebsite.website;

          url =
            detectedWebsite.url;
        }
      }


      if (
        !url
      ) {

        throw new Error(
          "No website URL specified for confirmed action."
        );
      }


      if (
        this.toolManager
      ) {

        try {

          const result =
            await this.toolManager.execute(
              "website",
              {
                url:
                  url,
              }
            );


          console.log(
            `CONFIRMED WEBSITE COMPLETE → ${website || url}`
          );


          if (
            this.conversationContext &&
            website
          ) {

            this.conversationContext.remember({
              type:
                "website",

              action:
                "open",

              website:
                website,
            });
          }


          return {

            type:
              "website",

            text:
              typeof result === "string"
                ? result
                : "Done.",

            website:
              website,

            url:
              url,

            tool:
              "website",

            confirmed:
              true,

          };

        } catch (error) {

          console.error(
            "CONFIRMED WEBSITE FAILED →",
            error?.message || error
          );


          throw new Error(
            error?.message ||
              "Unable to open confirmed website."
          );
        }
      }


      return {

        type:
          "website",

        text:
          "The website tool is not connected.",

        website:
          website,

        url:
          url,

        confirmed:
          true,

      };
    }


    // =======================================================
    // SYSTEM ACTION
    // =======================================================

    if (
      action.type === "system"
    ) {

      const systemAction =
        action.action;


      if (
        !systemAction
      ) {

        throw new Error(
          "No system action specified for confirmed action."
        );
      }


      if (
        this.toolManager
      ) {

        try {

          const result =
            await this.toolManager.execute(
              "system",
              {
                action:
                  systemAction,
              }
            );


          console.log(
            `CONFIRMED SYSTEM COMPLETE → ${systemAction}`
          );


          return {

            type:
              "system",

            text:
              typeof result === "string"
                ? result
                : "Done.",

            action:
              systemAction,

            tool:
              "system",

            confirmed:
              true,

          };

        } catch (error) {

          console.error(
            "CONFIRMED SYSTEM FAILED →",
            error?.message || error
          );


          throw new Error(
            error?.message ||
              "Unable to perform confirmed system action."
          );
        }
      }


      return {

        type:
          "system",

        text:
          "The system tool is not connected.",

        action:
          systemAction,

        confirmed:
          true,

      };
    }


// =======================================================
// FILE SYSTEM ACTION
// =======================================================

if (
  action.type === "file-system"
) {

  const fileSystemAction =
    action.action || "open";


  /*
    Different file-system actions use
    different target values.

    open       → folder
    create     → name
    create-file → name
  */

  const folder =
    action.folder ||
    action.target;


  const name =
    action.name;


  /*
    Build the input that will be sent
    to the file-system tool.
  */

  const fileSystemInput = {

    action:
      fileSystemAction,

  };


  /*
    OPEN FOLDER
  */

  if (
    fileSystemAction === "open"
  ) {

    if (
      !folder
    ) {

      throw new Error(
        "No folder specified for file-system open action."
      );

    }


    fileSystemInput.folder =
      folder;

  }


  /*
    CREATE FOLDER
  */

  else if (
    fileSystemAction === "create"
  ) {

    if (
      !name
    ) {

      throw new Error(
        "No folder name specified for file-system create action."
      );

    }


    fileSystemInput.name =
      name;

  }


  /*
    CREATE FILE
  */

  else if (
    fileSystemAction === "create-file"
  ) {

    if (
      !name
    ) {

      throw new Error(
        "No file name specified for file-system create-file action."
      );

    }


    fileSystemInput.name =
      name;

  }


  /*
    UNKNOWN FILE-SYSTEM ACTION
  */

  else {

    throw new Error(
      `Unknown file system action: ${fileSystemAction}`
    );

  }


  /*
    EXECUTE FILE-SYSTEM TOOL
  */

  if (
    this.toolManager
  ) {

    try {

      const result =
        await this.toolManager.execute(
          "file-system",
          fileSystemInput
        );


      console.log(
        `FILE SYSTEM COMPLETE → ${fileSystemAction}`
      );


      return {

        type:
          "tool",

        tool:
          "file-system",

        text:
          typeof result === "string"
            ? result
            : "Done.",

        action:
          fileSystemAction,

        target:
          name ||
          folder,

        confirmed:
          true,

      };

    } catch (error) {

      console.error(
        "FILE SYSTEM FAILED →",
        error?.message || error
      );


      throw new Error(
        error?.message ||
        "Unable to perform file-system action."
      );

    }

  }


  /*
    TOOL MANAGER NOT CONNECTED
  */

  return {

    type:
      "tool",

    tool:
      "file-system",

    text:
      "The file-system tool is not connected.",

    action:
      fileSystemAction,

    target:
      name ||
      folder,

    confirmed:
      true,

  };

}

    // =======================================================
    // GENERIC TOOL ACTION
    // =======================================================

    if (
      action.tool &&
      this.toolManager
    ) {

      try {

        const result =
          await this.toolManager.execute(
            action.tool,
            action.parameters ||
            action.input ||
            {}
          );


        return {

          type:
            "tool",

          tool:
            action.tool,

          text:
            typeof result === "string"
              ? result
              : "Done.",

          confirmed:
            true,

        };

      } catch (error) {

        console.error(
          "CONFIRMED TOOL FAILED →",
          error?.message || error
        );


        throw new Error(
          error?.message ||
            "Unable to execute confirmed tool action."
        );
      }
    }


    // =======================================================
    // UNKNOWN ACTION
    // =======================================================

    throw new Error(
      `Unsupported confirmed action type: ${
        action.type || "unknown"
      }`
    );
  }
  // =========================================================
  // MEMORY CONTEXT BUILDER
  // =========================================================

  buildMemoryContext(
    memory
  ) {

    return memory
      .map(
        (item) => {

          const role =
            item.role === "user"
              ? "User"
              : "AURA";


          return `${role}: ${item.content}`;
        }
      )
      .join("\n");
  }

  /* =========================================================
   DETECT SYSTEM REQUEST
========================================================= */

  /* =========================================================
     DETECT DIRECT SYSTEM ACTION
  ========================================================= */

  detectSystemAction(text) {

    if (
      !text ||
      typeof text !== "string"
    ) {
      return null;
    }

    const normalizedText =
      text
        .toLowerCase()
        .trim()
        .replace(
          /[?!.,;:]+/g,
          ""
        );

    if (
      normalizedText === "show my desktop" ||
      normalizedText === "show desktop" ||
      normalizedText === "show the desktop" ||
      normalizedText === "view my desktop"
    ) {
      return "show-desktop";
    }

    if (
      normalizedText === "lock my computer" ||
      normalizedText === "lock my laptop" ||
      normalizedText === "lock the computer" ||
      normalizedText === "lock the laptop" ||
      normalizedText === "lock my pc"
    ) {
      return "lock";
    }

    if (
      normalizedText === "open task manager" ||
      normalizedText === "launch task manager" ||
      normalizedText === "start task manager" ||
      normalizedText === "bring up task manager"
    ) {
      return "task-manager";
    }

    return null;
  }


looksLikeSystemRequest(text) {

  if (
    !text ||
    typeof text !== "string"
  ) {
    return false;
  }

  const systemWords = [

    "lock my computer",
    "lock my laptop",
    "lock the computer",
    "lock the laptop",
    "lock my pc",

    "show my desktop",
    "show desktop",
    "show the desktop",
    "view my desktop",

    "open task manager",
    "launch task manager",
    "start task manager",
    "bring up task manager",

  ];

  const normalizedText =
    text
      .toLowerCase()
      .trim();

  return systemWords.some(
    (word) =>
      normalizedText.includes(word)
  );
}

/* =========================================================
   FILE SYSTEM REQUEST DETECTION
========================================================= */

looksLikeFileSystemRequest(message) {

  const text =
    message
      .toLowerCase()
      .trim();

  const folderWords = [
    "desktop",
    "downloads",
    "download",
    "documents",
    "document",
    "pictures",
    "picture",
    "videos",
    "video",
    "music",
  ];

  const fileSystemWords = [
    "folder",
    "directory",
    "file explorer",
    "file manager",
  ];

  const hasFolder =
    folderWords.some(
      (word) =>
        text.includes(word)
    );

  const hasFileSystemWord =
    fileSystemWords.some(
      (word) =>
        text.includes(word)
    );

  return (
    hasFolder ||
    hasFileSystemWord
  );
}
  // =========================================================
  // WEBSITE DETECTION
  // =========================================================

  detectWebsite(
    message
  ) {

    const text =
      message
        .toLowerCase()
        .trim()
        .replace(
          /[?!.,;:]+/g,
          ""
        );


    const websites = {

      youtube: {

        aliases: [
          "youtube",
          "you tube",
        ],

        url:
          "https://www.youtube.com",

      },


      google: {

        aliases: [
          "google",
        ],

        url:
          "https://www.google.com",

      },


      github: {

        aliases: [
          "github",
          "git hub",
        ],

        url:
          "https://github.com",

      },


      chatgpt: {

        aliases: [
          "chatgpt",
          "chat gpt",
        ],

        url:
          "https://chatgpt.com",

      },


      spotify: {

        aliases: [
          "spotify",
        ],

        url:
          "https://open.spotify.com",

      },


      gmail: {

        aliases: [
          "gmail",
          "google mail",
        ],

        url:
          "https://mail.google.com",

      },


      instagram: {

        aliases: [
          "instagram",
          "insta",
        ],

        url:
          "https://www.instagram.com",

      },


      facebook: {

        aliases: [
          "facebook",
        ],

        url:
          "https://www.facebook.com",

      },


      whatsapp: {

        aliases: [
          "whatsapp",
          "whatsapp web",
        ],

        url:
          "https://web.whatsapp.com",

      },

    };


    // -------------------------------------------------------
    // Only treat it as a website command when an
    // opening/launching phrase is present.
    // -------------------------------------------------------

    const openWords = [

      "open",
      "launch",
      "start",
      "show",
      "bring up",
      "load",
      "go to",

    ];


    const hasOpenWord =
      openWords.some(
        (word) =>
          text.includes(word)
      );


    if (!hasOpenWord) {

      return null;
    }


    // -------------------------------------------------------
    // Find website
    // -------------------------------------------------------

    for (
      const [
        website,
        data,
      ]
      of Object.entries(
        websites
      )
    ) {

      for (
        const alias
        of data.aliases
      ) {

        if (
          text.includes(alias)
        ) {

          return {

            website,

            url:
              data.url,

          };
        }
      }
    }


    return null;
  }


  // =========================================================
  // ACTION DETECTION
  // =========================================================

  detectAction(
    message
  ) {

    const text =
      message
        .toLowerCase()
        .trim()
        .replace(
          /[?!.,;:]+$/g,
          ""
        );


    // =======================================================
    // OPEN CHROME
    // =======================================================

    if (

      text === "open chrome" ||

      text ===
        "open google chrome" ||

      text.includes(
        "launch chrome"
      ) ||

      text.includes(
        "start chrome"
      )

    ) {

      return {

        action:
          "open",

        application:
          "chrome",

      };
    }


    // =======================================================
    // CLOSE CHROME
    // =======================================================

    if (

      text === "close chrome" ||

      text ===
        "close google chrome" ||

      text.includes(
        "exit chrome"
      ) ||

      text.includes(
        "quit chrome"
      ) ||

      text.includes(
        "shut down chrome"
      )

    ) {

      return {

        action:
          "close",

        application:
          "chrome",

      };
    }


    // =======================================================
    // OPEN NOTEPAD
    // =======================================================

    if (

      text === "open notepad" ||

      text.includes(
        "launch notepad"
      ) ||

      text.includes(
        "start notepad"
      )

    ) {

      return {

        action:
          "open",

        application:
          "notepad",

      };
    }


    // =======================================================
    // CLOSE NOTEPAD
    // =======================================================

    if (

      text === "close notepad" ||

      text.includes(
        "exit notepad"
      ) ||

      text.includes(
        "quit notepad"
      )

    ) {

      return {

        action:
          "close",

        application:
          "notepad",

      };
    }


    // =======================================================
    // OPEN CALCULATOR
    // =======================================================

    if (

      text ===
        "open calculator" ||

      text.includes(
        "open calculator"
      ) ||

      text.includes(
        "launch calculator"
      ) ||

      text.includes(
        "start calculator"
      ) ||

      text.includes(
        "use calculator"
      ) ||

      text.includes(
        "calculator for me"
      )

    ) {

      return {

        action:
          "open",

        application:
          "calculator",

      };
    }


    // =======================================================
    // CLOSE CALCULATOR
    // =======================================================

    if (

      text ===
        "close calculator" ||

      text.includes(
        "exit calculator"
      ) ||

      text.includes(
        "quit calculator"
      )

    ) {

      return {

        action:
          "close",

        application:
          "calculator",

      };
    }


    // =======================================================
    // OPEN FILE EXPLORER
    // =======================================================

    if (

      text ===
        "open file explorer" ||

      text ===
        "open explorer" ||

      text.includes(
        "launch file explorer"
      ) ||

      text.includes(
        "start file explorer"
      )

    ) {

      return {

        action:
          "open",

        application:
          "explorer",

      };
    }


    // =======================================================
    // CLOSE FILE EXPLORER
    // =======================================================

    if (

      text ===
        "close file explorer" ||

      text ===
        "close explorer" ||

      text.includes(
        "exit file explorer"
      ) ||

      text.includes(
        "quit file explorer"
      )

    ) {

      return {

        action:
          "close",

        application:
          "explorer",

      };
    }


    // =======================================================
    // NO DIRECT ACTION
    // =======================================================

    return null;
  }
}


module.exports =
  AURAOrchestrator;