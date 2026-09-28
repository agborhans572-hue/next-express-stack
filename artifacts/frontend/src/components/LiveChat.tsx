import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageSquare, X, Send, Minus, Loader2 } from "lucide-react";
import { useAuth } from "@/context/auth";
import { getSocket } from "@/lib/socket";
import { toast } from "sonner";
import { apiFetch } from "@/lib/api";

interface ChatMessage {
  id: number;
  sessionId: number;
  senderId: number;
  senderRole: string;
  content: string;
  createdAt: string | Date;
}

interface ChatSession {
  id: number;
  userId: number;
  userEmail: string;
  status: string;
  createdAt: string | Date;
  updatedAt: string | Date;
}

export default function LiveChat({
  forceOpen = false,
}: {
  forceOpen?: boolean;
}) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [minimized, setMinimized] = useState(false);
  const openRef = useRef(false);

  useEffect(() => {
    if (forceOpen && user) {
      setOpen(true);
      setMinimized(false);
    }
  }, [forceOpen, user]);

  const [session, setSession] = useState<ChatSession | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [unread, setUnread] = useState(0);
  const bottomRef = useRef<HTMLDivElement>(null);
  const initializedRef = useRef(false);
  const socketHandlersRef = useRef<{
    handleMessage?: (msg: ChatMessage) => void;
    handleClosed?: () => void;
  }>({});

  const scrollToBottom = useCallback(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    openRef.current = open;
    if (open && unread > 0) setUnread(0);
  }, [open, unread]);

  useEffect(() => {
    return () => {
      if (!__SOCKET_IO_ENABLED__) return;
      const socket = getSocket();
      if (socketHandlersRef.current.handleMessage)
        socket.off("chat:message", socketHandlersRef.current.handleMessage);
      if (socketHandlersRef.current.handleClosed)
        socket.off("chat:closed", socketHandlersRef.current.handleClosed);
    };
  }, []);

  useEffect(() => {
    if (!open || !user || initializedRef.current) return;
    initializedRef.current = true;
    initSession();
  }, [open, user]);

  async function initSession(): Promise<void> {
    setLoading(true);
    try {
      const sessions = await apiFetch<ChatSession[]>("/chat/sessions");
      const existingOpen = sessions.find((s) => s.status === "open");

      let sess: ChatSession;
      if (existingOpen) {
        sess = existingOpen;
      } else {
        sess = await apiFetch<ChatSession>("/chat/sessions", {
          method: "POST",
        });
      }

      setSession(sess);

      const msgs = await apiFetch<ChatMessage[]>(
        `/chat/sessions/${sess.id}/messages`,
      );
      setMessages(msgs);
      setTimeout(scrollToBottom, 100);

      if (!__SOCKET_IO_ENABLED__) return;
      const socket = getSocket();
      socket.emit("join:chat", sess.id);

      const handleMessage = (msg: ChatMessage) => {
        if (msg.sessionId === sess.id) {
          setMessages((prev) => [...prev, msg]);
          if (msg.senderRole !== "user") {
            setUnread((u) => u + 1);
            if (!openRef.current) {
              toast("Support replied", {
                description:
                  msg.content.length > 70
                    ? msg.content.slice(0, 70) + "…"
                    : msg.content,
                duration: 5000,
              });
            }
          }
          setTimeout(scrollToBottom, 50);
        }
      };

      const handleClosed = () => {
        setSession((s) => (s ? { ...s, status: "closed" } : s));
      };

      socketHandlersRef.current.handleMessage = handleMessage;
      socketHandlersRef.current.handleClosed = handleClosed;
      socket.on("chat:message", handleMessage);
      socket.on("chat:closed", handleClosed);
    } catch (e) {
      console.error("Failed to init chat session", e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (__SOCKET_IO_ENABLED__ || !open || !session) return;
    let active = true;
    const poll = async () => {
      try {
        const next = await apiFetch<ChatMessage[]>(
          `/chat/sessions/${session.id}/messages`,
        );
        if (active) setMessages(next);
      } catch {
        // Keep the last successful messages and retry on the next interval.
      }
    };
    const timer = window.setInterval(() => void poll(), 5_000);
    return () => {
      active = false;
      window.clearInterval(timer);
    };
  }, [open, session?.id]);

  async function sendMessage() {
    if (!input.trim() || !session || sending) return;
    const content = input.trim();
    setInput("");
    setSending(true);
    try {
      const sent = await apiFetch<ChatMessage>(
        `/chat/sessions/${session.id}/messages`,
        {
          method: "POST",
          body: JSON.stringify({ content }),
        },
      );
      if (!__SOCKET_IO_ENABLED__)
        setMessages((previous) =>
          previous.some((message) => message.id === sent.id)
            ? previous
            : [...previous, sent],
        );
    } catch (e) {
      console.error("Failed to send message", e);
      setInput(content);
      toast.error("Failed to send message. Please try again.");
    } finally {
      setSending(false);
    }
  }

  if (!user) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
      <AnimatePresence>
        {open && !minimized && (
          <motion.div
            key="chat-window"
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="w-[340px] rounded-2xl shadow-2xl border border-gray-200 bg-white overflow-hidden flex flex-col"
            style={{ height: 460 }}
          >
            <div className="bg-olive-500 px-4 py-3 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                  <MessageSquare className="h-4 w-4 text-white" />
                </div>
                <div>
                  <p className="text-white font-semibold text-sm">
                    Shiprion Support
                  </p>
                  <p className="text-olive-200 text-xs flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
                    Online
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setMinimized(true)}
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-white/70 hover:text-white hover:bg-white/10 transition-colors"
                >
                  <Minus className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={() => {
                    setOpen(false);
                    setSession(null);
                    setMessages([]);
                    initializedRef.current = false;
                  }}
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-white/70 hover:text-white hover:bg-white/10 transition-colors"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 bg-gray-50">
              {loading ? (
                <div className="flex items-center justify-center h-full">
                  <Loader2 className="h-5 w-5 animate-spin text-olive-500" />
                </div>
              ) : messages.length === 0 ? (
                <div className="text-center pt-8">
                  <div className="w-12 h-12 rounded-full bg-cream-100 flex items-center justify-center mx-auto mb-3">
                    <MessageSquare className="h-6 w-6 text-olive-500" />
                  </div>
                  <p className="text-sm font-medium text-gray-700">
                    Start a conversation
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    Our team typically replies within a few minutes
                  </p>
                </div>
              ) : (
                messages.map((msg) => {
                  const isMe = msg.senderRole === "user";
                  return (
                    <div
                      key={msg.id}
                      className={`flex ${isMe ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-[75%] px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed ${
                          isMe
                            ? "bg-olive-500 text-white rounded-br-sm"
                            : "bg-white text-gray-800 border border-gray-100 rounded-bl-sm shadow-sm"
                        }`}
                      >
                        {!isMe && (
                          <p className="text-[10px] font-semibold text-olive-500 mb-0.5">
                            Support
                          </p>
                        )}
                        {msg.content}
                        <p
                          className={`text-[10px] mt-1 ${isMe ? "text-olive-200" : "text-gray-400"}`}
                        >
                          {new Date(msg.createdAt).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={bottomRef} />
            </div>

            {session?.status === "closed" ? (
              <div className="px-4 py-3 border-t border-gray-100 bg-white text-center text-xs text-gray-400">
                This chat has been closed by support.
              </div>
            ) : (
              <div className="px-3 py-3 border-t border-gray-100 bg-white shrink-0">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) =>
                      e.key === "Enter" && !e.shiftKey && sendMessage()
                    }
                    placeholder="Type a message…"
                    className="flex-1 text-sm px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-olive-400 bg-gray-50"
                    disabled={sending}
                  />
                  <button
                    onClick={sendMessage}
                    disabled={!input.trim() || sending}
                    className="w-9 h-9 rounded-xl bg-olive-500 flex items-center justify-center text-white disabled:opacity-40 hover:bg-olive-600 transition-colors shrink-0"
                  >
                    {sending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.93 }}
        onClick={() => {
          if (minimized) {
            setMinimized(false);
          } else {
            setOpen((v) => !v);
          }
        }}
        className="w-14 h-14 rounded-full bg-olive-500 shadow-lg flex items-center justify-center text-white relative"
      >
        <AnimatePresence mode="wait">
          {open && !minimized ? (
            <motion.div
              key="close"
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 90, opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              <X className="h-6 w-6" />
            </motion.div>
          ) : (
            <motion.div
              key="open"
              initial={{ rotate: 90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: -90, opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              <MessageSquare className="h-6 w-6" />
            </motion.div>
          )}
        </AnimatePresence>
        {unread > 0 && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-[#41276C] text-white text-[10px] font-bold flex items-center justify-center"
          >
            {unread}
          </motion.span>
        )}
      </motion.button>
    </div>
  );
}
