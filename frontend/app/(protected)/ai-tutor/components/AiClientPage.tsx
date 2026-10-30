"use client";

import { useState, useCallback } from "react";
import { SUBJECTS } from "@/lib/constants/ai-tutor";
import type { Difficulty, ResponseStyle, Subject } from "@/types/ai-tutor";
import { useChat } from "./useChat";
import { useSpeechRecognition } from "./useSpeechRecognition";
import Header from "./Header";
import Sidebar from "./SideBar";
import MobileSidebar from "./MobileSidebar";
import ChatMessages from "./ChatMessages";
import QuickPrompts from "./QuickPrompts";
import ChatInput from "./ChatInput";

export default function AITutorClientPage() {
  const [selectedSubject, setSelectedSubject] = useState<Subject>("general");
  const [difficulty, setDifficulty] = useState<Difficulty>("intermediate");
  const [responseStyle, setResponseStyle] = useState<ResponseStyle>("detailed");
  const [pidgin, setPidgin] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const {
    messages,
    input,
    setInput,
    isLoading,
    conversations,
    loadConversation,
    activeConversationId,
    renameConversation,
    deleteConversation,
    sendMessage,
    clearChat,
    handleFeedback,
    bottomRef,
    inputRef,
  } = useChat({ selectedSubject, difficulty, responseStyle, pidgin });

  const { isRecording, toggleRecording } = useSpeechRecognition({
    onTranscript: setInput,
  });

  const handleQuickPromptSelect = useCallback(
    (prompt: string) => {
      setInput(prompt);
      inputRef.current?.focus();
    },
    [setInput, inputRef],
  );

  const currentSubject = SUBJECTS.find((s) => s.id === selectedSubject) ?? SUBJECTS[0];

  return (
    <>
      <style>{`
        @keyframes msgIn { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
        @keyframes spin   { to { transform: rotate(360deg); } }
      `}</style>

      <div
        data-testid="ai-tutor-page"
        className="flex flex-col h-screen bg-cream font-sans overflow-hidden">
        <Header
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
          currentSubject={currentSubject}
          pidgin={pidgin}
          selectedSubject={selectedSubject}
        />

        <div className="flex-1 flex overflow-hidden relative">
          <MobileSidebar
            open={sidebarOpen}
            onClose={() => setSidebarOpen(false)}
            selectedSubject={selectedSubject}
            setSelectedSubject={setSelectedSubject}
            conversations={conversations}
            onNewChat={clearChat}
            onSelectConversation={loadConversation}
            activeConversationId={activeConversationId}
            onRenameConversation={renameConversation}
            onDeleteConversation={deleteConversation}
          />

          <div className="hidden lg:flex shrink-0">
            <Sidebar
              selectedSubject={selectedSubject}
              setSelectedSubject={setSelectedSubject}
              conversations={conversations}
              onNewChat={clearChat}
              onSelectConversation={loadConversation}
              activeConversationId={activeConversationId}
              onRenameConversation={renameConversation}
              onDeleteConversation={deleteConversation}
            />
          </div>

          <div className="flex-1 flex flex-col overflow-hidden min-w-0">
            <ChatMessages
              messages={messages}
              onFeedback={handleFeedback}
              onSendSuggestion={(s) => void sendMessage(s)}
              bottomRef={bottomRef}
            />

            <QuickPrompts onSelect={handleQuickPromptSelect} />

            <ChatInput
              input={input}
              setInput={setInput}
              isLoading={isLoading}
              isRecording={isRecording}
              toggleRecording={toggleRecording}
              onSend={() => void sendMessage()}
              subjectName={currentSubject.name}
              inputRef={inputRef}
              settingsOpen={settingsOpen}
              setSettingsOpen={setSettingsOpen}
              difficulty={difficulty}
              setDifficulty={setDifficulty}
              responseStyle={responseStyle}
              setResponseStyle={setResponseStyle}
              pidgin={pidgin}
              setPidgin={setPidgin}
            />
          </div>
        </div>
      </div>
    </>
  );
}
