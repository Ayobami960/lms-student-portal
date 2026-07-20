import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Navigate, useNavigate, useParams } from "react-router";
import { ArrowLeft, Plus, Trash2, Pencil, Check, X } from "lucide-react";
import toast from "react-hot-toast";
import {
  useGetCourseQuery,
  useUpdateCourseMutation,
  useCreateModuleMutation,
  useCreateLessonMutation,
  useUpdateLessonMutation,
} from "../../store/api/apiSlice";
import { useAppSelector } from "../../hooks/redux";

import { Input } from "../../components/ui/Input";
import { Select } from "../../components/ui/Select";
import { Button } from "../../components/ui/Button";
import { Skeleton } from "../../components/Skeleton";

// Slug isn't editable here — it's assigned once at creation (see
// course.service.ts#create) and the update endpoint doesn't accept it.
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

interface LessonInput {
  title: string;
  description: string;
  content: string;
  videoUrl: string;
}

interface ModuleInput {
  title: string;
  description: string;
  lessons: LessonInput[];
}

const emptyLesson = (): LessonInput => ({ title: "", description: "", content: "", videoUrl: "" });
const emptyModule = (): ModuleInput => ({ title: "", description: "", lessons: [emptyLesson()] });

const CourseEditPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const user = useAppSelector((s) => s.auth.user);

  const { data, isLoading, isError, refetch } = useGetCourseQuery(id!, { skip: !id });
  const course = data?.data;
  const [updateCourse, { isLoading: isSaving }] = useUpdateCourseMutation();
  const [createModule] = useCreateModuleMutation();
  const [createLesson] = useCreateLessonMutation();
  const [updateLesson, { isLoading: isSavingLesson }] = useUpdateLessonMutation();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormInput, any, FormOutput>({
    resolver: zodResolver(schema),
  });

  // Populate the form once the course has loaded — defaultValues can't be
  // set synchronously since the fetch is async.
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

  // ---- editing an existing lesson inline ----
  const [editingLesson, setEditingLesson] = useState<
    { id: string; title: string; description: string; content: string; videoUrl: string } | null
  >(null);

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
    if (!editingLesson || !id) return;
    try {
      const { id: lessonId, ...data } = editingLesson;
      await updateLesson({ id: lessonId, courseId: id, data }).unwrap();
      toast.success("Lesson updated");
      setEditingLesson(null);
    } catch (e: any) {
      toast.error(e?.data?.message ?? "Failed to update lesson");
    }
  }

  
  const [newModules, setNewModules] = useState<ModuleInput[]>([]);
  const [savingModules, setSavingModules] = useState(false);

  function addModule() {
    setNewModules((m) => [...m, emptyModule()]);
  }
  function removeModule(idx: number) {
    setNewModules((m) => m.filter((_, i) => i !== idx));
  }
  function updateModuleField(idx: number, key: keyof ModuleInput, value: string) {
    setNewModules((m) => m.map((mod, i) => (i === idx ? { ...mod, [key]: value } : mod)));
  }
  function addLesson(moduleIdx: number) {
    setNewModules((m) =>
      m.map((mod, i) => (i === moduleIdx ? { ...mod, lessons: [...mod.lessons, emptyLesson()] } : mod))
    );
  }
  function removeLesson(moduleIdx: number, lessonIdx: number) {
    setNewModules((m) =>
      m.map((mod, i) =>
        i === moduleIdx ? { ...mod, lessons: mod.lessons.filter((_, j) => j !== lessonIdx) } : mod
      )
    );
  }
  function updateLessonField(moduleIdx: number, lessonIdx: number, key: keyof LessonInput, value: string) {
    setNewModules((m) =>
      m.map((mod, i) =>
        i === moduleIdx
          ? { ...mod, lessons: mod.lessons.map((l, j) => (j === lessonIdx ? { ...l, [key]: value } : l)) }
          : mod
      )
    );
  }

  async function saveNewModules() {
    if (!id || newModules.length === 0) return;
    setSavingModules(true);
    try {
      const existingCount = course?.modules?.length ?? 0;
      for (let i = 0; i < newModules.length; i++) {
        const mod = newModules[i];
        if (!mod.title.trim()) continue; 

        const moduleRes = await createModule({
          courseId: id,
          data: { title: mod.title, description: mod.description, order: existingCount + i + 1 },
        }).unwrap();
        const moduleId = moduleRes.data.id;

        for (let j = 0; j < mod.lessons.length; j++) {
          const lesson = mod.lessons[j];
          if (!lesson.title.trim()) continue; 

          await createLesson({
            moduleId,
            data: {
              title: lesson.title,
              description: lesson.description,
              content: lesson.content,
              videoUrl: lesson.videoUrl,
              order: j + 1,
            },
          }).unwrap();
        }
      }

      toast.success("Modules added");
      setNewModules([]);
      refetch(); 
      
    } catch (e: any) {
      toast.error(e?.data?.message ?? "Failed to add modules");
    } finally {
      setSavingModules(false);
    }
  }

  // Instructor-only page.
  if (user?.role !== "INSTRUCTOR" && user?.role !== "ADMIN") {
    return <Navigate to="/dashboard" replace />;
  }

  if (isLoading) {
    return (
      <div className="space-y-4 animate-fade-in">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-96" />
      </div>
    );
  }

  if (isError || !course) {
    return (
      <div className="animate-fade-in text-center py-xl">
        <h1 className="text-xl font-semibold text-on-surface">Course not found</h1>
        <p className="mt-1 text-sm text-outline">It may have been deleted, or the link is incorrect.</p>
        <Button className="mt-4" onClick={() => navigate("/my-courses")}>
          Back to my courses
        </Button>
      </div>
    );
  }

  
  const isOwner = user?.role === "ADMIN" || course.instructorId === user?.id;
  if (!isOwner) {
    return <Navigate to="/my-courses" replace />;
  }

  async function onSubmit(values: FormOutput) {
    try {
      await updateCourse({ id: id!, data: values }).unwrap();
      toast.success("Course updated");
    } catch (e: any) {
      toast.error(e?.data?.message ?? "Failed to update course");
    }
  }

  return (
    <div className="w-full space-y-lg animate-fade-in">
      <button
        type="button"
        onClick={() => navigate("/my-courses")}
        className="flex items-center gap-1.5 text-sm text-on-surface-variant hover:text-on-surface"
      >
        <ArrowLeft size={16} /> Back to my courses
      </button>

      <div>
        <h1 className="text-2xl font-semibold text-on-surface">Edit course</h1>
        <p className="text-sm text-outline">/{course.slug}</p>
      </div>

      {/* --- Course details --- */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-2 gap-3">
          <Input label="Title" id="title" {...register("title")} error={errors.title?.message} />
          <Input label="Category" id="category" {...register("category")} error={errors.category?.message} />
        </div>

        <div>
          <label className="text-sm font-medium text-on-surface-variant">Description</label>
          <textarea
            className="mt-1 w-full rounded-lg border border-outline-variant bg-surface-container px-3 py-2 text-sm text-on-surface focus:outline-none focus:ring-1 focus:ring-primary"
            rows={4}
            {...register("description")}
          />
          {errors.description && <p className="mt-1 text-sm text-red-500">{errors.description.message}</p>}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Select label="Level" id="level" {...register("level")}>
            <option value="BEGINNER">Beginner</option>
            <option value="INTERMEDIATE">Intermediate</option>
            <option value="ADVANCED">Advanced</option>
          </Select>
          <Input
            label="Duration (min)"
            id="duration"
            type="number"
            {...register("duration")}
            error={errors.duration?.message}
          />
        </div>

        <Input label="Thumbnail URL" id="thumbnail" {...register("thumbnail")} />

       

        
      </form>

      {/* --- Existing modules & lessons (read-only for now) --- */}
      <section className="space-y-3 border-t border-outline-variant pt-6">
        <h2 className="text-sm font-semibold text-on-surface-variant uppercase tracking-wide">
          Existing modules & lessons
        </h2>

        {!course.modules?.length ? (
          <p className="text-sm text-outline">No modules yet — add one below.</p>
        ) : (
          <div className="space-y-2">
            {course.modules.map((mod: any) => (
              <div key={mod.id} className="card p-3 bg-surface-container">
                <p className="font-medium text-on-surface">{mod.title}</p>
                {mod.description && <p className="text-sm text-outline">{mod.description}</p>}
                {mod.lessons?.length > 0 && (
                  <ul className="mt-2 space-y-2">
                    {mod.lessons.map((lesson: any) =>
                      editingLesson && editingLesson.id === lesson.id ? (
                        <li key={lesson.id} className="card p-3 space-y-2 bg-surface-container-lowest">
                          <input
                            className="input"
                            placeholder="Lesson title"
                            value={editingLesson.title}
                            onChange={(e) => setEditingLesson({ ...editingLesson, title: e.target.value })}
                          />
                          <input
                            className="input"
                            placeholder="Lesson description"
                            value={editingLesson.description}
                            onChange={(e) => setEditingLesson({ ...editingLesson, description: e.target.value })}
                          />
                          <textarea
                            className="input"
                            rows={2}
                            placeholder="Lesson content"
                            value={editingLesson.content}
                            onChange={(e) => setEditingLesson({ ...editingLesson, content: e.target.value })}
                          />
                          <input
                            className="input"
                            placeholder="Video URL"
                            value={editingLesson.videoUrl}
                            onChange={(e) => setEditingLesson({ ...editingLesson, videoUrl: e.target.value })}
                          />
                          <div className="flex gap-2">
                            <Button onClick={saveEditLesson} loading={isSavingLesson} className="text-xs px-3 py-1.5">
                              <Check size={14} /> Save
                            </Button>
                            <Button
                              type="button"
                              variant="secondary"
                              onClick={() => setEditingLesson(null)}
                              disabled={isSavingLesson}
                              className="text-xs px-3 py-1.5"
                            >
                              <X size={14} /> Cancel
                            </Button>
                          </div>
                        </li>
                      ) : (
                        <li
                          key={lesson.id}
                          className="flex items-center justify-between gap-2 pl-4 text-sm text-on-surface-variant"
                        >
                          <span className="list-item list-disc">{lesson.title}</span>
                          <button
                            type="button"
                            onClick={() => startEditLesson(lesson)}
                            aria-label={`Edit ${lesson.title}`}
                            className="shrink-0 rounded-md p-1 text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface"
                          >
                            <Pencil size={13} />
                          </button>
                        </li>
                      )
                    )}
                  </ul>
                )}
              </div>
            ))}
          </div>
        )}
        <p className="text-xs text-outline">
          Modules can't be renamed or deleted yet, and lessons can't be deleted or reordered — that
          still needs its own backend routes.
        </p>
      </section>

      {/* --- Add new modules & lessons --- */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-on-surface-variant uppercase tracking-wide">
            Add modules & lessons
          </h2>
          <button type="button" onClick={addModule} className="btn-secondary text-xs px-3 py-1.5">
            <Plus size={14} /> Add module
          </button>
        </div>

        {newModules.map((mod, mIdx) => (
          <div key={mIdx} className="card p-4 space-y-3 bg-surface-container">
            <div className="flex items-start justify-between gap-4">
              <span className="mt-2.5 text-xs font-medium text-on-surface-variant">New module {mIdx + 1}</span>
              <button
                type="button"
                onClick={() => removeModule(mIdx)}
                className="rounded-md p-1.5 text-on-surface-variant hover:bg-surface-container-high"
                aria-label="Remove module"
              >
                <Trash2 size={16} />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <input
                className="input"
                placeholder="Module title"
                value={mod.title}
                onChange={(e) => updateModuleField(mIdx, "title", e.target.value)}
              />
              <input
                className="input"
                placeholder="Module description"
                value={mod.description}
                onChange={(e) => updateModuleField(mIdx, "description", e.target.value)}
              />
            </div>

            <div className="space-y-2 pl-4 border-l-2 border-outline-variant">
              {mod.lessons.map((lesson, lIdx) => (
                <div key={lIdx} className="card p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-on-surface-variant">Lesson {lIdx + 1}</span>
                    {mod.lessons.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeLesson(mIdx, lIdx)}
                        className="rounded-md p-1 text-on-surface-variant hover:bg-surface-container-high"
                        aria-label="Remove lesson"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                  <input
                    className="input"
                    placeholder="Lesson title"
                    value={lesson.title}
                    onChange={(e) => updateLessonField(mIdx, lIdx, "title", e.target.value)}
                  />
                  <input
                    className="input"
                    placeholder="Lesson description"
                    value={lesson.description}
                    onChange={(e) => updateLessonField(mIdx, lIdx, "description", e.target.value)}
                  />
                  <textarea
                    className="input"
                    rows={2}
                    placeholder="Lesson content"
                    value={lesson.content}
                    onChange={(e) => updateLessonField(mIdx, lIdx, "content", e.target.value)}
                  />
                  <input
                    className="input"
                    placeholder="Video URL"
                    value={lesson.videoUrl}
                    onChange={(e) => updateLessonField(mIdx, lIdx, "videoUrl", e.target.value)}
                  />
                </div>
              ))}
              <button type="button" onClick={() => addLesson(mIdx)} className="btn-secondary text-xs px-3 py-1.5">
                <Plus size={14} /> Add lesson
              </button>
            </div>
          </div>
        ))}

        {newModules.length > 0 && (
          <Button type="button" onClick={saveNewModules} loading={savingModules}>
            Save new modules
          </Button>
        )}
      </section>


       <label className="flex items-center gap-2 text-sm text-on-surface">
          <input type="checkbox" className="h-4 w-4 rounded border-outline-variant" {...register("published")} />
          Published — visible to students for enrollment
        </label>


      <div className="flex gap-3">
          <Button type="submit" loading={isSaving}>
            Save changes
          </Button>
          <Button type="button" variant="secondary" onClick={() => navigate("/my-courses")}>
            Cancel
          </Button>
        </div>
    </div>
  );
};

export default CourseEditPage;