"use client";

import { useState, useRef, useCallback } from "react";

// ── Inline Web Speech API types (avoids @types/dom-speech-recognition issues) ──
interface ISpeechRecognition extends EventTarget {
  lang: string;
  interimResults: boolean;
  onresult: ((e: SpeechRecognitionEvent) => void) | null;
  onend: (() => void) | null;
  start(): void;
  stop(): void;
}

interface ISpeechRecognitionConstructor {
  new (): ISpeechRecognition;
}

declare global {
  interface Window {
    SpeechRecognition?: ISpeechRecognitionConstructor;
    webkitSpeechRecognition?: ISpeechRecognitionConstructor;
  }
}
// ─────────────────────────────────────────────────────────────────────────────

interface UseSpeechRecognitionOptions {
  onTranscript: (text: string) => void;
}

export function useSpeechRecognition({ onTranscript }: UseSpeechRecognitionOptions) {
  const [isRecording, setIsRecording] = useState(false);
  const recognRef = useRef<ISpeechRecognition | null>(null);

  const toggleRecording = useCallback(() => {
    const SR: ISpeechRecognitionConstructor | undefined =
      window.SpeechRecognition ?? window.webkitSpeechRecognition;

    if (!SR) {
      alert("Voice input is not supported in this browser.");
      return;
    }

    if (isRecording) {
      recognRef.current?.stop();
      setIsRecording(false);
      return;
    }

    const recog = new SR();
    recog.lang = "en-NG";
    recog.interimResults = true;
    recog.onresult = (e: SpeechRecognitionEvent) => {
      const transcript = Array.from(e.results)
        .map((r) => r[0].transcript)
        .join("");
      onTranscript(transcript);
    };
    recog.onend = () => setIsRecording(false);
    recog.start();
    recognRef.current = recog;
    setIsRecording(true);
  }, [isRecording, onTranscript]);

  return { isRecording, toggleRecording };
}
