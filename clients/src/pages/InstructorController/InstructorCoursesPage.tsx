import { useState } from "react";
import { Link, Navigate } from "react-router";
import { Plus, BookOpen, Pencil, Trash2 } from "lucide-react";
import toast from "react-hot-toast";
import { useListCoursesQuery, useDeleteCourseMutation,  } from "../../store/api/apiSlice";
import { useAppSelector } from "../../hooks/redux";

import { EmptyState } from "../../components/EmptyState";
import { Badge } from "../../components/Badge";
import { Button } from "../../components/ui/Button";
import { Skeleton } from "../../components/Skeleton";
import { Modal } from "../../components/ui/Modal";

import NewCourseModal from "../../components/NewCourseModal";

const InstructorCoursesPage = () => {
  const [showModal, setShowModal] = useState(false);
  const [courseToDelete, setCourseToDelete] = useState<{ id: string; title: string } | null>(null);

  const role = useAppSelector((s) => s.auth.user?.role);
  const { data, isLoading } = useListCoursesQuery({ limit: 50, mine: true });
  const [deleteCourse, { isLoading: isDeleting }] = useDeleteCourseMutation();
  const courses = data?.data;

  // Instructor-only page — send anyone else back to the dashboard.
  if (role !== "INSTRUCTOR") {
    return <Navigate to="/dashboard" replace />;
  }

  async function handleDelete() {
    if (!courseToDelete) return;
    try {
      await deleteCourse(courseToDelete.id).unwrap();
      toast.success("Course deleted");
      setCourseToDelete(null);
    } catch (e: any) {
      toast.error(e?.data?.message ?? "Failed to delete course");
    }
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
            <div
              key={c.id}
              className="group relative bg-surface-container-lowest border border-outline-variant shadow-sm rounded-xl p-md transition hover:-translate-y-0.5 hover:shadow-md"
            >
              
              <Link to={`/view-courses/${c.id}`} className="block">
                <div className="mb-2 flex items-center justify-between pr-14">
                  <Badge variant={c.published ? "success" : "warning"}>
                    {c.published ? "Published" : "Draft"}
                  </Badge>
                  <span className="text-xs text-outline">{c._count?.enrollments ?? 0} students</span>
                </div>
                <h3 className="font-semibold text-on-surface pr-14">{c.title}</h3>
                <p className="mt-1 line-clamp-2 text-sm text-outline">{c.description}</p>
              </Link>

              <div className="absolute right-3 top-3 flex gap-1 opacity-0 transition group-hover:opacity-100 focus-within:opacity-100">
                <Link
                  to={`/my-courses/${c.id}`}
                  aria-label={`Edit ${c.title}`}
                  className="rounded-md bg-surface-container-lowest p-1.5 text-on-surface-variant shadow-sm hover:bg-surface-container-high hover:text-on-surface"
                >
                  <Pencil size={14} />
                </Link>
                <button
                  type="button"
                  aria-label={`Delete ${c.title}`}
                  onClick={() => setCourseToDelete({ id: c.id, title: c.title })}
                  className="rounded-md bg-surface-container-lowest p-1.5 text-on-surface-variant shadow-sm hover:bg-red-50 hover:text-red-600"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && <NewCourseModal onClose={() => setShowModal(false)} />}

      <Modal
        open={!!courseToDelete}
        onClose={() => setCourseToDelete(null)}
        title="Delete course?"
        description={
          courseToDelete
            ? `This permanently deletes "${courseToDelete.title}" and all of its modules and lessons.`
            : undefined
        }
        size="sm"
        
      >
        <div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={() => setCourseToDelete(null)} disabled={isDeleting}>
            Cancel
          </Button>
          <Button
            onClick={handleDelete}
            loading={isDeleting}
            className="bg-red-600 text-white hover:bg-red-700"
          >
            Delete
          </Button>
        </div>
      </Modal>
    </div>
  );
};

export default InstructorCoursesPage;