import { useState, useRef } from "react";
import { ClipboardList, Upload, FileText, Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import { useListAssignmentsQuery, useSubmitAssignmentMutation } from "../../store/api/apiSlice";
import { Skeleton } from "../../components/Skeleton";
import { EmptyState } from "../../components/EmptyState";
import { Badge } from "../../components/Badge";

const ALLOWED_EXT = [".pdf", ".doc", ".docx", ".ppt", ".pptx", ".zip", ".png", ".jpg", ".jpeg"];
const MAX_SIZE = 25 * 1024 * 1024;

function statusFor(assignment: any) {
  const sub = assignment.submissions?.[0];
  if (sub?.status === "GRADED") return { label: "Graded", variant: "success" as const };
  if (sub) return { label: sub.status === "LATE" ? "Submitted (late)" : "Submitted", variant: "info" as const };
  if (new Date(assignment.dueDate) < new Date()) return { label: "Overdue", variant: "danger" as const };
  return { label: "Not started", variant: "default" as const };
}

function SubmitPanel({ assignment }: { assignment: any }) {
  const [file, setFile] = useState<File | null>(null);
  const [comment, setComment] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const [submitAssignment, { isLoading }] = useSubmitAssignmentMutation();

  function validateAndSet(f: File) {
    const ext = "." + f.name.split(".").pop()?.toLowerCase();
    if (!ALLOWED_EXT.includes(ext)) return toast.error(`Unsupported file type: ${ext}`);
    if (f.size > MAX_SIZE) return toast.error("File exceeds 25MB limit");
    setFile(f);
  }

  async function handleSubmit() {
    if (!file) return;
    try {
      await submitAssignment({ id: assignment.id, file, comment }).unwrap();
      toast.success("Assignment submitted!");
      setFile(null);
      setComment("");
    } catch (e: any) {
      toast.error(e?.data?.message ?? "Submission failed");
    }
  }

  return (
    <div className="mt-3 border-t border-outline-variant pt-3">
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => { e.preventDefault(); setDragOver(false); if (e.dataTransfer.files[0]) validateAndSet(e.dataTransfer.files[0]); }}
        onClick={() => inputRef.current?.click()}
        className={`flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-6 text-center text-sm transition ${dragOver ? "border-primary bg-primary-container/20" : "border-outline-variant"}`}
      >
        <Upload size={22} className="mb-2 text-on-surface-variant" />
        {file ? <p className="font-medium">{file.name}</p> : <p className="text-on-surface-variant">Drag & drop a file, or click to browse<br /><span className="text-xs">PDF, DOC, DOCX, PPT, PPTX, ZIP, PNG, JPG (max 25MB)</span></p>}
        <input ref={inputRef} type="file" className="hidden" accept={ALLOWED_EXT.join(",")} onChange={(e) => e.target.files?.[0] && validateAndSet(e.target.files[0])} />
      </div>
      <textarea className="input mt-2" rows={2} placeholder="Add a comment (optional)" value={comment} onChange={(e) => setComment(e.target.value)} />
      <button onClick={handleSubmit} disabled={!file || isLoading} className="btn-primary mt-2 w-full">
        {isLoading && <Loader2 className="animate-spin" size={16} />} Submit assignment
      </button>
    </div>
  );
}

export default function AssignmentsPage() {
  const [expanded, setExpanded] = useState<string | null>(null);
  const { data, isLoading } = useListAssignmentsQuery();
  const assignments = data?.data;

  return (
    <div>
      <h1 className="mb-1 text-2xl font-bold">Assignments</h1>
      <p className="mb-6 text-sm text-on-surface-variant">Track deadlines and submit your work.</p>

      {isLoading ? (
        <div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-20" />)}</div>
      ) : !assignments?.length ? (
        <EmptyState icon={ClipboardList} title="No assignments yet" description="Enroll in a course to see assignments here." />
      ) : (
        <div className="space-y-3">
          {assignments.map((a: any) => {
            const status = statusFor(a);
            const sub = a.submissions?.[0];
            return (
              <div key={a.id} className="card p-4">
                <button onClick={() => setExpanded(expanded === a.id ? null : a.id)} className="flex w-full items-center justify-between text-left">
                  <div className="flex items-center gap-3">
                    <FileText size={18} className="text-on-surface-variant" />
                    <div>
                      <p className="font-medium">{a.title}</p>
                      <p className="text-xs text-on-surface-variant">{a.lesson?.module?.course?.title} · Due {new Date(a.dueDate).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <Badge variant={status.variant}>{status.label}</Badge>
                </button>

                {expanded === a.id && (
                  <div className="mt-3">
                    <p className="text-sm text-on-surface-variant">{a.description}</p>
                    {sub?.status === "GRADED" ? (
                      <div className="mt-3 rounded-lg bg-surface-container p-3 text-sm">
                        <p className="font-medium">Score: {sub.score} / {a.maxScore}</p>
                        {sub.feedback && <p className="mt-1 text-on-surface-variant">Feedback: {sub.feedback}</p>}
                      </div>
                    ) : (
                      <SubmitPanel assignment={a} />
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}