import { Target, Check } from "lucide-react";

interface TopicFocusSectionProps {
  subject?: string;
  availableTopics: string[];
  selectedTopics: string[];
  onChange: (topics: string[]) => void;
}

export default function TopicFocusSection({
  subject,
  availableTopics,
  selectedTopics,
  onChange,
}: TopicFocusSectionProps) {
  if (availableTopics.length === 0) return null;

  const toggle = (topic: string) =>
    onChange(
      selectedTopics.includes(topic)
        ? selectedTopics.filter((t) => t !== topic)
        : [...selectedTopics, topic],
    );

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
      <div className="flex items-center gap-2.5 mb-5">
        <div className="w-8 h-8 rounded-lg bg-teal-100 flex items-center justify-center">
          <Target size={16} className="text-teal-600" />
        </div>
        <div>
          <h3 className="text-[15px] font-bold text-gray-800">Focus Topics</h3>
          <p className="text-[11px] text-gray-400">
            Optional — narrow down to specific areas in {subject}
          </p>
        </div>
        {selectedTopics.length > 0 && (
          <button
            onClick={() => onChange([])}
            className="ml-auto text-[11px] text-gray-400 hover:text-red-500 transition-colors">
            Clear all ✕
          </button>
        )}
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {availableTopics.map((topic) => {
          const active = selectedTopics.includes(topic);
          return (
            <button
              key={topic}
              onClick={() => toggle(topic)}
              className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-[12px] font-semibold text-left transition-all border ${active ? "border-teal-500 bg-teal-50 text-teal-700" : "border-gray-100 bg-gray-50 text-gray-600 hover:border-gray-200"}`}>
              <div
                className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center shrink-0 ${active ? "border-teal-500 bg-teal-500" : "border-gray-300"}`}>
                {active && <Check size={8} className="text-white" />}
              </div>
              {topic}
            </button>
          );
        })}
      </div>
    </div>
  );
}
