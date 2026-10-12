"use client";

import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { School, BookOpen } from "lucide-react";
import { academicInfoSchema, type AcademicInfoData } from "../schemas";
import { CLASSES, GRADUATION_YEARS, SUBJECTS } from "../constants";
import { FieldWrapper, SectionHeader, SubjectChipGrid, inputCls } from "./Formprimitives";

interface Props {
  defaultValues?: Partial<AcademicInfoData>;
  onNext: (data: AcademicInfoData) => void;
  onBack: () => void;
  onSkip: () => void;
  isSkipping?: boolean;
}

export function Step2AcademicInfo({ defaultValues, onNext, onBack, onSkip, isSkipping }: Props) {
  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<AcademicInfoData>({
    resolver: zodResolver(academicInfoSchema),
    defaultValues: { focusSubjects: [], ...defaultValues },
    mode: "onChange",
  });

  return (
    <form onSubmit={handleSubmit(onNext)} className="space-y-6">
      {/* School details */}
      <div
        className="bg-white rounded-2xl border p-6"
        style={{ borderColor: "rgba(30,80,50,0.08)" }}>
        <SectionHeader
          icon={School}
          title="School Information"
          description="Tell us about your current academic level and institution."
          color="#8b5cf6"
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FieldWrapper label="Current School" required error={errors.currentSchool}>
            <div className="relative">
              <School
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none"
              />
              <input
                {...register("currentSchool")}
                type="text"
                placeholder="e.g., Lagos Preparatory School"
                className={`${inputCls(errors.currentSchool)} pl-10`}
              />
            </div>
          </FieldWrapper>

          <FieldWrapper label="Current Class / Level" required error={errors.currentClass}>
            <select {...register("currentClass")} className={inputCls(errors.currentClass)}>
              <option value="">Select class</option>
              <optgroup label="Junior Secondary">
                {CLASSES.filter((c) => c.startsWith("JSS")).map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </optgroup>
              <optgroup label="Senior Secondary">
                {CLASSES.filter((c) => c.startsWith("SS")).map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </optgroup>
              <optgroup label="Higher Education">
                {CLASSES.filter((c) => c.includes("Level") || c === "Postgraduate").map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </optgroup>
            </select>
          </FieldWrapper>

          <FieldWrapper label="Expected Graduation Year" required error={errors.graduationYear}>
            <select {...register("graduationYear")} className={inputCls(errors.graduationYear)}>
              <option value="">Select year</option>
              {GRADUATION_YEARS.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </FieldWrapper>
        </div>
      </div>

      {/* Focus subjects */}
      <div
        className="bg-white rounded-2xl border p-6"
        style={{ borderColor: "rgba(30,80,50,0.08)" }}>
        <SectionHeader
          icon={BookOpen}
          title="Focus Subjects"
          description="Pick up to 6 subjects you want to prioritise. We'll tailor your content and practice questions around these."
          color="#f59e0b"
        />

        <Controller
          control={control}
          name="focusSubjects"
          render={({ field, fieldState }) => (
            <SubjectChipGrid
              subjects={SUBJECTS}
              value={field.value ?? []}
              onChange={field.onChange}
              max={6}
              error={fieldState.error}
            />
          )}
        />
      </div>

      {/* Nav */}
      <div className="flex justify-between items-center">
        <button
          type="button"
          onClick={onBack}
          className="px-6 py-3 rounded-xl border-2 border-gray-200 text-[14px] font-semibold text-text-muted hover:bg-gray-50 transition-all">
          ← Back
        </button>
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={onSkip}
            disabled={isSkipping}
            className="text-[13px] font-medium text-text-muted hover:text-green-800 transition-colors disabled:opacity-50">
            Skip for now
          </button>
          <button
            type="submit"
            className="px-8 py-3 rounded-xl bg-green-800 text-white font-semibold hover:bg-green-700 transition-all shadow-lg hover:shadow-xl text-[14px] flex items-center gap-2">
            Continue →
          </button>
        </div>
      </div>
    </form>
  );
}
