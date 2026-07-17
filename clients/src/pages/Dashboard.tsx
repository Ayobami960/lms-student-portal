import React, { useState,  useRef, useEffect } from "react";
import { Link, Navigate } from "react-router";
import ReactMarkdown from "react-markdown";
import toast from "react-hot-toast";
import {
  BookMarked,
  CheckCircle2,
  TrendingUp,
  Award,
  Cpu,
  X,
  Send,
  Sparkles,
} from "lucide-react";

// API & Redux Integrations
import {
  useGetDashboardAnalyticsQuery,
  useGetProgressAnalyticsQuery,
  useSendChatMessageMutation,
} from "../store/api/apiSlice";
import { useAppSelector } from "../hooks/redux";

// Custom UI Subcomponents
import { AIWidget } from "../components/AIWidget";

interface Message {
  sender: "ai" | "user";
  text: string;
}

// Quick-start prompts surfaced both on the dashboard card and inside the chat panel.
// Keeping this as one source of truth means the two surfaces never drift out of sync.
const QUICK_PROMPTS = [
  { label: "Summarize my progress", prompt: "Summarize my current course progress and tell me what to focus on next." },
  { label: "Explain a concept", prompt: "Can you explain a concept I'm struggling with in my current module?" },
  { label: "Build a quiz", prompt: "Create a short 5-question quiz to test my understanding of this course." },
];

