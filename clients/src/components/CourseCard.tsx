import { memo, useState } from "react";
import { Link } from "react-router";
import { Star, Clock, Users } from "lucide-react";
import { Badge } from "./Badge";
import { ProgressBar } from "./ProgressBar";

function CourseCardImpl({ course }: { course: any }) {
  const [imageFailed, setImageFailed] = useState(false);
  const hasValidThumbnail = Boolean(course.thumbnail) && !imageFailed;

  return (
    <Link to={`/courses/${course.id}`} className="card  group overflow-hidden transition hover:shadow-md">
      <div className="relative h-32 overflow-hidden bg-gradient-to-br from-primary-500 to-primary-700">
        {hasValidThumbnail ? (
          <img
            src={course.thumbnail}
            alt={course.title}
            className="h-full w-full object-cover transition group-hover:scale-105"
            loading="lazy"
            onError={() => setImageFailed(true)}
          />
        ) : (
          <div className="flex h-full items-center justify-center text-white">
            <span className="px-4 text-center text-sm font-semibold opacity-90">{course.category}</span>
          </div>
        )}
      </div>
      <div className="p-4">
        <div className="mb-2 flex items-center gap-2">
          <Badge variant="info">{course.level}</Badge>
          {course.enrollment && <Badge variant={course.enrollment.completed ? "success" : "warning"}>{course.enrollment.completed ? "Completed" : "In progress"}</Badge>}
        </div>
        <h3 className="font-semibold group-hover:text-primary-600">{course.title}</h3>
        <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{course.description}</p>
        <p className="mt-2 text-xs text-muted-foreground">{course.instructor?.name}</p>

        <div className="mt-3 flex items-center gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1"><Star size={12} className="text-amber-400" /> {course.rating?.toFixed(1) ?? "New"}</span>
          <span className="flex items-center gap-1"><Clock size={12} /> {Math.round((course.duration ?? 0) / 60)}h</span>
          <span className="flex items-center gap-1"><Users size={12} /> {course._count?.enrollments ?? 0}</span>
        </div>

        {course.enrollment && (
          <div className="mt-3">
            <ProgressBar value={course.enrollment.progress} />
            <p className="mt-1 text-xs text-muted-foreground">{course.enrollment.progress}% complete</p>
          </div>
        )}
      </div>
    </Link>
  );
}

export const CourseCard = memo(CourseCardImpl);