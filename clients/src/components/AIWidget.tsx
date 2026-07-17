import { useState, useRef, useEffect, memo } from "react";
import { Link } from "react-router";
import { Sparkles, Send, Maximize2, Loader2, AlertCircle, RotateCcw } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { useSendChatMessageMutation } from "../store/api/apiSlice";

const QUICK_PROMPTS = ["Explain this topic simply", "Create a quiz", "Help me plan my studies"];

type ChatMessage = {
  id: number;
  role: "USER" | "ASSISTANT";
  content: string;
  // Only ever set on USER messages — tracks in-flight / failed delivery for that turn.
  status?: "pending" | "error";
};

function AIWidgetImpl() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [conversationId, setConversationId] = useState<string | undefined>();
  const scrollRef = useRef<HTMLDivElement>(null);
  const idRef = useRef(0);
  const [sendChatMessage, { isLoading }] = useSendChatMessageMutation();

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, isLoading]);

  function nextId() {
    idRef.current += 1;
    return idRef.current;
  }

  // Shared delivery path for both a fresh send and a retry of an existing message.
  async function deliver(id: number, content: string) {
    try {
      const res = await sendChatMessage({ message: content, conversationId }).unwrap();
      setConversationId(res.data.conversation.id);
      setMessages((m) => m.map((msg) => (msg.id === id ? { ...msg, status: undefined } : msg)));
      setMessages((m) => [...m, { id: nextId(), role: "ASSISTANT", content: res.data.reply.content }]);
    } catch {
      setMessages((m) => m.map((msg) => (msg.id === id ? { ...msg, status: "error" } : msg)));
    }
  }

  function handleSend(text?: string) {
    const message = (text ?? input).trim();
    if (!message || isLoading) return;
    const id = nextId();
    setMessages((m) => [...m, { id, role: "USER", content: message, status: "pending" }]);
    setInput("");
    deliver(id, message);
  }

  function handleRetry(id: number, content: string) {
    if (isLoading) return;
    setMessages((m) => m.map((msg) => (msg.id === id ? { ...msg, status: "pending" } : msg)));
    deliver(id, content);
  }

  return (
    <div className="card flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="flex h-6 w-6 items-center justify-center rounded-md bg-primary-600/10 text-primary-600">
            <Sparkles size={13} />
          </span>
          <span className="text-sm font-semibold">AI Assistant</span>
        </div>
        <Link
          to="/ai-assistant"
          className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-primary-600"
          aria-label="Open full AI assistant"
        >
          <Maximize2 size={15} />
        </Link>
      </div>

      <div
        ref={scrollRef}
        aria-live="polite"
        className="flex-1 space-y-3 overflow-y-auto p-3"
        style={{ minHeight: 180, maxHeight: 260 }}
      >
        {messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-600/10 text-primary-600">
              <Sparkles size={16} />
            </span>
            <p className="text-xs text-muted-foreground">What do you need help with?</p>
            <div className="flex flex-wrap justify-center gap-1.5 px-2">
              {QUICK_PROMPTS.map((p) => (
                <button
                  key={p}
                  onClick={() => handleSend(p)}
                  className="rounded-full border border-border bg-muted/60 px-3 py-1.5 text-xs text-foreground transition-colors hover:bg-muted"
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((m) => (
            <div key={m.id} className={`flex ${m.role === "USER" ? "justify-end" : "justify-start"}`}>
              <div className="flex max-w-[85%] flex-col items-end gap-1">
                <div className="flex items-end gap-1.5">
                  {m.role === "ASSISTANT" && (
                    <span className="mb-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary-600/10 text-primary-600">
                      <Sparkles size={10} />
                    </span>
                  )}
                  <div
                    className={`rounded-lg px-3 py-2 text-xs transition-opacity ${
                      m.role === "USER"
                        ? `bg-primary-600 text-white rounded-br-sm ${m.status === "pending" ? "opacity-60" : ""}`
                        : "bg-muted rounded-bl-sm"
                    }`}
                  >
                    <div className="prose prose-xs dark:prose-invert max-w-none">
                      <ReactMarkdown>{m.content}</ReactMarkdown>
                    </div>
                  </div>
                </div>
                {m.status === "error" && (
                  <button
                    onClick={() => handleRetry(m.id, m.content)}
                    className="flex items-center gap-1 text-[11px] font-medium text-red-500 hover:text-red-600"
                  >
                    <AlertCircle size={11} />
                    Failed to send
                    <span className="inline-flex items-center gap-0.5 underline underline-offset-2">
                      <RotateCcw size={10} /> Retry
                    </span>
                  </button>
                )}
              </div>
            </div>
          ))
        )}

        {isLoading && (
          <div className="flex items-center gap-1.5">
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary-600/10 text-primary-600">
              <Sparkles size={10} />
            </span>
            <div className="flex items-center gap-1 rounded-lg rounded-bl-sm bg-muted px-3 py-2.5">
              {[0, 1, 2].map((d) => (
                <span
                  key={d}
                  className="h-1.5 w-1.5 rounded-full bg-muted-foreground/60 animate-bounce"
                  style={{ animationDelay: `${d * 120}ms` }}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSend();
        }}
        className="border-t border-border p-2"
      >
        <div className="flex items-center gap-1 rounded-xl border border-border bg-muted/30 py-1 pl-3 pr-1.5 transition-colors focus-within:border-primary-600 focus-within:bg-transparent focus-within:ring-1 focus-within:ring-primary-600/30">
          <input
            className="flex-1 bg-transparent py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
            placeholder="Ask anything..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={isLoading}
            aria-label="Ask the AI assistant"
          />
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            aria-label="Send"
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary-600 text-white transition-all enabled:hover:bg-primary-600/90 enabled:active:scale-90 disabled:bg-transparent disabled:text-muted-foreground/40"
          >
            {isLoading ? <Loader2 size={13} className="animate-spin" /> : <Send size={13} />}
          </button>
        </div>
      </form>
    </div>
  );
}

export const AIWidget = memo(AIWidgetImpl);