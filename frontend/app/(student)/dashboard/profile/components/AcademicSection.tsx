"use client";

import { useState } from "react";
import { Save, Loader2, GraduationCap, Target, School, Star, X, Plus } from "lucide-react";
import { AcademicFormData } from "@/types/profile";
import { CLASS_OPTIONS, EXAM_OPTIONS } from "@/lib/constants/profile";

interface AcademicSectionProps {
  data: AcademicFormData;
  onSave: (data: AcademicFormData) => Promise<void>;
}

export default function AcademicSection({ data, onSave }: AcademicSectionProps) {
  const [form, setForm] = useState<AcademicFormData>(data);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const toggleExam = (exam: string) => {
    if (!isEditing) return;
    setForm((prev) => ({
      ...prev,
      targetExams: prev.targetExams.includes(exam)
        ? prev.targetExams.filter((e) => e !== exam)
        : [...prev.targetExams, exam],
    }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    await onSave(form);
    setIsSaving(false);
    setIsEditing(false);
  };

  const inputClass = (disabled: boolean) =>
    `w-full px-3.5 py-2.5 rounded-xl border text-[14px] transition-all focus:outline-none ${
      disabled
        ? "bg-gray-50 border-gray-100 text-gray-600 cursor-default"
        : "bg-white border-gray-200 text-gray-900 focus:border-green-400 focus:ring-2 focus:ring-green-500/20"
    }`;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-[16px] font-bold text-gray-900">Academic Information</h3>
          <p className="text-[12px] text-gray-500 mt-0.5">Your school details and exam goals</p>
        </div>
        <button
          onClick={() => setIsEditing((v) => !v)}
          className={`px-4 py-2 rounded-xl text-[13px] font-semibold transition-all ${
            isEditing
              ? "bg-gray-100 text-gray-700 hover:bg-gray-200"
              : "bg-green-600 text-white hover:bg-green-700 shadow-sm"
          }`}>
          {isEditing ? "Cancel" : "Edit"}
        </button>
      </div>

      <div className="space-y-5">
        {/* Current Class */}
        <div>
          <label className="block text-[12px] font-bold text-gray-600 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
            <GraduationCap size={11} /> Current Class
          </label>
          <select
            title="editing"
            value={form.currentClass}
            onChange={(e) => setForm({ ...form, currentClass: e.target.value })}
            disabled={!isEditing}
            className={inputClass(!isEditing)}>
            <option value="">Select class</option>
            {CLASS_OPTIONS.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        {/* School */}
        <div>
          <label className="block text-[12px] font-bold text-gray-600 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
            <School size={11} /> School / Institution
          </label>
          <input
            type="text"
            value={form.school}
            onChange={(e) => setForm({ ...form, school: e.target.value })}
            disabled={!isEditing}
            placeholder="Enter your school name"
            className={inputClass(!isEditing)}
          />
        </div>

        {/* Target Exams */}
        <div>
          <label className="block text-[12px] font-bold text-gray-600 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <Target size={11} /> Target Examinations
          </label>
          <div className="flex flex-wrap gap-2">
            {EXAM_OPTIONS.map((exam) => {
              const selected = form.targetExams.includes(exam);
              return (
                <button
                  key={exam}
                  onClick={() => toggleExam(exam)}
                  disabled={!isEditing}
                  className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-[13px] font-semibold border transition-all ${
                    selected
                      ? "bg-green-600 text-white border-green-600 shadow-sm"
                      : isEditing
                        ? "bg-white text-gray-600 border-gray-200 hover:border-green-400 hover:text-green-700"
                        : "bg-gray-50 text-gray-500 border-gray-100 cursor-default"
                  }`}>
                  {selected && isEditing ? (
                    <X size={11} />
                  ) : !selected && isEditing ? (
                    <Plus size={11} />
                  ) : null}
                  {exam.toUpperCase().replace("_", " ")}
                </button>
              );
            })}
          </div>
          {form.targetExams.length === 0 && !isEditing && (
            <p className="text-[12px] text-gray-400 mt-1">No target exams set</p>
          )}
        </div>

        {/* Target University / Course / Score */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-[12px] font-bold text-gray-600 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <Star size={11} /> Target University
            </label>
            <input
              type="text"
              value={form.targetUniversity}
              onChange={(e) => setForm({ ...form, targetUniversity: e.target.value })}
              disabled={!isEditing}
              placeholder="e.g. UNILAG"
              className={inputClass(!isEditing)}
            />
          </div>
          <div>
            <label className="block text-[12px] font-bold text-gray-600 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <Target size={11} /> Target Course
            </label>
            <input
              type="text"
              value={form.targetCourse}
              onChange={(e) => setForm({ ...form, targetCourse: e.target.value })}
              disabled={!isEditing}
              placeholder="e.g. Computer Science"
              className={inputClass(!isEditing)}
            />
          </div>
        </div>

        <div>
          <label className="block text-[12px] font-bold text-gray-600 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
            <GraduationCap size={11} /> Target Score
          </label>
          <input
            type="number"
            min={0}
            max={400}
            value={form.targetScore}
            onChange={(e) => setForm({ ...form, targetScore: e.target.value })}
            disabled={!isEditing}
            placeholder="e.g. 320"
            className={inputClass(!isEditing)}
          />
        </div>
      </div>

      {/* Info note about integration */}
      <div className="mt-5 p-3.5 bg-blue-50 border border-blue-100 rounded-xl">
        <p className="text-[12px] text-blue-700">
          <span className="font-bold">Note:</span> Your academic information is used to personalise
          your study plan and recommend the right resources.
        </p>
      </div>

      {isEditing && (
        <div className="flex gap-3 mt-5 pt-5 border-t border-gray-100">
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center gap-2 px-5 py-2.5 bg-green-600 text-white rounded-xl text-[14px] font-semibold hover:bg-green-700 disabled:opacity-60 shadow-sm">
            {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            {isSaving ? "Saving…" : "Save"}
          </button>
          <button
            onClick={() => {
              setForm(data);
              setIsEditing(false);
            }}
            className="px-5 py-2.5 border border-gray-200 text-gray-600 rounded-xl text-[14px] font-semibold hover:bg-gray-50">
            Discard
          </button>
        </div>
      )}
    </div>
  );
}
