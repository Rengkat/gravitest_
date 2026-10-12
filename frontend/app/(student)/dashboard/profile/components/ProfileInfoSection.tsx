"use client";

import { Save, Loader2 } from "lucide-react";
import { ProfileFormData } from "@/types/profile";
import { NIGERIAN_STATES } from "@/lib/constants/profile";

interface ProfileInfoSectionProps {
  formData: ProfileFormData;
  isEditing: boolean;
  isSaving: boolean;
  onChange: (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) => void;
  onSave: () => void;
  onCancel: () => void;
}

function Field({
  label,
  children,
  hint,
}: {
  label: string;
  children: React.ReactNode;
  hint?: string;
}) {
  return (
    <div>
      <label className="block text-[12px] font-bold text-gray-600 uppercase tracking-wider mb-1.5">
        {label}
      </label>
      {children}
      {hint && <p className="text-[11px] text-gray-400 mt-1">{hint}</p>}
    </div>
  );
}

const inputClass = (disabled: boolean) =>
  `w-full px-3.5 py-2.5 rounded-xl border text-[14px] transition-all focus:outline-none ${
    disabled
      ? "bg-gray-50 border-gray-100 text-gray-600 cursor-default"
      : "bg-white border-gray-200 text-gray-900 focus:border-green-400 focus:ring-2 focus:ring-green-500/20"
  }`;

export default function ProfileInfoSection({
  formData,
  isEditing,
  isSaving,
  onChange,
  onSave,
  onCancel,
}: ProfileInfoSectionProps) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-[16px] font-bold text-gray-900">Personal Information</h3>
          <p className="text-[12px] text-gray-500 mt-0.5">
            Your basic details and contact information
          </p>
        </div>
        {isEditing && (
          <span className="text-[11px] font-semibold text-green-700 bg-green-50 border border-green-200 px-2.5 py-1 rounded-full">
            Editing
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <Field label="First Name">
          <input
            title="first name"
            type="text"
            name="firstName"
            value={formData.firstName}
            onChange={onChange}
            disabled={!isEditing}
            className={inputClass(!isEditing)}
          />
        </Field>

        <Field label="Last Name">
          <input
            title="last name"
            type="text"
            name="lastName"
            value={formData.lastName}
            onChange={onChange}
            disabled={!isEditing}
            className={inputClass(!isEditing)}
          />
        </Field>

        <Field label="Middle Name" hint="Optional">
          <input
            type="text"
            name="middleName"
            value={formData.middleName}
            onChange={onChange}
            disabled={!isEditing}
            placeholder="Enter middle name"
            className={inputClass(!isEditing)}
          />
        </Field>

        <Field label="Phone Number">
          <input
            type="tel"
            name="phoneNumber"
            value={formData.phoneNumber}
            onChange={onChange}
            disabled={!isEditing}
            placeholder="+234 800 000 0000"
            className={inputClass(!isEditing)}
          />
        </Field>

        <Field label="Date of Birth">
          <input
            title="dob"
            type="date"
            name="dateOfBirth"
            value={formData.dateOfBirth}
            onChange={onChange}
            disabled={!isEditing}
            className={inputClass(!isEditing)}
          />
        </Field>

        <Field label="Gender">
          <select
            title="gender"
            name="gender"
            value={formData.gender}
            onChange={onChange}
            disabled={!isEditing}
            className={inputClass(!isEditing)}>
            <option value="">Select gender</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
            <option value="other">Other</option>
            <option value="prefer_not_to_say">Prefer not to say</option>
          </select>
        </Field>

        <Field label="State of Residence">
          <select
            title="state of residence"
            name="stateOfResidence"
            value={formData.stateOfResidence}
            onChange={onChange}
            disabled={!isEditing}
            className={inputClass(!isEditing)}>
            <option value="">Select state</option>
            {NIGERIAN_STATES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </Field>

        <Field label="LGA" hint="Local Government Area">
          <input
            type="text"
            name="lga"
            value={formData.lga}
            onChange={onChange}
            disabled={!isEditing}
            placeholder="Enter your LGA"
            className={inputClass(!isEditing)}
          />
        </Field>
      </div>

      <div className="mt-5">
        <Field label="Bio" hint="Max 250 characters">
          <textarea
            name="bio"
            value={formData.bio}
            onChange={onChange}
            disabled={!isEditing}
            rows={3}
            maxLength={250}
            placeholder="Tell us a bit about yourself, your goals and interests..."
            className={`${inputClass(!isEditing)} resize-none`}
          />
          {isEditing && (
            <p className="text-[11px] text-gray-400 mt-1 text-right">{formData.bio.length}/250</p>
          )}
        </Field>
      </div>

      {isEditing && (
        <div className="flex gap-3 mt-6 pt-5 border-t border-gray-100">
          <button
            onClick={onSave}
            disabled={isSaving}
            className="flex items-center gap-2 px-5 py-2.5 bg-green-600 text-white rounded-xl text-[14px] font-semibold hover:bg-green-700 transition-colors disabled:opacity-60 shadow-sm">
            {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            {isSaving ? "Saving…" : "Save Changes"}
          </button>
          <button
            onClick={onCancel}
            className="px-5 py-2.5 border border-gray-200 text-gray-600 rounded-xl text-[14px] font-semibold hover:bg-gray-50 transition-colors">
            Discard
          </button>
        </div>
      )}
    </div>
  );
}
