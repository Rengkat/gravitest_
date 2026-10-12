import type { Metadata } from "next";
import { Suspense } from "react";
import AdminOnboardingClient from "./PageClient";

export const metadata: Metadata = {
  title: "Complete Your Admin Account | Gravitest",
  description: "Accept your Gravitest admin invitation and set up your account.",
  robots: {
    index: false,
    follow: false,
  },
};

const page = () => {
  return (
    <div>
      <Suspense fallback={null}>
        <AdminOnboardingClient />
      </Suspense>
    </div>
  );
};

export default page;
