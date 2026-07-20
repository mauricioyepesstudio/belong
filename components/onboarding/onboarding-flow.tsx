"use client";

import { completeOnboarding } from "@/lib/actions/onboarding";
import { BUILD_GOAL_PROMPTS, BUILD_GOALS } from "@/engines/mission/config";
import { Button, ErrorMessage, Input, Textarea } from "@/components/ui";
import type { BuildGoal } from "@/types/database.types";
import { cn } from "@/lib/utils";
import { AnimatePresence, motion } from "framer-motion";
import { Check } from "lucide-react";
import { useCallback, useRef, useState, useTransition } from "react";

type Step = "goal" | "vision" | "profile" | "complete";

type OnboardingFlowProps = {
  initialName?: string;
};

const ease = [0.21, 0.47, 0.32, 0.98] as const;

export function OnboardingFlow({ initialName = "" }: OnboardingFlowProps) {
  const [step, setStep] = useState<Step>("goal");
  const [buildGoal, setBuildGoal] = useState<BuildGoal | null>(null);
  const [buildVision, setBuildVision] = useState("");
  const [fullName, setFullName] = useState(initialName);
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();
  const [advancing, setAdvancing] = useState(false);
  const submittedRef = useRef(false);

  const goToProfileOrComplete = useCallback(() => {
    if (initialName.trim() || fullName.trim()) {
      setStep("complete");
    } else {
      setStep("profile");
    }
  }, [initialName, fullName]);

  const submit = useCallback(() => {
    if (!buildGoal || submittedRef.current) return;
    submittedRef.current = true;
    setError("");
    startTransition(async () => {
      const result = await completeOnboarding({
        buildGoal,
        buildVision,
        fullName: fullName.trim() || initialName.trim() || undefined,
      });
      if (result?.error) {
        submittedRef.current = false;
        setError(result.error);
        setStep("profile");
      }
    });
  }, [buildGoal, buildVision, fullName, initialName, startTransition]);

  const selectGoal = (goal: BuildGoal) => {
    if (advancing || pending) return;
    setBuildGoal(goal);
    setAdvancing(true);
    setTimeout(() => {
      setStep("vision");
      setAdvancing(false);
    }, 700);
  };

  const stepIndex =
    step === "goal" ? 0 : step === "vision" ? 1 : step === "profile" ? 2 : 3;

  return (
    <div className="relative min-h-[calc(100vh-64px)] overflow-hidden">
      <div className="pointer-events-none absolute inset-0" aria-hidden>
        <div className="absolute top-1/4 left-1/2 h-[500px] w-[500px] -translate-x-1/2 rounded-full bg-brand/15 blur-[120px] animate-aurora" />
        <div className="absolute bottom-0 right-0 h-[300px] w-[300px] rounded-full bg-brand-secondary/10 blur-[100px] animate-aurora" />
      </div>

      <div className="relative mx-auto max-w-3xl px-6 py-12 md:py-16">
        <div className="mb-10 flex gap-2">
          {[0, 1, 2, 3].map((i) => (
            <motion.div
              key={i}
              className="h-1 flex-1 overflow-hidden rounded-full bg-bg-hover"
              initial={false}
            >
              <motion.div
                className="h-full bg-brand"
                initial={{ width: "0%" }}
                animate={{ width: i <= stepIndex ? "100%" : "0%" }}
                transition={{ duration: 0.5, ease }}
              />
            </motion.div>
          ))}
        </div>

        {error && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6"
          >
            <ErrorMessage>{error}</ErrorMessage>
          </motion.div>
        )}

        <AnimatePresence mode="wait">
          {step === "goal" && (
            <motion.div
              key="goal"
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.45, ease }}
            >
              <p className="text-label">Welcome to BELONG</p>
              <h1 className="mt-4 text-display text-fg-primary">
                What do you want to build?
              </h1>
              <p className="mt-3 max-w-lg text-body-lg">
                Choose what matters most right now. You can always evolve your path.
              </p>

              <motion.div
                className="mt-10 grid gap-3 sm:grid-cols-2"
                initial="hidden"
                animate="visible"
                variants={{
                  visible: { transition: { staggerChildren: 0.06, delayChildren: 0.15 } },
                }}
              >
                {BUILD_GOALS.map((goal) => {
                  const Icon = goal.icon;
                  const selected = buildGoal === goal.id;
                  return (
                    <motion.button
                      key={goal.id}
                      type="button"
                      variants={{
                        hidden: { opacity: 0, y: 20, scale: 0.96 },
                        visible: { opacity: 1, y: 0, scale: 1 },
                      }}
                      whileHover={{ scale: selected ? 1 : 1.02, y: -2 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => selectGoal(goal.id)}
                      disabled={advancing || pending}
                      className={cn(
                        "group relative overflow-hidden rounded-2xl border p-5 text-left transition-all duration-300",
                        selected
                          ? "border-brand/50 bg-brand/10 shadow-[0_0_40px_var(--brand-glow)]"
                          : "border-border bg-bg-elevated/80 hover:border-border-strong hover:bg-bg-surface"
                      )}
                    >
                      <div
                        className={cn(
                          "absolute inset-0 bg-gradient-to-br opacity-0 transition-opacity duration-300 group-hover:opacity-100",
                          goal.gradient,
                          selected && "opacity-100"
                        )}
                      />
                      <div className="relative flex items-start gap-4">
                        <div
                          className={cn(
                            "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl transition-colors",
                            selected ? "bg-brand text-white" : "bg-bg-hover text-brand"
                          )}
                        >
                          {selected ? (
                            <motion.div
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              transition={{ type: "spring", stiffness: 400, damping: 20 }}
                            >
                              <Check className="h-5 w-5" strokeWidth={2.5} />
                            </motion.div>
                          ) : (
                            <Icon className="h-5 w-5" />
                          )}
                        </div>
                        <div>
                          <p className="font-semibold text-fg-primary">{goal.label}</p>
                          <p className="mt-1 text-sm text-fg-muted">{goal.description}</p>
                        </div>
                      </div>
                    </motion.button>
                  );
                })}
              </motion.div>
            </motion.div>
          )}

          {step === "vision" && buildGoal && (
            <motion.div
              key="vision"
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.45, ease }}
            >
              <p className="text-label">
                {BUILD_GOALS.find((g) => g.id === buildGoal)?.label}
              </p>
              <h1 className="mt-4 text-heading-lg text-fg-primary">
                Tell us more about your vision
              </h1>
              <p className="mt-3 text-body">
                Optional — share a sentence or two about what you&apos;re building.
              </p>

              <div className="mt-8 surface-glass rounded-2xl p-6">
                <Textarea
                  autoFocus
                  value={buildVision}
                  onChange={(e) => setBuildVision(e.target.value)}
                  placeholder={BUILD_GOAL_PROMPTS[buildGoal]}
                  className="min-h-[120px] border-0 bg-transparent p-0 focus:ring-0"
                />
              </div>

              <div className="mt-8 flex justify-between">
                <Button variant="ghost" onClick={() => setStep("goal")}>
                  Back
                </Button>
                <Button size="lg" onClick={goToProfileOrComplete}>
                  Continue
                </Button>
              </div>
            </motion.div>
          )}

          {step === "profile" && (
            <motion.div
              key="profile"
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.45, ease }}
            >
              <p className="text-label">Almost there</p>
              <h1 className="mt-4 text-heading-lg text-fg-primary">
                What should we call you?
              </h1>
              <p className="mt-3 text-body">Your name appears on your BELONG profile.</p>

              <div className="mt-8 surface-glass rounded-2xl p-6">
                <Input
                  autoFocus
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Your full name"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && fullName.trim()) setStep("complete");
                  }}
                />
              </div>

              <div className="mt-8 flex justify-end">
                <Button
                  size="lg"
                  disabled={!fullName.trim() || pending}
                  isLoading={pending}
                  onClick={() => setStep("complete")}
                >
                  Enter BELONG
                </Button>
              </div>
            </motion.div>
          )}

          {step === "complete" && (
            <motion.div
              key="complete"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center py-16 text-center"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 300, damping: 20, delay: 0.1 }}
                className="flex h-20 w-20 items-center justify-center rounded-full bg-success/15"
              >
                <Check className="h-10 w-10 text-success" strokeWidth={2.5} />
              </motion.div>
              <motion.h1
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="mt-8 text-heading-lg text-fg-primary"
              >
                You&apos;re ready to build
              </motion.h1>
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="mt-3 max-w-md text-body"
              >
                Your profile and home feed are ready. Enter BELONG when you want to get started.
              </motion.p>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="mt-8"
              >
                <Button size="lg" isLoading={pending} onClick={submit}>
                  Enter BELONG
                </Button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
