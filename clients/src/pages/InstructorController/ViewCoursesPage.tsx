import { Link, Navigate, useNavigate, useParams } from "react-router";
import { ArrowLeft, Pencil, Users, Clock, Star } from "lucide-react";
import { useGetCourseQuery } from "../../store/api/apiSlice";
import { useAppSelector } from "../../hooks/redux";

import { Badge } from "../../components/Badge";
import { Button } from "../../components/ui/Button";
import { Skeleton } from "../../components/Skeleton";

const ViewCoursesPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const user = useAppSelector((s) => s.auth.user);

  const { data, isLoading, isError } = useGetCourseQuery(id!, { skip: !id });
  const course = data?.data;

  // Instructor-only page.
  if (user?.role !== "INSTRUCTOR" && user?.role !== "ADMIN") {
    return <Navigate to="/dashboard" replace />;
  }

  if (isLoading) {
    return (
      <div className="space-y-4 animate-fade-in">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-56" />
        <Skeleton className="h-40" />
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

  // Only the owning instructor (or an admin) can view this here — this is
  // the instructor's own "look at my course" page, not the public one.
  const isOwner = user?.role === "ADMIN" || course.instructorId === user?.id;
  if (!isOwner) {
    return <Navigate to="/my-courses" replace />;
  }

  return (
    <div className="max-w-3xl space-y-lg animate-fade-in">
      <button
        type="button"
        onClick={() => navigate("/my-courses")}
        className="flex items-center gap-1.5 text-sm text-on-surface-variant hover:text-on-surface"
      >
        <ArrowLeft size={16} /> Back to my courses
      </button>

      {course.thumbnail && (
        <img
          src={course.thumbnail}
          alt=""
          className="h-56 w-full rounded-xl border border-outline-variant object-cover"
        />
      )}

      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="mb-2 flex items-center gap-2">
            <Badge variant={course.published ? "success" : "warning"}>
              {course.published ? "Published" : "Draft"}
            </Badge>
            <span className="text-xs text-outline">{course.category}</span>
          </div>
          <h1 className="text-2xl font-semibold text-on-surface">{course.title}</h1>
          <p className="mt-1 text-sm text-outline">/{course.slug}</p>
        </div>
        <Link to={`/my-courses/${course.id}`}>
          <Button>
            <Pencil size={14} /> Edit
          </Button>
        </Link>
      </div>

      <p className="text-sm text-on-surface">{course.description}</p>

      <div className="flex flex-wrap gap-4 text-sm text-on-surface-variant">
        <span className="flex items-center gap-1.5">
          <Users size={15} /> {course._count?.enrollments ?? 0} students
        </span>
        <span className="flex items-center gap-1.5">
          <Clock size={15} /> {course.duration} min
        </span>
        {course.rating > 0 && (
          <span className="flex items-center gap-1.5">
            <Star size={15} /> {course.rating.toFixed(1)}
          </span>
        )}
        <Badge>{course.level}</Badge>
      </div>

      <section className="space-y-3 border-t border-outline-variant pt-6">
        <h2 className="text-sm font-semibold text-on-surface-variant uppercase tracking-wide">
          Modules & lessons
        </h2>

        {!course.modules?.length ? (
          <p className="text-sm text-outline">No modules yet.</p>
        ) : (
          <div className="space-y-2">
            {course.modules.map((mod: any) => (
              <div key={mod.id} className="card p-3 bg-surface-container">
                <p className="font-medium text-on-surface">{mod.title}</p>
                {mod.description && <p className="text-sm text-outline">{mod.description}</p>}
                {mod.lessons?.length > 0 && (
                  <ul className="mt-2 space-y-1 pl-4 text-sm text-on-surface-variant list-disc">
                    {mod.lessons.map((lesson: any) => (
                      <li key={lesson.id}>{lesson.title}</li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default ViewCoursesPage;