"use client";

import { useEffect, useState } from "react";
import { getMasteryColor, getScoreColor } from "@/lib/constants/subjectTab-helper";
import { Loader2, AlertTriangle } from "lucide-react";
import * as studentsApi from "@/lib/api/students";
import { extractErrorMessage } from "@/lib/api/client";
import { usePerformanceFilter } from "../context/PerformanceFilterContext";

const SubjectTab = () => {
  const { days } = usePerformanceFilter();
  const [subjects, setSubjects] = useState<studentsApi.StudentPerformance["subjectPerformance"]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    studentsApi
      .getMyPerformance(days)
      .then((data) => setSubjects(data.subjectPerformance))
      .catch((err) => setError(extractErrorMessage(err)))
      .finally(() => setLoading(false));
  }, [days]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 size={28} className="animate-spin text-blue-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
        <AlertTriangle size={28} className="mx-auto mb-3 text-red-400" />
        <p className="text-gray-600">Couldn&apos;t load subject data ({error}).</p>
      </div>
    );
  }

  if (subjects.length === 0) {
    return (
      <div className="bg-white rounded-2xl shadow-lg p-8 text-center text-gray-500 text-sm">
        No subject data yet — complete a few practice sessions to see a breakdown here.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {subjects.map((subject, idx) => (
          <div key={idx} className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-all">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-800 capitalize">{subject.subject}</h3>
              <div
                className={`px-3 py-1 rounded-full text-xs font-semibold ${getMasteryColor(subject.masteryLevel)}`}>
                {subject.masteryLevel.toUpperCase()}
              </div>
            </div>
            <div className="mb-4">
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-600">Performance Score</span>
                <span className={`font-semibold ${getScoreColor(subject.score)}`}>{subject.score}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-1000"
                  style={{ width: `${subject.score}%` }}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-500">Questions</p>
                <p className="font-semibold text-gray-800">{subject.questionsAttempted}</p>
              </div>
              <div>
                <p className="text-gray-500">Correct</p>
                <p className="font-semibold text-gray-800">{subject.correctAnswers}</p>
              </div>
              <div>
                <p className="text-gray-500">Time Spent</p>
                <p className="font-semibold text-gray-800">
                  {Math.floor(subject.timeSpent / 60)}h {subject.timeSpent % 60}m
                </p>
              </div>
              <div>
                <p className="text-gray-500">Accuracy</p>
                <p className="font-semibold text-gray-800">
                  {subject.questionsAttempted > 0
                    ? Math.round((subject.correctAnswers / subject.questionsAttempted) * 100)
                    : 0}
                  %
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SubjectTab;
