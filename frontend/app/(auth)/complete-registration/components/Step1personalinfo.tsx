"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { User, MapPin, Phone, Calendar, Mail } from "lucide-react";
import { personalInfoSchema, type PersonalInfoData } from "../schemas";
import { NIGERIAN_STATES } from "../constants";
import { FieldWrapper, SectionHeader, inputCls } from "./Formprimitives";

interface Props {
  defaultValues?: Partial<PersonalInfoData>;
  onNext: (data: PersonalInfoData) => void;
  /** Email captured at registration — shown read-only, not part of this form's payload. */
  email?: string;
  onSkip: () => void;
  isSkipping?: boolean;
}

export function Step1PersonalInfo({ defaultValues, onNext, email, onSkip, isSkipping }: Props) {
  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
  } = useForm<PersonalInfoData>({
    resolver: zodResolver(personalInfoSchema),
    defaultValues: defaultValues ?? {},
    mode: "onChange",
  });

  return (
    <form onSubmit={handleSubmit(onNext)} className="space-y-6">
      {/* Name */}
      <div
        className="bg-white rounded-2xl border p-6"
        style={{ borderColor: "rgba(30,80,50,0.08)" }}>
        <SectionHeader
          icon={User}
          title="Personal Information"
          description="Tell us a bit about yourself so we can personalise your experience."
        />

        {/* Email — captured & verified at registration, not editable here */}
        {email && (
          <div className="mb-4">
            <label className="block text-[12px] font-semibold text-green-900 mb-1.5">
              Email Address
            </label>
            <div className="relative">
              <Mail
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none"
              />
              <input
                type="email"
                value={email}
                disabled
                readOnly
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-[14px] text-text-muted cursor-not-allowed"
              />
            </div>
            <p className="text-[11px] text-text-muted mt-1">
              Verified during registration — can&apos;t be changed here.
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FieldWrapper label="First Name" required error={errors.firstName}>
            <input
              {...register("firstName")}
              type="text"
              placeholder="e.g., Oluwaseun"
              className={inputCls(errors.firstName)}
            />
          </FieldWrapper>

          <FieldWrapper label="Last Name" required error={errors.lastName}>
            <input
              {...register("lastName")}
              type="text"
              placeholder="e.g., Adebayo"
              className={inputCls(errors.lastName)}
            />
          </FieldWrapper>

          <FieldWrapper label="Date of Birth" required error={errors.dateOfBirth}>
            <div className="relative">
              <Calendar
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none"
              />
              <input
                {...register("dateOfBirth")}
                type="date"
                className={`${inputCls(errors.dateOfBirth)} pl-10`}
              />
            </div>
          </FieldWrapper>

          <FieldWrapper label="Gender" required error={errors.gender}>
            <select {...register("gender")} className={inputCls(errors.gender)}>
              <option value="">Select gender</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
            </select>
          </FieldWrapper>
        </div>
      </div>

      {/* Contact */}
      <div
        className="bg-white rounded-2xl border p-6"
        style={{ borderColor: "rgba(30,80,50,0.08)" }}>
        <SectionHeader
          icon={Phone}
          title="Contact & Location"
          description="So we can match you with the right resources in your area."
          color="#3b82f6"
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FieldWrapper
            label="Phone Number"
            required
            error={errors.phoneNumber}
            hint="Nigerian number e.g. 08012345678 or +2348012345678">
            <div className="relative">
              <Phone
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none"
              />
              <input
                {...register("phoneNumber")}
                type="tel"
                placeholder="08012345678"
                className={`${inputCls(errors.phoneNumber)} pl-10`}
              />
            </div>
          </FieldWrapper>

          <FieldWrapper label="State of Residence" required error={errors.stateOfResidence}>
            <div className="relative">
              <MapPin
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none"
              />
              <select
                {...register("stateOfResidence")}
                className={`${inputCls(errors.stateOfResidence)} pl-10`}>
                <option value="">Select state</option>
                {NIGERIAN_STATES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
          </FieldWrapper>

          <FieldWrapper label="Local Government Area (LGA)" required error={errors.lga}>
            <div className="relative">
              <MapPin
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none"
              />
              <input
                {...register("lga")}
                type="text"
                placeholder="e.g., Ikeja, Surulere"
                className={`${inputCls(errors.lga)} pl-10`}
              />
            </div>
          </FieldWrapper>
        </div>
      </div>

      {/* Submit */}
      <div className="flex justify-between items-center">
        <button
          type="button"
          onClick={onSkip}
          disabled={isSkipping}
          className="text-[13px] font-medium text-text-muted hover:text-green-800 transition-colors disabled:opacity-50">
          Skip for now
        </button>
        <button
          type="submit"
          className="px-8 py-3 rounded-xl bg-green-800 text-white font-semibold hover:bg-green-700 transition-all shadow-lg hover:shadow-xl text-[14px] flex items-center gap-2 disabled:opacity-50">
          Continue
          <span className="text-lg leading-none">→</span>
        </button>
      </div>
    </form>
  );
}
