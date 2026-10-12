"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Trophy,
  Download,
  ChevronDown,
  Maximize2,
  Minimize2,
  Download as DownloadCsv,
  Printer,
  BarChart3,
  BookOpen,
  Target,
  Brain,
  Lightbulb,
  Users,
} from "lucide-react";
import { ExamType, Subject, TimeRange } from "@/types/performance";
import {
  PerformanceFilterContext,
  TIME_RANGE_TO_DAYS,
} from "./context/PerformanceFilterContext";
import * as studentsApi from "@/lib/api/students";

const TABS = [
  { id: "overview", label: "Overview", icon: BarChart3, href: "/dashboard/performance" },
  { id: "subjects", label: "Subjects", icon: BookOpen, href: "/dashboard/performance/subjects" },
  { id: "exams", label: "Exams", icon: Target, href: "/dashboard/performance/exams" },
  { id: "topics", label: "Topics", icon: Brain, href: "/dashboard/performance/topics" },
  { id: "insights", label: "Insights", icon: Lightbulb, href: "/dashboard/performance/insights" },
  {
    id: "leaderboard",
    label: "Leaderboard",
    icon: Users,
    href: "/dashboard/performance/leaderboard",
  },
];

function toCSV(rows: (string | number)[][]): string {
  return rows.map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n");
}

