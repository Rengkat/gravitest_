"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";

export default function RouteProgressBar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [progress, setProgress] = useState(0);
  const [visible, setVisible] = useState(false);
  const [completing, setCompleting] = useState(false);
  const prevPath = useRef("");
  const timerRefs = useRef<ReturnType<typeof setTimeout>[]>([]);

  const currentPath = `${pathname}?${searchParams.toString()}`;

  const clearTimers = () => {
    timerRefs.current.forEach(clearTimeout);
    timerRefs.current = [];
  };

  useEffect(() => {
    if (prevPath.current === currentPath) return;
    prevPath.current = currentPath;

    clearTimers();
    setTimeout(() => {
      setVisible(true);
      setCompleting(false);
      setProgress(0);
    }, 0);

    // Eased ticks to ~85 %
    const ticks: [number, number][] = [
      [20, 30],
      [45, 100],
      [65, 200],
      [80, 320],
      [85, 420],
    ];
    ticks.forEach(([target, delay]) => {
      timerRefs.current.push(setTimeout(() => setProgress(target), delay));
    });

    // Complete
    timerRefs.current.push(
      setTimeout(() => {
        setCompleting(true);
        setProgress(100);
        timerRefs.current.push(
          setTimeout(() => {
            setVisible(false);
            setProgress(0);
            setCompleting(false);
          }, 400),
        );
      }, 500),
    );

    return clearTimers;
  }, [currentPath]);

  if (!visible) return null;

  return (
    <div
      data-testid="route-progress-bar"
      className="fixed top-0 left-0 right-0 z-[9999] pointer-events-none"
      style={{ height: 3 }}>
      {/* Bar */}
      <div
        style={{
          height: "100%",
          width: `${progress}%`,
          background: completing
            ? "linear-gradient(90deg, #1a4a2e, #2e8b57, #3aab6a, #f5c842)"
            : "linear-gradient(90deg, #1a4a2e, #3aab6a)",
          borderRadius: "0 2px 2px 0",
          boxShadow: "0 0 12px rgba(58,171,106,0.5)",
          opacity: completing ? 0 : 1,
          transition: completing
            ? "width 0.25s ease-out, opacity 0.2s ease"
            : `width ${progress < 20 ? 0.2 : progress < 65 ? 0.4 : 0.6}s cubic-bezier(0.4,0,0.2,1)`,
        }}
      />
      {/* Gold tip dot */}
      {!completing && (
        <div
          className="absolute rounded-full"
          style={{
            right: `${100 - progress}%`,
            top: "50%",
            transform: "translateY(-50%)",
            width: 7,
            height: 7,
            background: "#f5c842",
            boxShadow: "0 0 12px rgba(245,200,66,0.9)",
            transition: `right ${progress < 20 ? 0.2 : 0.5}s cubic-bezier(0.4,0,0.2,1)`,
          }}
        />
      )}
    </div>
  );
}
