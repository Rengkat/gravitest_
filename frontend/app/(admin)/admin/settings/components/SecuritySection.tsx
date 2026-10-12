"use client";

import ComingSoon from "./ComingSoon";

export default function SecuritySection() {
  return (
    <ComingSoon
      title="Security Settings"
      description="Session timeouts, login rate limits, and 2FA enforcement policies aren't configurable yet — these need a real backend settings store first. Password strength requirements are already enforced server-side (see the registration and password-reset flows)."
    />
  );
}
