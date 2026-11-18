import { AIResult, Answer, AnswerType, ExamMode, SubQuestion } from "@/types/examsTypes";
import { AlertTriangle, BarChart2, ChevronDown, ChevronUp, FileText, Loader2, PenLine, PenTool, RefreshCw, Ruler, Sparkles, Trash2, Type, Upload } from "lucide-react";
import { useRef, useState } from "react";
import LinedCanvas from "./LinedCanvas";
import GraphCanvas from "./GraphCanvas";
import ConstructionCanvas from "./ConstructionCanvas";
import AIResultPanel from "./AIResultPanel";
import QuestionDiscussion from "@/Components/discussion/QuestionDiscussion";
import MathAnswerEditor from "@/Components/content/MathAnswerEditor";
import StudentAnswerText from "@/Components/content/StudentAnswerText";
import Image from "next/image";

export default function SubQuestionAnswer({
  subQuestion,
  answer,
  onAnswerChange,
  mode,
  isSubmitted,
  aiResult,
  onAIScore,
  onToggleSolution,
  onElaborated,
  isGrading = false,
  gradeError = null,
  isStale = false,
  hasAnswer = true,
}: {
  subQuestion: SubQuestion;
  answer: Answer;
  onAnswerChange: (a: Answer) => void;
  mode: ExamMode;
  isSubmitted: boolean;
  aiResult?: AIResult;
  onAIScore: () => void;
  onToggleSolution: () => void;
  onElaborated: (subQuestionId: string, detailedFeedback: string) => void;
  /** THIS part's grading request is in flight (other parts are unaffected). */
  isGrading?: boolean;
  /** THIS part's last grading attempt failed — the answer is kept; retry is offered. */
  gradeError?: string | null;
  /** The answer was edited after it was graded, so the shown grade is out of date. */
  isStale?: boolean;
  /** Something has been written/uploaded for this part. */
  hasAnswer?: boolean;
}) {
  const [activeTab, setActiveTab] = useState<AnswerType>(answer.type);
  // Practice: the answer box stays tucked away until the student chooses to attempt the part (like "Show Model
  // Answer"), so the question can be read first. It opens by default when something is already written.
  // Exam mode — and the read-only view after submission — never hide it.
  const [attemptOpen, setAttemptOpen] = useState(!!hasAnswer);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const handleTypeChange = (content: string) =>
    onAnswerChange({ ...answer, type: "type", content });
  const handleWhiteboardSave = (data: string) =>
    onAnswerChange({ ...answer, type: "whiteboard", content: "", whiteboardData: data });
  const handleGraphSave = (data: string) =>
    onAnswerChange({ ...answer, type: "graph", content: "", graphData: data });
  const handleConstructionSave = (data: string) =>
    onAnswerChange({ ...answer, type: "construction", content: "", constructionData: data });
  const handleFileUpload = (file: File) => {
    const r = new FileReader();
    r.onload = (e) =>
      onAnswerChange({
        ...answer,
        type: "upload",
        content: "",
        uploadData: { name: file.name, data: e.target?.result as string, type: file.type },
      });
    r.readAsDataURL(file);
  };
  const removeUpload = () => {
    onAnswerChange({ ...answer, type: "upload", content: "", uploadData: null });
    if (fileInputRef.current) fileInputRef.current.value = "";
  };
  const wordCount = answer.content.trim() ? answer.content.trim().split(/\s+/).length : 0;
  const tabs: { id: AnswerType; label: string; icon: React.ReactNode }[] = [
    { id: "type", label: "Type", icon: <Type size={13} /> },
    { id: "whiteboard", label: "Whiteboard", icon: <PenTool size={13} /> },
    { id: "graph", label: "Graph Sheet", icon: <BarChart2 size={13} /> },
    { id: "construction", label: "Construction", icon: <Ruler size={13} /> },
    { id: "upload", label: "Upload", icon: <Upload size={13} /> },
  ];

  // Practice mode only: the student can check THIS part as soon as they've answered it —
  // they don't have to submit the whole paper. Exam mode never renders any of this.
  const canRevealInPractice = mode === "practice" && !isSubmitted;
  const showInput = !canRevealInPractice || attemptOpen;
  const inputId = `attempt-${subQuestion.id}`;

  return (
    <div className="mt-4">
      {/* Practice: the answer box opens on demand */}
      {canRevealInPractice && (
        <button
          type="button"
          onClick={() => setAttemptOpen((o) => !o)}
          aria-expanded={attemptOpen}
          aria-controls={inputId}
          className="mb-3 flex items-center gap-2 rounded-xl border border-green-800/40 bg-green-50/60 px-4 py-2.5 text-sm font-bold text-green-900 transition-all hover:bg-green-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-700">
          <PenLine size={15} aria-hidden="true" />
          {attemptOpen ? "Hide Answer Box" : "Attempt Question"}
          {attemptOpen ? <ChevronUp size={14} aria-hidden="true" /> : <ChevronDown size={14} aria-hidden="true" />}
        </button>
      )}

      {/* Kept mounted but hidden when collapsed, so an unsaved drawing or half-typed answer survives. */}
      <div id={inputId} hidden={!showInput}>
      {/* Tabs */}
      {!isSubmitted && (
        <div className="flex gap-0.5 border-b mb-4 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id);
                onAnswerChange({ ...answer, type: tab.id });
              }}
              className={`px-3 py-2 text-xs font-semibold flex items-center gap-1.5 whitespace-nowrap transition-all border-b-2 -mb-px ${activeTab === tab.id ? "text-green-800 border-green-800 bg-green-50/50" : "text-gray-500 border-transparent hover:text-gray-700 hover:border-gray-300"}`}>
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>
      )}

      {/* Type panel */}
      {(!isSubmitted && activeTab === "type") || (isSubmitted && answer.type === "type") ? (
        <div>
          {isSubmitted ? (
            // After submission the answer is shown as the student meant it: equations typeset, formatting applied.
            <div
              role="region"
              aria-label={`Your answer for ${subQuestion.label}`}
              className="min-h-[96px] rounded-xl border bg-gray-50 p-4 text-gray-800"
              style={{ borderColor: "rgba(30,80,50,0.2)" }}>
              {answer.content.trim() ? (
                <StudentAnswerText text={answer.content} />
              ) : (
                <span className="text-sm text-gray-500">No typed answer.</span>
              )}
            </div>
          ) : (
            // WYSIWYG: equations are typeset right inside the text as the student writes.
            <MathAnswerEditor
              value={answer.content}
              onChange={handleTypeChange}
              label={`Your answer for ${subQuestion.label}`}
              placeholder={`Write your answer for ${subQuestion.label} here…`}
              describedBy={`eq-hint-${subQuestion.id}`}
            />
          )}
          {!isSubmitted && (
            <div className="mt-1.5 flex flex-wrap items-center justify-between gap-2 px-1 text-[11px] text-gray-500">
              <span>
                {wordCount} word{wordCount !== 1 ? "s" : ""}
              </span>
              <span id={`eq-hint-${subQuestion.id}`} className="text-gray-500">
                Equations show as maths while you write — click Equation (or press Alt+=) to add one, click an equation to edit it.
              </span>
              <span>{answer.content.length} chars</span>
            </div>
          )}
        </div>
      ) : null}

      {/* Whiteboard */}
      {!isSubmitted && activeTab === "whiteboard" && (
        <LinedCanvas
          subQuestionId={subQuestion.id}
          onSave={handleWhiteboardSave}
          initialData={answer.whiteboardData}
        />
      )}
      {isSubmitted && answer.type === "whiteboard" && answer.whiteboardData && (
        <Image
          src={answer.whiteboardData}
          alt="Your whiteboard answer"
          height={500}
          width={500}
          className="rounded-xl border max-w-full"
        />
      )}

      {/* Graph */}
      {!isSubmitted && activeTab === "graph" && (
        <GraphCanvas
          subQuestionId={subQuestion.id}
          onSave={handleGraphSave}
          initialData={answer.graphData}
        />
      )}
      {isSubmitted && answer.type === "graph" && answer.graphData && (
        <Image
          src={answer.graphData}
          alt="Your graph answer"
          height={500}
          width={500}
          className="rounded-xl border max-w-full"
        />
      )}

      {/* Construction */}
      {!isSubmitted && activeTab === "construction" && (
        <ConstructionCanvas
          subQuestionId={subQuestion.id}
          onSave={handleConstructionSave}
          initialData={answer.constructionData}
        />
      )}
      {isSubmitted && answer.type === "construction" && answer.constructionData && (
        <Image
          src={answer.constructionData}
          alt="Your construction answer"
          height={500}
          width={500}
          className="rounded-xl border max-w-full"
        />
      )}

      {/* Upload */}
      {!isSubmitted && activeTab === "upload" && (
        <div>
          {!answer.uploadData ? (
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                const f = e.dataTransfer.files[0];
                if (f) handleFileUpload(f);
              }}
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-all hover:border-green-700 hover:bg-green-50"
              style={{ borderColor: "rgba(30,80,50,0.25)" }}>
              <Upload size={36} className="mx-auto text-gray-400 mb-3" />
              <p className="text-sm font-medium text-gray-600">
                Click or drag &amp; drop to upload
              </p>
              <p className="text-xs text-gray-400 mt-1">Supports images (JPG, PNG) and PDF files</p>
              <input
                title="upload"
                ref={fileInputRef}
                type="file"
                accept="image/*,application/pdf"
                onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
                className="hidden"
              />
            </div>
          ) : (
            <div className="border rounded-xl p-4" style={{ borderColor: "rgba(30,80,50,0.15)" }}>
              {answer.uploadData.type.startsWith("image/") ? (
                <Image
                  src={answer.uploadData.data}
                  alt="Uploaded answer"
                  height={500}
                  width={500}
                  className="max-w-full max-h-80 rounded-lg mx-auto object-contain"
                />
              ) : (
                <div className="text-center py-10">
                  <FileText size={48} className="mx-auto text-gray-400 mb-2" />
                  <p className="text-sm font-medium text-gray-700">{answer.uploadData.name}</p>
                </div>
              )}
              <div className="flex justify-center mt-4 gap-3">
                <button
                  onClick={removeUpload}
                  className="text-red-600 text-xs flex items-center gap-1.5 font-medium px-3 py-1.5 rounded-lg border border-red-200 hover:bg-red-50 transition-all">
                  <Trash2 size={13} />
                  Remove
                </button>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="text-green-700 text-xs flex items-center gap-1.5 font-medium px-3 py-1.5 rounded-lg border border-green-200 hover:bg-green-50 transition-all">
                  <Upload size={13} />
                  Replace
                </button>
                <input
                  title="image upload"
                  ref={fileInputRef}
                  type="file"
                  accept="image/*,application/pdf"
                  onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
                  className="hidden"
                />
              </div>
            </div>
          )}
        </div>
      )}
      {isSubmitted && answer.type === "upload" && answer.uploadData && (
        <div className="border rounded-xl p-4" style={{ borderColor: "rgba(30,80,50,0.15)" }}>
          {answer.uploadData.type.startsWith("image/") ? (
            <Image
              src={answer.uploadData.data}
              alt="Uploaded answer"
              height={500}
              width={500}
              className="max-w-full max-h-80 rounded-lg mx-auto object-contain"
            />
          ) : (
            <div className="text-center py-6">
              <FileText size={40} className="mx-auto text-gray-400 mb-2" />
              <p className="text-sm font-medium">{answer.uploadData.name}</p>
            </div>
          )}
        </div>
      )}

      </div>

      {/* ── PRACTICE MODE: check THIS part on its own ── */}
      {canRevealInPractice && (
        <div className="mt-4" aria-live="polite">
          {(!aiResult || isStale) && showInput && (
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={onAIScore}
                disabled={isGrading || !hasAnswer}
                aria-label={`${aiResult ? "Check answer again" : "Check answer"} for ${subQuestion.label}`}
                className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-green-800 to-green-700 text-white rounded-xl text-sm font-bold hover:from-green-700 hover:to-green-600 transition-all shadow-sm disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-700">
                {isGrading ? (
                  <Loader2 size={15} className="animate-spin" aria-hidden="true" />
                ) : (
                  <Sparkles size={15} aria-hidden="true" />
                )}
                {isGrading ? "Checking your answer…" : aiResult ? "Check Answer again" : "Check Answer"}
              </button>
              {!hasAnswer && (
                <span className="text-xs text-gray-600">Write or upload an answer for this part first.</span>
              )}
            </div>
          )}

          {isStale && aiResult && (
            <p className="mt-2 text-xs font-semibold text-amber-800">
              You changed this answer after it was checked — the feedback below is for your earlier version.
            </p>
          )}

          {gradeError && !isGrading && (
            <div role="alert" className="mt-3 flex flex-wrap items-center gap-3 rounded-xl border border-red-200 bg-red-50 p-3">
              <AlertTriangle size={16} className="shrink-0 text-red-600" aria-hidden="true" />
              <p className="flex-1 text-[13px] text-red-800">{gradeError} Your answer is still here.</p>
              <button
                type="button"
                onClick={onAIScore}
                className="flex items-center gap-1.5 rounded-lg bg-green-800 px-3 py-1.5 text-xs font-bold text-white hover:bg-green-700">
                <RefreshCw size={13} aria-hidden="true" /> Try again
              </button>
            </div>
          )}

          {aiResult && (
            <AIResultPanel
              result={aiResult}
              modelAnswer={subQuestion.modelAnswer}
              questionText={`${subQuestion.label} ${subQuestion.text}`}
              onToggleSolution={onToggleSolution}
              onElaborated={(detail) => onElaborated(subQuestion.id, detail)}
              mode={mode}
            />
          )}

          {/* Practice only: opens once THIS part has been graded (the server enforces it too). Never in an exam. */}
          {aiResult && mode === "practice" && (
            <QuestionDiscussion
              questionId={subQuestion.questionId}
              partId={subQuestion.partId ?? null}
              label={subQuestion.path ? `Part ${subQuestion.label}` : undefined}
            />
          )}
        </div>
      )}

      {/* ── After submission: read-only view of any result already attached ── */}
      {isSubmitted && aiResult && (
        <div className="mt-4">
          <AIResultPanel
            result={aiResult}
            modelAnswer={subQuestion.modelAnswer}
            questionText={`${subQuestion.label} ${subQuestion.text}`}
            onToggleSolution={onToggleSolution}
            onElaborated={(detail) => onElaborated(subQuestion.id, detail)}
            mode={mode}
          />
          {/* After submission the server decides: it opens only once grading/correction has been released. */}
          <QuestionDiscussion
            questionId={subQuestion.questionId}
            partId={subQuestion.partId ?? null}
            label={subQuestion.path ? `Part ${subQuestion.label}` : undefined}
          />
        </div>
      )}
    </div>
  );
}
