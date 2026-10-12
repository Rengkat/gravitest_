"use client";

import ComingSoon from "./ComingSoon";

// This used to have raw text inputs for Paystack/Flutterwave/Termii
// secret keys that saved to local React state only — worth calling out
// specifically: even as a non-functional mock, collecting live secret
// keys into a plain-text browser input with no backend to receive them
// is the wrong pattern to leave in place. Payment/SMS provider
// credentials belong in server-side environment config, never in an
// admin UI form field.
export default function IntegrationsSection() {
  return (
    <ComingSoon
      title="Third-Party Integrations"
      description="Payment gateway and SMS provider configuration belongs in server-side environment variables, not an admin UI form — there's no backend endpoint for managing these, and there shouldn't be one that stores secret keys in the database unencrypted."
    />
  );
}
