"use client";

import Link from "next/link";
import { Plus, Upload } from "lucide-react";
import BankStatsPanel from "./components/BankStatsPanel";
import ExamCategoryGrid from "./components/ExamCategoryGrid";


export default function AdminQuestionsPage() {
  return (
    <div className="max-w-7xl mx-auto">
      {/* ── Page header ── */}
      <div className="mb-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="font-serif text-3xl text-green-900 mb-1.5">Question Bank</h1>
            <p className="text-[14px] text-gray-500 max-w-2xl">
              Manage and organise past questions across all exam types, years, and subjects.
            </p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <Link
              href="/admin/questions/bulk-import"
              className="flex items-center gap-2 px-5 py-3 bg-white border-2 border-green-800 text-green-800 rounded-xl hover:bg-green-50 transition-all font-semibold text-[14px]"
            >
              <Upload size={18} />
              Bulk Import
            </Link>
            <Link
              href="/admin/questions/create"
              className="flex items-center gap-2 px-5 py-3 bg-green-800 text-white rounded-xl hover:bg-green-700 transition-all shadow-lg hover:shadow-xl font-semibold text-[14px]"
            >
              <Plus size={18} />
              Add Question
            </Link>
          </div>
        </div>
      </div>

      {/* ── Overall statistics ── */}
      <BankStatsPanel />

      {/* ── Exam category grid (Professional + Secondary School) ── */}
   
      <ExamCategoryGrid />
    </div>
  );
}
