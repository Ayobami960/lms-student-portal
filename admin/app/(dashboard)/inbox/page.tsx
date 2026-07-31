"use client";

import { useEffect, useRef, useState } from "react";
import { Send, Inbox, Archive, CheckCircle2 } from "lucide-react";
import toast from "react-hot-toast";
import {
  useListConversationsQuery,
  useGetConversationQuery,
  useSendConversationMessageMutation,
  useUpdateConversationStatusMutation,
} from "@/store/api/apiSlice";

import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/EmptyState";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";

export default function InboxPage() {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Poll so the admin sees new incoming messages without refreshing the page.
  const { data: listRes, isLoading } = useListConversationsQuery();
  const { data: convRes } = useGetConversationQuery(activeId!, { skip: !activeId });
  const [sendMessage, { isLoading: sending }] = useSendConversationMessageMutation();
  const [updateStatus] = useUpdateConversationStatusMutation();
  const conversations = listRes?.data ?? [];
  const active = convRes?.data;

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [active?.messages?.length]);

  async function handleSend() {
    if (!activeId || !input.trim()) return;
    const content = input.trim();
    setInput("");
    try {
      await sendMessage({ id: activeId, content }).unwrap();
    } catch (e: any) {
      setInput(content); // restore so the admin doesn't lose what they typed
      toast.error(e?.data?.message ?? "Failed to send message");
    }
  }

  return (
    <div className="flex h-[calc(100vh-8rem)] gap-4">
      <aside className="w-80 shrink-0 card overflow-y-auto">
        <div className="border-b border-gray-100 px-4 py-3 text-sm font-semibold dark:border-gray-800">Support Inbox</div>
        {isLoading ? (
          <div className="space-y-2 p-3">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-14" />)}</div>
        ) : !conversations.length ? (
          <p className="p-4 text-sm text-gray-400">No conversations yet.</p>
        ) : (
          conversations.map((c: any) => {
            const student = c.participants.find((p: any) => p.user.role === "STUDENT")?.user;
            const lastMessage = c.messages[0];
            return (
              <button
                key={c.id}
                onClick={() => setActiveId(c.id)}
                className={`block w-full border-b border-gray-50 px-4 py-3 text-left hover:bg-gray-50 dark:border-gray-800/50 dark:hover:bg-gray-800/50 ${activeId === c.id ? "bg-primary-50 dark:bg-primary-900/20" : ""}`}
              >
                <div className="mb-1 flex items-center justify-between">
                  <p className="text-sm font-medium">{c.subject}</p>
                  <Badge variant={c.status === "OPEN" ? "info" : c.status === "RESOLVED" ? "success" : "default"}>{c.status}</Badge>
                </div>
                <p className="truncate text-xs text-gray-500">{student?.name ?? "Unknown"} · {lastMessage?.content ?? ""}</p>
              </button>
            );
          })
        )}
      </aside>

      <div className="flex flex-1 flex-col card">
        {!active ? (
          <EmptyState icon={Inbox} title="Select a conversation" description="Pick a conversation from the inbox to view and reply." />
        ) : (
          <>
            <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3 dark:border-gray-800">
              <div>
                <p className="font-semibold">{active.subject}</p>
                <p className="text-xs text-gray-400">
                  {active.participants.map((p: any) => p.user.name).join(", ")}
                </p>
              </div>
              <div className="flex gap-2">
                {active.status !== "RESOLVED" && (
                  <button onClick={() => updateStatus({ id: active.id, status: "RESOLVED" })} className="btn-secondary text-xs">
                    <CheckCircle2 size={14} /> Resolve
                  </button>
                )}
                {active.status !== "ARCHIVED" && (
                  <button onClick={() => updateStatus({ id: active.id, status: "ARCHIVED" })} className="btn-secondary text-xs">
                    <Archive size={14} /> Archive
                  </button>
                )}
              </div>
            </div>

            <div className="flex-1 space-y-3 overflow-y-auto p-4">
              {active.messages.map((m: any) => (
                <div key={m.id} className={`flex ${m.sender.role === "ADMIN" ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[75%] rounded-xl px-4 py-2.5 text-sm ${m.sender.role === "ADMIN" ? "bg-primary-600 text-white" : "bg-gray-100 dark:bg-gray-800"}`}>
                    <p className="mb-0.5 text-xs opacity-70">{m.sender.name}</p>
                    {m.content}
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            <form onSubmit={(e) => { e.preventDefault(); handleSend(); }} className="flex items-center gap-2 border-t border-gray-100 p-3 dark:border-gray-800">
              <input className="input" placeholder="Type a reply..." value={input} onChange={(e) => setInput(e.target.value)} />
              <Button type="submit" size="icon" disabled={!input.trim() || sending} aria-label="Send">
                <Send size={16} />
              </Button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}