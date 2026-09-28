import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageSquare, X, Send, Minus, Loader2, User } from "lucide-react";
import { io, type Socket } from "socket.io-client";
import { apiFetch, ApiRequestError } from "@/lib/api";
import type {
  ClientToServerEvents,
  ServerToClientEvents,
} from "@workspace/api-zod";

const STORAGE_KEY = "shiprion_guest_chat";

interface GuestSession {
  sessionId: number;
  guestToken: string;
  guestName: string;
  expiresAt: string; // ISO timestamp
}

interface ChatMessage {
  id: number;
  sessionId: number;
  senderId: number | null;
  senderRole: string;
  content: string;
  createdAt: string | Date;
}

function loadGuestSession(): GuestSession | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as GuestSession;
    // Discard stored session if the token has expired
    if (!parsed.expiresAt || new Date(parsed.expiresAt) <= new Date()) {
      localStorage.removeItem(STORAGE_KEY);
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

function saveGuestSession(s: GuestSession): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
}

function clearGuestSession(): void {
  localStorage.removeItem(STORAGE_KEY);
}

export default function GuestLiveChat({
  forceOpen = false,
}: {
  forceOpen?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [minimized, setMinimized] = useState(false);
  const [step, setStep] = useState<"form" | "chat">("form");
  const [guestSession, setGuestSession] = useState<GuestSession | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [sessionClosed, setSessionClosed] = useState(false);
  const [unread, setUnread] = useState(0);
  const [nameVal, setNameVal] = useState("");
  const [emailVal, setEmailVal] = useState("");
  const [formError, setFormError] = useState("");
  const [startingChat, setStartingChat] = useState(false);
  const socketRef = useRef<Socket<
    ServerToClientEvents,
    ClientToServerEvents
  > | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const initializedRef = useRef(false);

  const scrollToBottom = useCallback(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    if (forceOpen) {
      setOpen(true);
      setMinimized(false);
    }
  }, [forceOpen]);

  useEffect(() => {
    if (open && unread > 0) setUnread(0);
  }, [open, unread]);

  useEffect(() => {
    const saved = loadGuestSession();
    if (saved) {
      setGuestSession(saved);
      setStep("chat");
    }
  }, []);

  useEffect(() => {
    if (!open || step !== "chat" || !guestSession || initializedRef.current)
      return;
    initializedRef.current = true;
    initSocket(guestSession);
    fetchMessages(guestSession);
  }, [open, step, guestSession]);

  useEffect(() => {
    return () => {
      socketRef.current?.disconnect();
    };
  }, []);

  function initSocket(sess: GuestSession) {
    if (!__SOCKET_IO_ENABLED__) return;
    const socket: Socket<ServerToClientEvents, ClientToServerEvents> = io({
      path: "/api/socket.io",
      withCredentials: true,
    });
    socketRef.current = socket;

    socket.emit("join:guest-chat", {
      sessionId: sess.sessionId,
      guestToken: sess.guestToken,
    });

    socket.on("chat:message", (msg: ChatMessage) => {
      if (msg.sessionId === sess.sessionId) {
        setMessages((prev) => [...prev, msg]);
        if (msg.senderRole !== "guest") {
          setUnread((u) => u + 1);
        }
        setTimeout(scrollToBottom, 50);
      }
    });

    socket.on("chat:closed", () => {
      setSessionClosed(true);
      // Once closed, the token is no longer usable — clear local storage
      clearGuestSession();
    });
  }

  function resetToForm(): void {
    clearGuestSession();
    setGuestSession(null);
    setStep("form");
    setMessages([]);
    setSessionClosed(false);
    initializedRef.current = false;
    socketRef.current?.disconnect();
    socketRef.current = null;
  }

  async function fetchMessages(sess: GuestSession, silent = false) {
    if (!silent) setLoading(true);
    try {
      const data = await apiFetch<ChatMessage[]>(
        `/chat/guest-sessions/${sess.sessionId}/messages`,
        { headers: { "X-Guest-Token": sess.guestToken } },
      );
      setMessages(data);
      setTimeout(scrollToBottom, 100);
    } catch (error) {
      if (error instanceof ApiRequestError && error.status === 403)
        resetToForm();
      else if (error instanceof ApiRequestError && error.status === 410) {
        setSessionClosed(true);
        clearGuestSession();
      }
    } finally {
      if (!silent) setLoading(false);
    }
  }

  useEffect(() => {
    if (__SOCKET_IO_ENABLED__ || !open || !guestSession || sessionClosed)
      return;
    const timer = window.setInterval(
      () => void fetchMessages(guestSession, true),
      5_000,
    );
    return () => window.clearInterval(timer);
  }, [open, guestSession?.sessionId, sessionClosed]);

  async function startChat() {
    if (!nameVal.trim()) {
      setFormError("Please enter your name.");
      return;
    }
    if (!emailVal.trim() || !/\S+@\S+\.\S+/.test(emailVal)) {
      setFormError("Please enter a valid email.");
      return;
    }
    setFormError("");
    setStartingChat(true);
    try {
      const data = await apiFetch<{
        session: { id: number };
        guestToken: string;
        guestTokenExpiresAt: string;
      }>("/chat/guest-sessions", {
        method: "POST",
        body: JSON.stringify({
          guestName: nameVal.trim(),
          guestEmail: emailVal.trim(),
        }),
      });
      const sess: GuestSession = {
        sessionId: data.session.id,
        guestToken: data.guestToken,
        guestName: nameVal.trim(),
        expiresAt: data.guestTokenExpiresAt,
      };
      saveGuestSession(sess);
      setGuestSession(sess);
      setStep("chat");
      initSocket(sess);
    } catch {
      setFormError("Could not start chat. Please try again.");
    } finally {
      setStartingChat(false);
    }
  }

  async function sendMessage() {
    if (!input.trim() || !guestSession || sending || sessionClosed) return;
    const content = input.trim();
    setInput("");
    setSending(true);
    try {
      const sent = await apiFetch<ChatMessage>(
        `/chat/guest-sessions/${guestSession.sessionId}/messages`,
        {
          method: "POST",
          headers: { "X-Guest-Token": guestSession.guestToken },
          body: JSON.stringify({ content }),
        },
      );
      if (!__SOCKET_IO_ENABLED__)
        setMessages((previous) =>
          previous.some((message) => message.id === sent.id)
            ? previous
            : [...previous, sent],
        );
    } catch (error) {
      if (error instanceof ApiRequestError && error.status === 403)
        resetToForm();
    } finally {
      setSending(false);
    }
  }

  function handleClose() {
    setOpen(false);
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
      <AnimatePresence>
        {open && !minimized && (
          <motion.div
            key="guest-chat-window"
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="w-[340px] rounded-2xl shadow-2xl border border-gray-200 bg-white overflow-hidden flex flex-col"
            style={{ height: step === "form" ? "auto" : 460 }}
          >
            {/* Header */}
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
                {step === "chat" && (
                  <button
                    onClick={() => setMinimized(true)}
                    className="w-7 h-7 rounded-lg flex items-center justify-center text-white/70 hover:text-white hover:bg-white/10 transition-colors"
                  >
                    <Minus className="h-3.5 w-3.5" />
                  </button>
                )}
                <button
                  onClick={handleClose}
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-white/70 hover:text-white hover:bg-white/10 transition-colors"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            {step === "form" ? (
              /* Name + email collection form */
              <div className="p-5 space-y-4">
                <div>
                  <p className="text-sm font-semibold text-gray-800 mb-0.5">
                    Start a conversation
                  </p>
                  <p className="text-xs text-gray-500">
                    Enter your details so our team can reach you.
                  </p>
                </div>
                <div className="space-y-3">
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">
                      Your name
                    </label>
                    <input
                      type="text"
                      value={nameVal}
                      onChange={(e) => setNameVal(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && startChat()}
                      placeholder="Jane Doe"
                      className="w-full text-sm px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-olive-400 bg-gray-50"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">
                      Email address
                    </label>
                    <input
                      type="email"
                      value={emailVal}
                      onChange={(e) => setEmailVal(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && startChat()}
                      placeholder="jane@example.com"
                      className="w-full text-sm px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-olive-400 bg-gray-50"
                    />
                  </div>
                  {formError && (
                    <p className="text-xs text-red-500">{formError}</p>
                  )}
                  <button
                    onClick={startChat}
                    disabled={startingChat}
                    className="w-full py-2.5 rounded-xl bg-olive-500 hover:bg-olive-600 text-white text-sm font-semibold transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {startingChat ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <MessageSquare className="h-4 w-4" />
                        Start Chat
                      </>
                    )}
                  </button>
                </div>
              </div>
            ) : (
              /* Chat window */
              <>
                <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 bg-gray-50">
                  {loading ? (
                    <div className="flex items-center justify-center h-full">
                      <Loader2 className="h-5 w-5 animate-spin text-olive-500" />
                    </div>
                  ) : messages.length === 0 ? (
                    <div className="text-center pt-8">
                      <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3">
                        <MessageSquare className="h-6 w-6 text-olive-500" />
                      </div>
                      <p className="text-sm font-medium text-gray-700">
                        Hi, {guestSession?.guestName}!
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        Our team typically replies within a few minutes
                      </p>
                    </div>
                  ) : (
                    messages.map((msg) => {
                      const isMe = msg.senderRole === "guest";
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

                {sessionClosed ? (
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
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* FAB toggle button */}
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
