import { useState } from "react";
import { Send, Inbox, Plus } from "lucide-react";
import toast from "react-hot-toast";
import {
  useListMyConversationsQuery,
  useGetMyConversationQuery,
  useStartConversationMutation,
  useReplyToConversationMutation,
} from "../store/api/apiSlice";
import { Skeleton } from "../components/Skeleton";
import { EmptyState } from "../components/EmptyState";
import { Badge } from "../components/Badge";
import { Modal } from "../components/ui/Modal";
import { Input } from "../components/ui/Input";
import { Button } from "../components/ui/Button";
import { useAppSelector } from "../hooks/redux";

function NewConversationModal({ isInstructor, onClose }: { isInstructor: boolean; onClose: () => void }) {
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [recipientId, setRecipientId] = useState("");
  const [startConversation, { isLoading }] = useStartConversationMutation();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!subject.trim() || !message.trim()) return toast.error("Subject and message are required");
    if (isInstructor && !recipientId.trim()) return toast.error("Student ID or user ID of the recipient is required");
    try {
      await startConversation({
        subject,
        message,
        type: isInstructor ? "INSTRUCTOR_DM" : "SUPPORT",
        recipientId: isInstructor ? recipientId.trim() : undefined,
      }).unwrap();
      toast.success(isInstructor ? "Message sent" : "Support request sent to the admin team");
      onClose();
    } catch (e: any) {
      toast.error(e?.data?.message ?? "Failed to send");
    }
  }

  return (
    <Modal open onClose={onClose} title={isInstructor ? "Message a student" : "Contact support"}>
      <form onSubmit={handleSubmit} className="space-y-3">
        {isInstructor && (
          <>
            <Input
              label="Student's user ID"
              id="recipientId"
              value={recipientId}
              onChange={(e) => setRecipientId(e.target.value)}
              placeholder="Copy from the student roster"
            />
            <p className="text-xs text-outline">They must be enrolled in one of your courses.</p>
          </>
        )}
        <Input label="Subject" id="subject" value={subject} onChange={(e) => setSubject(e.target.value)} />
        <div>
          <label className="label" htmlFor="message">Message</label>
          <textarea
            id="message"
            className="input"
            rows={4}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
          />
        </div>
        <Button type="submit" loading={isLoading} className="w-full">
          <Send size={16} /> Send
        </Button>
      </form>
    </Modal>
  );
}

const MessagesPage = () => {
  const user = useAppSelector((s) => s.auth.user);
  const isInstructor = user?.role === "INSTRUCTOR";
  const [activeId, setActiveId] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [showNew, setShowNew] = useState(false);

  const { data: listRes, isLoading } = useListMyConversationsQuery();
  const { data: convRes } = useGetMyConversationQuery(activeId!, { skip: !activeId });
  const [reply, { isLoading: sending }] = useReplyToConversationMutation();

  const conversations = listRes?.data ?? [];
  const active = convRes?.data;

  async function handleSend() {
    if (!activeId || !input.trim()) return;
    try {
      await reply({ id: activeId, content: input.trim() }).unwrap();
      setInput("");
    } catch (e: any) {
      toast.error(e?.data?.message ?? "Failed to send reply");
    }
  }

  return (
    <div className="animate-fade-in">
      <div className="mb-lg flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-on-surface">Messages</h1>
          <p className="text-sm text-outline">
            {isInstructor ? "Message students enrolled in your courses." : "Get help from the admin team."}
          </p>
        </div>
        <Button onClick={() => setShowNew(true)}>
          <Plus size={16} /> {isInstructor ? "New message" : "Contact support"}
        </Button>
      </div>

      <div className="flex h-[calc(100vh-14rem)] gap-md">
        <aside className="w-72 shrink-0 overflow-y-auto rounded-xl border border-outline-variant bg-surface-container-lowest shadow-sm">
          {isLoading ? (
            <div className="space-y-2 p-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-14" />
              ))}
            </div>
          ) : !conversations.length ? (
            <p className="p-4 text-sm text-outline">No conversations yet.</p>
          ) : (
            conversations.map((c: any) => {
              const other = c.participants.find((p: any) => p.user.id !== user?.id)?.user;
              return (
                <button
                  key={c.id}
                  onClick={() => setActiveId(c.id)}
                  className={`block w-full border-b border-outline-variant px-4 py-3 text-left transition hover:bg-surface-container ${
                    activeId === c.id ? "bg-primary-container/30" : ""
                  }`}
                >
                  <div className="mb-1 flex items-center justify-between">
                    <p className="text-sm font-medium text-on-surface">{c.subject}</p>
                    <Badge variant={c.status === "OPEN" ? "info" : c.status === "RESOLVED" ? "success" : "default"}>
                      {c.status}
                    </Badge>
                  </div>
                  <p className="truncate text-xs text-on-surface-variant">
                    {other?.name ?? "Admin team"} · {c.messages?.[0]?.content ?? ""}
                  </p>
                </button>
              );
            })
          )}
        </aside>

        <div className="flex flex-1 flex-col rounded-xl border border-outline-variant bg-surface-container-lowest shadow-sm">
          {!active ? (
            <EmptyState icon={Inbox} title="Select a conversation" description="Pick a thread to view and reply." />
          ) : (
            <>
              <div className="border-b border-outline-variant px-4 py-3">
                <p className="font-semibold text-on-surface">{active.subject}</p>
              </div>
              <div className="flex-1 space-y-3 overflow-y-auto p-4">
                {active.messages.map((m: any) => (
                  <div key={m.id} className={`flex ${m.sender.id === user?.id ? "justify-end" : "justify-start"}`}>
                    <div
                      className={`max-w-[75%] rounded-xl px-4 py-2.5 text-sm ${
                        m.sender.id === user?.id
                          ? "bg-primary text-on-primary"
                          : "bg-surface-container text-on-surface"
                      }`}
                    >
                      <p className="mb-0.5 text-xs opacity-70">{m.sender.name}</p>
                      {m.content}
                    </div>
                  </div>
                ))}
              </div>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSend();
                }}
                className="flex gap-2 border-t border-outline-variant p-3"
              >
                <input
                  className="input"
                  placeholder="Type a reply..."
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                />
                <Button type="submit" disabled={!input.trim()} loading={sending} aria-label="Send">
                  <Send size={16} />
                </Button>
              </form>
            </>
          )}
        </div>
      </div>

      {showNew && <NewConversationModal isInstructor={isInstructor} onClose={() => setShowNew(false)} />}
    </div>
  );
};

export default MessagesPage;