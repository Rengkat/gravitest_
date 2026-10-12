import { ChevronRight, GraduationCap, BriefcaseBusiness } from "lucide-react";
import { SECONDARY_EXAMS, PROFESSIONAL_EXAMS } from "@/lib/constants/practice";
import { ExamCategory, PracticeConfig } from "@/types/practice";
import ExamCard from "./ExamCard";
import ProfCard from "./ProfileCard";

interface StepOneExamCategoryProps {
  examCategory: ExamCategory;
  config: PracticeConfig;
  onChangeCategory: (cat: ExamCategory) => void;
  onUpdateConfig: (updates: Partial<PracticeConfig>) => void;
  onContinue: () => void;
}

export default function StepOneExamCategory({
  examCategory,
  config,
  onChangeCategory,
  onUpdateConfig,
  onContinue,
}: StepOneExamCategoryProps) {
  return (
    <div>
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">What are you preparing for?</h2>
        <p className="text-gray-500 text-sm">Choose the exam category that applies to you</p>
      </div>

      <div className="flex justify-center mb-8">
        <div className="inline-flex bg-gray-100 rounded-xl p-1 gap-1">
          {(["SECONDARY", "PROFESSIONAL"] as ExamCategory[]).map((cat) => (
            <button
              key={cat}
              onClick={() => onChangeCategory(cat)}
              className={`px-6 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 ${examCategory === cat ? "bg-white text-green-800 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}>
              <span className="inline-flex items-center gap-1.5">
                {cat === "SECONDARY" ? (
                  <>
                    <GraduationCap size={16} className="text-blue-600" />
                    <span>Secondary School</span>
                  </>
                ) : (
                  <>
                    <BriefcaseBusiness size={16} className="text-purple-600" />
                    <span>Professional</span>
                  </>
                )}
              </span>
            </button>
          ))}
        </div>
      </div>

      {examCategory === "SECONDARY" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          {SECONDARY_EXAMS.map((e) => (
            <ExamCard
              key={e.id}
              exam={e}
              selected={config.examType === e.id}
              onClick={() =>
                onUpdateConfig({
                  examType: e.id,
                  candidateType: undefined,
                  subject: undefined,
                  questionType: undefined,
                  professionalExam: undefined,
                })
              }
            />
          ))}
        </div>
      )}

      {examCategory === "PROFESSIONAL" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          {PROFESSIONAL_EXAMS.map((e) => (
            <ProfCard
              key={e.id}
              exam={e}
              selected={config.professionalExam === e.id}
              onClick={() => onUpdateConfig({ examType: "PROFESSIONAL", candidateType: undefined, professionalExam: e.id })}
            />
          ))}
        </div>
      )}

      <div className="flex justify-center">
        <button
          onClick={() => config.examType && onContinue()}
          disabled={!config.examType}
          className={`px-10 py-3.5 rounded-xl font-bold text-sm flex items-center gap-2 transition-all duration-200 ${config.examType ? "bg-green-800 text-white hover:bg-green-700 shadow-lg hover:shadow-xl hover:-translate-y-0.5" : "bg-gray-100 text-gray-400 cursor-not-allowed"}`}>
          Continue <ChevronRight size={18} />
        </button>
      </div>
    </div>
  );
}
