"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Pencil, Check, X, Plus, Trash2, ClipboardList } from "lucide-react";
import toast from "react-hot-toast";

import {
  useGetCourseQuery,
  useUpdateCourseMutation,
  useUpdateLessonMutation,
  useListAssignmentsQuery,
  useCreateAssignmentMutation,
  useUpdateAssignmentMutation,
  useDeleteAssignmentMutation,
} from "@/store/api/apiSlice";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

// Admin edits course metadata only — slug and instructor assignment are
// fixed at creation time and aren't editable from here.
const schema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  category: z.string().min(2, "Category is required"),
  level: z.enum(["BEGINNER", "INTERMEDIATE", "ADVANCED"]),
  duration: z.coerce.number().int().nonnegative(),
  thumbnail: z.string().optional(),
  published: z.boolean(),
});

type FormInput = z.input<typeof schema>;
type FormOutput = z.output<typeof schema>;

interface EditingLesson {
  id: string;
  title: string;
  description: string;
  content: string;
  videoUrl: string;
}

interface AssignmentFormState {
  title: string;
  description: string;
  instructions: string;
  dueDate: string; // yyyy-mm-dd for the <input type="date">
  maxScore: string;
}

const emptyAssignmentForm = (): AssignmentFormState => ({
  title: "",
  description: "",
  instructions: "",
  dueDate: "",
  maxScore: "100",
});

