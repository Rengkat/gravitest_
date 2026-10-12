import React from "react";
import { Star } from "lucide-react";

interface AiResult {
  score: number;
  maxScore: number;
}

interface SubQuestion {
  // Define your sub-question shape here based on your actual data structure
  // Example:
  id?: string;
  // Add other sub-question properties as needed
}

interface EssayQuestion {
  subQuestions: SubQuestion[];
  // Add other essay question properties as needed
}

interface AiTotalScoreSummaryProps {
  aiResults: Record<string, AiResult>; // or { [key: string]: AiResult }
  essayQuestions: EssayQuestion[];
}

const AiTotalScoreSummary = ({ aiResults, essayQuestions }: AiTotalScoreSummaryProps) => {
  const totalScore = Object.values(aiResults).reduce((s, r) => s + r.score, 0);
  const totalMaxScore = Object.values(aiResults).reduce((s, r) => s + r.maxScore, 0);
  const scoredCount = Object.keys(aiResults).length;
  const totalSubQuestions = essayQuestions.reduce((acc, q) => acc + q.subQuestions.length, 0);

  return (
    <div className="bg-white rounded-xl border p-6" style={{ borderColor: "rgba(30,80,50,0.1)" }}>
      <div className="flex items-center justify-between mb-3 flex-wrap gap-3">
        <div>
          <h3 className="font-bold text-green-800 text-lg flex items-center gap-2">
            <Star size={18} className="text-yellow-400" />
            Overall AI Score
          </h3>
          <p className="text-sm text-gray-500">Based on AI-scored sub-questions</p>
        </div>
        <div className="text-right">
          <div className="font-serif text-3xl font-bold text-green-800">
            {totalScore}
            <span className="text-lg text-gray-400">/{totalMaxScore}</span>
          </div>
          <div className="text-xs text-gray-400">
            {scoredCount} of {totalSubQuestions} scored
          </div>
        </div>
      </div>
      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-green-700 to-green-500 rounded-full transition-all duration-700"
          style={{
            width: `${(totalScore / Math.max(1, totalMaxScore)) * 100}%`,
          }}
        />
      </div>
    </div>
  );
};

export default AiTotalScoreSummary;
