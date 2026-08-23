"use client";

import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  ReactNode,
} from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  MagnifyingGlassIcon as SearchIcon,
  ArrowRightIcon,
  Squares2X2Icon,
  FolderIcon,
  Cog6ToothIcon,
  UserGroupIcon,
  CubeIcon,
  SparklesIcon,
  DocumentDuplicateIcon,
  PlusIcon,
  NewspaperIcon,
  ServerIcon,
  CircleStackIcon,
  GlobeAltIcon,
  CpuChipIcon,
  BoltIcon,
  MagnifyingGlassIcon,
  CloudArrowUpIcon,
  ShieldCheckIcon,
  CreditCardIcon,
  ChatBubbleLeftRightIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";

// ── Debounce hook ────────────────────────────────────────────────────
function useDebounce<T>(value: T, delay = 150): T {
  const [debounced, setDebounced] = useState<T>(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

// ── Types ────────────────────────────────────────────────────────────
export interface CommandItem {
  id: string;
  label: string;
  description?: string;
  icon: ReactNode;
  shortcut?: string;
  badge?: string;
  badgeColor?: string;
  action: () => void;
}

export interface CommandGroup {
  title: string;
  items: CommandItem[];
}

interface CommandPaletteProps {
  open: boolean;
  onClose: () => void;
  groups?: CommandGroup[];
}

// ── Default command groups for the dashboard ────────────────────────
function makeDefaultIcon(
  Icon: React.FC<{ className?: string }>,
  color: string,
) {
  return <Icon className={`w-4 h-4 ${color}`} />;
}

export function buildDefaultGroups(
  navigate: (path: string) => void,
): CommandGroup[] {
  return [
    {
      title: "Navigation",
      items: [
        {
          id: "nav-home",
          label: "Dashboard",
          description: "Go to your home dashboard",
          icon: makeDefaultIcon(Squares2X2Icon, "text-indigo-400"),
          shortcut: "⌘H",
          action: () => navigate("/home"),
        },
        {
          id: "nav-workspaces",
          label: "Workspaces",
          description: "Browse all your projects",
          icon: makeDefaultIcon(FolderIcon, "text-purple-400"),
          shortcut: "⌘W",
          action: () => navigate("/workspaces"),
        },
        {
          id: "nav-team",
          label: "Connectors",
          description: "Manage team & access",
          icon: makeDefaultIcon(UserGroupIcon, "text-blue-400"),
          action: () => navigate("/team"),
        },
        {
          id: "nav-templates",
          label: "Templates",
          description: "Start from a ready-made design",
          icon: makeDefaultIcon(CubeIcon, "text-violet-400"),
          action: () => navigate("/dev"),
        },
        {
          id: "nav-settings",
          label: "Settings",
          description: "Preferences & account",
          icon: makeDefaultIcon(Cog6ToothIcon, "text-slate-400"),
          shortcut: "⌘,",
          action: () => navigate("/settings"),
        },
      ],
    },
    {
      title: "Actions",
      items: [
        {
          id: "action-new",
          label: "New Workspace",
          description: "Create a fresh architecture diagram",
          icon: makeDefaultIcon(PlusIcon, "text-emerald-400"),
          shortcut: "⌘N",
          badge: "Quick",
          badgeColor:
            "text-emerald-400 bg-emerald-400/10 border-emerald-400/20",
          action: () => {
            window.dispatchEvent(new CustomEvent("meshwork:new-workspace"));
          },
        },
        {
          id: "action-duplicate",
          label: "Duplicate Workspace",
          description: "Clone the current project",
          icon: makeDefaultIcon(DocumentDuplicateIcon, "text-amber-400"),
          action: () => {
            window.dispatchEvent(
              new CustomEvent("meshwork:duplicate-workspace"),
            );
          },
        },
      ],
    },
    {
      title: "Node Types",
      items: [
        {
          id: "node-server",
          label: "Server",
          description: "Generic server or VM",
          icon: makeDefaultIcon(ServerIcon, "text-blue-400"),
          badge: "Core",
          badgeColor: "text-blue-400 bg-blue-400/10 border-blue-400/20",
          action: () => {},
        },
        {
          id: "node-database",
          label: "Database",
          description: "PostgreSQL, MySQL, etc.",
          icon: makeDefaultIcon(CircleStackIcon, "text-emerald-400"),
          badge: "Core",
          badgeColor:
            "text-emerald-400 bg-emerald-400/10 border-emerald-400/20",
          action: () => {},
        },
        {
          id: "node-gateway",
          label: "API Gateway",
          description: "Route and proxy requests",
          icon: makeDefaultIcon(GlobeAltIcon, "text-sky-400"),
          badge: "Core",
          badgeColor: "text-sky-400 bg-sky-400/10 border-sky-400/20",
          action: () => {},
        },
        {
          id: "node-cache",
          label: "Redis Cache",
          description: "In-memory key/value store",
          icon: makeDefaultIcon(BoltIcon, "text-red-400"),
          badge: "Core",
          badgeColor: "text-red-400 bg-red-400/10 border-red-400/20",
          action: () => {},
        },
        {
          id: "node-lb",
          label: "Load Balancer",
          description: "Distribute incoming traffic",
          icon: makeDefaultIcon(CpuChipIcon, "text-purple-400"),
          badge: "Core",
          badgeColor: "text-purple-400 bg-purple-400/10 border-purple-400/20",
          action: () => {},
        },
        {
          id: "node-search",
          label: "Elasticsearch",
          description: "Full-text search engine",
          icon: makeDefaultIcon(MagnifyingGlassIcon, "text-yellow-400"),
          badge: "More",
          badgeColor: "text-yellow-400 bg-yellow-400/10 border-yellow-400/20",
          action: () => {},
        },
        {
          id: "node-cdn",
          label: "CDN",
          description: "Global content distribution",
          icon: makeDefaultIcon(CloudArrowUpIcon, "text-cyan-400"),
          badge: "More",
          badgeColor: "text-cyan-400 bg-cyan-400/10 border-cyan-400/20",
          action: () => {},
        },
        {
          id: "node-waf",
          label: "WAF",
          description: "Web Application Firewall",
          icon: makeDefaultIcon(ShieldCheckIcon, "text-green-400"),
          badge: "Security",
          badgeColor: "text-green-400 bg-green-400/10 border-green-400/20",
          action: () => {},
        },
        {
          id: "node-stripe",
          label: "Stripe",
          description: "Payment processing",
          icon: makeDefaultIcon(CreditCardIcon, "text-violet-400"),
          badge: "More",
          badgeColor: "text-violet-400 bg-violet-400/10 border-violet-400/20",
          action: () => {},
        },
        {
          id: "node-chat",
          label: "Socket.io",
          description: "Real-time WebSocket server",
          icon: makeDefaultIcon(ChatBubbleLeftRightIcon, "text-pink-400"),
          badge: "More",
          badgeColor: "text-pink-400 bg-pink-400/10 border-pink-400/20",
          action: () => {},
        },
      ],
    },
    {
      title: "Docs & Help",
      items: [
        {
          id: "docs-changelog",
          label: "Changelog",
          description: "What's new in Meshwork Studio",
          icon: makeDefaultIcon(NewspaperIcon, "text-slate-400"),
          action: () => navigate("/docs"),
        },
        {
          id: "docs-ai",
          label: "Ask Mosh AI",
          description: "Open the AI co-pilot in your workspace",
          icon: makeDefaultIcon(SparklesIcon, "text-fuchsia-400"),
          badge: "AI",
          badgeColor:
            "text-fuchsia-400 bg-fuchsia-400/10 border-fuchsia-400/20",
          action: () => {
            window.dispatchEvent(new CustomEvent("meshwork:open-mosh"));
          },
        },
      ],
    },
  ];
}

// ── Main component ───────────────────────────────────────────────────
export function CommandPalette({
  open,
  onClose,
  groups = [],
}: CommandPaletteProps) {
  const [query, setQuery] = useState("");
  const [cursor, setCursor] = useState(0);
  const debouncedQuery = useDebounce(query, 100);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Flatten all items for searching + keyboard nav
  const allItems = groups.flatMap((g) => g.items);

  const filteredGroups: CommandGroup[] = debouncedQuery.trim()
    ? [
        {
          title: "Results",
          items: allItems.filter((item) =>
            `${item.label} ${item.description ?? ""}`
              .toLowerCase()
              .includes(debouncedQuery.toLowerCase().trim()),
          ),
        },
      ]
    : groups;

  const flatFiltered = filteredGroups.flatMap((g) => g.items);

  // Reset state when opening
  useEffect(() => {
    if (open) {
      setQuery("");
      setCursor(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  // Keyboard navigation
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setCursor((c) => Math.min(c + 1, flatFiltered.length - 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setCursor((c) => Math.max(c - 1, 0));
      } else if (e.key === "Enter") {
        e.preventDefault();
        const item = flatFiltered[cursor];
        if (item) {
          item.action();
          onClose();
        }
      } else if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
    },
    [flatFiltered, cursor, onClose],
  );

  // Scroll active item into view
  useEffect(() => {
    const el = listRef.current?.querySelector(
      `[data-idx="${cursor}"]`,
    ) as HTMLElement | null;
    el?.scrollIntoView({ block: "nearest" });
  }, [cursor]);

  // Reset cursor on query change
  useEffect(() => setCursor(0), [debouncedQuery]);

  let globalIdx = -1;

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop: slight blur + dark */}
          <motion.div
            key="palette-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            className="fixed inset-0 z-[999] bg-black/40 backdrop-blur-[3px]"
            onClick={onClose}
          />

          {/* Panel */}
          <motion.div
            key="palette-panel"
            initial={{ opacity: 0, scale: 0.96, y: -12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: -12 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="fixed inset-0 z-[1000] flex items-start justify-center pt-[15vh] pointer-events-none px-4"
          >
            <div
              className="w-full max-w-[580px] bg-[#111115]/95 backdrop-blur-2xl border border-white/[0.1] rounded-2xl shadow-[0_32px_80px_rgba(0,0,0,0.8)] overflow-hidden pointer-events-auto"
              onKeyDown={handleKeyDown}
            >
              {/* Search input */}
              <div className="flex items-center gap-3 px-4 py-3.5 border-b border-white/[0.07]">
                <SearchIcon className="w-4 h-4 text-white/30 shrink-0" />
                <input
                  ref={inputRef}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search commands, nodes, pages..."
                  className="flex-1 bg-transparent outline-none text-[13.5px] text-white placeholder:text-white/25 font-body"
                />
                {query && (
                  <button
                    onClick={() => setQuery("")}
                    className="text-white/20 hover:text-white/60 transition-colors"
                  >
                    <XMarkIcon className="w-3.5 h-3.5" />
                  </button>
                )}
                <kbd className="hidden sm:flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-white/[0.06] border border-white/[0.1] text-[10px] text-white/30 font-mono shrink-0">
                  ESC
                </kbd>
              </div>

              {/* Results */}
              <div
                ref={listRef}
                className="overflow-y-auto max-h-[400px] hide-scrollbar"
              >
                {filteredGroups.map((group) => (
                  <div key={group.title}>
                    {/* Group header */}
                    {!debouncedQuery.trim() && (
                      <div className="px-4 pt-3 pb-1.5">
                        <span className="text-[10px] font-semibold text-white/25 uppercase tracking-widest">
                          {group.title}
                        </span>
                      </div>
                    )}

                    {/* Items */}
                    <div className="px-2 pb-2">
                      {group.items.map((item) => {
                        globalIdx++;
                        const idx = globalIdx;
                        const isActive = cursor === idx;

                        return (
                          <button
                            key={item.id}
                            data-idx={idx}
                            onClick={() => {
                              item.action();
                              onClose();
                            }}
                            onMouseEnter={() => setCursor(idx)}
                            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all duration-100 ${
                              isActive
                                ? "bg-white/[0.08] text-white"
                                : "text-white/60 hover:bg-white/[0.04] hover:text-white/90"
                            }`}
                          >
                            {/* Icon */}
                            <div
                              className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                                isActive ? "bg-white/[0.1]" : "bg-white/[0.04]"
                              } border border-white/[0.07]`}
                            >
                              {item.icon}
                            </div>

                            {/* Label + description */}
                            <div className="flex-1 min-w-0">
                              <p
                                className={`text-[13px] font-medium leading-tight truncate ${isActive ? "text-white" : "text-white/80"}`}
                              >
                                {item.label}
                              </p>
                              {item.description && (
                                <p className="text-[11px] text-white/30 truncate mt-0.5">
                                  {item.description}
                                </p>
                              )}
                            </div>

                            {/* Right side: badge + shortcut */}
                            <div className="flex items-center gap-2 shrink-0">
                              {item.badge && (
                                <span
                                  className={`text-[9.5px] font-semibold px-1.5 py-0.5 rounded-md border ${item.badgeColor ?? "text-white/40 bg-white/[0.05] border-white/10"}`}
                                >
                                  {item.badge}
                                </span>
                              )}
                              {item.shortcut && (
                                <kbd className="text-[10px] font-mono text-white/20 hidden sm:block">
                                  {item.shortcut}
                                </kbd>
                              )}
                              {isActive && (
                                <ArrowRightIcon className="w-3 h-3 text-white/30" />
                              )}
                            </div>
                          </button>
                        );
                      })}

                      {debouncedQuery.trim() && group.items.length === 0 && (
                        <div className="text-center py-8">
                          <p className="text-[12px] text-white/25">
                            No results for{" "}
                            <span className="text-white/40">
                              "{debouncedQuery}"
                            </span>
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Footer */}
              <div className="px-4 py-2.5 border-t border-white/[0.06] flex items-center justify-between">
                <div className="flex items-center gap-3 text-[10.5px] text-white/20">
                  <span className="flex items-center gap-1">
                    <kbd className="font-mono bg-white/[0.05] border border-white/[0.08] px-1 rounded text-[9px]">
                      ↑
                    </kbd>
                    <kbd className="font-mono bg-white/[0.05] border border-white/[0.08] px-1 rounded text-[9px]">
                      ↓
                    </kbd>
                    navigate
                  </span>
                  <span className="flex items-center gap-1">
                    <kbd className="font-mono bg-white/[0.05] border border-white/[0.08] px-1 rounded text-[9px]">
                      ↵
                    </kbd>
                    select
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-indigo-500/70 animate-pulse" />
                  <span className="text-[10px] text-white/20">
                    Meshwork Studio
                  </span>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
