"use client";

import { applyCopilotAction, runCopilotAction } from "@/lib/actions/ai-copilot";
import type { CopilotAuditRecord } from "@/engines/ai/copilot/audit";
import type { CopilotOutputPayload } from "@/engines/ai/copilot/types";
import type { AICopilotActionType, AICopilotContextType } from "@/types/database.types";
import {
  Button,
  Card,
  CardContent,
  Label,
  Textarea,
  useToast,
} from "@/systems/design-system";
import { cn } from "@/lib/utils";
import { Bot, ChevronDown, ChevronUp, Loader2, Sparkles } from "lucide-react";
import { useState, useTransition } from "react";

const QUICK_ACTIONS: {
  type: AICopilotActionType;
  label: string;
  applyable: boolean;
}[] = [
  { type: "summarize_discussions", label: "Summarize", applyable: false },
  { type: "generate_tasks", label: "Tasks", applyable: true },
  { type: "generate_milestones", label: "Milestones", applyable: true },
  { type: "suggest_missions", label: "Missions", applyable: true },
  { type: "create_announcement", label: "Announcement", applyable: true },
  { type: "weekly_summary", label: "Weekly summary", applyable: true },
];

function renderOutput(output: CopilotOutputPayload): string {
  switch (output.kind) {
    case "summary":
    case "answer":
      return output.text;
    case "tasks":
      return output.items.map((t, i) => `${i + 1}. ${t.title}${t.description ? ` — ${t.description}` : ""}`).join("\n");
    case "milestones":
      return output.items.map((m, i) => `${i + 1}. ${m.title}`).join("\n");
    case "missions":
      return output.items.map((m, i) => `${i + 1}. ${m.title}\n   ${m.rationale}`).join("\n\n");
    case "announcement":
      return `${output.draft.title}\n\n${output.draft.body}`;
    case "weekly_summary":
      return `${output.data.title}\n\n${output.data.summary}\n\n${output.data.highlights.map((h) => `• ${h}`).join("\n")}`;
  }
}

function actionLabel(type: AICopilotActionType): string {
  return QUICK_ACTIONS.find((a) => a.type === type)?.label ?? type.replace(/_/g, " ");
}

export function CopilotPanel({
  contextType,
  contextId,
  slug,
  contextName,
  canUse,
  canApply,
  recentActions: initialActions,
}: {
  contextType: AICopilotContextType;
  contextId: string;
  slug?: string;
  contextName: string;
  canUse: boolean;
  canApply: boolean;
  recentActions: CopilotAuditRecord[];
}) {
  const { toast } = useToast();
  const [expanded, setExpanded] = useState(true);
  const [question, setQuestion] = useState("");
  const [output, setOutput] = useState<CopilotOutputPayload | null>(null);
  const [lastActionId, setLastActionId] = useState<string | null>(null);
  const [lastActionType, setLastActionType] = useState<AICopilotActionType | null>(null);
  const [recentActions, setRecentActions] = useState(initialActions);
  const [isPending, startTransition] = useTransition();

  if (!canUse) return null;

  const runAction = (actionType: AICopilotActionType, prompt?: string) => {
    startTransition(async () => {
      const result = await runCopilotAction({
        contextType,
        contextId,
        slug,
        actionType,
        prompt,
      });
      if (result.error) {
        toast(result.error, "error");
        return;
      }
      if (result.output) {
        setOutput(result.output);
        setLastActionId(result.actionId ?? null);
        setLastActionType(actionType);
        toast("Copilot response ready", "success");
      }
    });
  };

  const handleAsk = () => {
    const q = question.trim();
    if (!q) return;
    runAction("answer_question", q);
  };

  const handleApply = () => {
    if (!lastActionId) return;
    startTransition(async () => {
      const result = await applyCopilotAction({ actionId: lastActionId });
      if (result.error) toast(result.error, "error");
      else {
        toast("Applied to workspace", "success");
        setRecentActions((prev) =>
          prev.map((a) => (a.id === lastActionId ? { ...a, applied: true, status: "applied" } : a))
        );
      }
    });
  };

  const currentQuick = lastActionType
    ? QUICK_ACTIONS.find((a) => a.type === lastActionType)
    : null;
  const showApply = Boolean(lastActionId && currentQuick?.applyable && canApply && output);

  return (
    <Card className="mt-6 border-brand/20 bg-gradient-to-br from-brand/5 to-transparent">
      <CardContent className="pt-6">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand/10">
              <Sparkles className="h-5 w-5 text-brand" aria-hidden />
            </div>
            <div>
              <h3 className="font-semibold text-fg-primary">BELONG Copilot</h3>
              <p className="text-caption text-fg-muted">
                AI assistant for {contextName}
              </p>
            </div>
          </div>
          <Button
            type="button"
            variant="ghost"
            className="h-8 px-2"
            onClick={() => setExpanded((v) => !v)}
            aria-expanded={expanded}
          >
            {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
        </div>

        {expanded && (
          <div className="mt-4 space-y-4">
            <div className="flex flex-wrap gap-2">
              {QUICK_ACTIONS.map((action) => (
                <Button
                  key={action.type}
                  type="button"
                  variant="secondary"
                  className="h-8 gap-1 px-2 text-xs"
                  disabled={isPending}
                  onClick={() => runAction(action.type)}
                >
                  {isPending ? (
                    <Loader2 className="h-3 w-3 animate-spin" aria-hidden />
                  ) : (
                    <Bot className="h-3 w-3" aria-hidden />
                  )}
                  {action.label}
                </Button>
              ))}
            </div>

            <div className="space-y-2">
              <Label htmlFor={`copilot-question-${contextId}`}>Ask about this {contextType}</Label>
              <div className="flex flex-col gap-2 sm:flex-row">
                <Textarea
                  id={`copilot-question-${contextId}`}
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  placeholder="What should we prioritize next?"
                  rows={2}
                  disabled={isPending}
                  className="min-h-0 flex-1"
                />
                <Button
                  type="button"
                  variant="brand"
                  disabled={isPending || !question.trim()}
                  onClick={handleAsk}
                  className="shrink-0"
                >
                  Ask
                </Button>
              </div>
            </div>

            {output && (
              <div className="rounded-xl border border-border-subtle bg-bg-base/80 p-4">
                <p className="text-xs font-medium uppercase tracking-wide text-fg-muted">
                  {lastActionType ? actionLabel(lastActionType) : "Response"}
                </p>
                <pre className="mt-2 whitespace-pre-wrap font-sans text-sm text-fg-secondary">
                  {renderOutput(output)}
                </pre>
                {showApply && (
                  <Button
                    type="button"
                    variant="brand"
                    className="mt-3 h-8 px-3 text-xs"
                    disabled={isPending}
                    onClick={handleApply}
                  >
                    Apply to {contextType}
                  </Button>
                )}
              </div>
            )}

            {recentActions.length > 0 && (
              <div>
                <p className="mb-2 text-xs font-medium text-fg-muted">Recent AI actions (audited)</p>
                <ul className="space-y-1">
                  {recentActions.slice(0, 5).map((action) => (
                    <li
                      key={action.id}
                      className={cn(
                        "flex items-center justify-between gap-2 rounded-lg px-2 py-1.5 text-caption",
                        action.status === "failed" && "text-destructive",
                        action.applied && "text-brand"
                      )}
                    >
                      <span className="capitalize">{actionLabel(action.actionType)}</span>
                      <span className="text-fg-faint">
                        {action.applied ? "Applied" : action.status}
                        {action.model ? ` · ${action.model}` : ""}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
