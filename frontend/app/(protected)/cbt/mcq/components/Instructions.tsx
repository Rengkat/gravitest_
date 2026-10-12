import { AlertCircle, FileText, HelpCircle, Play } from "lucide-react";

export default function InstructionsPage({ onStart }: { onStart: () => void }) {
  const instructions = [
    {
      text: (
        <>
          The examination consists of <strong>100 multiple-choice questions</strong> to be answered
          in <strong>2 hours</strong>.
        </>
      ),
    },
    {
      text: (
        <>
          Each question has <strong>four options (A, B, C, D)</strong>. Select the most appropriate
          answer. You can also press <strong>A, B, C or D</strong> on your keyboard.
        </>
      ),
    },
    {
      text: (
        <>
          Use the <strong>Question Navigator</strong> to jump between questions. Answered questions
          are highlighted in green.
        </>
      ),
    },
    {
      text: (
        <>
          Press <strong>F</strong> to flag a question for review. Flagged questions are shown in
          yellow.
        </>
      ),
    },
    {
      text: (
        <>
          Use the <strong>← →</strong> arrow keys or the Previous / Next buttons to move between
          questions.
        </>
      ),
    },
    { text: <>You can change your answers anytime before final submission.</> },
    {
      warning: true,
      text: <>The exam will auto-submit when the timer reaches zero.</>,
    },
  ];

  return (
    <div className="min-h-screen bg-cream flex items-center justify-center p-6">
      <div className="max-w-3xl w-full bg-white rounded-2xl shadow-xl overflow-hidden">
        <div className="bg-green-800 text-white p-6 text-center">
          <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center mx-auto mb-4">
            <FileText size={32} className="text-gold" />
          </div>
          <h1 className="font-serif text-2xl mb-2">JAMB UTME CBT Examination</h1>
          <p className="text-white/70">Physics · 100 Questions · 2 Hours</p>
        </div>

        <div className="p-8">
          <h2 className="font-bold text-green-800 mb-4 flex items-center gap-2">
            <HelpCircle size={18} />
            Important Instructions
          </h2>

          <div className="space-y-4 mb-8">
            {instructions.map((item, i) => (
              <div key={i} className="flex gap-3">
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-0.5 ${
                    item.warning ? "bg-yellow-100 text-yellow-700" : "bg-green-100 text-green-800"
                  }`}>
                  {item.warning ? "⚠" : i + 1}
                </div>
                <p className="text-text-muted text-sm">{item.text}</p>
              </div>
            ))}
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-8">
            <p className="text-yellow-800 text-sm flex items-start gap-2">
              <AlertCircle size={16} className="shrink-0 mt-0.5" />
              <span>
                Ensure you have a stable internet connection. Your answers are saved automatically
                as you progress.
              </span>
            </p>
          </div>

          <button
            onClick={onStart}
            className="w-full py-4 bg-green-800 text-white rounded-xl font-bold text-lg flex items-center justify-center gap-2 hover:bg-green-700 transition-all">
            <Play size={20} />
            Start Examination
          </button>
        </div>
      </div>
    </div>
  );
}
