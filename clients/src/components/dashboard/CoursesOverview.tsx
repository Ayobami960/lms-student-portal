import { Link } from "react-router";
import { BookOpen } from "lucide-react";
import EnrollmentChart from "../chart/EnrollmentChart";
import type { CourseProgress, CourseEnrollment } from "../../types";

interface InstructorOverviewProps {
  role: "INSTRUCTOR";
  courses: CourseEnrollment[] | undefined;
}

interface StudentOverviewProps {
  role: "STUDENT";
  progress: CourseProgress[] | undefined;
  isLoading: boolean;
  isError: boolean;
}

type CoursesOverviewProps = InstructorOverviewProps | StudentOverviewProps;

export function CoursesOverview(props: CoursesOverviewProps) {
  return (
    <section className="grid grid-cols-1 lg:grid-cols-3 gap-md">
      <div className="bg-surface-container-lowest border border-outline-variant shadow-sm p-md rounded-xl flex flex-col justify-between lg:col-span-3">
        {props.role === "INSTRUCTOR" ? <InstructorPanel courses={props.courses} /> : <StudentPanel {...props} />}

        <Link
          to={props.role === "INSTRUCTOR" ? "/my-courses" : "/courses"}
          className="w-full mt-6 text-center font-semibold text-sm text-primary hover:underline"
        >
          {props.role === "INSTRUCTOR" ? "View All Your Courses" : "View All Courses"}
        </Link>
      </div>
    </section>
  );
}

function InstructorPanel({ courses }: { courses: CourseEnrollment[] | undefined }) {
  return (
    <div>
      <h3 className="text-xl font-semibold mb-md">Your Courses</h3>
      {!courses?.length ? (
        <div className="text-center py-lg">
          <BookOpen className="w-8 h-8 mx-auto text-outline-variant mb-2" aria-hidden="true" />
          <p className="text-sm text-outline mb-3">No courses yet — create your first course to get started.</p>
          <Link to="/my-courses" className="text-sm font-semibold text-primary hover:underline">
            Go to My Courses
          </Link>
        </div>
      ) : (
        <>
          <div className="mb-lg">
            <h4 className="text-sm font-semibold text-on-surface-variant uppercase tracking-wide mb-3">Enrollment by Course</h4>
            <EnrollmentChart courses={courses} />
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-outline-variant text-xs uppercase text-outline">
                <tr>
                  <th className="px-4 py-3">Course</th>
                  <th className="px-4 py-3">Students</th>
                </tr>
              </thead>
              <tbody>
                {courses.map((c) => (
                  <tr key={c.id} className="border-b border-outline-variant/60 last:border-0">
                    <td className="px-4 py-3 font-medium text-on-surface">{c.title}</td>
                    <td className="px-4 py-3 text-outline">{c.students}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}

function StudentPanel({ progress, isLoading, isError }: Omit<StudentOverviewProps, "role">) {
  return (
    <div>
      <h3 className="text-xl font-semibold mb-md">Course Progress</h3>
      {isLoading ? (
        <div className="space-y-md" aria-busy="true" aria-label="Loading course progress">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-10 bg-outline-variant/20 rounded animate-pulse" />
          ))}
        </div>
      ) : isError ? (
        <p className="text-sm text-red-600 dark:text-red-400">Couldn't load your course progress. Please try again shortly.</p>
      ) : !progress?.length ? (
        <p className="text-sm text-outline">No enrolled active courses found.</p>
      ) : (
        <div className="space-y-md">
          {progress.slice(0, 3).map((course) => (
            <div key={course.courseId}>
              <div className="flex justify-between text-sm mb-1 font-medium">
                <span className="truncate max-w-[200px]">{course.courseTitle}</span>
                <span className="text-primary font-semibold">{course.progress}%</span>
              </div>
              <div className="w-full h-1.5 bg-outline-variant rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary transition-all duration-500"
                  style={{ width: `${course.progress}%` }}
                  role="progressbar"
                  aria-valuenow={course.progress}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-label={`${course.courseTitle} progress`}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}