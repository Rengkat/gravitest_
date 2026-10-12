import type { Metadata } from "next";
import { Suspense } from "react";
import CompleteRegistrationClient from "./PageClient";

export const metadata: Metadata = {
  title: "Complete Your Profile | Gravitest",
  description: "Finish setting up your Gravitest account with your academic details and exam goals.",
  robots: {
    index: false,
    follow: false,
  },
};

const page = () => {
  return (
    <div>
      <Suspense fallback={null}>
        <CompleteRegistrationClient />
      </Suspense>
    </div>
  );
};

export default page;
