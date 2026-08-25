import { useEffect, useRef, useState } from "react";
import "./App.css";

function App() {
  const [command, setCommand] = useState("");
  const [response, setResponse] = useState("");
  const [status, setStatus] = useState("READY");
  const [isListening, setIsListening] = useState(false);

  const recognitionRef = useRef(null);
  const inputRef = useRef(null);

  // ============================================
  // TEXT TO SPEECH
  // ============================================

  const speak = (text) => {
    if (!text) return;

    if (!("speechSynthesis" in window)) {
      console.warn("Speech synthesis is not available.");
      return;
    }

    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);

    utterance.rate = 1.05;
    utterance.pitch = 1;
    utterance.volume = 1;

    utterance.onstart = () => {
      console.log("🔊 AURA started speaking");
    };

    utterance.onend = () => {
      console.log("🔊 AURA finished speaking");
    };

    utterance.onerror = (event) => {
      console.error("Speech synthesis error:", event);
    };

    window.speechSynthesis.speak(utterance);
  };

  // ============================================
  // VOICE COMMAND HANDLER
  // ============================================

  const handleVoiceCommand = async (message) => {
    if (!message) return;

    setStatus("THINKING");
    setResponse("");

    try {
      console.log("AURA processing voice command:", message);

      // First try a computer action
      const actionResult = await window.aura.command(message);

      console.log("AURA action result:", actionResult);

      if (actionResult.handled) {
        const actionResponse =
          actionResult.response || "Done.";

        setResponse(actionResponse);
        setStatus("READY");
        setCommand("");

        speak(actionResponse);

        return;
      }

      // If it isn't a computer action,
      // send it to Gemini
      const result = await window.aura.askGemini(message);

      setResponse(result);
      setStatus("READY");
      setCommand("");

      speak(result);
    } catch (error) {
      console.error("AURA voice command error:", error);

      const errorMessage =
        error?.message ||
        "Something went wrong while processing your command.";

      setResponse(errorMessage);
      setStatus("ERROR");

      speak(errorMessage);
    }
  };

  // ============================================
  // START LISTENING
  // ============================================

  const startListening = () => {
    console.log("🎙 Starting AURA voice recognition...");

    const SpeechRecognition =
      window.SpeechRecognition ||
      window.webkitSpeechRecognition;

    console.log(
      "SpeechRecognition available:",
      Boolean(SpeechRecognition)
    );

    console.log(
      "MediaDevices available:",
      Boolean(navigator.mediaDevices)
    );

    // Browser/Electron doesn't support SpeechRecognition
    if (!SpeechRecognition) {
      setStatus("ERROR");

      setResponse(
        "Voice recognition is not available in this Electron environment."
      );

      console.error(
        "SpeechRecognition API is not available."
      );

      return;
    }

    // Prevent multiple recognition sessions
    if (isListening) {
      console.log("AURA is already listening.");
      return;
    }

    // Stop an old recognition instance if one exists
    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort();
      } catch (error) {
        console.warn(
          "Could not abort previous recognition:",
          error
        );
      }

      recognitionRef.current = null;
    }

    const recognition = new SpeechRecognition();

    recognition.lang = "en-IN";

    recognition.continuous = false;

    recognition.interimResults = false;

    recognition.maxAlternatives = 1;

    recognitionRef.current = recognition;

    // ============================================
    // RECOGNITION START
    // ============================================

    recognition.onstart = () => {
      console.log("🎙 AURA started listening");

      setIsListening(true);
      setStatus("LISTENING");
      setResponse("I'm listening...");
    };

    // ============================================
    // AUDIO START
    // ============================================

    recognition.onaudiostart = () => {
      console.log("🎙 AURA microphone started");
    };

    // ============================================
    // SOUND DETECTED
    // ============================================

    recognition.onsoundstart = () => {
      console.log("🔊 AURA detected sound");
    };

    // ============================================
    // SPEECH DETECTED
    // ============================================

    recognition.onspeechstart = () => {
      console.log("🗣 AURA detected speech");
    };

    // ============================================
    // SPEECH ENDED
    // ============================================

    recognition.onspeechend = () => {
      console.log("🛑 AURA detected end of speech");
    };

    // ============================================
    // RESULT
    // ============================================

    recognition.onresult = (event) => {
      try {
        const transcript =
          event.results?.[0]?.[0]?.transcript?.trim();

        console.log(
          "🎤 AURA heard:",
          transcript
        );

        if (!transcript) {
          setIsListening(false);
          setStatus("READY");
          setResponse(
            "I didn't detect any words. Try again."
          );
          return;
        }

        setCommand(transcript);

        setIsListening(false);

        handleVoiceCommand(transcript);
      } catch (error) {
        console.error(
          "Error processing speech result:",
          error
        );

        setIsListening(false);
        setStatus("ERROR");
        setResponse(
          "I couldn't process what you said."
        );
      }
    };

    // ============================================
    // ERROR
    // ============================================

    recognition.onerror = (event) => {
      console.error(
        "🎙 AURA speech error:",
        event.error
      );

      console.error(
        "Speech recognition event:",
        event
      );

      setIsListening(false);

      switch (event.error) {
        case "not-allowed":
          setStatus("ERROR");

          setResponse(
            "Microphone permission was denied. Please allow microphone access for AURA."
          );

          break;

        case "no-speech":
          setStatus("READY");

          setResponse(
            "I didn't detect any speech. Try speaking after AURA starts listening."
          );

          break;

        case "audio-capture":
          setStatus("ERROR");

          setResponse(
            "I can't access your microphone. Check your Windows microphone settings."
          );

          break;

        case "service-not-allowed":
          setStatus("ERROR");

          setResponse(
            "The speech recognition service isn't available in this Electron environment."
          );

          break;

        case "network":
          setStatus("ERROR");

          setResponse(
            "The speech recognition service could not connect to the network."
          );

          break;

        case "aborted":
          setStatus("READY");

          setResponse("");

          break;

        default:
          setStatus("ERROR");

          setResponse(
            `Voice recognition error: ${
              event.error || "unknown error"
            }`
          );
      }
    };

    // ============================================
    // RECOGNITION END
    // ============================================

    recognition.onend = () => {
      console.log("🎙 AURA recognition ended");

      setIsListening(false);

      recognitionRef.current = null;
    };

    // ============================================
    // START RECOGNITION
    // ============================================

    try {
      recognition.start();

      console.log(
        "🎙 recognition.start() called"
      );
    } catch (error) {
      console.error(
        "Could not start speech recognition:",
        error
      );

      setIsListening(false);
      setStatus("ERROR");

      setResponse(
        error?.message ||
          "Unable to start microphone."
      );
    }
  };

  // ============================================
  // WAKE LISTENER
  // ============================================

  useEffect(() => {
    inputRef.current?.focus();

    if (!window.aura?.onWake) {
      console.log(
        "AURA wake listener is not available."
      );

      return;
    }

    const removeWakeListener =
      window.aura.onWake(() => {
        console.log(
          "⚡ AURA wake shortcut triggered"
        );

        setTimeout(() => {
          startListening();
        }, 100);
      });

    return () => {
      removeWakeListener?.();

      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch (error) {
          console.warn(
            "Could not stop recognition:",
            error
          );
        }
      }

      window.speechSynthesis?.cancel();
    };
  }, []);

  // ============================================
  // TEXT COMMAND
  // ============================================

  const handleSubmit = async (event) => {
    event.preventDefault();

    const message = command.trim();

    if (!message) return;

    setStatus("THINKING");
    setResponse("");

    try {
      console.log(
        "AURA text command:",
        message
      );

      // First try computer action
      const actionResult =
        await window.aura.command(message);

      console.log(
        "AURA action result:",
        actionResult
      );

      if (actionResult.handled) {
        const actionResponse =
          actionResult.response || "Done.";

        setResponse(actionResponse);
        setStatus("READY");
        setCommand("");

        return;
      }

      // Otherwise use Gemini
      const result =
        await window.aura.askGemini(message);

      setResponse(result);
      setStatus("READY");
      setCommand("");
    } catch (error) {
      console.error(
        "AURA text command error:",
        error
      );

      setResponse(
        error?.message ||
          "Something went wrong."
      );

      setStatus("ERROR");
    }
  };

  // ============================================
  // UI
  // ============================================

  return (
    <main className="aura-window">

      <div className="aura-glow aura-glow-one"></div>

      <div className="aura-glow aura-glow-two"></div>

      <section className="aura-card">

        {/* HEADER */}

        <header className="aura-header">

          <div className="brand">

            <div className="status-orb">
              <span></span>
            </div>

            <div>
              <h1>AURA</h1>

              <p>
                AI DESKTOP ASSISTANT
              </p>
            </div>

          </div>

          <div className="connection">

            <span
              className={`connection-dot ${
                status === "ERROR"
                  ? "error-dot"
                  : ""
              }`}
            ></span>

            {status}

          </div>

        </header>

        {/* CENTER */}

        <div className="aura-center">

          <div className="core">

            <div className="core-ring ring-one"></div>

            <div className="core-ring ring-two"></div>

            <div className="core-ring ring-three"></div>

            <div className="core-center">

              <span>✦</span>

            </div>

          </div>

          <h2>
            {status === "THINKING"
              ? "Thinking..."
              : status === "LISTENING"
              ? "Listening..."
              : "How can I help?"}
          </h2>

          <p className="subtitle">

            {response ||
              "Speak naturally or type a command below."}

          </p>

        </div>

        {/* COMMAND BAR */}

        <form
          className="command-form"
          onSubmit={handleSubmit}
        >

          <span className="prompt-symbol">
            ›
          </span>

          <input
            ref={inputRef}
            value={command}
            onChange={(event) =>
              setCommand(event.target.value)
            }
            placeholder={
              isListening
                ? "Listening..."
                : "Ask AURA anything..."
            }
            autoComplete="off"
            disabled={
              status === "THINKING"
            }
          />

          {/* SEND BUTTON */}

          <button
            type="submit"
            disabled={
              !command.trim() ||
              status === "THINKING" ||
              isListening
            }
          >
            <span>↵</span>
          </button>

          {/* MICROPHONE BUTTON */}

          <button
            type="button"
            className={`voice-button ${
              isListening
                ? "listening"
                : ""
            }`}
            onClick={startListening}
            disabled={
              status === "THINKING"
            }
            title={
              isListening
                ? "AURA is listening"
                : "Talk to AURA"
            }
          >

            {isListening ? "●" : "🎙"}

          </button>

        </form>

        {/* FOOTER */}

        <footer className="aura-footer">

          <span>

            <kbd>CTRL</kbd>

            <kbd>SHIFT</kbd>

            <kbd>SPACE</kbd>

            <span>
              to toggle AURA
            </span>

          </span>

          <span>
            GEMINI CONNECTED
          </span>

        </footer>

      </section>

    </main>
  );
}

export default App;