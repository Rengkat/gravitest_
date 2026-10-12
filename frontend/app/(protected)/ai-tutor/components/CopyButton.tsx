import React, { useState } from "react";
import { CheckCircle, Copy } from "lucide-react";

interface CopyButtonProps {
  text: string;
}

export default function CopyButton({ text }: CopyButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(text).catch(() => {
      /* silently fail — clipboard API may be unavailable in some contexts */
    });
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <button
      onClick={handleCopy}
      aria-label={copied ? "Copied to clipboard" : "Copy message"}
      aria-live="polite"
      title={copied ? "Copied!" : "Copy"}
      className={`p-1 border-none bg-transparent cursor-pointer flex items-center transition-colors rounded focus-visible:outline-2 focus-visible:outline-green-500 ${
        copied ? "text-green-500" : "text-text-light hover:text-text-muted"
      }`}>
      {copied ? (
        <CheckCircle size={14} aria-hidden="true" />
      ) : (
        <Copy size={14} aria-hidden="true" />
      )}
    </button>
  );
}
