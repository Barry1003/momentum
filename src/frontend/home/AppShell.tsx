"use client";

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { BottomNav, Sidebar, Toast, type BottomNavKey } from "../components";
import type { NewHabitInput, NewTaskInput } from "../mocks/types";
import { StageUpOverlay } from "../progress/StageUpOverlay";
import { QuickCreateSheet, type QuickCreateKind } from "./QuickCreateSheet";

const NAV_HREFS = { home: "/home", plan: "/planner", progress: "/progress", me: "/my-space" } as const;

interface ShellContextValue {
  openQuickCreate: (kind?: QuickCreateKind) => void;
  showToast: (message: string) => void;
}

const ShellContext = createContext<ShellContextValue | null>(null);

export function useShell(): ShellContextValue {
  const value = useContext(ShellContext);
  if (!value) throw new Error("useShell must be used inside AppShell");
  return value;
}

export interface AppShellProps {
  active: BottomNavKey;
  children: ReactNode;
  /** Where Quick create saves things. Pages that show tasks pass their own handlers. */
  onAddTask?: (input: NewTaskInput) => Promise<void>;
  onAddHabit?: (input: NewHabitInput) => Promise<void>;
}

/**
 * Signed-in app frame: desktop sidebar, mobile floating bottom nav with the
 * raised "+" button, the Quick create sheet and a toast. Section 02 · Home.
 */
export function AppShell({ active, children, onAddTask, onAddHabit }: AppShellProps) {
  const [quickCreate, setQuickCreate] = useState<{ open: boolean; kind: QuickCreateKind; session: number }>({
    open: false,
    kind: "task",
    session: 0,
  });
  const [toast, setToast] = useState<string | null>(null);

  const openQuickCreate = useCallback(
    (kind: QuickCreateKind = "task") => setQuickCreate((previous) => ({ open: true, kind, session: previous.session + 1 })),
    [],
  );
  const showToast = useCallback((message: string) => setToast(message), []);
  const dismissToast = useCallback(() => setToast(null), []);
  const value = useMemo(() => ({ openQuickCreate, showToast }), [openQuickCreate, showToast]);

  return (
    <ShellContext.Provider value={value}>
      <div className="min-h-dvh md:flex">
        <Sidebar
          activeKey={active}
          hrefs={{ ...NAV_HREFS, create: "/home?create=task" }}
          className="sticky top-0"
        />
        <div className="min-w-0 flex-1">{children}</div>
        <BottomNav activeKey={active} hrefs={NAV_HREFS} onCreate={() => openQuickCreate("task")} />
      </div>
      <QuickCreateSheet
        // A fresh form each time it opens.
        key={quickCreate.session}
        open={quickCreate.open}
        initialKind={quickCreate.kind}
        onClose={() => setQuickCreate((previous) => ({ ...previous, open: false }))}
        onAddTask={async (input) => {
          await onAddTask?.(input);
          setToast(`Added “${input.title}” to today`);
        }}
        onAddHabit={async (input) => {
          await onAddHabit?.(input);
          setToast(`New habit: ${input.name}`);
        }}
      />
      <StageUpOverlay onShare={() => setToast("Your squad will see that Ari grew up.")} />
      {toast ? <Toast message={toast} onDismiss={dismissToast} /> : null}
    </ShellContext.Provider>
  );
}