export default function DashboardPage() {
  const user = useAppSelector((s) => s.auth.user);
  const isStudent = user?.role === "STUDENT";

  // This dashboard is student-only — anyone else gets redirected immediately.
  if (user && !isStudent) {
    return <Navigate to="/" replace />;
  }

  // API Queries
  const { data: statsRes, isLoading: statsLoading } = useGetDashboardAnalyticsQuery(undefined, { skip: !isStudent });
  const { data: progressRes, isLoading: progressLoading } = useGetProgressAnalyticsQuery(undefined, { skip: !isStudent });

  const stats = statsRes?.data;
  const progress = progressRes?.data;

  // Summary cards derived from the student's stats payload.
  const summaryCards = [
    {
      label: "Enrolled Courses",
      value: stats?.enrolledCourses ?? 0,
      icon: BookMarked,
      color: "bg-primary/10 text-primary",
    },
    {
      label: "Completed Courses",
      value: stats?.completedCourses ?? 0,
      icon: CheckCircle2,
      color: "bg-secondary/10 text-secondary",
    },
    {
      label: "Average Progress",
      value: `${stats?.averageProgress ?? 0}%`,
      icon: TrendingUp,
      color: "bg-tertiary/10 text-tertiary",
    },
    {
      label: "Certificates Earned",
      value: stats?.certificatesEarned ?? 0,
      icon: Award,
      color: "bg-primary/10 text-primary",
    },
  ];

  // ------------------------------------------------------------------
  // AI Companion state — wired to the real /ai/chat endpoint so replies
  // are actually generated instead of a canned placeholder.
  // ------------------------------------------------------------------
  const [isChatOpen, setIsChatOpen] = useState<boolean>(false);
  const [userInput, setUserInput] = useState<string>("");
  const [conversationId, setConversationId] = useState<string | undefined>(undefined);
  const [messages, setMessages] = useState<Message[]>([
    {
      sender: "ai",
      text: `Hi ${user?.name?.split(" ")[0] || "there"}! Let me know if you need help analyzing your course progression or studying for quizzes.`,
    },
  ]);
  const [sendChatMessage, { isLoading: isTyping }] = useSendChatMessageMutation();

  const inputRef = useRef<HTMLInputElement>(null);
  const threadRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to the newest message whenever the thread changes.
  useEffect(() => {
    threadRef.current?.scrollTo({ top: threadRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, isTyping]);

  // Focus the composer as soon as the panel opens.
  useEffect(() => {
    if (isChatOpen) inputRef.current?.focus();
  }, [isChatOpen]);

  // Let Escape close the panel, same as any dismissible surface should.
  useEffect(() => {
    if (!isChatOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsChatOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isChatOpen]);

  const sendMessage = async (text: string) => {
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
  };

  const handleSendMessage = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    sendMessage(userInput);
  };

  const handleQuickPrompt = (prompt: string) => {
    setIsChatOpen(true);
    sendMessage(prompt);
  };

  return (
    <div className="space-y-lg relative animate-fade-in">
      {/* Welcome Header */}
      <section className="mb-lg">
        <h2 className="text-3xl font-semibold text-on-surface mb-1">
          Welcome back, {user?.name?.split(" ")[0]} 👋
        </h2>
        <div className="flex flex-col md:flex-row md:items-center gap-2">
          <p className="text-lg text-on-surface-variant">Here's where you left off.</p>
          {stats?.averageProgress !== undefined && (
            <div className="flex-1 max-w-xs h-2 bg-outline-variant rounded-full overflow-hidden">
              <div
                className="h-full bg-secondary rounded-full transition-all duration-500"
                style={{ width: `${stats.averageProgress}%` }}
              ></div>
            </div>
          )}
        </div>
      </section>

      {/* Bento Summary Cards Grid */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-md">
        {statsLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-24 bg-surface-container-lowest border border-outline-variant rounded-xl animate-pulse" />
          ))
        ) : (
          summaryCards.map((card, i) => {
            const Icon = card.icon;
            return (
              <div
                key={i}
                className="bg-surface-container-lowest border border-outline-variant shadow-sm p-md rounded-xl flex items-center gap-md hover:-translate-y-0.5 transition-transform duration-200 cursor-pointer"
              >
                <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${card.color}`}>
                  <Icon className="w-6 h-6" strokeWidth={2} />
                </div>
                <div>
                  <p className="text-xs font-semibold text-outline uppercase tracking-wider">{card.label}</p>
                  <p className="text-xl font-semibold text-on-surface">{card.value}</p>
                </div>
              </div>
            );
          })
        )}
      </section>

      {/* Course Completion Metrics */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-md">
        <div className="bg-surface-container-lowest border border-outline-variant shadow-sm p-md rounded-xl flex flex-col justify-between lg:col-span-3">
          <div>
            <h3 className="text-xl font-semibold mb-md">Course Progress</h3>
            {progressLoading ? (
              <div className="space-y-md">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="h-10 bg-outline-variant/20 rounded animate-pulse" />
                ))}
              </div>
            ) : !progress?.length ? (
              <p className="text-sm text-outline">No enrolled active courses found.</p>
            ) : (
              <div className="space-y-md">
                {progress.slice(0, 3).map((course: any) => (
                  <div key={course.courseId}>
                    <div className="flex justify-between text-sm mb-1 font-medium">
                      <span className="truncate max-w-[200px]">{course.courseTitle}</span>
                      <span className="text-primary font-semibold">{course.progress}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-outline-variant rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary"
                        style={{ width: `${course.progress}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          <Link to="/courses" className="w-full mt-6 text-center font-semibold text-sm text-primary hover:underline">
            View All Courses
          </Link>
        </div>
      </section>

      {/* ================= AI Companion — dashboard card ================= */}
      <section className="relative overflow-hidden bg-surface-container-lowest border border-outline-variant shadow-sm rounded-2xl p-lg">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-md mb-md pb-md border-b border-outline-variant/60">
          <div className="flex items-start gap-md">
            <div className="relative flex items-center justify-center w-11 h-11 rounded-xl bg-primary/10 text-primary border border-primary/15 shrink-0">
              <Cpu className="w-5 h-5" strokeWidth={2} />
              <span className="absolute -bottom-1 -right-1 w-3 h-3 rounded-full bg-emerald-500 border-2 border-surface-container-lowest" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-on-surface leading-tight">Course Companion</h3>
              <p className="text-sm text-outline leading-relaxed mt-0.5 ">
                Your AI study partner for this dashboard — it can summarize progress, explain concepts, and turn a module into a quiz.
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsChatOpen(true)}
            className="shrink-0 inline-flex items-center gap-2 text-sm font-semibold text-primary bg-primary/10 hover:bg-primary/15 border border-primary/15 px-4 py-2 rounded-lg transition-colors"
          >
            <Sparkles className="w-4 h-4" />
            Ask the companion
          </button>
        </div>

        {/* Quick-start prompts — clicking one opens the chat and sends it immediately */}
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

      {/* ================= AI Companion — floating chat ================= */}
      <div className="fixed bottom-lg right-lg z-50 flex flex-col items-end gap-md">
        {isChatOpen && (
          <div
            role="dialog"
            aria-label="Course Companion chat"
            className="w-85 md:w-96 bg-surface-container-lowest border border-outline-variant/80 rounded-2xl overflow-hidden shadow-2xl transition-all duration-300 ease-out animate-in fade-in slide-in-from-bottom-6"
          >
            {/* Header */}
            <div className="bg-primary p-md flex justify-between items-center text-on-primary">
              <div className="flex items-center gap-sm">
                <div className="relative bg-white/15 p-2 rounded-xl border border-white/15">
                  <Cpu className="w-5 h-5" strokeWidth={2} />
                  <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-400 border-2 border-primary rounded-full" />
                </div>
                <div>
                  <span className="font-semibold text-sm leading-none block">Course Companion</span>
                  <span className="text-[10px] text-on-primary/70 font-medium">
                    {isTyping ? "Typing…" : "Ready to help"}
                  </span>
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

            {/* Conversation */}
            <div
              ref={threadRef}
              className="h-72 p-md overflow-y-auto bg-surface-container-low/30 space-y-md scroll-smooth"
            >
              {messages.map((msg, i) => {
                const isUser = msg.sender === "user";
                return (
                  <div key={i} className={`flex gap-sm ${isUser ? "justify-end" : "justify-start"}`}>
                    {!isUser && (
                      <div className="w-7 h-7 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0 mt-1">
                        <Cpu className="w-4 h-4 text-primary" strokeWidth={2} />
                      </div>
                    )}
                    <div
                      className={`p-3 max-w-[80%] text-sm shadow-xs ${
                        isUser
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
                <div className="flex gap-sm justify-start">
                  <div className="w-7 h-7 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0 mt-1">
                    <Cpu className="w-4 h-4 text-primary" strokeWidth={2} />
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

            {/* Quick prompts inside the panel too, for when it's opened via the FAB */}
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

            {/* Composer */}
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
                  className="flex-1 bg-transparent border-0 focus:outline-none focus:ring-0 text-xs py-1.5 px-1 text-on-surface placeholder:text-outline-variant disabled:opacity-60"
                />
                <button
                  type="submit"
                  disabled={!userInput.trim() || isTyping}
                  aria-label="Send message"
                  className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary hover:bg-primary/95 text-on-primary transition-all active:scale-95 disabled:opacity-50"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </form>
              <p className="text-[10px] text-center text-outline-variant mt-2">
                AI generated. Double check vital concepts.
              </p>
            </div>
          </div>
        )}

        {/* Floating Action Button */}
        <button
          onClick={() => setIsChatOpen(!isChatOpen)}
          aria-label={isChatOpen ? "Close companion chat" : "Open companion chat"}
          className={`w-14 h-14 rounded-full shadow-xl flex items-center justify-center transition-all duration-300 relative cursor-pointer group ${
            isChatOpen
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
    </div>
  );
}