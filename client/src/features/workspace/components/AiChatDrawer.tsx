import React, { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  PaperAirplaneIcon,
  SparklesIcon,
  CpuChipIcon,
  ArrowPathIcon,
  ChevronDownIcon,
} from "@heroicons/react/24/outline";
import { useReactFlow, useNodes, useEdges } from "@xyflow/react";
import StreamingText from "@/components/ui/streaming-text";
import LoadingState from "@/components/ui/loading-state";
import {
  runMoshAgent,
  MoshAgentMessage,
} from "@/features/workspace/agent/moshAgent";

const DEFAULT_SUGGESTIONS = [
  "Add a Redis caching layer to the backend",
  "Design a secure AWS VPC with public & private subnets",
  "Set up a high-availability PostgreSQL cluster",
  "Build an event-driven Kafka stream processing pipeline",
];

export function AiChatDrawer({
  isLeftSidebarOpen = false,
  isRightSidebarOpen = false,
}: {
  isLeftSidebarOpen?: boolean;
  isRightSidebarOpen?: boolean;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<MoshAgentMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isDesigning, setIsDesigning] = useState(false);
  const [agentStatus, setAgentStatus] = useState("Consulting Mosh...");
  const [streamingMessageId, setStreamingMessageId] = useState<string | null>(
    null,
  );
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { setNodes, setEdges, fitView, getNodes, getEdges, getViewport } =
    useReactFlow();

  const nodes = useNodes();
  const edges = useEdges();
  const [suggestions, setSuggestions] = useState<string[]>(DEFAULT_SUGGESTIONS);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);

  const [selectedModel, setSelectedModel] = useState("gemini-3.5-flash");

  useEffect(() => {
    if (!isOpen) return;

    setIsLoadingSuggestions(true);
    const timer = setTimeout(async () => {
      try {
        const { secureFetch } = await import("@/lib/secure-fetch");
        const response = await secureFetch("/api/v1/ai/suggestions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            canvas: { nodes, edges },
          }),
        });

        if (response.ok) {
          const data = (await response.json()) as string[];
          if (Array.isArray(data) && data.length > 0) {
            setSuggestions(data);
          }
        }
      } catch {
        // fallback to default suggestions
      } finally {
        setIsLoadingSuggestions(false);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [isOpen, nodes.length, edges.length]);

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  };

  useEffect(() => {
    if (isOpen) {
      setTimeout(
        () => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }),
        50,
      );
    }
  }, [messages, isOpen]);

  const executePrompt = useCallback(
    async (userPrompt: string, modelOverride?: string) => {
      if (!userPrompt.trim()) return;

      const modelToUse = modelOverride || selectedModel;
      const isArchitectureTask =
        /design|create|build|add|connect|attach|draw|architecture|system|app|generate|make|put|update|delete|remove/i.test(
          userPrompt,
        );

      const userMsg: MoshAgentMessage = {
        id: Date.now().toString(),
        role: "user",
        content: userPrompt,
      };
      setMessages((prev) => [...prev, userMsg]);
      setInput("");
      if (textareaRef.current) textareaRef.current.style.height = "auto";
      const viewport = getViewport();
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const centerX = Math.round((-viewport.x + vw / 2) / viewport.zoom);
      const centerY = Math.round((-viewport.y + vh / 2) / viewport.zoom);

      setIsLoading(true);
      setIsDesigning(isArchitectureTask);
      setAgentStatus("Consulting Mosh...");

      if (isArchitectureTask) {
        window.dispatchEvent(
          new CustomEvent("mosh:designing", {
            detail: { active: true, x: centerX, y: centerY },
          }),
        );
      }

      try {
        const currentNodes = getNodes();
        const currentEdges = getEdges();

        const agentResult = await runMoshAgent({
          userPrompt,
          history: messages,
          currentNodes,
          currentEdges,
          viewportCenter: { x: centerX, y: centerY },
          model: modelToUse,
          onStatusUpdate: (status) => setAgentStatus(status),
        });

        if (agentResult.canvasResult?.applied) {
          setNodes(agentResult.canvasResult.nodes);
          setEdges(agentResult.canvasResult.edges);
          setTimeout(() => fitView({ duration: 700, padding: 0.2 }), 100);
        }

        const newMsg = agentResult.message;
        setStreamingMessageId(newMsg.id);
        setMessages((prev) => [...prev, newMsg]);
      } catch (error: unknown) {
        const errMsg = error instanceof Error ? error.message : "";
        let errorMessage = "An unexpected error occurred.";
        if (errMsg.includes("key") || errMsg.includes("API")) {
          errorMessage =
            "No API key configured. Please ensure your provider API key is set correctly.";
        } else if (
          errMsg.includes("429") ||
          errMsg.toLowerCase().includes("rate limit")
        ) {
          errorMessage =
            "Rate limit exceeded. Please try again in a few moments.";
        } else if (errMsg) {
          errorMessage = errMsg;
        }

        setMessages((prev) => [
          ...prev,
          {
            id: (Date.now() + 1).toString(),
            role: "assistant",
            content: `⚠️ **System Error**\n\n${errorMessage}`,
          },
        ]);
      } finally {
        setIsLoading(false);
        setIsDesigning(false);
        window.dispatchEvent(
          new CustomEvent("mosh:designing", { detail: { active: false } }),
        );
      }
    },
    [
      getNodes,
      getEdges,
      getViewport,
      messages,
      selectedModel,
      setEdges,
      setNodes,
      fitView,
    ],
  );

  // Auto-trigger from landing page prompt
  useEffect(() => {
    const autoPrompt = localStorage.getItem("meshwork_auto_trigger_mosh");
    const autoModel = localStorage.getItem("meshwork_auto_trigger_model");

    if (autoPrompt) {
      localStorage.removeItem("meshwork_auto_trigger_mosh");
      localStorage.removeItem("meshwork_auto_trigger_model");

      setIsOpen(true);
      if (autoModel) {
        setSelectedModel(autoModel);
      }

      const timer = setTimeout(() => {
        void executePrompt(autoPrompt, autoModel || undefined);
      }, 700);

      return () => clearTimeout(timer);
    }
  }, [executePrompt]);

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || isLoading) return;
    await executePrompt(input);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void handleSubmit();
    }
  };

  return (
    <div
      className="fixed bottom-0 left-1/2 z-50 flex flex-col items-center pointer-events-none transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]"
      style={{
        transform: `translate(calc(-50% + ${
          (isLeftSidebarOpen ? 130 : 0) - (isRightSidebarOpen ? 140 : 0)
        }px), 0)`,
      }}
    >
      {/* Pull Tab */}
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        className="pointer-events-auto flex items-center gap-2 px-4 h-8 bg-[#121214]/80 backdrop-blur-xl border border-b-0 border-white/[0.08] rounded-t-xl shadow-[inset_0_1px_0_rgba(255,255,255,0.1),0_-4px_20px_rgba(0,0,0,0.5)] hover:bg-[#1C1C1F]/90 transition-all cursor-pointer"
        whileHover={{ y: -2 }}
        whileTap={{ scale: 0.97 }}
      >
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 25 }}
        >
          <ChevronDownIcon className="w-3.5 h-3.5 text-white/50" />
        </motion.div>
        <motion.div
          animate={{ scale: [1, 1.2, 1], opacity: [0.7, 1, 0.7] }}
          transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
        >
          <CpuChipIcon className="w-3.5 h-3.5 text-[#00E5A0]" />
        </motion.div>
        <span className="text-[11px] font-semibold tracking-widest uppercase text-white/60">
          Meshwork AI
        </span>
        <span className="text-[9px] text-white/25 border border-white/10 px-1.5 py-0.5 rounded-md font-mono">
          BETA
        </span>
      </motion.button>

      {/* Drawer */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 520, opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ type: "spring", stiffness: 350, damping: 35 }}
            className="pointer-events-auto w-[640px] max-w-[92vw] flex flex-col overflow-hidden bg-[#121214]/80 backdrop-blur-xl border border-b-0 border-white/[0.08] rounded-t-3xl shadow-[inset_0_1px_0_rgba(255,255,255,0.1),0_-20px_60px_-10px_rgba(0,0,0,0.8)]"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.04]">
              <div className="flex items-center gap-3">
                <div
                  className="w-7 h-7 rounded-lg flex items-center justify-center"
                  style={{
                    background: "linear-gradient(135deg, #10B981, #059669)",
                    boxShadow: "0 2px 12px rgba(16, 185, 129, 0.4)",
                  }}
                >
                  <CpuChipIcon className="w-4 h-4 text-white" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[12px] font-[#00E5A0] font-semibold text-white/90 tracking-wide">
                      MESHWORK AI
                    </span>
                    <span className="text-[9px] text-[#00E5A0] border border-[rgba(0,229,160,0.22)] bg-[rgba(0,229,160,0.10)] px-1.5 py-0.5 rounded font-mono tracking-wider">
                      BETA
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <motion.div
                      className="w-1.5 h-1.5 rounded-full bg-[#00E5A0]"
                      animate={{ opacity: [1, 0.4, 1] }}
                      transition={{ repeat: Infinity, duration: 2 }}
                    />
                    <span className="text-[10px] text-white/30">
                      GPT OSS 120B · Canvas-aware
                    </span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="w-8 h-8 flex items-center justify-center rounded-xl text-white/20 hover:text-white/60 hover:bg-white/5 transition-all"
              >
                <ChevronDownIcon className="w-4 h-4" />
              </button>
            </div>

            {/* Chat */}
            <div className="flex-1 overflow-y-auto px-5 py-5 space-y-5 scrollbar-thin scrollbar-thumb-white/[0.06]">
              {/* Empty State & Suggestions */}
              {messages.length === 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15 }}
                  className="flex flex-col mt-6 mb-4"
                >
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-6 h-6 rounded-lg flex items-center justify-center bg-white/[0.06] border border-white/[0.08]">
                      <CpuChipIcon className="w-3.5 h-3.5 text-white/70" />
                    </div>
                    <div>
                      <p className="text-[13px] font-medium text-white/90">
                        Mosh
                      </p>
                      <p className="text-[11px] text-white/40">
                        Describe your cloud infrastructure or ask me to modify
                        the canvas.
                      </p>
                    </div>
                  </div>

                  {/* Suggestions as border-b list */}
                  <div className="flex flex-col">
                    {isLoadingSuggestions
                      ? Array.from({ length: 4 }).map((_, i) => (
                          <div
                            key={i}
                            className="flex items-center gap-2 border-b border-white/[0.06] py-2.5 px-1"
                          >
                            <div className="w-2.5 h-2.5 rounded-full bg-white/[0.08] shrink-0" />
                            <div className="h-3 bg-white/[0.06] rounded w-2/3 animate-pulse" />
                          </div>
                        ))
                      : suggestions.map((s, i) => (
                          <motion.button
                            key={s}
                            initial={{ opacity: 0, y: 4 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.15 + i * 0.06 }}
                            onClick={() => {
                              setInput(s);
                              textareaRef.current?.focus();
                            }}
                            className="flex items-center gap-2 border-b border-white/[0.06] py-2.5 px-1 text-left text-[12.5px] text-white/60 hover:bg-white/[0.04] hover:text-white/90 transition-colors duration-100 cursor-pointer rounded-sm"
                          >
                            <svg
                              width="11"
                              height="11"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              className="shrink-0 text-white/30"
                            >
                              <path d="M9 10l-5 5 5 5" />
                              <path d="M20 4v7a4 4 0 0 1-4 4H4" />
                            </svg>
                            <span>{s}</span>
                          </motion.button>
                        ))}
                  </div>
                </motion.div>
              )}

              {/* Messages */}
              {messages.map((msg, idx) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ type: "spring", stiffness: 400, damping: 35 }}
                >
                  {msg.role === "user" ? (
                    /* User bubble — stays as a pill */
                    <div className="flex justify-end">
                      <div
                        className="max-w-[82%] rounded-2xl rounded-tr-sm px-4 py-3 text-[13px] text-white/90"
                        style={{
                          background: "rgba(255,255,255,0.08)",
                          border: "1px solid rgba(255,255,255,0.12)",
                        }}
                      >
                        <span className="whitespace-pre-wrap">
                          {msg.content}
                        </span>
                      </div>
                    </div>
                  ) : (
                    /* Assistant — NO bubble, just content inline */
                    <div className="flex gap-3">
                      <div
                        className="w-6 h-6 rounded-lg shrink-0 flex items-center justify-center mt-0.5 border border-white/[0.08] text-white/70"
                        style={{
                          background:
                            "linear-gradient(145deg, #1E1E1E, #141414)",
                        }}
                      >
                        <CpuChipIcon className="w-3.5 h-3.5" />
                      </div>
                      <div className="flex-1 min-w-0 pt-0.5">
                        <StreamingText
                          content={msg.content}
                          isStreaming={msg.id === streamingMessageId}
                          onComplete={() => setStreamingMessageId(null)}
                          onRetry={() => {
                            const prevUserMsg = messages
                              .slice(0, idx)
                              .reverse()
                              .find((m) => m.role === "user");
                            if (prevUserMsg)
                              void executePrompt(prevUserMsg.content);
                          }}
                        />

                        {msg.toolCalls && msg.toolCalls.length > 0 && (
                          <div className="space-y-1.5 mt-2.5 pt-2.5 border-t border-white/[0.06]">
                            {msg.toolCalls.map((tc) => (
                              <div
                                key={tc.id}
                                className="flex items-start gap-2 p-2 rounded-lg bg-white/[0.03] border border-white/[0.06] text-[11px] text-white/70 font-mono"
                              >
                                <SparklesIcon className="w-3.5 h-3.5 mt-0.5 text-white/50 shrink-0" />
                                <div className="flex-1 min-w-0">
                                  <div className="font-semibold text-white/80">
                                    {tc.name === "edit_canvas"
                                      ? "🛠️ Canvas Action"
                                      : `🛠️ ${tc.name}`}
                                  </div>
                                  <div className="text-white/60 text-[10px] mt-0.5 whitespace-normal">
                                    {tc.result?.summary ||
                                      tc.args.explanation ||
                                      "Modified architecture components."}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}

                        {msg.appliedToCanvas && !msg.toolCalls && (
                          <div className="flex items-center gap-1.5 mt-2 text-[10px] text-white/40 font-medium">
                            <div className="w-1 h-1 rounded-full bg-white/40" />
                            Applied to canvas
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </motion.div>
              ))}

              {/* Loading — shown while agent is running, before message arrives */}
              <AnimatePresence>
                {isLoading && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="flex gap-3"
                  >
                    <div
                      className="w-6 h-6 rounded-lg shrink-0 flex items-center justify-center mt-0.5 border border-white/[0.08]"
                      style={{
                        background: "linear-gradient(145deg, #1E1E1E, #141414)",
                      }}
                    />
                    <div className="pt-1">
                      <LoadingState label="Churning" variant="Drive" />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="px-4 pb-4 pt-2">
              <form
                onSubmit={handleSubmit}
                className="relative flex items-end gap-2 rounded-2xl p-1.5 transition-all"
                style={{
                  background: "rgba(20,20,20,0.9)",
                  border: "1px solid rgba(255,255,255,0.08)",
                }}
              >
                <textarea
                  ref={textareaRef}
                  value={input}
                  onChange={handleInputChange}
                  onKeyDown={handleKeyDown}
                  placeholder="Describe an architecture, add annotations, or ask me to modify the canvas..."
                  className="flex-1 max-h-32 min-h-[44px] bg-transparent border-0 resize-none outline-none text-white/90 text-[13px] placeholder:text-white/25 px-3 py-3 leading-relaxed scrollbar-thin"
                  rows={1}
                />
                <motion.button
                  type="submit"
                  disabled={!input.trim() || isLoading}
                  className="w-10 h-10 shrink-0 flex items-center justify-center mb-0.5 rounded-xl bg-white text-black transition-all cursor-pointer disabled:opacity-20 disabled:cursor-default hover:bg-white/90 active:scale-95"
                >
                  <PaperAirplaneIcon className="w-4 h-4" />
                </motion.button>
              </form>
              <div className="flex items-center justify-center gap-1.5 mt-2.5">
                <SparklesIcon className="w-2.5 h-2.5 text-white/15" />
                <span className="text-[10px] text-white/20 tracking-wide">
                  Enter to send · Shift+Enter for new line
                </span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

const DESIGN_PHRASES = [
  "Thinking...",
  "Designing architecture...",
  "Generating layout...",
  "Positioning nodes...",
];

function MoshLoadingIndicator({ isDesigning }: { isDesigning: boolean }) {
  const [phraseIndex, setPhraseIndex] = useState(0);

  useEffect(() => {
    if (!isDesigning) return;
    const interval = setInterval(() => {
      setPhraseIndex((prev) => (prev + 1) % DESIGN_PHRASES.length);
    }, 2500);
    return () => clearInterval(interval);
  }, [isDesigning]);

  if (!isDesigning) {
    return (
      <div className="flex items-center gap-1">
        {[0, 0.15, 0.3].map((delay, i) => (
          <motion.div
            key={i}
            className="w-1.5 h-1.5 rounded-full bg-white/60"
            animate={{ y: [0, -4, 0], opacity: [0.4, 1, 0.4] }}
            transition={{
              repeat: Infinity,
              duration: 0.9,
              delay,
              ease: "easeInOut",
            }}
          />
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-col w-full gap-2">
      <div className="flex items-center justify-between">
        <motion.span
          key={phraseIndex}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          className="text-[11px] text-white/80 font-mono tracking-tight"
        >
          {DESIGN_PHRASES[phraseIndex]}
        </motion.span>
        <span className="text-[9px] text-white/30 font-mono animate-pulse">
          GENERATING
        </span>
      </div>
      <div className="h-1.5 w-full bg-white/[0.05] rounded-full overflow-hidden relative">
        <motion.div
          className="absolute top-0 bottom-0 w-1/3 bg-gradient-to-r from-transparent via-white/50 to-transparent"
          animate={{ left: ["-30%", "100%"] }}
          transition={{
            duration: 1.5,
            ease: "easeInOut",
            repeat: Infinity,
            repeatType: "reverse",
          }}
        />
      </div>
    </div>
  );
}
