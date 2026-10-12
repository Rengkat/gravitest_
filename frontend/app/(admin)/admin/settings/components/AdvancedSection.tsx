"use client";

import ComingSoon from "./ComingSoon";

// "Reset all settings" and "clear server cache" used to live here —
// neither has anything real to act on: there's no platform-config
// backend to reset (see PlatformSection/ComingSoon components), and no
// cache-clearing endpoint anywhere in the API.
export default function AdvancedSection() {
  return (
    <ComingSoon
      title="Advanced"
      description="No destructive platform-wide actions are wired to a real backend yet. Your own appearance preferences can be changed directly in the Appearance tab."
    />
  );
}
