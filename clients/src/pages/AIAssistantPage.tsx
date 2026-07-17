import { useState, useRef, useEffect } from "react";
import { Sparkles, Send, Trash2, Loader2, Plus } from "lucide-react";
import ReactMarkdown from "react-markdown";
import toast from "react-hot-toast";
import { useListConversationsQuery, useLazyGetConversationQuery, useSendChatMessageMutation } from "../store/api/apiSlice";

const SUGGESTED_PROMPTS = [
  "Explain this topic in simple terms.",
  "Create a quiz from this lesson.",
  "Help me create a study plan.",
  "Summarize this course module.",
];

export default function AIAssistantPage() {
  const [conversationId, setConversationId] = useState<string | undefined>();
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<{ role: "USER" | "ASSISTANT"; content: string }[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  const { data: conversationsRes } = useListConversationsQuery();
  const [fetchConversation] = useLazyGetConversationQuery();
  const [sendChatMessage, { isLoading }] = useSendChatMessageMutation();

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, isLoading]);

  async function handleSend(text?: string) {
    const message = (text ?? input).trim();
    if (!message) return;
    setMessages((m) => [...m, { role: "USER", content: message }]);
    setInput("");
    try {
      const res = await sendChatMessage({ message, conversationId }).unwrap();
      setConversationId(res.data.conversation.id);
      setMessages((m) => [...m, { role: "ASSISTANT", content: res.data.reply.content }]);
    } catch {
      toast.error("The AI assistant is temporarily unavailable");
    }
  }

  function startNewConversation() {
    setConversationId(undefined);
    setMessages([]);
  }

  async function loadConversation(id: string) {
    const res = await fetchConversation(id).unwrap();
    setConversationId(id);
    setMessages(res.data.messages.map((m: any) => ({ role: m.role, content: m.content })));
  }

  return (
    <div className="flex h-[calc(100vh-8rem)] gap-4">
      <aside className="hidden w-64 shrink-0 flex-col md:flex">
        <button onClick={startNewConversation} className="btn-secondary mb-3 w-full">
          <Plus size={16} /> New conversation
        </button>
        <div className="card flex-1 overflow-y-auto p-2">
          {conversationsRes?.data?.length ? conversationsRes.data.map((c: any) => (
            <button
              key={c.id}
              onClick={() => loadConversation(c.id)}
              className={`block w-full truncate rounded-lg px-3 py-2 text-left text-sm hover:bg-surface-container-high ${conversationId === c.id ? "bg-primary-container/30 text-on-primary-container" : ""}`}
            >
              {c.title}
            </button>
          )) : <p className="p-3 text-sm text-on-surface-variant">No conversations yet.</p>}
        </div>
      </aside>

      <div className="flex flex-1 flex-col card">
        <div className="flex items-center justify-between border-b border-outline-variant px-4 py-3">
          <div className="flex items-center gap-2 font-semibold"><Sparkles size={18} className="text-primary" /> AI Learning Assistant</div>
          {messages.length > 0 && (
            <button onClick={startNewConversation} className="text-sm text-on-surface-variant hover:text-red-500" aria-label="Clear conversation">
              <Trash2 size={16} />
            </button>
          )}
        </div>

        <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto p-4">
          {messages.length === 0 && (
            <div className="flex h-full flex-col items-center justify-center text-center">
              <Sparkles size={32} className="mb-3 text-primary/40" />
              <p className="mb-4 text-sm text-on-surface-variant">Ask me anything about your courses, or try a suggestion:</p>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {SUGGESTED_PROMPTS.map((p) => (
                  <button key={p} onClick={() => handleSend(p)} className="btn-secondary text-xs">{p}</button>
                ))}
              </div>
            </div>
          )}

          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === "USER" ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[80%] rounded-xl px-4 py-2.5 text-sm ${m.role === "USER" ? "bg-primary text-on-primary" : "bg-surface-container"}`}>
                <div className="prose prose-sm dark:prose-invert max-w-none">
                  <ReactMarkdown>{m.content}</ReactMarkdown>
                </div>
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex justify-start">
              <div className="flex items-center gap-2 rounded-xl bg-surface-container px-4 py-2.5 text-sm">
                <Loader2 size={14} className="animate-spin" /> Thinking...
              </div>
            </div>
          )}
        </div>

        <form onSubmit={(e) => { e.preventDefault(); handleSend(); }} className="flex gap-2 border-t border-outline-variant p-3">
          <input
            className="input"
            placeholder="Ask the AI assistant..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            aria-label="Message"
          />
          <button type="submit" disabled={!input.trim() || isLoading} className="btn-primary" aria-label="Send message">
            <Send size={16} />
          </button>
        </form>
      </div>
    </div>
  );
}