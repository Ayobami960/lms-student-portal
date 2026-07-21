"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import toast from "react-hot-toast";

import { useCreateCourseMutation, useListUsersQuery } from "@/store/api/apiSlice";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";

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

export default function AdminCreateCoursePage() {
  const router = useRouter();
  const { data: instructorsData, isLoading: loadingInstructors } = useListUsersQuery({ role: "INSTRUCTOR", limit: 100 });
  const [createCourse, { isLoading: isSaving }] = useCreateCourseMutation();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormInput, any, FormOutput>({
    resolver: zodResolver(schema),
    defaultValues: { level: "BEGINNER", duration: 0, published: false },
  });

  async function onSubmit(values: FormOutput) {
    try {
      const res = await createCourse(values).unwrap();
      toast.success("Course created");
      router.push(`/courses`);
    } catch (e: any) {
      toast.error(e?.data?.message ?? "Failed to create course");
    }
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

      <div>
        <h1 className="text-2xl font-bold text-foreground">New course</h1>
        <p className="text-sm text-muted-foreground">Create a course on behalf of an instructor.</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="card space-y-5 p-6">
        <div>
          <label className="text-sm font-medium text-foreground">Instructor</label>
          {loadingInstructors ? (
            <Skeleton className="mt-1 h-9 w-full" />
          ) : (
            <select
              className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground"
              {...register("instructorId")}
              defaultValue=""
            >
              <option value="" disabled>
                Select an instructor
              </option>
              {instructorsData?.data.map((u: any) => (
                <option key={u.id} value={u.id}>
                  {u.name} ({u.email})
                </option>
              ))}
            </select>
          )}
          {errors.instructorId && <p className="mt-1 text-sm text-destructive">{errors.instructorId.message}</p>}
        </div>

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
          Publish immediately
        </label>

        <div className="flex gap-3 pt-2">
          <Button type="submit" disabled={isSaving}>
            {isSaving ? "Creating..." : "Create course"}
          </Button>
          <Button type="button" variant="outline" asChild>
            <Link href="/courses">Cancel</Link>
          </Button>
        </div>
      </form>
    </div>
  );
}