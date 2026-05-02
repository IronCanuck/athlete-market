"use client";

import { useEffect, useRef, useState } from "react";
import { Send } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { createClient } from "@/lib/supabase/client";
import type { Message } from "@/types/db";
import { timeAgo, cn } from "@/lib/utils";

export function OrderThread({
  orderId,
  initialMessages,
  currentUserId,
}: {
  orderId: string;
  initialMessages: Message[];
  currentUserId: string;
}) {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages]);

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`order-${orderId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `order_id=eq.${orderId}`,
        },
        (payload) => {
          setMessages((cur) => {
            if (cur.some((m) => m.id === (payload.new as Message).id)) return cur;
            return [...cur, payload.new as Message];
          });
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [orderId]);

  async function send() {
    const text = body.trim();
    if (!text) return;
    setBusy(true);
    const supabase = createClient();
    const { data, error } = await supabase
      .from("messages")
      .insert({ order_id: orderId, sender_id: currentUserId, body: text })
      .select("*")
      .single();
    setBusy(false);
    if (error) return;
    setBody("");
    if (data) {
      setMessages((cur) =>
        cur.some((m) => m.id === data.id) ? cur : [...cur, data as Message]
      );
    }
  }

  return (
    <div className="flex flex-col">
      <div className="max-h-[440px] min-h-[200px] flex-1 space-y-2 overflow-y-auto p-4">
        {messages.length === 0 ? (
          <p className="py-8 text-center text-sm text-[var(--color-fg-muted)]">
            No messages yet — say hi to kick things off.
          </p>
        ) : (
          messages.map((m) => {
            const mine = m.sender_id === currentUserId;
            return (
              <div key={m.id} className={cn("flex", mine ? "justify-end" : "justify-start")}>
                <div
                  className={cn(
                    "max-w-[80%] rounded-2xl px-3 py-2 text-sm",
                    mine
                      ? "rounded-br-sm bg-[var(--color-brand)] text-white"
                      : "rounded-bl-sm bg-[var(--color-bg-subtle)] text-[var(--color-fg)]"
                  )}
                >
                  <div className="whitespace-pre-line">{m.body}</div>
                  <div
                    className={cn(
                      "mt-1 text-[10px]",
                      mine ? "text-white/70" : "text-[var(--color-fg-muted)]"
                    )}
                  >
                    {timeAgo(m.created_at)}
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={endRef} />
      </div>
      <div className="flex items-end gap-2 border-t p-3">
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
              e.preventDefault();
              send();
            }
          }}
          placeholder="Type a message…"
          className="input min-h-[42px] flex-1 resize-none"
          rows={1}
        />
        <Button onClick={send} disabled={busy || !body.trim()}>
          <Send className="h-4 w-4" />
          Send
        </Button>
      </div>
    </div>
  );
}
