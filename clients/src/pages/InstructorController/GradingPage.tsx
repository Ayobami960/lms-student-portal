import { useState } from "react";
import { Navigate } from "react-router";
import { ClipboardCheck, CheckCircle2, RotateCcw } from "lucide-react";
import toast from "react-hot-toast";
import { useListGradingSubmissionsQuery, useGradeSubmissionMutation } from "../../store/api/apiSlice";
import { useAppSelector } from "../../hooks/redux";
import { Skeleton } from "../../components/Skeleton";
import { EmptyState } from "../../components/EmptyState";
import { Badge } from "../../components/Badge";
import { Input } from "../../components/ui/Input";
import { Button } from "../../components/ui/Button";

function GradeForm({ submission }: { submission: any }) {
  const [score, setScore] = useState(submission.score?.toString() ?? "");
  const [feedback, setFeedback] = useState(submission.feedback ?? "");
  const [gradeSubmission, { isLoading }] = useGradeSubmissionMutation();

  const scoreValid = score !== "" && Number(score) >= 0 && Number(score) <= submission.assignment.maxScore;

  async function handleDecision(approved: boolean) {
    if (!scoreValid) return toast.error("Enter a valid score first");
    if (!approved && !feedback.trim()) return toast.error("Feedback is required so the student knows what to fix");
    try {
      await gradeSubmission({ id: submission.id, score: Number(score), feedback, approved }).unwrap();
      toast.success(approved ? "Submission approved" : "Revision requested");
    } catch (e: any) {
      toast.error(e?.data?.message ?? "Failed to save");
    }
  }

  return (
    <div className="mt-3 space-y-2 border-t border-outline-variant pt-3">
      <div className="">
        <div className="">
          <Input
            label={`Score (/${submission.assignment.maxScore})`}
            id={`score-${submission.id}`}
            type="number"
            min={0}
            max={submission.assignment.maxScore}
            value={score}
            onChange={(e) => setScore(e.target.value)}
          />
        </div>
        <div className="flex-1">
          <Input
            label="Feedback"
            id={`feedback-${submission.id}`}
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            placeholder="What should the student fix or confirm?"
          />
          <p className="mt-1 text-xs text-outline">Required if requesting revision</p>
        </div>
      </div>
      <div className="flex flex-col gap-2 sm:flex-row">
        <Button onClick={() => handleDecision(true)} loading={isLoading} disabled={!scoreValid} className="flex-1">
          <CheckCircle2 size={16} /> Approve
        </Button>
        <Button
          onClick={() => handleDecision(false)}
          loading={isLoading}
          disabled={!scoreValid}
          variant="secondary"
          className="flex-1"
        >
          <RotateCcw size={16} /> Request revision
        </Button>
      </div>
    </div>
  );
}

const GradingPage = () => {
  const [expanded, setExpanded] = useState<string | null>(null);
  const role = useAppSelector((s) => s.auth.user?.role);
  const { data, isLoading } = useListGradingSubmissionsQuery();
  const submissions = data?.data;

  // Instructor-only page — send anyone else back to the dashboard.
  if (role !== "INSTRUCTOR") {
    return <Navigate to="/dashboard" replace />;
  }

  function statusBadge(s: any) {
    if (s.status === "GRADED" && s.approved) return <Badge variant="success">Approved</Badge>;
    if (s.status === "GRADED" && !s.approved) return <Badge variant="warning">Revision requested</Badge>;
    return <Badge variant={s.status === "LATE" ? "warning" : "info"}>{s.status}</Badge>;
  }

  return (
    <div className="space-y-lg animate-fade-in">
      <div>
        <h1 className="text-2xl font-semibold text-on-surface">Grading</h1>
        <p className="text-sm text-outline">
          Review submissions and either approve them or request a revision. Approval is required before the student can claim their certificate.
        </p>
      </div>

      {isLoading ? (
        <div className="space-y-sm">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-20" />
          ))}
        </div>
      ) : !submissions?.length ? (
        <EmptyState
          icon={ClipboardCheck}
          title="No submissions to grade"
          description="Submissions from your courses will show up here."
        />
      ) : (
        <div className="space-y-sm">
          {submissions.map((s: any) => (
            <div
              key={s.id}
              className="bg-surface-container-lowest border border-outline-variant shadow-sm rounded-xl p-md"
            >
              <button
                onClick={() => setExpanded(expanded === s.id ? null : s.id)}
                className="flex w-full items-center justify-between text-left"
              >
                <div>
                  <p className="font-medium text-on-surface">{s.assignment.title}</p>
                  <p className="text-xs text-outline">
                    {s.student.name} · Submitted {new Date(s.submittedAt).toLocaleDateString()}
                  </p>
                </div>
                {statusBadge(s)}
              </button>

              {expanded === s.id && (
                <div className="mt-3">
                  {s.comment && (
                    <p className="text-sm text-on-surface-variant">Comment: {s.comment}</p>
                  )}
                  {s.fileUrl && (
                    <a
                      href={s.fileUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-1 inline-block text-sm text-primary hover:underline"
                    >
                      Download submission: {s.fileName}
                    </a>
                  )}
                  <GradeForm submission={s} />
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default GradingPage;