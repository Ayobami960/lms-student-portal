"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import toast from "react-hot-toast";

import { useGetCourseQuery, useUpdateCourseMutation } from "@/store/api/apiSlice";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

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

export default function AdminCourseEditPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const { data, isLoading, isError } = useGetCourseQuery(id, { skip: !id });
  const course = data?.data;
  const [updateCourse, { isLoading: isSaving }] = useUpdateCourseMutation();

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

      <form onSubmit={handleSubmit(onSubmit)} className="card space-y-5 p-6">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-foreground">Title</label>
            <Input className="mt-1" {...register("title")} />
            {errors.title && <p className="mt-1 text-sm text-destructive">{errors.title.message}</p>}
          </div>
          <div>
            <label className="text-sm font-medium text-foreground">Category</label>
            <Input className="mt-1" {...register("category")} />
            {errors.category && <p className="mt-1 text-sm text-destructive">{errors.category.message}</p>}
          </div>
        </div>

        <div>
          <label className="text-sm font-medium text-foreground">Description</label>
          <Textarea className="mt-1" rows={4} {...register("description")} />
          {errors.description && <p className="mt-1 text-sm text-destructive">{errors.description.message}</p>}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-foreground">Level</label>
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
            <label className="text-sm font-medium text-foreground">Duration (min)</label>
            <Input className="mt-1" type="number" {...register("duration")} />
            {errors.duration && <p className="mt-1 text-sm text-destructive">{errors.duration.message}</p>}
          </div>
        </div>

        <div>
          <label className="text-sm font-medium text-foreground">Thumbnail URL</label>
          <Input className="mt-1" {...register("thumbnail")} />
        </div>

        <label className="flex items-center gap-2 text-sm text-foreground">
          <Checkbox {...register("published")} />
          Published — visible to students for enrollment
        </label>

        <div className="flex gap-3 pt-2">
          <Button type="submit" disabled={isSaving}>
            {isSaving ? "Saving..." : "Save changes"}
          </Button>
          <Button type="button" variant="outline" asChild>
            <Link href="/courses">Cancel</Link>
          </Button>
        </div>
      </form>

      {course.modules?.length > 0 && (
        <section className="card space-y-2 p-6">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Modules & lessons
          </h2>
          <div className="space-y-2">
            {course.modules.map((mod: any) => (
              <div key={mod.id} className="rounded-md border border-border p-3">
                <p className="font-medium text-foreground">{mod.title}</p>
                {mod.lessons?.length > 0 && (
                  <ul className="mt-1 list-disc pl-5 text-sm text-muted-foreground">
                    {mod.lessons.map((l: any) => (
                      <li key={l.id}>{l.title}</li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
          <p className="text-xs text-muted-foreground">
            Module and lesson content is managed by the instructor — this view is read-only for admins.
          </p>
        </section>
      )}
    </div>
  );
}