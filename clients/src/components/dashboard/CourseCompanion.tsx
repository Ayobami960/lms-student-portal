import { useEffect, useRef, useState, useCallback } from "react";
import ReactMarkdown from "react-markdown";
import toast from "react-hot-toast";
import { Cpu, X, Send, Sparkles } from "lucide-react";
import { useSendChatMessageMutation } from "../../store/api/apiSlice";
import { AIWidget } from "../AIWidget";
import type { ChatMessage, QuickPrompt } from "../../types";

const QUICK_PROMPTS: QuickPrompt[] = [
  { label: "Summarize my progress", prompt: "Summarize my current course progress and tell me what to focus on next." },
  { label: "Explain a concept", prompt: "Can you explain a concept I'm struggling with in my current module?" },
  { label: "Build a quiz", prompt: "Create a short 5-question quiz to test my understanding of this course." },
];

interface CourseCompanionProps {
  firstName: string;
  isInstructor: boolean;
}

/**
 * AI study/teaching assistant surfaced two ways on the dashboard:
 * an inline card with quick prompts, and a floating chat panel.
 * Both share the same conversation state, wired to POST /ai/chat.
 */
export function CourseCompanion({ firstName, isInstructor }: CourseCompanionProps) {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [userInput, setUserInput] = useState("");
  const [conversationId, setConversationId] = useState<string | undefined>(undefined);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      sender: "ai",
      text: `Hi ${firstName || "there"}! Let me know if you need help analyzing your ${isInstructor ? "courses" : "course progression"
        } or ${isInstructor ? "grading" : "studying for quizzes"}.`,
    },
  ]);
  const [sendChatMessage, { isLoading: isTyping }] = useSendChatMessageMutation();

  const inputRef = useRef<HTMLInputElement>(null);
  const threadRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    threadRef.current?.scrollTo({ top: threadRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, isTyping]);

  useEffect(() => {
    if (isChatOpen) inputRef.current?.focus();
  }, [isChatOpen]);

  useEffect(() => {
    if (!isChatOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsChatOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isChatOpen]);

  const sendMessage = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || isTyping) return;

      setMessages((prev) => [...prev, { sender: "user", text: trimmed }]);
      setUserInput("");

      try {
        const res = await sendChatMessage({ message: trimmed, conversationId }).unwrap();
        setConversationId(res.data.conversation.id);
        setMessages((prev) => [...prev, { sender: "ai", text: res.data.reply.content }]);
      } catch {
        toast.error("The AI assistant is temporarily unavailable");
        setMessages((prev) => [
          ...prev,
          { sender: "ai", text: "Sorry, I couldn't reach the assistant just now — please try again in a moment." },
        ]);
      }
    },
    [isTyping, conversationId, sendChatMessage]
  );

  const handleSendMessage = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    sendMessage(userInput);
  };

  const handleQuickPrompt = (prompt: string) => {
    setIsChatOpen(true);
    sendMessage(prompt);
  };

  return (
    <>
      {/* Dashboard card */}
      <section className="relative overflow-hidden bg-surface-container-lowest border border-outline-variant shadow-sm rounded-2xl p-lg">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-md mb-md pb-md border-b border-outline-variant/60">
          <div className="flex items-start gap-md">
            <div className="relative flex items-center justify-center w-11 h-11 rounded-xl bg-primary/10 text-primary border border-primary/15 shrink-0">
              <Cpu className="w-5 h-5" strokeWidth={2} aria-hidden="true" />
              <span className="absolute -bottom-1 -right-1 w-3 h-3 rounded-full bg-emerald-500 border-2 border-surface-container-lowest" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-on-surface leading-tight">Course Companion</h3>
              <p className="text-sm text-outline leading-relaxed mt-0.5">
                Your AI study partner for this dashboard — it can summarize progress, explain concepts, and turn a module into a quiz.
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsChatOpen(true)}
            className="shrink-0 inline-flex items-center gap-2 text-sm font-semibold text-primary bg-primary/10 hover:bg-primary/15 border border-primary/15 px-4 py-2 rounded-lg transition-colors"
          >
            <Sparkles className="w-4 h-4" aria-hidden="true" />
            Ask the companion
          </button>
        </div>

        <div className="flex flex-wrap gap-2 mb-md">
          {QUICK_PROMPTS.map((q) => (
            <button
              key={q.label}
              onClick={() => handleQuickPrompt(q.prompt)}
              className="text-xs font-medium text-on-surface-variant bg-surface-container hover:bg-surface-container-high border border-outline-variant/70 px-3 py-1.5 rounded-full transition-colors"
            >
              {q.label}
            </button>
          ))}
        </div>

        <div className="bg-surface-container-low/50 rounded-xl p-xs">
          <AIWidget />
        </div>
      </section>

      {/* Floating chat */}
      <div className="fixed bottom-lg right-lg z-50 flex flex-col items-end gap-md">
        {isChatOpen && (
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Course Companion chat"
            className="w-85 md:w-96 bg-surface-container-lowest border border-outline-variant/80 rounded-2xl overflow-hidden shadow-2xl transition-all duration-300 ease-out animate-in fade-in slide-in-from-bottom-6"
          >
            <div className="bg-primary p-md flex justify-between items-center text-on-primary">
              <div className="flex items-center gap-sm">
                <div className="relative bg-white/15 p-2 rounded-xl border border-white/15">
                  <Cpu className="w-5 h-5" strokeWidth={2} aria-hidden="true" />
                  <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-400 border-2 border-primary rounded-full" />
                </div>
                <div>
                  <span className="font-semibold text-sm leading-none block">Course Companion</span>
                  <span className="text-[10px] text-on-primary/70 font-medium">{isTyping ? "Typing…" : "Ready to help"}</span>
                </div>
              </div>
              <button
                onClick={() => setIsChatOpen(false)}
                aria-label="Close chat"
                className="hover:bg-white/15 text-on-primary/80 hover:text-on-primary p-1.5 rounded-lg transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div
              ref={threadRef}
              role="log"
              aria-live="polite"
              className="h-72 p-md overflow-y-auto bg-surface-container-low/30 space-y-md scroll-smooth"
            >
              {messages.map((msg, i) => {
                const isUser = msg.sender === "user";
                return (
                  <div key={i} className={`flex gap-sm ${isUser ? "justify-end" : "justify-start"}`}>
                    {!isUser && (
                      <div className="w-7 h-7 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0 mt-1">
                        <Cpu className="w-4 h-4 text-primary" strokeWidth={2} aria-hidden="true" />
                      </div>
                    )}
                    <div
                      className={`p-3 max-w-[80%] text-sm shadow-xs ${isUser
                          ? "bg-primary text-on-primary rounded-2xl rounded-tr-sm"
                          : "bg-surface-container-lowest text-on-surface border border-outline-variant/50 rounded-2xl rounded-tl-sm"
                        }`}
                    >
                      {isUser ? (
                        <p className="leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                      ) : (
                        <div className="prose prose-sm dark:prose-invert max-w-none leading-relaxed">
                          <ReactMarkdown>{msg.text}</ReactMarkdown>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}

              {isTyping && (
                <div className="flex gap-sm justify-start" aria-label="Companion is typing">
                  <div className="w-7 h-7 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0 mt-1">
                    <Cpu className="w-4 h-4 text-primary" strokeWidth={2} aria-hidden="true" />
                  </div>
                  <div className="p-3 bg-surface-container-lowest border border-outline-variant/50 rounded-2xl rounded-tl-sm flex items-center gap-1">
                    {[0, 1, 2].map((d) => (
                      <span
                        key={d}
                        className="w-1.5 h-1.5 rounded-full bg-outline animate-bounce"
                        style={{ animationDelay: `${d * 120}ms` }}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="px-md pt-sm flex flex-wrap gap-1.5 border-t border-outline-variant/60 bg-surface-container-lowest">
              {QUICK_PROMPTS.map((q) => (
                <button
                  key={q.label}
                  onClick={() => sendMessage(q.prompt)}
                  disabled={isTyping}
                  className="text-[11px] font-medium text-on-surface-variant bg-surface-container hover:bg-surface-container-high border border-outline-variant/70 px-2.5 py-1 rounded-full transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {q.label}
                </button>
              ))}
            </div>

            <div className="p-md bg-surface-container-lowest">
              <form
                onSubmit={handleSendMessage}
                className="flex items-center gap-xs bg-surface-container border border-outline-variant/80 rounded-xl px-sm py-1 focus-within:border-primary focus-within:ring-1 focus-within:ring-primary/40 transition-all duration-200"
              >
                <input
                  ref={inputRef}
                  type="text"
                  value={userInput}
                  onChange={(e) => setUserInput(e.target.value)}
                  placeholder="Ask me to summarize or generate a quiz..."
                  disabled={isTyping}
                  aria-label="Message the Course Companion"
                  className="flex-1 bg-transparent border-0 focus:outline-none focus:ring-0 text-xs py-1.5 px-1 text-on-surface placeholder:text-outline-variant disabled:opacity-60"
                />
                <button
                  type="submit"
                  disabled={!userInput.trim() || isTyping}
                  aria-label="Send message"
                  className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary hover:bg-primary/95 text-on-primary transition-all active:scale-95 disabled:opacity-50"
                >
                  <Send className="w-3.5 h-3.5" aria-hidden="true" />
                </button>
              </form>
              <p className="text-[10px] text-center text-outline-variant mt-2">AI generated. Double check vital concepts.</p>
            </div>
          </div>
        )}

        <button
          onClick={() => setIsChatOpen((open) => !open)}
          aria-label={isChatOpen ? "Close companion chat" : "Open companion chat"}
          aria-expanded={isChatOpen}
          className={`w-14 h-14 rounded-full shadow-xl flex items-center justify-center transition-all duration-300 relative cursor-pointer group ${isChatOpen
              ? "bg-surface-container-lowest text-primary border border-primary/20 scale-95"
              : "bg-primary text-on-primary hover:scale-105 hover:shadow-primary/20 hover:shadow-2xl"
            }`}
        >
          {!isChatOpen && (
            <span className="absolute inset-0 rounded-full bg-primary/20 animate-ping group-hover:animate-none opacity-75" />
          )}
          <div className="relative z-10 transition-transform duration-300 group-hover:rotate-12">
            {isChatOpen ? <X className="w-6 h-6" /> : <Cpu className="w-6 h-6" strokeWidth={2} />}
          </div>
        </button>
      </div>
    </>
  );
}