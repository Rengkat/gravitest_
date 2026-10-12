"use client";

import { useEffect, useRef } from "react";
import toast from "react-hot-toast";
import { WifiOff, Wifi } from "lucide-react";

export function NetworkStatusToast() {
  const hasGoneOffline = useRef(false);

  useEffect(() => {
    const handleOffline = () => {
      hasGoneOffline.current = true;
      toast(
        (t) => (
          <div className="flex items-center gap-2">
            <WifiOff size={16} className="text-red-500 shrink-0" />
            <span>You're offline — some actions won't work until you reconnect.</span>
          </div>
        ),
        { id: "network-status", duration: Infinity },
      );
    };

    const handleOnline = () => {
      if (!hasGoneOffline.current) return; // don't announce on initial mount
      toast(
        (t) => (
          <div className="flex items-center gap-2">
            <Wifi size={16} className="text-green-600 shrink-0" />
            <span>Back online.</span>
          </div>
        ),
        { id: "network-status", duration: 3000 },
      );
    };

    window.addEventListener("offline", handleOffline);
    window.addEventListener("online", handleOnline);
    return () => {
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("online", handleOnline);
    };
  }, []);

  return null;
}
