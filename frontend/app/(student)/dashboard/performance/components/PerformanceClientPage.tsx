"use client";

import { useEffect, useState } from "react";
import { CheckCircle, Clock, Target, Zap, Calendar, Loader2, AlertTriangle } from "lucide-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import dynamic from "next/dynamic";
import * as studentsApi from "@/lib/api/students";
import { extractErrorMessage } from "@/lib/api/client";
import { usePerformanceFilter } from "../context/PerformanceFilterContext";

const PerformanceDot = dynamic(() => import("./PerformanceDot"), { ssr: false });

const OverviewTab = () => {
  const { days } = usePerformanceFilter();
  const [data, setData] = useState<studentsApi.StudentPerformance | null>(null);
  const [heatmap, setHeatmap] = useState<{ date: string; count: number; minutesStudied: number }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    Promise.all([studentsApi.getMyPerformance(days), studentsApi.getMyStudyActivity(Math.min(days, 90))])
      .then(([perf, activity]) => {
        setData(perf);
        setHeatmap(activity);
      })
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

  if (error || !data) {
    return (
      <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
        <AlertTriangle size={28} className="mx-auto mb-3 text-red-400" />
        <p className="text-gray-600">
          Couldn&apos;t load your performance data{error ? ` (${error})` : ""}.
        </p>
      </div>
    );
  }

  const { overall, subjectPerformance, weeklyTrend, recentActivity } = data;
  const hasSessions = overall.totalQuestions > 0;

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-all">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
              <Target size={24} className="text-blue-600" />
            </div>
            <span
              className={`text-xs font-semibold px-2 py-1 rounded-full ${
                overall.improvement >= 0 ? "text-green-600 bg-green-100" : "text-red-600 bg-red-100"
              }`}>
              {overall.improvement >= 0 ? "+" : ""}
              {overall.improvement}%
            </span>
          </div>
          <h3 className="text-2xl font-bold text-gray-800">{overall.averageScore}%</h3>
          <p className="text-gray-600 text-sm">Average Score</p>
          <div className="mt-2 text-xs text-gray-500">{overall.accuracyRate}% accuracy rate</div>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-all">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
              <CheckCircle size={24} className="text-green-600" />
            </div>
          </div>
          <h3 className="text-2xl font-bold text-gray-800">
            {overall.correctAnswers}/{overall.totalQuestions}
          </h3>
          <p className="text-gray-600 text-sm">Correct Answers</p>
          <div className="mt-2 text-xs text-gray-500">{overall.accuracyRate}% accuracy rate</div>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-all">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center">
              <Clock size={24} className="text-purple-600" />
            </div>
          </div>
          <h3 className="text-2xl font-bold text-gray-800">
            {Math.floor(overall.totalTimeSpentMinutes / 60)}h
          </h3>
          <p className="text-gray-600 text-sm">Total Study Time</p>
          <div className="mt-2 text-xs text-gray-500">{overall.totalTimeSpentMinutes} minutes</div>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-all">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-full bg-yellow-100 flex items-center justify-center">
              <Zap size={24} className="text-yellow-600" />
            </div>
          </div>
          <h3 className="text-2xl font-bold text-gray-800">{overall.streak}</h3>
          <p className="text-gray-600 text-sm">Current Streak</p>
          <div className="mt-2 text-xs text-gray-500">Best: {overall.bestStreak} days</div>
        </div>
      </div>

      {!hasSessions && (
        <div className="bg-blue-50 border border-blue-100 rounded-2xl p-5 text-center text-blue-700 text-sm">
          No practice sessions yet in this time range — complete a session to start seeing your
          performance data here.
        </div>
      )}

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Performance Trend</h3>
          {weeklyTrend.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={weeklyTrend}>
                <defs>
                  <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="week" />
                <YAxis />
                <CartesianGrid strokeDasharray="3 3" />
                <Tooltip />
                <Area
                  type="monotone"
                  dataKey="score"
                  stroke="#3B82F6"
                  fillOpacity={1}
                  fill="url(#colorScore)"
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[300px] flex items-center justify-center text-sm text-gray-400">
              Not enough activity yet to chart a trend
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Subject Scores</h3>
          {subjectPerformance.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <RadarChart data={subjectPerformance}>
                <PolarGrid />
                <PolarAngleAxis dataKey="subject" />
                <PolarRadiusAxis angle={30} domain={[0, 100]} />
                <Radar name="Your Score" dataKey="score" stroke="#3B82F6" fill="#3B82F6" fillOpacity={0.6} />
                <Legend />
                <Tooltip />
              </RadarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[300px] flex items-center justify-center text-sm text-gray-400">
              Practice a few subjects to see a breakdown here
            </div>
          )}
        </div>
      </div>

      {/* Study Activity Heatmap */}
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <div className="flex items-center gap-2 mb-4">
          <Calendar size={20} className="text-gray-600" />
          <h3 className="text-lg font-semibold text-gray-800">Study Activity</h3>
        </div>
        <PerformanceDot data={heatmap} />
        <div className="flex items-center gap-2 mt-3 text-xs text-gray-500">
          <span>Less</span>
          <div className="flex gap-1">
            {["bg-gray-100", "bg-green-200", "bg-green-300", "bg-green-400", "bg-green-600"].map((c, i) => (
              <div key={i} className={`w-3 h-3 rounded-sm ${c}`} />
            ))}
          </div>
          <span>More</span>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Recent Activity</h3>
        {recentActivity.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-8">No sessions in this time range yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  {["Date", "Exam", "Subject", "Score", "Time Spent", "Accuracy"].map((h) => (
                    <th
                      key={h}
                      className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {recentActivity.map((activity, idx) => (
                  <tr key={idx} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm text-gray-600">{activity.date}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{activity.examType}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{activity.subject}</td>
                    <td className="px-4 py-3 text-sm font-semibold text-gray-800">{activity.score}%</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{activity.timeSpent} min</td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {activity.totalQuestions > 0
                        ? Math.round((activity.questionsCorrect / activity.totalQuestions) * 100)
                        : 0}
                      %
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default OverviewTab;