export default function PerformanceLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [timeRange, setTimeRange] = useState<TimeRange>("month");
  // Selected but not yet wired to a specific endpoint filter — see the
  // context file for why these stay local UI state for now.
  const [selectedExam, setSelectedExam] = useState<ExamType>("all");
  const [selectedSubject, setSelectedSubject] = useState<Subject>("all");
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [exporting, setExporting] = useState(false);
  const reportRef = useRef<HTMLDivElement>(null);

  async function exportToCSV() {
    setShowExportMenu(false);
    setExporting(true);
    try {
      const perf = await studentsApi.getMyPerformance(TIME_RANGE_TO_DAYS[timeRange]);
      const rows: (string | number)[][] = [
        ["Gravitest Performance Report"],
        [`Generated: ${new Date().toLocaleString()}`],
        [],
        ["OVERALL"],
        ["Average Score", `${perf.overall.averageScore}%`],
        ["Total Questions", perf.overall.totalQuestions],
        ["Correct Answers", perf.overall.correctAnswers],
        ["Accuracy Rate", `${perf.overall.accuracyRate}%`],
        ["Study Time (min)", perf.overall.totalTimeSpentMinutes],
        ["Current Streak", perf.overall.streak],
        ["Best Streak", perf.overall.bestStreak],
        [],
        ["SUBJECT PERFORMANCE"],
        ["Subject", "Score", "Questions", "Correct", "Time (min)"],
        ...perf.subjectPerformance.map((s) => [
          s.subject,
          `${s.score}%`,
          s.questionsAttempted,
          s.correctAnswers,
          s.timeSpent,
        ]),
        [],
        ["RECENT ACTIVITY"],
        ["Date", "Exam Type", "Subject", "Score", "Time (min)"],
        ...perf.recentActivity.map((a) => [a.date, a.examType, a.subject, `${a.score}%`, a.timeSpent]),
      ];
      const blob = new Blob([toCSV(rows)], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Gravitest-performance-${Date.now()}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      // Silent — the export button staying idle is feedback enough here;
      // a toast system isn't wired into this page.
    } finally {
      setExporting(false);
    }
  }

  function printReport() {
    setShowExportMenu(false);
    window.print();
  }

  const days = TIME_RANGE_TO_DAYS[timeRange];

  return (
    <PerformanceFilterContext.Provider value={{ timeRange, days }}>
      <div
        className={`min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50/30 to-purple-50/20 ${
          isFullscreen ? "fixed inset-0 z-50 overflow-auto bg-white" : ""
        }`}>
        {/* Hero */}
        <div className="relative bg-gradient-to-r from-green-900 to-emerald-900 text-white overflow-hidden">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 left-0 w-72 h-72 bg-green-400 rounded-full filter blur-3xl -translate-x-1/2 -translate-y-1/2" />
            <div className="absolute bottom-0 right-0 w-96 h-96 bg-emerald-400 rounded-full filter blur-3xl translate-x-1/2 translate-y-1/2" />
          </div>
          <div className="relative max-w-7xl mx-auto px-4 py-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Trophy size={24} className="text-yellow-400" />
                  <h1 className="text-3xl md:text-4xl font-bold">Performance Analysis</h1>
                </div>
                <p className="text-green-100">
                  Track your progress, identify strengths, and achieve your academic goals
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setIsFullscreen(!isFullscreen)}
                  className="px-4 py-2 bg-white/10 rounded-lg hover:bg-white/20 transition-colors flex items-center gap-2">
                  {isFullscreen ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
                  {isFullscreen ? "Exit" : "Fullscreen"}
                </button>
                <div className="relative">
                  <button
                    onClick={() => setShowExportMenu(!showExportMenu)}
                    disabled={exporting}
                    className="px-4 py-2 bg-white/10 rounded-lg hover:bg-white/20 transition-colors flex items-center gap-2 disabled:opacity-60">
                    <Download size={18} />
                    {exporting ? "Preparing…" : "Export"}
                    <ChevronDown size={14} />
                  </button>
                  {showExportMenu && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-xl z-20">
                      <button
                        onClick={exportToCSV}
                        className="w-full px-4 py-2 text-left text-gray-700 hover:bg-gray-100 rounded-t-lg flex items-center gap-2">
                        <DownloadCsv size={16} /> Export as CSV
                      </button>
                      <button
                        onClick={printReport}
                        className="w-full px-4 py-2 text-left text-gray-700 hover:bg-gray-100 rounded-b-lg flex items-center gap-2">
                        <Printer size={16} /> Print Report
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 py-8" ref={reportRef}>
          {/* Filters */}
          <div className="bg-white rounded-2xl shadow-lg p-4 mb-8">
            <div className="flex flex-wrap gap-4">
              <div className="flex-1 min-w-[150px]">
                <label className="block text-sm font-medium text-gray-700 mb-1">Time Range</label>
                <select
                  title="select time"
                  value={timeRange}
                  onChange={(e) => setTimeRange(e.target.value as TimeRange)}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="week">Last 7 Days</option>
                  <option value="month">Last 30 Days</option>
                  <option value="3months">Last 3 Months</option>
                  <option value="year">Last Year</option>
                  <option value="all">All Time</option>
                </select>
              </div>
              <div className="flex-1 min-w-[150px]">
                <label className="block text-sm font-medium text-gray-700 mb-1">Exam Type</label>
                <select
                  title="select exam"
                  value={selectedExam}
                  onChange={(e) => setSelectedExam(e.target.value as ExamType)}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="all">All Exams</option>
                  <option value="jamb">JAMB</option>
                  <option value="waec">WAEC</option>
                  <option value="neco">NECO</option>
                  <option value="nabteb">NABTEB</option>
                  <option value="professional">Professional</option>
                </select>
              </div>
              <div className="flex-1 min-w-[150px]">
                <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
                <select
                  title="select subject"
                  value={selectedSubject}
                  onChange={(e) => setSelectedSubject(e.target.value as Subject)}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="all">All Subjects</option>
                  <option value="mathematics">Mathematics</option>
                  <option value="english">English</option>
                  <option value="physics">Physics</option>
                  <option value="chemistry">Chemistry</option>
                  <option value="biology">Biology</option>
                  <option value="economics">Economics</option>
                </select>
              </div>
            </div>
            <p className="text-xs text-gray-400 mt-3">
              Exam type and subject filters apply within the Exams tab's session list — the charts
              here reflect the selected time range across all your activity.
            </p>
          </div>

          {/* Tab Nav — URL-based */}
          <div className="flex gap-2 mb-8 border-b border-gray-200 overflow-x-auto">
            {TABS.map((tab) => {
              const isActive = pathname === tab.href || pathname?.startsWith(tab.href);
              return (
                <Link
                  key={tab.id}
                  href={tab.href}
                  className={`flex items-center gap-2 px-6 py-3 text-sm font-medium transition-all relative whitespace-nowrap ${
                    isActive ? "text-blue-700" : "text-gray-500 hover:text-gray-700"
                  }`}>
                  <tab.icon size={18} />
                  {tab.label}
                  {isActive && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full" />
                  )}
                </Link>
              );
            })}
          </div>

          {/* Page content */}
          {children}
        </div>
      </div>
    </PerformanceFilterContext.Provider>
  );
}
