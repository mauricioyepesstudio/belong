"use client";

import type { ProjectFile } from "@/lib/core/project-workspace";
import { getProjectFileUrl, uploadProjectFile } from "@/lib/actions/project-workspace";
import {
  Badge,
  Button,
  Card,
  CardContent,
  EmptyState,
  useToast,
} from "@/systems/design-system";
import { formatDistanceToNow } from "@/lib/format";
import { FileText, Upload } from "lucide-react";
import { useRef, useTransition } from "react";

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function ProjectFilesTab({
  projectId,
  files,
  isMember,
}: {
  projectId: string;
  files: ProjectFile[];
  isMember: boolean;
}) {
  const { toast } = useToast();
  const inputRef = useRef<HTMLInputElement>(null);
  const [isPending, startTransition] = useTransition();

  const handleUpload = (fileList: FileList | null) => {
    const file = fileList?.[0];
    if (!file) return;
    const formData = new FormData();
    formData.set("file", file);
    startTransition(async () => {
      const result = await uploadProjectFile(projectId, formData);
      if (result.error) toast(result.error, "error");
      else {
        toast("File uploaded", "success");
        window.location.reload();
      }
    });
  };

  const handleDownload = (fileId: string) => {
    startTransition(async () => {
      const result = await getProjectFileUrl(fileId);
      if (result.error) toast(result.error, "error");
      else if (result.url) window.open(result.url, "_blank");
    });
  };

  if (!isMember) {
    return (
      <EmptyState
        icon={FileText}
        title="Join to upload files"
        description="Project members can upload and preview shared files."
        className="mt-6 py-10"
      />
    );
  }

  return (
    <div className="mt-6 space-y-4">
      <Card>
        <CardContent className="flex items-center justify-between pt-6">
          <div>
            <p className="text-sm font-medium text-fg-primary">Upload a file</p>
            <p className="text-caption">Max 10MB per file</p>
          </div>
          <input
            ref={inputRef}
            type="file"
            className="hidden"
            onChange={(e) => handleUpload(e.target.files)}
          />
          <Button
            disabled={isPending}
            onClick={() => inputRef.current?.click()}
          >
            <Upload className="h-4 w-4" aria-hidden />
            Upload
          </Button>
        </CardContent>
      </Card>

      {files.length === 0 ? (
        <EmptyState icon={FileText} title="No files yet" description="Upload documents, designs, or assets." />
      ) : (
        <Card>
          <CardContent className="divide-y divide-border-subtle p-0 pt-2">
            <ul>
              {files.map((file) => (
                <li key={file.id} className="flex items-center justify-between gap-4 px-4 py-4 sm:px-6">
                  <div className="min-w-0">
                    <p className="truncate font-medium text-fg-primary">{file.fileName}</p>
                    <p className="text-caption">
                      {file.uploaderName ?? "Member"} · v{file.version} · {formatBytes(file.fileSize)} ·{" "}
                      {formatDistanceToNow(file.createdAt)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {file.mimeType?.startsWith("image/") && (
                      <Badge variant="outline">Preview</Badge>
                    )}
                    <Button size="sm" variant="secondary" disabled={isPending} onClick={() => handleDownload(file.id)}>
                      Open
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
