import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Trash2 } from "lucide-react";
import toast from "react-hot-toast";
import {
  useCreateCourseMutation,
  useCreateModuleMutation,
  useCreateLessonMutation,
} from "../store/api/apiSlice";


import { Input } from "./ui/Input";
import { Select } from "./ui/Select";
import { Button } from "./ui/Button";
import Modal from "./ui/Modal";


const schema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  category: z.string().min(2, "Category is required"),
  level: z.enum(["BEGINNER", "INTERMEDIATE", "ADVANCED"]),
  duration: z.coerce.number().int().nonnegative(),
  thumbnail: z.string().optional(),
  published: z.boolean(), // NEW
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

const emptyLesson = (): LessonInput => ({
  title: "",
  description: "",
  content: "",
  videoUrl: "",
});

const emptyModule = (): ModuleInput => ({
  title: "",
  description: "",
  lessons: [emptyLesson()],
});

interface NewCourseModalProps {
  onClose: () => void;
}

export function NewCourseModal({ onClose }: NewCourseModalProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormInput, any, FormOutput>({
    resolver: zodResolver(schema),
    defaultValues: { level: "BEGINNER", duration: 300, published: false },
  });

  const [createCourse, { isLoading: creatingCourse }] = useCreateCourseMutation();
  const [createModule] = useCreateModuleMutation();
  const [createLesson] = useCreateLessonMutation();

  const [modules, setModules] = useState<ModuleInput[]>([emptyModule()]);
  const [submitting, setSubmitting] = useState(false);

  // ---- module handlers ----
  function addModule() {
    setModules((m) => [...m, emptyModule()]);
  }
  function removeModule(idx: number) {
    setModules((m) => m.filter((_, i) => i !== idx));
  }
  function updateModule(idx: number, key: keyof ModuleInput, value: string) {
    setModules((m) => m.map((mod, i) => (i === idx ? { ...mod, [key]: value } : mod)));
  }

  // ---- lesson handlers ----
  function addLesson(moduleIdx: number) {
    setModules((m) =>
      m.map((mod, i) => (i === moduleIdx ? { ...mod, lessons: [...mod.lessons, emptyLesson()] } : mod))
    );
  }
  function removeLesson(moduleIdx: number, lessonIdx: number) {
    setModules((m) =>
      m.map((mod, i) =>
        i === moduleIdx ? { ...mod, lessons: mod.lessons.filter((_, j) => j !== lessonIdx) } : mod
      )
    );
  }
  function updateLesson(moduleIdx: number, lessonIdx: number, key: keyof LessonInput, value: string) {
    setModules((m) =>
      m.map((mod, i) =>
        i === moduleIdx
          ? { ...mod, lessons: mod.lessons.map((l, j) => (j === lessonIdx ? { ...l, [key]: value } : l)) }
          : mod
      )
    );
  }

  async function onSubmit(values: FormOutput) {
    setSubmitting(true);
    try {
      // 1. create the course shell
      const courseRes = await createCourse(values).unwrap();
      const courseId = courseRes.data.id;

      // 2. create each module, then its lessons, in order
      for (let i = 0; i < modules.length; i++) {
        const mod = modules[i];
        if (!mod.title.trim()) continue; // skip untouched blank modules

        const moduleRes = await createModule({
          courseId,
          data: { title: mod.title, description: mod.description, order: i + 1 },
        }).unwrap();
        const moduleId = moduleRes.data.id;

        for (let j = 0; j < mod.lessons.length; j++) {
          const lesson = mod.lessons[j];
          if (!lesson.title.trim()) continue; // skip untouched blank lessons

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

     

      toast.success("Course created");
      onClose();
    } catch (e: any) {
      toast.error(e?.data?.message ?? "Failed to create course");
    } finally {
      setSubmitting(false);
    }
  }

  const isLoading = creatingCourse || submitting;

  return (
    <Modal open onClose={onClose} title="Create course" description="Set up the course, then add modules and lessons." size="lg">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        {/* --- Course details --- */}
        <section className="space-y-3">
          <h3 className="text-sm font-semibold text-on-surface-variant uppercase tracking-wide">
            Course details
          </h3>

          <div className="grid grid-cols-2 gap-3">
            <Input label="Title" id="title" {...register("title")} error={errors.title?.message} />
            {/* <Input label="Slug" id="slug" {...register("slug")} error={errors.slug?.message} /> */}
          </div>

          <div>
            <label className="text-sm font-medium text-on-surface-variant">Description</label>
            <textarea
              className="mt-1 w-full rounded-lg border border-outline-variant bg-surface-container px-3 py-2 text-sm text-on-surface focus:outline-none focus:ring-1 focus:ring-primary"
              rows={3}
              {...register("description")}
            />
            {errors.description && (
              <p className="mt-1 text-sm text-red-500">{errors.description.message}</p>
            )}
          </div>

          <div className="grid grid-cols-3 gap-3">
            <Input label="Category" id="category" {...register("category")} error={errors.category?.message} />
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
        </section>

        {/* --- Modules & lessons --- */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-on-surface-variant uppercase tracking-wide">
              Modules & lessons
            </h3>
            <button type="button" onClick={addModule} className="btn-secondary text-xs px-3 py-1.5">
              <Plus size={14} /> Add module
            </button>
          </div>

          {modules.map((mod, mIdx) => (
            <div key={mIdx} className="card p-4 space-y-3 bg-surface-container">
              <div className="flex items-start justify-between gap-4">
                <span className="mt-2.5 text-xs font-medium text-on-surface-variant">
                  Module {mIdx + 1}
                </span>
                {modules.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeModule(mIdx)}
                    className="rounded-md p-1.5 text-on-surface-variant hover:bg-surface-container-high"
                    aria-label="Remove module"
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <input
                  className="input"
                  placeholder="Module title"
                  value={mod.title}
                  onChange={(e) => updateModule(mIdx, "title", e.target.value)}
                />
                <input
                  className="input"
                  placeholder="Module description"
                  value={mod.description}
                  onChange={(e) => updateModule(mIdx, "description", e.target.value)}
                />
              </div>

              <div className="space-y-2 pl-4 border-l-2 border-outline-variant">
                {mod.lessons.map((lesson, lIdx) => (
                  <div key={lIdx} className="card p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-on-surface-variant">
                        Lesson {lIdx + 1}
                      </span>
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
                      onChange={(e) => updateLesson(mIdx, lIdx, "title", e.target.value)}
                    />
                    <input
                      className="input"
                      placeholder="Lesson description"
                      value={lesson.description}
                      onChange={(e) => updateLesson(mIdx, lIdx, "description", e.target.value)}
                    />
                    <textarea
                      className="input"
                      rows={2}
                      placeholder="Lesson content"
                      value={lesson.content}
                      onChange={(e) => updateLesson(mIdx, lIdx, "content", e.target.value)}
                    />
                    <input
                      className="input"
                      placeholder="Video URL"
                      value={lesson.videoUrl}
                      onChange={(e) => updateLesson(mIdx, lIdx, "videoUrl", e.target.value)}
                    />
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => addLesson(mIdx)}
                  className="btn-secondary text-xs px-3 py-1.5"
                >
                  <Plus size={14} /> Add lesson
                </button>
              </div>

              <label className="flex items-center gap-2 text-sm text-on-surface">
                <input type="checkbox" className="h-4 w-4 rounded border-outline-variant" {...register("published")} />
                Publish immediately — students can view and enroll right away
              </label>

            </div>
          ))}
        </section>

        <Button type="submit" loading={isLoading} className="w-full">
          {isLoading ? "Creating..." : "Create course"}
        </Button>
      </form>
    </Modal>
  );
}

export default NewCourseModal;