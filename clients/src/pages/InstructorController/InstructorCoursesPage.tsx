import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Link, Navigate } from "react-router";
import { Plus, BookOpen } from "lucide-react";
import toast from "react-hot-toast";
import { useListCoursesQuery, useCreateCourseMutation } from "../../store/api/apiSlice";
import { useAppSelector } from "../../hooks/redux";

import { EmptyState } from "../../components/EmptyState";
import { Badge } from "../../components/Badge";
import { Modal } from "../../components/ui/Modal";
import { Input } from "../../components/ui/Input";
import { Select } from "../../components/ui/Select";
import { Button } from "../../components/ui/Button";
import { Skeleton } from "../../components/Skeleton";

const schema = z.object({
  title: z.string().min(3),
  description: z.string().min(10),
  category: z.string().min(2),
  level: z.enum(["BEGINNER", "INTERMEDIATE", "ADVANCED"]),
  duration: z.coerce.number().int().nonnegative(),
});

type FormInput = z.input<typeof schema>;
type FormOutput = z.output<typeof schema>;

function NewCourseModal({ onClose }: { onClose: () => void }) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormInput, any, FormOutput>({
    resolver: zodResolver(schema),
    defaultValues: { level: "BEGINNER", duration: 300 },
  });
  const [createCourse, { isLoading }] = useCreateCourseMutation();

  async function onSubmit(values: FormOutput) {
    try {
      await createCourse(values).unwrap();
      toast.success("Course created");
      onClose();
    } catch (e: any) {
      toast.error(e?.data?.message ?? "Failed to create course");
    }
  }

  return (
    <Modal open onClose={onClose} title="Create Course">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
        <Input label="Title" id="title" {...register("title")} error={errors.title?.message} />
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
        <div className="grid grid-cols-2 gap-3">
          <Input label="Category" id="category" {...register("category")} error={errors.category?.message} />
          <Select label="Level" id="level" {...register("level")}>
            <option value="BEGINNER">Beginner</option>
            <option value="INTERMEDIATE">Intermediate</option>
            <option value="ADVANCED">Advanced</option>
          </Select>
        </div>
        <Input
          label="Duration (minutes)"
          id="duration"
          type="number"
          {...register("duration")}
          error={errors.duration?.message}
        />
        <Button type="submit" loading={isLoading} className="w-full">
          Create course
        </Button>
      </form>
    </Modal>
  );
}

const InstructorCoursesPage = () => {
  const [showModal, setShowModal] = useState(false);
  const role = useAppSelector((s) => s.auth.user?.role);
  const { data, isLoading } = useListCoursesQuery({ limit: 50 });
  const courses = data?.data;

  // Instructor-only page — send anyone else back to the dashboard.
  if (role !== "INSTRUCTOR") {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="space-y-lg animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-on-surface">My Courses</h1>
          <p className="text-sm text-outline">Create and manage your courses.</p>
        </div>
        <Button onClick={() => setShowModal(true)}>
          <Plus className="w-4 h-4" /> New course
        </Button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 gap-md sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-40" />
          ))}
        </div>
      ) : !courses?.length ? (
        <EmptyState
          icon={BookOpen}
          title="No courses yet"
          description="Create your first course to get started."
          action={<Button onClick={() => setShowModal(true)}>Create course</Button>}
        />
      ) : (
        <div className="grid grid-cols-1 gap-md sm:grid-cols-2 lg:grid-cols-3">
          {courses.map((c: any) => (
            <Link
              key={c.id}
              to={`/courses/${c.id}`}
              className="bg-surface-container-lowest border border-outline-variant shadow-sm rounded-xl p-md transition hover:-translate-y-0.5 hover:shadow-md"
            >
              <div className="mb-2 flex items-center justify-between">
                <Badge variant={c.published ? "success" : "warning"}>
                  {c.published ? "Published" : "Draft"}
                </Badge>
                <span className="text-xs text-outline">{c._count?.enrollments ?? 0} students</span>
              </div>
              <h3 className="font-semibold text-on-surface">{c.title}</h3>
              <p className="mt-1 line-clamp-2 text-sm text-outline">{c.description}</p>
            </Link>
          ))}
        </div>
      )}

      {showModal && <NewCourseModal onClose={() => setShowModal(false)} />}
    </div>
  );
};

export default InstructorCoursesPage;