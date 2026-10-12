"use client";

import { useEffect, useState } from "react";
import { getMasteryColor, getScoreColor } from "@/lib/constants/subjectTab-helper";
import { Loader2, AlertTriangle } from "lucide-react";
import * as studentsApi from "@/lib/api/students";
import { extractErrorMessage } from "@/lib/api/client";
import { usePerformanceFilter } from "../context/PerformanceFilterContext";

const TopicsTab = () => {
  const { days } = usePerformanceFilter();
  const [topics, setTopics] = useState<studentsApi.StudentPerformance["topicMastery"]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    studentsApi
      .getMyPerformance(days)
      .then((data) => setTopics(data.topicMastery))
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
        <p className="text-gray-600">Couldn&apos;t load topic data ({error}).</p>
      </div>
    );
  }

  if (topics.length === 0) {
    return (
      <div className="bg-white rounded-2xl shadow-lg p-8 text-center text-gray-500 text-sm">
        No topic-level data yet — practice sessions build up topic mastery over time.
      </div>
    );
  }

  const sorted = [...topics].sort((a, b) => a.score - b.score);

  return (
    <div className="space-y-6">
      {/* Summary row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {(["expert", "advanced", "intermediate", "beginner"] as const).map((level) => {
          const count = topics.filter((t) => t.masteryLevel === level).length;
          return (
            <div key={level} className={`rounded-xl p-4 text-center ${getMasteryColor(level)} bg-opacity-20`}>
              <div className="text-2xl font-bold">{count}</div>
              <div className="text-sm font-medium capitalize mt-1">{level}</div>
            </div>
          );
        })}
      </div>

      <div className="bg-white rounded-2xl shadow-lg p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Topic Mastery Breakdown</h3>
        <div className="space-y-4">
          {sorted.map((topic, idx) => (
            <div key={idx}>
              <div className="flex justify-between text-sm mb-1">
                <span className="font-medium text-gray-700">
                  {topic.topic} <span className="text-gray-400 font-normal">· {topic.subject}</span>
                </span>
                <span className={`font-semibold ${getScoreColor(topic.score)}`}>{topic.score}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-1000"
                  style={{ width: `${topic.score}%` }}
                />
              </div>
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span
                  className={`px-2 py-0.5 rounded-full text-xs ${getMasteryColor(topic.masteryLevel)}`}>
                  {topic.masteryLevel}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TopicsTab;
