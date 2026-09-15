"use client";

import { linkApproachToProject } from "@/lib/actions/proof";
import type { ProjectWithMemberCount } from "@/lib/core";
import { Button, EmptyState, Label, Modal, useToast } from "@/systems/design-system";
import { FolderKanban, Rocket } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

type ShowUpModalProps = {
  approachId: string;
  projects: ProjectWithMemberCount[];
};

/**
 * SHOW UP (BELONG_PROOF_LOOP.md): "BELONG routes relevant people, skills,
 * organizations, resources, and communities toward concrete roles" by
 * linking an Approach to a Project the person already owns or belongs to —
 * reusing the existing Projects engine rather than building an execution
 * layer from scratch, per the V1 vertical slice's own instruction to use
 * existing engines wherever possible.
 */
export function ShowUpModal({ approachId, projects }: ShowUpModalProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);

  const handleLink = (formData: FormData) => {
    startTransition(async () => {
      const result = await linkApproachToProject({
        approachId,
        projectId: formData.get("projectId") as string,
      });

      if (result.error) toast(result.error, "error");
      else {
        toast("Showed up with a project", "success");
        setOpen(false);
        router.refresh();
      }
    });
  };

  return (
    <>
      <Button variant="outline" size="sm" className="rounded-xl" onClick={() => setOpen(true)}>
        <Rocket className="h-3.5 w-3.5" aria-hidden />
        Show up
      </Button>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Show up for this approach"
        description="Link one of your projects so it can actually execute this approach."
      >
        {projects.length === 0 ? (
          <EmptyState
            icon={FolderKanban}
            title="No projects yet"
            description="Create or join a project first, then come back to link it here."
          />
        ) : (
          <form action={handleLink} className="space-y-4">
            <div>
              <Label htmlFor="show-up-project">Project</Label>
              <select
                id="show-up-project"
                name="projectId"
                required
                className="mt-1 flex h-10 w-full rounded-xl border border-border-subtle bg-bg-surface px-3 text-sm text-fg-primary"
              >
                {projects.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="brand" disabled={isPending}>
                Show up
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </>
  );
}
