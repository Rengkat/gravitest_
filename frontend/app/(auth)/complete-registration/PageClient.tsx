"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { CheckCircle, Mail, AlertCircle } from "lucide-react";

import { type StepNumber } from "./constants";
import type {
  PersonalInfoData,
  AcademicInfoData,
  ExamGoalsData,
  FullRegistration,
} from "./schemas";
import { Step3ExamGoals } from "./components/Step3examgoals";
import { Step2AcademicInfo } from "./components/Step2academicinfo";
import { Step1PersonalInfo } from "./components/Step1personalinfo";
import { SuccessState } from "./components/Successstate";
import { StepProgress } from "./components/Stepprogress";
import { toBackendState, toBackendExamTypes, toBackendSubjects } from "./apiMapping";
import { toNigerianE164 } from "@/utils/registerUtils";
import { extractErrorMessage } from "@/lib/api/client";
import * as profileApi from "@/lib/api/profile";
import { useAuthStore } from "@/lib/store/authStore";

export default function CompleteRegistrationPage() {
  const searchParams = useSearchParams();
  const emailParam = searchParams.get("email") ?? "";
  const authUser = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);
  const email = authUser?.email || emailParam;

  const [currentStep, setCurrentStep] = useState<StepNumber>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSkipping, setIsSkipping] = useState(false);
  const [isDone, setIsDone] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Accumulated form data across steps. First/last name were already
  // captured at registration (see authUser) — seed them here so Step 1
  // doesn't make the user retype what we already have. Still editable in
  // case they want to correct it.
  const [formData, setFormData] = useState<Partial<FullRegistration>>(() => ({
    firstName: authUser?.firstName,
    lastName: authUser?.lastName,
  }));

  // ─── STEP HANDLERS ──────────────────────────────────────
  const handleStep1 = (data: PersonalInfoData) => {
    setFormData((prev) => ({ ...prev, ...data }));
    setCurrentStep(2);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleStep2 = (data: AcademicInfoData) => {
    setFormData((prev) => ({ ...prev, ...data }));
    setCurrentStep(3);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleStep3 = async (data: ExamGoalsData) => {
    setIsSubmitting(true);
    setSubmitError(null);
    const payload: FullRegistration = { ...(formData as any), ...data };

    try {
      // ── Step 1 fields live on the User record ──
      const normalizedPhone = toNigerianE164(payload.phoneNumber) ?? payload.phoneNumber;
      await profileApi.updateMe({
        dateOfBirth: payload.dateOfBirth,
        gender: payload.gender,
        phoneNumber: normalizedPhone,
        stateOfResidence: toBackendState(payload.stateOfResidence),
        lga: payload.lga,
      });

      // ── Steps 2 & 3 live on the StudentProfile record ──
      await profileApi.updateAcademicProfile({
        currentSchool: payload.currentSchool,
        currentClass: payload.currentClass,
        graduationYear: parseInt(payload.graduationYear, 10),
        focusSubjects: toBackendSubjects(payload.focusSubjects),
        examTargets: toBackendExamTypes(payload.examTargets),
        targetScore: parseInt(payload.targetScore, 10),
        targetCourse: payload.targetCourse,
      });

      // ── Flip isOnboarded so middleware stops routing here ──
      const updated = await profileApi.completeOnboarding();
      if (authUser) {
        setUser({ ...authUser, isOnboarded: updated.isOnboarded });
      }

      setFormData((prev) => ({ ...prev, ...data }));
      setIsDone(true);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      setSubmitError(extractErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBack = () => {
    setCurrentStep((prev) => (prev > 1 ? ((prev - 1) as StepNumber) : prev));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Profile completion isn't compulsory for now — let the user bypass the
  // wizard entirely from any step. Whatever they've already filled in on
  // earlier steps is simply discarded (nothing is sent to the backend);
  // we only flip isOnboarded so middleware stops routing them here, then
  // send them straight to the dashboard. They can fill the rest in later
  // from their profile settings.
  const handleSkip = async () => {
    if (isSkipping || isSubmitting) return;
    setIsSkipping(true);
    setSubmitError(null);
    try {
      const updated = await profileApi.completeOnboarding();
      if (authUser) {
        setUser({ ...authUser, isOnboarded: updated.isOnboarded });
      }
      // Full navigation (not router.push) so middleware re-reads the
      // freshly-updated gt_onboarded cookie rather than a cached route.
      window.location.href = "/dashboard";
    } catch (err) {
      setSubmitError(extractErrorMessage(err));
      setIsSkipping(false);
    }
  };

  // ─── RENDER ──────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-cream py-12 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Page header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 mb-4 shadow-md">
            <CheckCircle size={32} className="text-green-600" />
          </div>
          <h1 className="font-serif text-3xl text-green-900 mb-2">Complete Your Profile</h1>
          <p className="text-text-muted">
            Welcome to Gravitest! Let&apos;s set up your personalised learning journey.
          </p>
          {email && (
            <div className="inline-flex items-center gap-1.5 mt-2 px-3 py-1 rounded-full bg-green-50 text-[13px] text-green-700">
              <Mail size={13} />
              {email}
            </div>
          )}
        </div>

        {/* Step progress — hidden on success */}
        {!isDone && <StepProgress currentStep={currentStep} />}

        {submitError && (
          <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 border border-red-100 rounded-xl px-4 py-3 mb-5 max-w-2xl mx-auto">
            <AlertCircle size={16} strokeWidth={2.5} className="shrink-0" />
            {submitError}
          </div>
        )}

        {/* Step content */}
        {isDone ? (
          <div
            className="bg-white rounded-2xl border p-8"
            style={{ borderColor: "rgba(30,80,50,0.08)" }}>
            <SuccessState data={formData} />
          </div>
        ) : (
          <>
            {currentStep === 1 && (
              <Step1PersonalInfo
                defaultValues={formData as Partial<PersonalInfoData>}
                onNext={handleStep1}
                email={email}
                onSkip={handleSkip}
                isSkipping={isSkipping}
              />
            )}
            {currentStep === 2 && (
              <Step2AcademicInfo
                defaultValues={formData as Partial<AcademicInfoData>}
                onNext={handleStep2}
                onBack={handleBack}
                onSkip={handleSkip}
                isSkipping={isSkipping}
              />
            )}
            {currentStep === 3 && (
              <Step3ExamGoals
                defaultValues={formData as Partial<ExamGoalsData>}
                onSubmit={handleStep3}
                onBack={handleBack}
                isSubmitting={isSubmitting}
                onSkip={handleSkip}
                isSkipping={isSkipping}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
}
