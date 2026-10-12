"use client";

import { useEffect, useState } from "react";
import { getScoreColor } from "@/lib/constants/subjectTab-helper";
import { Trophy, Loader2, AlertTriangle } from "lucide-react";
import {
  BarChart as RechartsBarChart,
  Bar,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import * as studentsApi from "@/lib/api/students";
import { extractErrorMessage } from "@/lib/api/client";
import { usePerformanceFilter } from "../context/PerformanceFilterContext";

const ExamsTab = () => {
  const { days } = usePerformanceFilter();
  const [exams, setExams] = useState<studentsApi.StudentPerformance["examPerformance"]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    studentsApi
      .getMyPerformance(days)
      .then((data) => setExams(data.examPerformance))
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
        <p className="text-gray-600">Couldn&apos;t load exam data ({error}).</p>
      </div>
    );
  }

  if (exams.length === 0) {
    return (
      <div className="bg-white rounded-2xl shadow-lg p-8 text-center text-gray-500 text-sm">
        No exam sessions yet — take a full mock exam to see performance by exam type here.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {exams.map((exam, idx) => (
          <div key={idx} className="bg-white rounded-2xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold text-gray-800 uppercase">{exam.examType}</h3>
              <Trophy size={24} className={exam.averageScore >= 80 ? "text-yellow-500" : "text-gray-400"} />
            </div>
            <div className="mb-4">
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-600">Average Score</span>
                <span className={`font-semibold ${getScoreColor(exam.averageScore)}`}>
                  {exam.averageScore}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-blue-600 h-2 rounded-full" style={{ width: `${exam.averageScore}%` }} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm mb-4">
              <div>
                <p className="text-gray-500">Exams Taken</p>
                <p className="font-semibold text-gray-800">{exam.examsTaken}</p>
              </div>
              <div>
                <p className="text-gray-500">Best Score</p>
                <p className="font-semibold text-green-600">{exam.bestScore}%</p>
              </div>
              <div>
                <p className="text-gray-500">Worst Score</p>
                <p className="font-semibold text-red-600">{exam.worstScore}%</p>
              </div>
              <div>
                <p className="text-gray-500">Last Attempt</p>
                <p className="font-semibold text-gray-800">
                  {new Date(exam.lastAttemptAt).toLocaleDateString("en-NG")}
                </p>
              </div>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-gray-500">
                Range: {exam.worstScore}% – {exam.bestScore}%
              </span>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl shadow-lg p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Exam Performance Comparison</h3>
        <ResponsiveContainer width="100%" height={400}>
          <RechartsBarChart data={exams}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="examType" />
            <YAxis domain={[0, 100]} />
            <Tooltip />
            <Legend />
            <Bar dataKey="averageScore" name="Average Score" fill="#3B82F6" />
            <Bar dataKey="bestScore" name="Best Score" fill="#10B981" />
            <Bar dataKey="worstScore" name="Worst Score" fill="#EF4444" />
          </RechartsBarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default ExamsTab;
