"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  Plus,
  Trash2,
  Check,
  Loader2,
  FolderClosed,
  FileText,
  BookOpen,
  ClipboardList,
} from "lucide-react";
import toast from "react-hot-toast";

import {
  useCreateCourseMutation,
  useCreateModuleMutation,
  useCreateLessonMutation,
  useCreateAssignmentMutation,
  useListUsersQuery,
} from "@/store/api/apiSlice";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const schema = z.object({
  instructorId: z.string().min(1, "Select an instructor"),
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

interface AssignmentInput {
  title: string;
  description: string;
  instructions: string;
  dueDate: string; // yyyy-mm-dd for the <input type="date">
  maxScore: string;
}

interface LessonInput {
  title: string;
  description: string;
  content: string;
  videoUrl: string;
  assignments: AssignmentInput[];
}

interface ModuleInput {
  title: string;
  description: string;
  lessons: LessonInput[];
}

const emptyAssignment = (): AssignmentInput => ({
  title: "",
  description: "",
  instructions: "",
  dueDate: "",
  maxScore: "100",
});
const emptyLesson = (): LessonInput => ({ title: "", description: "", content: "", videoUrl: "", assignments: [] });
const emptyModule = (): ModuleInput => ({ title: "", description: "", lessons: [] });

// z.string().url().optional() rejects "" — it only tolerates `undefined`.
// Form fields default to "" when left blank, so this converts blank
// strings to undefined right before anything is sent to the API.
function orUndefined(value: string | undefined): string | undefined {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

type Selection = { type: "module"; moduleIdx: number } | { type: "lesson"; moduleIdx: number; lessonIdx: number } | null;

const STEPS = [
  { id: "details", label: "Course details" },
  { id: "curriculum", label: "Curriculum" },
  { id: "review", label: "Review & publish" },
] as const;
type StepId = (typeof STEPS)[number]["id"];

export default function AdminCreateCoursePage() {
  const router = useRouter();
  const { data: instructorsData, isLoading: loadingInstructors } = useListUsersQuery({ role: "INSTRUCTOR", limit: 100 });
  const [createCourse] = useCreateCourseMutation();
  const [createModule] = useCreateModuleMutation();
  const [createLesson] = useCreateLessonMutation();
  const [createAssignment] = useCreateAssignmentMutation();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    getValues,
    trigger,
    formState: { errors },
  } = useForm<FormInput, any, FormOutput>({
    resolver: zodResolver(schema),
    defaultValues: { level: "BEGINNER", duration: 0, published: false },
  });

  const [step, setStep] = useState<StepId>("details");
  const [modules, setModules] = useState<ModuleInput[]>([]);
  const [selection, setSelection] = useState<Selection>(null);
  const [progress, setProgress] = useState<{ current: number; total: number; label: string } | null>(null);

  const currentStepIndex = STEPS.findIndex((s) => s.id === step);

  // ---- step navigation ----
  async function goToCurriculum() {
    const valid = await trigger(); // validates the whole schema, incl. instructorId
    if (!valid) {
      toast.error("Fix the highlighted fields before continuing");
      return;
    }
    setStep("curriculum");
  }

  // ---- module / lesson tree handlers ----
  function addModule() {
    setModules((m) => {
      const next = [...m, emptyModule()];
      setSelection({ type: "module", moduleIdx: next.length - 1 });
      return next;
    });
  }
  function removeModule(idx: number) {
    setModules((m) => m.filter((_, i) => i !== idx));
    setSelection(null);
  }
  function updateModule(idx: number, key: keyof Omit<ModuleInput, "lessons">, value: string) {
    setModules((m) => m.map((mod, i) => (i === idx ? { ...mod, [key]: value } : mod)));
  }

  function addLesson(moduleIdx: number) {
    setModules((m) => {
      const next = m.map((mod, i) => (i === moduleIdx ? { ...mod, lessons: [...mod.lessons, emptyLesson()] } : mod));
      setSelection({ type: "lesson", moduleIdx, lessonIdx: next[moduleIdx].lessons.length - 1 });
      return next;
    });
  }
  function removeLesson(moduleIdx: number, lessonIdx: number) {
    setModules((m) =>
      m.map((mod, i) =>
        i === moduleIdx ? { ...mod, lessons: mod.lessons.filter((_, j) => j !== lessonIdx) } : mod
      )
    );
    setSelection({ type: "module", moduleIdx });
  }
  function updateLesson(moduleIdx: number, lessonIdx: number, key: keyof Omit<LessonInput, "assignments">, value: string) {
    setModules((m) =>
      m.map((mod, i) =>
        i === moduleIdx
          ? { ...mod, lessons: mod.lessons.map((l, j) => (j === lessonIdx ? { ...l, [key]: value } : l)) }
          : mod
      )
    );
  }

  // ---- assignment handlers (nested under a lesson) ----
  function addAssignment(moduleIdx: number, lessonIdx: number) {
    setModules((m) =>
      m.map((mod, i) =>
        i === moduleIdx
          ? {
              ...mod,
              lessons: mod.lessons.map((l, j) =>
                j === lessonIdx ? { ...l, assignments: [...l.assignments, emptyAssignment()] } : l
              ),
            }
          : mod
      )
    );
  }
  function removeAssignment(moduleIdx: number, lessonIdx: number, assignmentIdx: number) {
    setModules((m) =>
      m.map((mod, i) =>
        i === moduleIdx
          ? {
              ...mod,
              lessons: mod.lessons.map((l, j) =>
                j === lessonIdx ? { ...l, assignments: l.assignments.filter((_, k) => k !== assignmentIdx) } : l
              ),
            }
          : mod
      )
    );
  }
  function updateAssignmentField(
    moduleIdx: number,
    lessonIdx: number,
    assignmentIdx: number,
    key: keyof AssignmentInput,
    value: string
  ) {
    setModules((m) =>
      m.map((mod, i) =>
        i === moduleIdx
          ? {
              ...mod,
              lessons: mod.lessons.map((l, j) =>
                j === lessonIdx
                  ? {
                      ...l,
                      assignments: l.assignments.map((a, k) => (k === assignmentIdx ? { ...a, [key]: value } : a)),
                    }
                  : l
              ),
            }
          : mod
      )
    );
  }

  const totalLessons = modules.reduce((n, m) => n + m.lessons.length, 0);
  const totalAssignments = modules.reduce(
    (n, m) => n + m.lessons.reduce((ln, l) => ln + l.assignments.length, 0),
    0
  );
  const curriculumReady = modules.some((m) => m.title.trim());

  // ---- final submission (Review step) ----
  async function onSubmit(values: FormOutput) {
    const namedModules = modules.filter((m) => m.title.trim());
    const namedLessonsPerModule = namedModules.map((m) => m.lessons.filter((l) => l.title.trim()));

    // Assignments are optional, but a *named* assignment needs a description and
    // due date — the API requires dueDate as a real string, not undefined. Validate
    // everything up front so we don't fail partway through and leave the course,
    // some modules, or some lessons already created with a broken assignment.
    for (const lessons of namedLessonsPerModule) {
      for (const lesson of lessons) {
        for (const assignment of lesson.assignments) {
          if (!assignment.title.trim()) continue;
          if (!assignment.description.trim() || !assignment.dueDate) {
            toast.error(`Assignment "${assignment.title}" needs a description and due date`);
            return;
          }
        }
      }
    }

    const totalSteps =
      1 +
      namedModules.length +
      namedLessonsPerModule.reduce((n, lessons) => n + lessons.length, 0) +
      namedLessonsPerModule.reduce(
        (n, lessons) => n + lessons.reduce((ln, l) => ln + l.assignments.filter((a) => a.title.trim()).length, 0),
        0
      );
    let done = 0;

    try {
      setProgress({ current: 0, total: totalSteps, label: "Creating course" });
      const courseRes = await createCourse({ ...values, thumbnail: orUndefined(values.thumbnail) }).unwrap();
      const courseId = courseRes.data.id;
      done += 1;

      for (let i = 0; i < modules.length; i++) {
        const mod = modules[i];
        if (!mod.title.trim()) continue;

        setProgress({ current: done, total: totalSteps, label: `Creating module "${mod.title}"` });
        const moduleRes = await createModule({
          courseId,
          data: { title: mod.title, description: mod.description, order: i + 1 },
        }).unwrap();
        const moduleId = moduleRes.data.id;
        done += 1;

        for (let j = 0; j < mod.lessons.length; j++) {
          const lesson = mod.lessons[j];
          if (!lesson.title.trim()) continue;

          setProgress({ current: done, total: totalSteps, label: `Creating lesson "${lesson.title}"` });
          const lessonRes = await createLesson({
            moduleId,
            data: {
              title: lesson.title,
              description: lesson.description,
              content: lesson.content,
              videoUrl: orUndefined(lesson.videoUrl),
              order: j + 1,
            },
          }).unwrap();
          const lessonId = lessonRes.data.id;
          done += 1;

          for (const assignment of lesson.assignments) {
            if (!assignment.title.trim()) continue;

            setProgress({ current: done, total: totalSteps, label: `Adding assignment "${assignment.title}"` });
            await createAssignment({
              lessonId,
              data: {
                title: assignment.title,
                description: assignment.description,
                instructions: assignment.instructions || undefined,
                dueDate: new Date(assignment.dueDate).toISOString(),
                maxScore: Number(assignment.maxScore) || 100,
              },
            }).unwrap();
            done += 1;
          }
        }
      }

      toast.success("Course created");
      router.push("/courses");
    } catch (e: any) {
      toast.error(e?.data?.message ?? "Failed to create course");
    } finally {
      setProgress(null);
    }
  }

  const details = getValues() as unknown as FormOutput;
  const instructorName = instructorsData?.data.find((u: any) => u.id === details.instructorId)?.name;

  return (
    <div className="w-full space-y-6">
      <button
        type="button"
        onClick={() => router.push("/courses")}
        className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft size={16} /> Back to all courses
      </button>

      <div>
        <h1 className="text-2xl font-bold text-foreground">New course</h1>
        <p className="text-sm text-muted-foreground">Create a course on behalf of an instructor.</p>
      </div>

      {/* Stepper */}
      <ol className="flex items-center gap-2">
        {STEPS.map((s, i) => {
          const state = i < currentStepIndex ? "done" : i === currentStepIndex ? "current" : "upcoming";
          return (
            <li key={s.id} className="flex flex-1 items-center gap-2">
              <button
                type="button"
                disabled={state === "upcoming" && !(i === 1 && curriculumReady)}
                onClick={() => {
                  if (state !== "upcoming") setStep(s.id);
                }}
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border text-xs font-semibold transition-colors ${
                  state === "done"
                    ? "border-primary bg-primary text-primary-foreground"
                    : state === "current"
                      ? "border-primary bg-primary-soft text-primary"
                      : "border-border bg-secondary text-muted-foreground"
                }`}
              >
                {state === "done" ? <Check size={14} /> : i + 1}
              </button>
              <span
                className={`hidden text-sm sm:inline ${
                  state === "upcoming" ? "text-muted-foreground" : "font-medium text-foreground"
                }`}
              >
                {s.label}
              </span>
              {i < STEPS.length - 1 && <div className="mx-2 h-px flex-1 bg-border" />}
            </li>
          );
        })}
      </ol>

      <form onSubmit={handleSubmit(onSubmit)}>
        {/* ---------------- Step 1: Course details ---------------- */}
        {step === "details" && (
          <div className="card space-y-4 p-6">
            <div>
              <Label>Instructor</Label>
              {loadingInstructors ? (
                <Skeleton className="mt-1 h-9 w-full" />
              ) : (
                <Select
                  value={watch("instructorId")}
                  onValueChange={(v) => setValue("instructorId", v, { shouldValidate: true })}
                >
                  <SelectTrigger className="mt-1 w-full">
                    <SelectValue placeholder="Select an instructor" />
                  </SelectTrigger>
                  <SelectContent>
                    {instructorsData?.data.map((u: any) => (
                      <SelectItem key={u.id} value={u.id}>
                        {u.name} ({u.email})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              {errors.instructorId && <p className="mt-1 text-sm text-destructive">{errors.instructorId.message}</p>}
            </div>

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
                <Select
                  value={watch("level")}
                  onValueChange={(v) => setValue("level", v as FormOutput["level"], { shouldValidate: true })}
                >
                  <SelectTrigger className="mt-1 w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="BEGINNER">Beginner</SelectItem>
                    <SelectItem value="INTERMEDIATE">Intermediate</SelectItem>
                    <SelectItem value="ADVANCED">Advanced</SelectItem>
                  </SelectContent>
                </Select>
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
              <Checkbox checked={watch("published")} onCheckedChange={(v) => setValue("published", !!v)} />
              Publish immediately — students can view and enroll right away
            </label>

            <div className="flex justify-end pt-2">
              <Button type="button" onClick={goToCurriculum}>
                Continue to curriculum <ArrowRight size={15} />
              </Button>
            </div>
          </div>
        )}

        {/* ---------------- Step 2: Curriculum (tree + editor) ---------------- */}
        {step === "curriculum" && (
          <div className="grid grid-cols-[280px_1fr] gap-4">
            {/* Tree navigator */}
            <div className="card flex max-h-[560px] flex-col overflow-hidden p-0">
              <div className="border-b border-border p-3">
                <Button type="button" size="sm" className="w-full" onClick={addModule}>
                  <Plus size={14} /> Add module
                </Button>
              </div>
              <div className="flex-1 space-y-1 overflow-y-auto p-2">
                {modules.length === 0 && (
                  <p className="p-3 text-center text-xs text-muted-foreground">
                    No modules yet. Add one to start building the curriculum.
                  </p>
                )}
                {modules.map((mod, mIdx) => (
                  <div key={mIdx}>
                    <button
                      type="button"
                      onClick={() => setSelection({ type: "module", moduleIdx: mIdx })}
                      className={`flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm transition-colors ${
                        selection?.type === "module" && selection.moduleIdx === mIdx
                          ? "bg-primary-soft text-primary"
                          : "text-foreground hover:bg-muted"
                      }`}
                    >
                      <FolderClosed size={14} className="shrink-0" />
                      <span className="truncate">{mod.title || `Untitled module ${mIdx + 1}`}</span>
                    </button>
                    <div className="ml-4 space-y-0.5 border-l border-border pl-2">
                      {mod.lessons.map((lesson, lIdx) => (
                        <button
                          key={lIdx}
                          type="button"
                          onClick={() => setSelection({ type: "lesson", moduleIdx: mIdx, lessonIdx: lIdx })}
                          className={`flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-xs transition-colors ${
                            selection?.type === "lesson" && selection.moduleIdx === mIdx && selection.lessonIdx === lIdx
                              ? "bg-primary-soft text-primary"
                              : "text-muted-foreground hover:bg-muted"
                          }`}
                        >
                          <FileText size={12} className="shrink-0" />
                          <span className="truncate">{lesson.title || `Untitled lesson ${lIdx + 1}`}</span>
                          {lesson.assignments.length > 0 && (
                            <span className="ml-auto flex shrink-0 items-center gap-0.5 text-[10px] text-muted-foreground">
                              <ClipboardList size={10} /> {lesson.assignments.length}
                            </span>
                          )}
                        </button>
                      ))}
                      <button
                        type="button"
                        onClick={() => addLesson(mIdx)}
                        className="flex w-full items-center gap-1.5 rounded-md px-2 py-1 text-left text-xs text-muted-foreground hover:bg-muted hover:text-foreground"
                      >
                        <Plus size={12} /> Add lesson
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Editor panel */}
            <div className="card min-h-[560px] p-6">
              {!selection ? (
                <div className="flex h-full flex-col items-center justify-center text-center text-muted-foreground">
                  <BookOpen size={28} className="mb-2 opacity-50" />
                  <p className="text-sm">Select a module or lesson to edit it here.</p>
                  <p className="text-xs">Or add your first module from the panel on the left.</p>
                </div>
              ) : selection.type === "module" ? (
                <ModuleEditor
                  key={selection.moduleIdx}
                  mod={modules[selection.moduleIdx]}
                  onChange={(key, value) => updateModule(selection.moduleIdx, key, value)}
                  onAddLesson={() => addLesson(selection.moduleIdx)}
                  onRemove={() => removeModule(selection.moduleIdx)}
                />
              ) : (
                <LessonEditor
                  key={`${selection.moduleIdx}-${selection.lessonIdx}`}
                  lesson={modules[selection.moduleIdx].lessons[selection.lessonIdx]}
                  onChange={(key, value) => updateLesson(selection.moduleIdx, selection.lessonIdx, key, value)}
                  onRemove={() => removeLesson(selection.moduleIdx, selection.lessonIdx)}
                  onAddAssignment={() => addAssignment(selection.moduleIdx, selection.lessonIdx)}
                  onRemoveAssignment={(assignmentIdx) =>
                    removeAssignment(selection.moduleIdx, selection.lessonIdx, assignmentIdx)
                  }
                  onChangeAssignment={(assignmentIdx, key, value) =>
                    updateAssignmentField(selection.moduleIdx, selection.lessonIdx, assignmentIdx, key, value)
                  }
                />
              )}
            </div>
          </div>
        )}

        {step === "curriculum" && (
          <div className="mt-4 flex items-center justify-between">
            <Button type="button" variant="outline" onClick={() => setStep("details")}>
              <ArrowLeft size={15} /> Back to details
            </Button>
            <Button type="button" onClick={() => setStep("review")}>
              Continue to review <ArrowRight size={15} />
            </Button>
          </div>
        )}

        {/* ---------------- Step 3: Review & publish ---------------- */}
        {step === "review" && (
          <div className="space-y-4">
            <div className="card space-y-3 p-6">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                  Course details
                </h2>
                <button type="button" onClick={() => setStep("details")} className="text-xs text-primary hover:underline">
                  Edit
                </button>
              </div>
              <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
                <div>
                  <p className="text-xs text-muted-foreground">Title</p>
                  <p className="font-medium text-foreground">{details.title || "—"}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Instructor</p>
                  <p className="font-medium text-foreground">{instructorName ?? "—"}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Category</p>
                  <p className="font-medium text-foreground">{details.category || "—"}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Level / Duration</p>
                  <p className="font-medium text-foreground">
                    {details.level} · {details.duration} min
                  </p>
                </div>
                <div className="col-span-2">
                  <p className="text-xs text-muted-foreground">Visibility</p>
                  <Badge
                    className={
                      details.published
                        ? "border-green-200 bg-green-50 text-green-700"
                        : "border-amber-200 bg-amber-50 text-amber-700"
                    }
                  >
                    {details.published ? "Publishes immediately" : "Saved as draft"}
                  </Badge>
                </div>
              </div>
            </div>

            <div className="card space-y-3 p-6">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                  Curriculum · {modules.filter((m) => m.title.trim()).length} modules, {totalLessons} lessons,{" "}
                  {totalAssignments} assignments
                </h2>
                <button type="button" onClick={() => setStep("curriculum")} className="text-xs text-primary hover:underline">
                  Edit
                </button>
              </div>
              {!curriculumReady ? (
                <p className="text-sm text-muted-foreground">No curriculum added — the course will be created empty.</p>
              ) : (
                <ul className="space-y-2">
                  {modules
                    .filter((m) => m.title.trim())
                    .map((mod, i) => (
                      <li key={i} className="rounded-md border border-border p-3">
                        <p className="text-sm font-medium text-foreground">{mod.title}</p>
                        {mod.lessons.filter((l) => l.title.trim()).length > 0 && (
                          <ul className="mt-1.5 space-y-0.5 pl-4 text-xs text-muted-foreground">
                            {mod.lessons
                              .filter((l) => l.title.trim())
                              .map((l, j) => (
                                <li key={j}>
                                  · {l.title}
                                  {l.assignments.filter((a) => a.title.trim()).length > 0 && (
                                    <span className="ml-1 inline-flex items-center gap-0.5">
                                      <ClipboardList size={10} /> {l.assignments.filter((a) => a.title.trim()).length}
                                    </span>
                                  )}
                                </li>
                              ))}
                          </ul>
                        )}
                      </li>
                    ))}
                </ul>
              )}
            </div>

            {progress && (
              <div className="card space-y-2 p-4">
                <div className="flex items-center gap-2 text-sm text-foreground">
                  <Loader2 size={14} className="animate-spin" /> {progress.label}
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full bg-primary transition-all"
                    style={{ width: `${(progress.current / progress.total) * 100}%` }}
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  {progress.current} of {progress.total} steps complete
                </p>
              </div>
            )}

            <div className="flex items-center justify-between">
              <Button type="button" variant="outline" onClick={() => setStep("curriculum")} disabled={!!progress}>
                <ArrowLeft size={15} /> Back to curriculum
              </Button>
              <div className="flex gap-3">
                <Button type="button" variant="outline" asChild>
                  <Link href="/courses">Cancel</Link>
                </Button>
                <Button type="submit" disabled={!!progress}>
                  {progress ? "Creating..." : "Create course"}
                </Button>
              </div>
            </div>
          </div>
        )}
      </form>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Editor panels                                                       */
/* ------------------------------------------------------------------ */

function ModuleEditor({
  mod,
  onChange,
  onAddLesson,
  onRemove,
}: {
  mod: ModuleInput;
  onChange: (key: keyof Omit<ModuleInput, "lessons">, value: string) => void;
  onAddLesson: () => void;
  onRemove: () => void;
}) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Module</h3>
        <Button type="button" variant="ghost" size="icon" onClick={onRemove} aria-label="Remove module">
          <Trash2 size={16} className="text-destructive" />
        </Button>
      </div>
      <div>
        <Label>Module title</Label>
        <Input className="mt-1" value={mod.title} onChange={(e) => onChange("title", e.target.value)} />
      </div>
      <div>
        <Label>Module description</Label>
        <Textarea className="mt-1" rows={3} value={mod.description} onChange={(e) => onChange("description", e.target.value)} />
      </div>
      <div className="border-t border-border pt-4">
        <p className="mb-2 text-xs text-muted-foreground">{mod.lessons.length} lesson(s) in this module</p>
        <Button type="button" variant="outline" size="sm" onClick={onAddLesson}>
          <Plus size={14} /> Add lesson
        </Button>
      </div>
    </div>
  );
}

function LessonEditor({
  lesson,
  onChange,
  onRemove,
  onAddAssignment,
  onRemoveAssignment,
  onChangeAssignment,
}: {
  lesson: LessonInput;
  onChange: (key: keyof Omit<LessonInput, "assignments">, value: string) => void;
  onRemove: () => void;
  onAddAssignment: () => void;
  onRemoveAssignment: (assignmentIdx: number) => void;
  onChangeAssignment: (assignmentIdx: number, key: keyof AssignmentInput, value: string) => void;
}) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Lesson</h3>
        <Button type="button" variant="ghost" size="icon" onClick={onRemove} aria-label="Remove lesson">
          <Trash2 size={16} className="text-destructive" />
        </Button>
      </div>
      <div>
        <Label>Lesson title</Label>
        <Input className="mt-1" value={lesson.title} onChange={(e) => onChange("title", e.target.value)} />
      </div>
      <div>
        <Label>Lesson description</Label>
        <Input className="mt-1" value={lesson.description} onChange={(e) => onChange("description", e.target.value)} />
      </div>
      <div>
        <Label>Lesson content</Label>
        <Textarea className="mt-1" rows={4} value={lesson.content} onChange={(e) => onChange("content", e.target.value)} />
      </div>
      <div>
        <Label>Video URL</Label>
        <Input className="mt-1" value={lesson.videoUrl} onChange={(e) => onChange("videoUrl", e.target.value)} />
      </div>

      {/* One assignment per lesson: hide "Add assignment" once one exists,
          only show it again if it's removed. */}
      <div className="border-t border-border pt-4">
        <div className="mb-2 flex items-center justify-between">
          <p className="text-xs font-medium text-muted-foreground">
            {lesson.assignments.length > 0 ? "Assignment on this lesson" : "No assignment on this lesson yet"}
          </p>
          {lesson.assignments.length === 0 && (
            <Button type="button" variant="outline" size="sm" onClick={onAddAssignment}>
              <Plus size={14} /> Add assignment
            </Button>
          )}
        </div>

        {lesson.assignments.length > 0 && (
          <div className="space-y-3">
            {lesson.assignments.map((assignment, idx) => (
              <div key={idx} className="space-y-2 rounded-md border border-border bg-muted/30 p-3">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                    <ClipboardList size={12} /> Assignment {idx + 1}
                  </span>
                  <button
                    type="button"
                    onClick={() => onRemoveAssignment(idx)}
                    className="rounded p-1 text-destructive hover:bg-destructive/10"
                    aria-label={`Remove assignment ${idx + 1}`}
                  >
                    <Trash2 size={13} />
                  </button>
                </div>

                <div>
                  <Label>Title</Label>
                  <Input
                    className="mt-1"
                    value={assignment.title}
                    onChange={(e) => onChangeAssignment(idx, "title", e.target.value)}
                  />
                </div>
                <div>
                  <Label>Description</Label>
                  <Textarea
                    className="mt-1"
                    rows={2}
                    value={assignment.description}
                    onChange={(e) => onChangeAssignment(idx, "description", e.target.value)}
                  />
                </div>
                <div>
                  <Label>Instructions (optional)</Label>
                  <Textarea
                    className="mt-1"
                    rows={2}
                    value={assignment.instructions}
                    onChange={(e) => onChangeAssignment(idx, "instructions", e.target.value)}
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Due date</Label>
                    <Input
                      className="mt-1"
                      type="date"
                      value={assignment.dueDate}
                      onChange={(e) => onChangeAssignment(idx, "dueDate", e.target.value)}
                    />
                  </div>
                  <div>
                    <Label>Max score</Label>
                    <Input
                      className="mt-1"
                      type="number"
                      value={assignment.maxScore}
                      onChange={(e) => onChangeAssignment(idx, "maxScore", e.target.value)}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}