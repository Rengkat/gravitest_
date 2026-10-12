"use client";

import { useState, useCallback, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { ProfileSection, ProfileFormData, AcademicFormData } from "@/types/profile";
import { useAuthStore } from "@/lib/store/authStore";

import ProfileSidebar from "./ProfileSidebar";
import ProfileHeader from "./ProfileHeader";
import ProfileInfoSection from "./ProfileInfoSection";
import AcademicSection from "./AcademicSection";
import SecuritySection from "./SecuritySection";
import NotificationsSection from "./NotificationsSection";
import { ConnectedAccountsSection, BillingSection } from "./ConnectedAndBilling";
import { useProfile } from "../useProfile";

const VALID_SECTIONS: ProfileSection[] = [
  "profile",
  "academic",
  "security",
  "notifications",
  "connected",
  "billing",
];

export default function ProfilePage() {
  const searchParams = useSearchParams();
  const [activeSection, setActiveSection] = useState<ProfileSection>(() => {
    const requested = searchParams.get("section");
    return VALID_SECTIONS.includes(requested as ProfileSection)
      ? (requested as ProfileSection)
      : "profile";
  });
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const logout = useAuthStore((s) => s.logout);

  const { isLoading, error, reload, profile, formData, academicFormData, saveProfile, saveAcademic } =
    useProfile();

  const [localFormData, setLocalFormData] = useState<ProfileFormData | null>(null);

  useEffect(() => {
    if (formData && !isEditing) setLocalFormData(formData);
  }, [formData, isEditing]);

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      setLocalFormData((prev) => (prev ? { ...prev, [e.target.name]: e.target.value } : prev));
    },
    [],
  );

  const handleSaveProfile = async () => {
    if (!localFormData) return;
    setIsSaving(true);
    try {
      await saveProfile(localFormData);
      setIsEditing(false);
    } catch {
      // errors are non-fatal here — form stays open so the user can retry
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveAcademic = async (data: AcademicFormData) => {
    await saveAcademic(data);
  };

  const handleToggleEdit = () => {
    if (isEditing && formData) {
      setLocalFormData(formData); // reset on cancel
    }
    setIsEditing((v) => !v);
  };

  const handleLogout = () => {
    if (confirm("Are you sure you want to sign out?")) {
      logout();
      window.location.href = "/login";
    }
  };

  if (isLoading || !profile || !localFormData) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 size={32} className="animate-spin text-green-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center gap-3">
        <p className="text-[14px] text-red-600">{error}</p>
        <button
          onClick={reload}
          className="px-4 py-2 rounded-xl bg-green-700 text-white text-[13px] font-medium hover:bg-green-800 transition-all">
          Try again
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      {/* Page title */}
      <div className="mb-6">
        <h1 className="text-[24px] font-black text-gray-900">My Profile</h1>
        <p className="text-[13px] text-gray-500 mt-1">
          Manage your personal information, security, and account preferences
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* ── Sidebar ── */}
        <ProfileSidebar
          user={profile}
          activeSection={activeSection}
          onSectionChange={(s) => {
            setActiveSection(s);
            setIsEditing(false);
          }}
          onLogout={handleLogout}
        />

        {/* ── Main content ── */}
        <div className="lg:col-span-3 space-y-0">
          {activeSection === "profile" && (
            <>
              <ProfileHeader
                user={profile}
                isEditing={isEditing}
                onToggleEdit={handleToggleEdit}
                onAvatarChange={() => reload()}
              />
              <ProfileInfoSection
                formData={localFormData}
                isEditing={isEditing}
                isSaving={isSaving}
                onChange={handleInputChange}
                onSave={handleSaveProfile}
                onCancel={handleToggleEdit}
              />
            </>
          )}

          {activeSection === "academic" && (
            <>
              <ProfileHeader user={profile} isEditing={false} onToggleEdit={() => {}} />
              <AcademicSection data={academicFormData} onSave={handleSaveAcademic} />
            </>
          )}

          {activeSection === "security" && <SecuritySection />}

          {activeSection === "notifications" && <NotificationsSection />}

          {activeSection === "connected" && <ConnectedAccountsSection />}

          {activeSection === "billing" && <BillingSection />}
        </div>
      </div>
    </div>
  );
}