export default function AdminCourseEditPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const { data, isLoading, isError } = useGetCourseQuery(id, { skip: !id });
  const course = data?.data;
  const [updateCourse, { isLoading: isSaving }] = useUpdateCourseMutation();
  const [updateLesson, { isLoading: isSavingLesson }] = useUpdateLessonMutation();

  const { data: assignmentsData } = useListAssignmentsQuery({ courseId: id }, { skip: !id });
  const assignments = assignmentsData?.data ?? [];
  const [createAssignment, { isLoading: creatingAssignment }] = useCreateAssignmentMutation();
  const [updateAssignment, { isLoading: updatingAssignment }] = useUpdateAssignmentMutation();
  const [deleteAssignment] = useDeleteAssignmentMutation();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormInput, any, FormOutput>({ resolver: zodResolver(schema) });

  useEffect(() => {
    if (!course) return;
    reset({
      title: course.title,
      description: course.description,
      category: course.category,
      level: course.level,
      duration: course.duration,
      thumbnail: course.thumbnail ?? "",
      published: course.published,
    });
  }, [course, reset]);

  async function onSubmit(values: FormOutput) {
    try {
      await updateCourse({ id, data: values }).unwrap();
      toast.success("Course updated");
    } catch (e: any) {
      toast.error(e?.data?.message ?? "Failed to update course");
    }
  }

  // ---- inline lesson editing ----
  const [editingLesson, setEditingLesson] = useState<EditingLesson | null>(null);

  function startEditLesson(lesson: any) {
    setEditingLesson({
      id: lesson.id,
      title: lesson.title,
      description: lesson.description ?? "",
      content: lesson.content ?? "",
      videoUrl: lesson.videoUrl ?? "",
    });
  }

  async function saveEditLesson() {
    if (!editingLesson) return;
    try {
      const { id: lessonId, ...data } = editingLesson;
      await updateLesson({ id: lessonId, courseId: id, data }).unwrap();
      toast.success("Lesson updated");
      setEditingLesson(null);
    } catch (e: any) {
      toast.error(e?.data?.message ?? "Failed to update lesson");
    }
  }

  // ---- assignment add/edit dialog ----
  const [assignmentDialog, setAssignmentDialog] = useState<{ lessonId: string; assignmentId?: string } | null>(null);
  const [assignmentForm, setAssignmentForm] = useState<AssignmentFormState>(emptyAssignmentForm());
  const [pendingDeleteAssignment, setPendingDeleteAssignment] = useState<{ id: string; title: string } | null>(null);

  function openNewAssignment(lessonId: string) {
    setAssignmentForm(emptyAssignmentForm());
    setAssignmentDialog({ lessonId });
  }

  function openEditAssignment(lessonId: string, assignment: any) {
    setAssignmentForm({
      title: assignment.title,
      description: assignment.description,
      instructions: assignment.instructions ?? "",
      dueDate: assignment.dueDate ? assignment.dueDate.slice(0, 10) : "",
      maxScore: String(assignment.maxScore ?? 100),
    });
    setAssignmentDialog({ lessonId, assignmentId: assignment.id });
  }

  async function saveAssignment() {
    if (!assignmentDialog) return;
    if (!assignmentForm.title.trim() || !assignmentForm.description.trim() || !assignmentForm.dueDate) {
      toast.error("Title, description, and due date are required");
      return;
    }
    const payload = {
      title: assignmentForm.title,
      description: assignmentForm.description,
      instructions: assignmentForm.instructions || undefined,
      dueDate: new Date(assignmentForm.dueDate).toISOString(),
      maxScore: Number(assignmentForm.maxScore) || 100,
    };
    try {
      if (assignmentDialog.assignmentId) {
        await updateAssignment({ id: assignmentDialog.assignmentId, data: payload }).unwrap();
        toast.success("Assignment updated");
      } else {
        await createAssignment({ lessonId: assignmentDialog.lessonId, data: payload }).unwrap();
        toast.success("Assignment added");
      }
      setAssignmentDialog(null);
    } catch (e: any) {
      toast.error(e?.data?.message ?? "Failed to save assignment");
    }
  }

  async function confirmDeleteAssignment() {
    if (!pendingDeleteAssignment) return;
    try {
      await deleteAssignment(pendingDeleteAssignment.id).unwrap();
      toast.success("Assignment deleted");
    } catch {
      toast.error("Failed to delete assignment");
    } finally {
      setPendingDeleteAssignment(null);
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-96" />
      </div>
    );
  }

  if (isError || !course) {
    return (
      <div className="py-xl text-center">
        <h1 className="text-xl font-semibold text-foreground">Course not found</h1>
        <p className="mt-1 text-sm text-muted-foreground">It may have been deleted, or the link is incorrect.</p>
        <Button className="mt-4" onClick={() => router.push("/courses")}>
          Back to all courses
        </Button>
      </div>
    );
  }

  return (
    <div className="w-full space-y-6">
      <button
        type="button"
        onClick={() => router.push("/courses")}
        className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft size={16} /> Back to all courses
      </button>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Edit course</h1>
          <p className="text-sm text-muted-foreground">
            /{course.slug} · Instructor: {course.instructor?.name}
          </p>
        </div>
        <Badge variant={course.published ? "success" : "warning"}>
          {course.published ? "Published" : "Draft"}
        </Badge>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="card space-y-5 p-6">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Title</Label>
            <Input className="mt-1" {...register("title")} />
            {errors.title && <p className="mt-1 text-sm text-destructive">{errors.title.message}</p>}
          </div>
          <div>
            <Label>Category</Label>
            <Input className="mt-1" {...register("category")} />
            {errors.category && <p className="mt-1 text-sm text-destructive">{errors.category.message}</p>}
          </div>
        </div>

        <div>
          <Label>Description</Label>
          <Textarea className="mt-1" rows={4} {...register("description")} />
          {errors.description && <p className="mt-1 text-sm text-destructive">{errors.description.message}</p>}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Level</Label>
            <select
              className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground"
              {...register("level")}
            >
              <option value="BEGINNER">Beginner</option>
              <option value="INTERMEDIATE">Intermediate</option>
              <option value="ADVANCED">Advanced</option>
            </select>
          </div>
          <div>
            <Label>Duration (min)</Label>
            <Input className="mt-1" type="number" {...register("duration")} />
            {errors.duration && <p className="mt-1 text-sm text-destructive">{errors.duration.message}</p>}
          </div>
        </div>

        <div>
          <Label>Thumbnail URL</Label>
          <Input className="mt-1" {...register("thumbnail")} />
        </div>

        <label className="flex items-center gap-2 text-sm text-foreground">
          <Checkbox {...register("published")} />
          Published — visible to students for enrollment
        </label>
      </div>

      {course.modules?.length > 0 && (
        <section className="card space-y-3 p-6">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Modules, lessons & assignments
          </h2>
          <div className="space-y-3">
            {course.modules.map((mod: any) => (
              <div key={mod.id} className="rounded-md border border-border p-3">
                <p className="font-medium text-foreground">{mod.title}</p>
                {mod.description && <p className="text-sm text-muted-foreground">{mod.description}</p>}

                {mod.lessons?.length > 0 && (
                  <ul className="mt-2 space-y-2">
                    {mod.lessons.map((lesson: any) => {
                      const lessonAssignments = assignments.filter((a: any) => a.lessonId === lesson.id);

                      // NOTE: `editingLesson && editingLesson.id === lesson.id` (rather than
                      // `editingLesson?.id === lesson.id`) so TypeScript can actually narrow
                      // `editingLesson` to non-null for the rest of this branch. Optional
                      // chaining in the condition doesn't narrow the object itself, only the
                      // `.id` access, so the later `{ ...editingLesson, ... }` spread was
                      // seeing `EditingLesson | null` and inferring every field as optional.
                      if (editingLesson && editingLesson.id === lesson.id) {
                        return (
                          <li key={lesson.id} className="space-y-2 rounded-md border border-border bg-muted/30 p-3">
                            <Input
                              placeholder="Lesson title"
                              value={editingLesson.title}
                              onChange={(e) => setEditingLesson({ ...editingLesson, title: e.target.value })}
                            />
                            <Input
                              placeholder="Lesson description"
                              value={editingLesson.description}
                              onChange={(e) => setEditingLesson({ ...editingLesson, description: e.target.value })}
                            />
                            <Textarea
                              rows={2}
                              placeholder="Lesson content"
                              value={editingLesson.content}
                              onChange={(e) => setEditingLesson({ ...editingLesson, content: e.target.value })}
                            />
                            <Input
                              placeholder="Video URL"
                              value={editingLesson.videoUrl}
                              onChange={(e) => setEditingLesson({ ...editingLesson, videoUrl: e.target.value })}
                            />
                            <div className="flex gap-2">
                              <Button size="sm" onClick={saveEditLesson} disabled={isSavingLesson}>
                                <Check size={14} /> Save
                              </Button>
                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                onClick={() => setEditingLesson(null)}
                                disabled={isSavingLesson}
                              >
                                <X size={14} /> Cancel
                              </Button>
                            </div>
                          </li>
                        );
                      }

                      return (
                        <li key={lesson.id} className="rounded-md border border-transparent pl-4 text-sm">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-foreground">{lesson.title}</span>
                            <button
                              type="button"
                              onClick={() => startEditLesson(lesson)}
                              aria-label={`Edit ${lesson.title}`}
                              className="shrink-0 rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
                            >
                              <Pencil size={13} />
                            </button>
                          </div>

                          <div className="mt-1.5 space-y-1 border-l border-border pl-3">
                            {/* One assignment per lesson: once it has one, show edit/delete
                                only — no "Add assignment" until it's deleted again. */}
                            {lessonAssignments.map((a: any) => (
                              <div key={a.id} className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
                                <span className="flex items-center gap-1.5">
                                  <ClipboardList size={12} /> {a.title}
                                  {a.dueDate && <span>· due {new Date(a.dueDate).toLocaleDateString()}</span>}
                                </span>
                                <div className="flex gap-1">
                                  <button
                                    type="button"
                                    onClick={() => openEditAssignment(lesson.id, a)}
                                    className="rounded p-1 hover:bg-muted hover:text-foreground"
                                    aria-label={`Edit assignment ${a.title}`}
                                  >
                                    <Pencil size={11} />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setPendingDeleteAssignment({ id: a.id, title: a.title })}
                                    className="rounded p-1 text-destructive hover:bg-destructive/10"
                                    aria-label={`Delete assignment ${a.title}`}
                                  >
                                    <Trash2 size={11} />
                                  </button>
                                </div>
                              </div>
                            ))}
                            {lessonAssignments.length === 0 && (
                              <button
                                type="button"
                                onClick={() => openNewAssignment(lesson.id)}
                                className="flex items-center gap-1 py-0.5 text-xs text-primary hover:underline"
                              >
                                <Plus size={11} /> Add assignment
                              </button>
                            )}
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

        {/* Save/Cancel sit at the very end — once you're done editing course
            details, lessons, and assignments above, save (or discard) it all here. */}
        <div className="flex gap-3">
          <Button type="submit" disabled={isSaving}>
            {isSaving ? "Saving..." : "Save changes"}
          </Button>
          <Button type="button" variant="outline" asChild>
            <Link href="/courses">Cancel</Link>
          </Button>
        </div>
      </form>

      {/* Add/edit assignment dialog */}
      <Dialog open={!!assignmentDialog} onOpenChange={(v) => !v && setAssignmentDialog(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{assignmentDialog?.assignmentId ? "Edit assignment" : "Add assignment"}</DialogTitle>
            <DialogDescription>Assignments appear on the lesson and in the student's assignments list.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Title</Label>
              <Input
                className="mt-1"
                value={assignmentForm.title}
                onChange={(e) => setAssignmentForm({ ...assignmentForm, title: e.target.value })}
              />
            </div>
            <div>
              <Label>Description</Label>
              <Textarea
                className="mt-1"
                rows={2}
                value={assignmentForm.description}
                onChange={(e) => setAssignmentForm({ ...assignmentForm, description: e.target.value })}
              />
            </div>
            <div>
              <Label>Instructions (optional)</Label>
              <Textarea
                className="mt-1"
                rows={3}
                value={assignmentForm.instructions}
                onChange={(e) => setAssignmentForm({ ...assignmentForm, instructions: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Due date</Label>
                <Input
                  className="mt-1"
                  type="date"
                  value={assignmentForm.dueDate}
                  onChange={(e) => setAssignmentForm({ ...assignmentForm, dueDate: e.target.value })}
                />
              </div>
              <div>
                <Label>Max score</Label>
                <Input
                  className="mt-1"
                  type="number"
                  value={assignmentForm.maxScore}
                  onChange={(e) => setAssignmentForm({ ...assignmentForm, maxScore: e.target.value })}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setAssignmentDialog(null)}>
              Cancel
            </Button>
            <Button type="button" onClick={saveAssignment} disabled={creatingAssignment || updatingAssignment}>
              {creatingAssignment || updatingAssignment ? "Saving..." : "Save assignment"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete assignment confirmation */}
      <AlertDialog open={!!pendingDeleteAssignment} onOpenChange={(v) => !v && setPendingDeleteAssignment(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete "{pendingDeleteAssignment?.title}"?</AlertDialogTitle>
            <AlertDialogDescription>
              This permanently removes the assignment and any student submissions tied to it.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-white hover:bg-destructive/90"
              onClick={confirmDeleteAssignment}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}