"use client";

import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Target, Trophy, BookOpen, Loader2, CheckCircle } from "lucide-react";
import { examGoalsSchema, type ExamGoalsData } from "../schemas";
import { EXAM_TYPES, SCORE_PRESETS, POPULAR_COURSES } from "../constants";
import { FieldWrapper, SectionHeader, ChipGroup, inputCls } from "./Formprimitives";

interface Props {
  defaultValues?: Partial<ExamGoalsData>;
  onSubmit: (data: ExamGoalsData) => Promise<void>;
  onBack: () => void;
  isSubmitting: boolean;
  onSkip: () => void;
  isSkipping?: boolean;
}

export function Step3ExamGoals({
  defaultValues,
  onSubmit,
  onBack,
  isSubmitting,
  onSkip,
  isSkipping,
}: Props) {
  const [courseQuery, setCourseQuery] = useState(defaultValues?.targetCourse ?? "");
  const [showSuggestions, setShowSuggestions] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    setValue,
    formState: { errors },
  } = useForm<ExamGoalsData>({
    resolver: zodResolver(examGoalsSchema),
    defaultValues: { examTargets: [], ...defaultValues },
    mode: "onChange",
  });

  const courseSuggestions = POPULAR_COURSES.filter((c) =>
    c.toLowerCase().includes(courseQuery.toLowerCase()),
  );

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Exam targets */}
      <div
        className="bg-white rounded-2xl border p-6"
        style={{ borderColor: "rgba(30,80,50,0.08)" }}>
        <SectionHeader
          icon={Target}
          title="Exam Targets"
          description="Which exams are you preparing for? We'll customise your practice questions and study materials."
          color="#ef4444"
        />

        <Controller
          control={control}
          name="examTargets"
          render={({ field, fieldState }) => (
            <ChipGroup
              options={EXAM_TYPES.map((e) => ({
                id: e.id,
                label: e.label,
                description: e.description,
                color: e.color,
              }))}
              value={field.value ?? []}
              onChange={field.onChange}
              error={fieldState.error}
            />
          )}
        />

        {/* Exam descriptions */}
        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-2">
          {EXAM_TYPES.map((e) => (
            <div key={e.id} className="flex items-start gap-2 text-[11px] text-text-muted">
              <span
                className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0"
                style={{ background: e.color }}
              />
              <span>
                <strong style={{ color: e.color }}>{e.label}</strong> — {e.description}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Score target */}
      <div
        className="bg-white rounded-2xl border p-6"
        style={{ borderColor: "rgba(30,80,50,0.08)" }}>
        <SectionHeader
          icon={Trophy}
          title="Score & Course Target"
          description="Setting a clear goal keeps you motivated and helps us track your progress."
          color="#f59e0b"
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <FieldWrapper
              label="Target Score"
              required
              error={errors.targetScore}
              hint="JAMB scores are out of 400; WAEC/NECO are percentages">
              <input
                {...register("targetScore")}
                type="number"
                placeholder="e.g., 320 (JAMB) or 85 (WAEC %)"
                min={1}
                max={400}
                className={inputCls(errors.targetScore)}
              />
            </FieldWrapper>

            {/* Score presets */}
            <div className="mt-3">
              <p className="text-[11px] text-text-muted mb-2">Quick presets:</p>
              <div className="flex flex-wrap gap-2">
                {SCORE_PRESETS.map((p) => (
                  <button
                    key={p.value + p.exam}
                    type="button"
                    onClick={() => setValue("targetScore", p.value, { shouldValidate: true })}
                    className="px-3 py-1.5 rounded-lg bg-cream border border-gray-200 hover:border-green-400 text-[12px] font-semibold text-green-900 transition-all group"
                    title={p.description}>
                    {p.label}
                    <span className="ml-1 text-[10px] text-text-muted capitalize">({p.exam})</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Target course with autocomplete */}
          <div>
            <FieldWrapper
              label="Target Course / Programme"
              required
              error={errors.targetCourse}
              hint="What course do you want to study?">
              <div className="relative">
                <BookOpen
                  size={16}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none"
                />
                <input
                  {...register("targetCourse")}
                  type="text"
                  value={courseQuery}
                  onChange={(e) => {
                    setCourseQuery(e.target.value);
                    setValue("targetCourse", e.target.value, { shouldValidate: true });
                    setShowSuggestions(true);
                  }}
                  onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
                  onFocus={() => setShowSuggestions(true)}
                  placeholder="e.g., Medicine and Surgery"
                  className={`${inputCls(errors.targetCourse)} pl-10`}
                  autoComplete="off"
                />
                {showSuggestions && courseQuery.length >= 2 && courseSuggestions.length > 0 && (
                  <div className="absolute z-20 top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-48 overflow-y-auto">
                    {courseSuggestions.map((c) => (
                      <button
                        key={c}
                        type="button"
                        onMouseDown={() => {
                          setCourseQuery(c);
                          setValue("targetCourse", c, { shouldValidate: true });
                          setShowSuggestions(false);
                        }}
                        className="w-full px-4 py-2.5 text-left text-[13px] text-green-900 hover:bg-green-50 transition-colors first:rounded-t-xl last:rounded-b-xl">
                        {c}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </FieldWrapper>

            {/* Popular suggestions */}
            <div className="mt-3">
              <p className="text-[11px] text-text-muted mb-2">Popular courses:</p>
              <div className="flex flex-wrap gap-1.5">
                {POPULAR_COURSES.slice(0, 6).map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => {
                      setCourseQuery(c);
                      setValue("targetCourse", c, { shouldValidate: true });
                    }}
                    className="px-2.5 py-1 rounded-full bg-cream border border-gray-200 hover:border-green-400 text-[11px] text-text-muted hover:text-green-900 transition-all">
                    {c}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <div className="flex justify-between items-center">
        <button
          type="button"
          onClick={onBack}
          disabled={isSubmitting || isSkipping}
          className="px-6 py-3 rounded-xl border-2 border-gray-200 text-[14px] font-semibold text-text-muted hover:bg-gray-50 transition-all disabled:opacity-50">
          ← Back
        </button>
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={onSkip}
            disabled={isSubmitting || isSkipping}
            className="text-[13px] font-medium text-text-muted hover:text-green-800 transition-colors disabled:opacity-50">
            Skip for now
          </button>
          <button
            type="submit"
            disabled={isSubmitting || isSkipping}
            className="px-8 py-3 rounded-xl bg-green-800 text-white font-semibold hover:bg-green-700 transition-all shadow-lg hover:shadow-xl text-[14px] flex items-center gap-2 disabled:opacity-70">
            {isSubmitting ? (
              <>
                <Loader2 size={16} className="animate-spin" /> Setting up your account…
              </>
            ) : (
              <>
                <CheckCircle size={16} /> Complete Registration
              </>
            )}
          </button>
        </div>
      </div>
    </form>
  );
}
