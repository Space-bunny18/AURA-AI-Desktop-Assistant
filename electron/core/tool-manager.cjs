class ToolManager {
  constructor() {
    this.tools = new Map();
  }


  /* =========================================================
     REGISTER TOOL
  ========================================================= */

  registerTool(tool) {

    if (
      !tool ||
      !tool.name ||
      typeof tool.execute !== "function"
    ) {
      throw new Error(
        "Invalid AURA tool registration."
      );
    }


    this.tools.set(
      tool.name,
      tool
    );


    console.log(
      `AURA TOOL REGISTERED → ${tool.name}`
    );
  }


  /* =========================================================
     GET TOOL
  ========================================================= */

  getTool(name) {

    if (!name) {
      return null;
    }

    return (
      this.tools.get(name) ||
      null
    );
  }


  /* =========================================================
     GET ALL TOOLS
  ========================================================= */

  getAllTools() {

    return Array.from(
      this.tools.values()
    );
  }


  /* =========================================================
     GET AVAILABLE TOOLS
  ========================================================= */

  getAvailableTools() {

    return this.getAllTools()
      .filter(
        (tool) =>
          tool.enabled !== false
      );
  }


  /* =========================================================
     FIND TOOL CAPABILITY
  ========================================================= */

  findCapability(
    capability
  ) {

    const available =
      this.getAvailableTools();


    return available.find(
      (tool) => {

        const capabilities =
          tool.capabilities || [];


        return capabilities.includes(
          capability
        );
      }
    ) || null;
  }


  /* =========================================================
     EXECUTE TOOL
  ========================================================= */

  async execute(
    toolName,
    input = {}
  ) {

    const tool =
      this.getTool(toolName);


    if (!tool) {

      throw new Error(
        `AURA tool "${toolName}" was not found.`
      );
    }


    if (
      tool.enabled === false
    ) {

      throw new Error(
        `AURA tool "${toolName}" is disabled.`
      );
    }


    console.log(
      `AURA TOOL → ${toolName}`
    );


    try {

      const result =
        await tool.execute(input);


      console.log(
        `AURA TOOL ← ${toolName}`
      );


      return result;

    } catch (error) {

      console.error(
        `AURA TOOL FAILED → ${toolName}`,
        error?.message || error
      );


      throw error;
    }
  }


  /* =========================================================
     TOOL STATUS
  ========================================================= */

  getStatus() {

    return this.getAllTools()
      .map(
        (tool) => ({

          name:
            tool.name,

          enabled:
            tool.enabled !== false,

          capabilities:
            tool.capabilities || [],

        })
      );
  }
}


module.exports =
  ToolManager;