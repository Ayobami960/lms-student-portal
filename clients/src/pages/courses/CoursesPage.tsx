import { useEffect, useState } from "react";
import { Search, BookOpen, ListFilter } from "lucide-react";
import { useListCoursesQuery } from "../../store/api/apiSlice";
import { CourseCard } from "../../components/CourseCard";
import { CardSkeleton } from "../../components/Skeleton";
import { EmptyState } from "../../components/EmptyState";

const CATEGORIES = ["Web Development", "Backend Development", "Data Science", "Design", "Business", "Marketing"];

const LEVELS = [
  { label: "Any Level", value: "" },
  { label: "Beginner", value: "BEGINNER" },
  { label: "Intermediate", value: "INTERMEDIATE" },
  { label: "Advanced", value: "ADVANCED" },
];

const SORT_OPTIONS = [
  { label: "Newest", value: "newest" },
  { label: "Most popular", value: "popular" },
  { label: "Highest rated", value: "rating" },
  { label: "Alphabetical", value: "alphabetical" },
];

export default function CoursesPage() {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [category, setCategory] = useState("");
  const [level, setLevel] = useState("");
  const [sort, setSort] = useState("newest");
  const [page, setPage] = useState(1);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedSearch(search), 400);
    return () => window.clearTimeout(timer);
  }, [search]);

  const { data, isLoading, isFetching } = useListCoursesQuery(
    { search: debouncedSearch || undefined, category: category || undefined, level: level || undefined, sort, page, limit: 9 },
    { refetchOnMountOrArgChange: true }
  );

  const courses = data?.data ?? [];
  const pagination = data?.pagination;
  const showSkeleton = isLoading || (isFetching && courses.length === 0);

  return (
    <div className="space-y-lg animate-fade-in">
     <div>
          <h1 className="text-3xl font-semibold text-on-surface">Courses</h1>
          <p className="text-sm text-on-surface-variant mt-1">Browse and enroll in courses.</p>
        </div>
      <div className="flex flex-col gap-md md:flex-row md:items-center ">
       

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative w-full sm:w-80">
            <Search size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant" />
            <input
              className="input w-full pl-10"
              placeholder="Search by title"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              aria-label="Search courses"
            />
          </div>

          <div className="grid w-full grid-cols-1 gap-3 sm:grid-cols-3">
            <select
              className="input w-full"
              value={category}
              onChange={(e) => {
                setCategory(e.target.value);
                setPage(1);
              }}
            >
              <option value="">All categories</option>
              {CATEGORIES.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>

            <select
              className="input w-full"
              value={level}
              onChange={(e) => {
                setLevel(e.target.value);
                setPage(1);
              }}
            >
              {LEVELS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>

            <select
              className="input w-full"
              value={sort}
              onChange={(e) => {
                setSort(e.target.value);
                setPage(1);
              }}
            >
              {SORT_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <button
          type="button"
          onClick={() => {
            setSearch("");
            setDebouncedSearch("");
            setCategory("");
            setLevel("");
            setSort("newest");
            setPage(1);
          }}
          className="inline-flex items-center gap-2 rounded-lg border border-outline-variant bg-surface-container-lowest px-4 py-2 text-sm font-medium text-on-surface transition-colors hover:border-primary"
        >
          <ListFilter className="w-4 h-4" /> Reset
        </button>
      </div>

      <section className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {showSkeleton
          ? Array.from({ length: 6 }).map((_, index) => <CardSkeleton key={index} />)
          : courses.length === 0
          ? (
            <div className="col-span-full">
              <EmptyState icon={BookOpen} title="No courses found" description="Try adjusting your search or filters." />
            </div>
          )
          : courses.map((course: any) => <CourseCard key={course.id} course={course} />)}
      </section>

      {pagination && pagination.totalPages > 1 && (
        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between text-sm text-on-surface-variant">
          <span>
            Page {pagination.page} of {pagination.totalPages} ({pagination.total} courses)
          </span>
          <div className="flex gap-2">
            <button className="btn-secondary" disabled={pagination.page <= 1} onClick={() => setPage((current) => Math.max(1, current - 1))}>
              Previous
            </button>
            <button
              className="btn-secondary"
              disabled={pagination.page >= pagination.totalPages}
              onClick={() => setPage((current) => Math.min(pagination.totalPages, current + 1))}
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
