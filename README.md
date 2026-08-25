# AURA — AI Desktop Assistant

> AURA is a Windows desktop AI assistant that understands natural-language commands and performs useful actions on your computer.

AURA is an AI-powered desktop assistant built with **Electron, JavaScript, Node.js, and Gemini**.

Instead of interacting with your computer only through traditional menus, AURA lets you communicate naturally.

For example:

- "Open Chrome"
- "Open my Downloads folder"
- "Create a folder called Projects"
- "Create a file called notes.txt"
- "Open YouTube"
- "Show my desktop"
- "Open Task Manager"
- "Lock my computer"

AURA interprets the request, determines the user's intent, and routes the request to the appropriate tool.

---

## ✨ Features

### 🤖 AI Intent Understanding

AURA uses an AI intent parser to understand what the user wants.

It can distinguish between:

- Conversation
- Applications
- Websites
- File-system actions
- Windows system actions

For example:

```text
User:
"Can you bring up Chrome?"

## 🧠 What Can AURA Do?

AURA is designed to understand natural language commands and convert them into actions.

Instead of remembering exact commands, you can talk to AURA naturally.

### 🖥️ Application Control

AURA can open and close supported desktop applications.

Examples:

- `open chrome`
- `launch chrome`
- `start chrome`
- `close chrome`
- `open notepad`
- `close notepad`
- `open calculator`
- `close calculator`
- `open file explorer`
- `close file explorer`

Currently supported applications include:

- Google Chrome
- Notepad
- Calculator
- File Explorer

---

### 🌐 Website Control

AURA can recognize websites and open them automatically.

Examples:

- `open YouTube`
- `launch Google`
- `open GitHub`
- `open ChatGPT`
- `open Spotify`
- `open Gmail`
- `open Instagram`
- `open Facebook`
- `open WhatsApp`

Supported websites include:

- YouTube
- Google
- GitHub
- ChatGPT
- Spotify
- Gmail
- Instagram
- Facebook
- WhatsApp

---

### 📁 File System Control

AURA can interact with common Windows folders.

Examples:

```text
open my Downloads folder
open Documents
open Desktop
open Pictures
open Videos
open Music

---

# 📸 Screenshots

## AURA Desktop Assistant

Add screenshots of the AURA interface here.

Example:

![AURA Interface](screenshots/aura-interface.png)

---

## 🧠 Natural Language Commands

AURA can understand natural commands and convert them into actions.

Example:

```text
User:
"Can you open Chrome?"

AURA:
Chrome opened.

## 🖥️ Supported Commands

AURA currently supports several categories of commands.

---

### 📂 File System Commands

AURA can interact with common Windows folders.

#### Open Folders

```text
open desktop
open downloads
open documents
open pictures
open videos
open music

## 🖥️ Supported Commands

AURA understands both direct commands and natural-language requests.

You don't always need to use an exact phrase. For example:

> "Can you bring up Chrome?"

works the same way as:

> "Open Chrome"

---

## 🌐 Website Commands

AURA can open commonly used websites directly.

### YouTube

```text
open youtube
launch youtube
start youtube
I want to watch YouTube

## 🧠 How AURA Understands Commands

AURA uses multiple layers to understand what the user wants.

The basic flow is:

User Input
   ↓
Conversation / Follow-Up Detection
   ↓
Multi-Action Detection
   ↓
Fast Local Router
   ↓
Intent Classifier
   ↓
AI Intent Parser
   ↓
Tool Manager
   ↓
Windows Action
   ↓
Response

This layered architecture allows AURA to handle simple commands quickly while still using AI for more complex requests.

---

## ⚡ Fast Command Routing

AURA does not send every command to the AI.

Common commands are detected locally first.

For example:

```text
open chrome
