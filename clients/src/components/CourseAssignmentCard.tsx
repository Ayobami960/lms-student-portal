import { useRef, useState } from "react";
import { CalendarClock, ClipboardList, Loader2, Lock, Upload } from "lucide-react";
import toast from "react-hot-toast";
import { useSubmitAssignmentMutation } from "../store/api/apiSlice";

const ALLOWED_EXT = [".pdf", ".doc", ".docx", ".ppt", ".pptx", ".zip", ".png", ".jpg", ".jpeg"];
const MAX_SIZE = 25 * 1024 * 1024;

// ---------------------------------------------------------------------------
// Assignment card shown at the bottom of an enrolled course. Submission is
// locked until every lesson in the course has been completed — once the
// course hits 100%, the upload area unlocks.
// ---------------------------------------------------------------------------
export function CourseAssignmentCard({ assignment, unlocked }: { assignment: any; unlocked: boolean }) {
  const [file, setFile] = useState<File | null>(null);
  const [comment, setComment] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const [submitAssignment, { isLoading }] = useSubmitAssignmentMutation();

  const submission = assignment.submissions?.[0];
  const isPastDue = new Date(assignment.dueDate) < new Date();

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
    <div className="border border-outline-variant rounded-xl p-lg bg-surface-container-lowest">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-md">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <ClipboardList className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-semibold text-on-surface">{assignment.title}</h4>
            <p className="text-sm text-on-surface-variant mt-0.5">{assignment.description}</p>
            <p className="flex items-center gap-1 text-xs text-on-surface-variant mt-2">
              <CalendarClock className="w-3.5 h-3.5" />
              Due {new Date(assignment.dueDate).toLocaleDateString()} · {assignment.maxScore} pts
            </p>
          </div>
        </div>

        {submission?.status === "GRADED" && (
          <span className="shrink-0 inline-flex items-center gap-1 text-xs font-semibold bg-secondary-container text-on-secondary-container px-3 py-1 rounded-full">
            Graded: {submission.score}/{assignment.maxScore}
          </span>
        )}
        {submission && submission.status !== "GRADED" && (
          <span className="shrink-0 inline-flex items-center gap-1 text-xs font-semibold bg-primary/10 text-primary px-3 py-1 rounded-full">
            {submission.status === "LATE" ? "Submitted (late)" : "Submitted"}
          </span>
        )}
      </div>

      {assignment.instructions && (
        <p className="text-sm text-on-surface-variant bg-surface-container rounded-lg p-3 mb-md">
          {assignment.instructions}
        </p>
      )}

      {submission?.status === "GRADED" ? (
        submission.feedback && (
          <p className="text-sm text-on-surface-variant">
            <span className="font-medium text-on-surface">Instructor feedback: </span>
            {submission.feedback}
          </p>
        )
      ) : !unlocked ? (
        <div className="flex items-center gap-2 text-sm text-on-surface-variant bg-surface-container rounded-lg p-3">
          <Lock className="w-4 h-4 shrink-0" />
          Finish every lesson in this course to unlock assignment submission.
        </div>
      ) : (
        <div>
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragOver(false);
              if (e.dataTransfer.files[0]) validateAndSet(e.dataTransfer.files[0]);
            }}
            onClick={() => inputRef.current?.click()}
            className={`flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-6 text-center text-sm transition ${
              dragOver ? "border-primary bg-primary/5" : "border-outline-variant"
            }`}
          >
            <Upload size={20} className="mb-2 text-on-surface-variant" />
            {file ? (
              <p className="font-medium">{file.name}</p>
            ) : (
              <p className="text-on-surface-variant">
                Drag &amp; drop a file, or click to browse
                <br />
                <span className="text-xs">PDF, DOC, DOCX, PPT, PPTX, ZIP, PNG, JPG (max 25MB)</span>
              </p>
            )}
            <input
              ref={inputRef}
              type="file"
              className="hidden"
              accept={ALLOWED_EXT.join(",")}
              onChange={(e) => e.target.files?.[0] && validateAndSet(e.target.files[0])}
            />
          </div>
          <textarea
            className="input mt-2 w-full"
            rows={2}
            placeholder="Add a comment (optional)"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
          />
          {isPastDue && !submission && (
            <p className="text-xs text-tertiary mt-1">This assignment is past due — it will be marked as submitted late.</p>
          )}
          <button
            onClick={handleSubmit}
            disabled={!file || isLoading}
            className="inline-flex items-center justify-center gap-2 bg-primary text-on-primary font-semibold px-5 py-2.5 rounded-xl hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-60 mt-2 w-full sm:w-auto"
          >
            {isLoading && <Loader2 className="animate-spin" size={16} />} Submit assignment
          </button>
        </div>
      )}
    </div>
  );
}