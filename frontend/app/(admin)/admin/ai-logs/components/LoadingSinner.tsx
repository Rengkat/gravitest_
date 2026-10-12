"use client";

import { RefreshCw } from "lucide-react";

interface LoadingSpinnerProps {
  text?: string;
  size?: "sm" | "md" | "lg";
}

export function LoadingSpinner({ text = "Loading...", size = "md" }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: "w-4 h-4",
    md: "w-8 h-8",
    lg: "w-12 h-12",
  };

  const textSizes = {
    sm: "text-[12px]",
    md: "text-[14px]",
    lg: "text-[16px]",
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[400px]">
      <div className="relative">
        <div className="absolute inset-0 rounded-full border-4 border-green-100" />
        <RefreshCw className={`${sizeClasses[size]} text-green-800 animate-spin relative`} />
      </div>
      <div className={`mt-4 text-text-muted ${textSizes[size]}`}>{text}</div>
    </div>
  );
}
