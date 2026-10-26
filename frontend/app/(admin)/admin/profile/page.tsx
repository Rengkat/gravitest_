import { Suspense } from "react";
import { Loader2 } from "lucide-react";
import ProfilePage from "@/app/(student)/dashboard/profile/components/ProfileClientPage";

// Admin/super-admin profile. Rendered inside the admin layout (admin sidebar +
// header). The shared profile component already hides student-only sections
// (Academic, Billing) and learner stats (XP, level, rank, streak) by role.
export default function AdminProfilePage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center py-24">
          <Loader2 size={32} className="animate-spin text-green-600" />
        </div>
      }>
      <ProfilePage />
    </Suspense>
  );
}
