class AIIntentParser {

  constructor(brainManager) {
    this.brainManager = brainManager;
  }


  /* =========================================================
     PARSE USER INTENT
  ========================================================= */

  async parse(message) {

    if (
      !message ||
      typeof message !== "string"
    ) {
      return null;
    }


    const text =
      message.trim();


    if (!text) {
      return null;
    }


    const prompt = `
You are the intent understanding layer of AURA,
a Windows desktop AI assistant.

Analyze the user's request and determine whether
they want AURA to perform an action on the computer
or simply have a conversation.

Return ONLY valid JSON.

Possible intent types:

conversation
application
website
file-system
system


=========================================================
SYSTEM ACTIONS
=========================================================

For system actions, use:

lock
show-desktop
task-manager
shutdown
restart


Examples:

User:
"Lock my computer"

JSON:
{
  "type": "system",
  "action": "lock"
}


User:
"Show my desktop"

JSON:
{
  "type": "system",
  "action": "show-desktop"
}


User:
"Open Task Manager"

JSON:
{
  "type": "system",
  "action": "task-manager"
}


=========================================================
FILE SYSTEM ACTIONS
=========================================================

For file-system actions, use:

open
create
create-file


Known folders include:

desktop
downloads
documents
pictures
videos
music


For OPEN folder requests:

User:
"Can you open my downloads folder?"

JSON:
{
  "type": "file-system",
  "action": "open",
  "folder": "downloads"
}


User:
"Show me my desktop folder"

JSON:
{
  "type": "file-system",
  "action": "open",
  "folder": "desktop"
}


User:
"Open my Documents"

JSON:
{
  "type": "file-system",
  "action": "open",
  "folder": "documents"
}


=========================================================
CREATE FOLDER
=========================================================

When the user wants to create or make a folder,
use:

{
  "type": "file-system",
  "action": "create",
  "name": "FolderName"
}


Examples:

User:
"Create a folder called Projects"

JSON:
{
  "type": "file-system",
  "action": "create",
  "name": "Projects"
}


User:
"Make a folder named Resume"

JSON:
{
  "type": "file-system",
  "action": "create",
  "name": "Resume"
}


User:
"Create a new folder called AURA Projects"

JSON:
{
  "type": "file-system",
  "action": "create",
  "name": "AURA Projects"
}


User:
"Can you make me a folder called College"

JSON:
{
  "type": "file-system",
  "action": "create",
  "name": "College"
}


Important:

When creating a folder, extract ONLY the folder name.

Do not include phrases such as:

"create a folder called"
"make a folder named"
"new folder"

For example:

"Create a folder called My Projects"

must become:

{
  "type": "file-system",
  "action": "create",
  "name": "My Projects"
}

=========================================================
CREATE FILE
=========================================================

When the user wants to create or make a file,
use:

{
  "type": "file-system",
  "action": "create-file",
  "name": "FileName"
}


Examples:

User:
"Create a file called notes.txt"

JSON:
{
  "type": "file-system",
  "action": "create-file",
  "name": "notes.txt"
}


User:
"Make a text file called project.txt"

JSON:
{
  "type": "file-system",
  "action": "create-file",
  "name": "project.txt"
}


User:
"Create a file called ideas.md"

JSON:
{
  "type": "file-system",
  "action": "create-file",
  "name": "ideas.md"
}


User:
"Create a new file named resume.txt"

JSON:
{
  "type": "file-system",
  "action": "create-file",
  "name": "resume.txt"
}


Important:

When creating a file, extract ONLY the file name.

Do not include phrases such as:

"create a file called"
"make a file named"
"new file"

For example:

"Create a file called notes.txt"

must become:

{
  "type": "file-system",
  "action": "create-file",
  "name": "notes.txt"
}
=========================================================
APPLICATION ACTIONS
=========================================================

For application actions, use:

open
close


Known applications include:

chrome
notepad
calculator
explorer


Examples:

User:
"I need to do some calculations"

JSON:
{
  "type": "application",
  "action": "open",
  "application": "calculator"
}


User:
"Can you bring up Chrome?"

JSON:
{
  "type": "application",
  "action": "open",
  "application": "chrome"
}


User:
"Close Chrome"

JSON:
{
  "type": "application",
  "action": "close",
  "application": "chrome"
}


=========================================================
WEBSITE ACTIONS
=========================================================

Known websites include:

youtube
google
github
chatgpt
spotify
gmail
instagram
facebook
whatsapp


Example:

User:
"I want to watch some YouTube"

JSON:
{
  "type": "website",
  "website": "youtube"
}


=========================================================
CONVERSATION
=========================================================

If the user is simply talking to AURA
and does not want a computer action:

User:
"hello"

JSON:
{
  "type": "conversation"
}


User:
"thank you"

JSON:
{
  "type": "conversation"
}


=========================================================
IMPORTANT RULES
=========================================================

1. Return ONLY valid JSON.

2. Never return markdown.

3. Never explain the JSON.

4. For folder creation, always use:
   "type": "file-system"
   "action": "create"
   "name": "..."

5. For file creation, always use:
   "type": "file-system"
   "action": "create-file"
   "name": "..."

6. For opening a known folder, use:
   "type": "file-system"
   "action": "open"
   "folder": "..."

7. Do not confuse the Desktop folder with
   the Windows "show desktop" system action.

8. "Show my desktop" may mean opening the Desktop
   folder when the user clearly refers to the folder.

9. "Show desktop" as a Windows command should use:
   "type": "system"
   "action": "show-desktop"


=========================================================
USER REQUEST
=========================================================

${text}
`;


    try {

      const brain =
        this.brainManager
          .getAvailableBrains()
          .find(
            (item) =>
              item.enabled !== false &&
              typeof item.ask === "function"
          );


      if (!brain) {
        return null;
      }


      const response =
        await brain.ask(prompt);


      if (
        !response ||
        typeof response !== "string"
      ) {
        return null;
      }


      return this.extractJSON(
        response
      );

    } catch (error) {

      console.error(
        "AURA AI INTENT ERROR →",
        error?.message || error
      );

      return null;
    }
  }


  /* =========================================================
     EXTRACT JSON
  ========================================================= */

  extractJSON(response) {

    let text =
      response.trim();


    /*
      Remove markdown JSON fences
    */

    text =
      text
        .replace(
          /^```json/i,
          ""
        )
        .replace(
          /^```/i,
          ""
        )
        .replace(
          /```$/i,
          ""
        )
        .trim();


    try {

      return JSON.parse(text);

    } catch (error) {

      /*
        Try to find JSON inside
        additional AI text.
      */

      const start =
        text.indexOf("{");

      const end =
        text.lastIndexOf("}");


      if (
        start === -1 ||
        end === -1 ||
        end <= start
      ) {
        return null;
      }


      try {

        return JSON.parse(
          text.slice(
            start,
            end + 1
          )
        );

      } catch {

        return null;
      }
    }
  }
}


module.exports =
  AIIntentParser;