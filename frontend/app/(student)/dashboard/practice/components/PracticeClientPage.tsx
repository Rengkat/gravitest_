"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Sparkles } from "lucide-react";
import toast from "react-hot-toast";
import { extractErrorMessage } from "@/lib/api/client";
import { PROFESSIONAL_EXAMS, SECONDARY_EXAMS } from "@/lib/constants/practice";
import { ExamCategory, PracticeConfig } from "@/types/practice";
import {
  createPracticeSession,
  partRoute,
  CbtPart,
  SessionMode,
} from "@/lib/session/practiceSession";
import StepIndicator from "./StepIndicator";
import StepOneExamCategory from "./StepOneExamCategory";
import StepTwoConfig from "./StepTwoConfig";
import StepThreeSummary from "./StepThreeSummary";
import { hasTheorySupport } from "../theoryAvailability";

export default function PracticePage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [examCategory, setExamCategory] = useState<ExamCategory>("SECONDARY");
  const [config, setConfig] = useState<PracticeConfig>({ examType: null });
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  const [sessionMode, setSessionMode] = useState<SessionMode>("practice");
  const [startWith, setStartWith] = useState<CbtPart>("mcq");

  const update = (updates: Partial<PracticeConfig>) =>
    setConfig((prev) => ({ ...prev, ...updates }));

  const isJamb = config.examType === "JAMB";
  const canProceed =
    config.examType === "PROFESSIONAL"
      ? !!config.professionalExam
      : isJamb
        ? (config.subjects?.length ?? 0) >= 1
        : !!config.examType && !!config.subject;

  const theoryAvailable = hasTheorySupport({
    examType: config.examType,
    subject: config.subject,
    professionalExam: config.professionalExam,
  });

  const buildPlan = (): CbtPart[] => {
    if (config.questionType === "THEORY" || config.questionType === "PRACTICAL") return ["theory"];
    if (config.questionType === "ALL" && theoryAvailable) {
      return startWith === "mcq" ? ["mcq", "theory"] : ["theory", "mcq"];
    }
    return ["mcq"];
  };

  const [isStarting, setIsStarting] = useState(false);

  const handleStartPractice = async () => {
    const plan = buildPlan();
    setIsStarting(true);
    try {
      const sessionId = await createPracticeSession(
        { ...config, topics: selectedTopics },
        plan,
        sessionMode,
      );
      router.push(partRoute(plan[0], sessionId));
    } catch (err) {
      toast.error(extractErrorMessage(err));
      setIsStarting(false);
    }
  };

  const exam =
    config.examType === "PROFESSIONAL"
      ? PROFESSIONAL_EXAMS.find((e) => e.id === config.professionalExam)
      : SECONDARY_EXAMS.find((e) => e.id === config.examType);

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50/60 via-white to-white py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-green-100 mb-4">
            <Sparkles size={14} className="text-green-700" />
            <span className="text-[12px] font-bold text-green-700 tracking-wide uppercase">
              Practice Center
            </span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
            Start a Practice Session
          </h1>
          <p className="text-gray-500 text-sm max-w-lg mx-auto">
            Configure your session in a few steps and start practising exam questions tailored to
            you.
          </p>
        </div>

        <StepIndicator step={step} />

        {step === 1 && (
          <StepOneExamCategory
            examCategory={examCategory}
            config={config}
            onChangeCategory={setExamCategory}
            onUpdateConfig={update}
            onContinue={() => setStep(2)}
          />
        )}

        {step === 2 && config.examType && (
          <StepTwoConfig
            config={config}
            isJamb={isJamb}
            theoryAvailable={theoryAvailable}
            startWith={startWith}
            sessionMode={sessionMode}
            selectedTopics={selectedTopics}
            canProceed={canProceed}
            onUpdateConfig={update}
            onChangeStartWith={setStartWith}
            onChangeSessionMode={setSessionMode}
            onChangeTopics={setSelectedTopics}
            onNext={() => setStep(3)}
            onBack={() => setStep(1)}
          />
        )}

        {step === 3 && (
          <StepThreeSummary
            config={config}
            exam={exam}
            sessionMode={sessionMode}
            selectedTopics={selectedTopics}
            theoryAvailable={theoryAvailable}
            startWith={startWith}
            onBack={() => setStep(2)}
            onStart={handleStartPractice}
            isStarting={isStarting}
          />
        )}
      </div>
    </div>
  );
}
