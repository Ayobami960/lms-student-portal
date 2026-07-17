import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useNavigate, Link } from "react-router";
import {
  Star,
  CheckCircle2,
  PlayCircle,
  Lock,
  ChevronDown,
  ChevronRight,
  Clock,
  FileText,
  Smartphone,
  Award,
  Infinity as InfinityIcon,
  Share2,
  Heart,
  ArrowRight,
  Bot,
  Loader2,
} from "lucide-react";
import toast from "react-hot-toast";
import { useAppSelector } from "../../hooks/redux";
import {
  useCompleteLessonMutation,
  useEnrollCourseMutation,
  useGetCourseQuery,
  useListAssignmentsQuery,
  useGenerateCertificateMutation,
} from "../../store/api/apiSlice";
import { VideoPlayer } from "../../components/VideoPlayer";
import { CourseAssignmentCard } from "../../components/CourseAssignmentCard";

const TABS = ["Overview", "Curriculum", "Resources", "Reviews", "Q&A"] as const;

type Tab = (typeof TABS)[number];

function formatDuration(minutes: number) {
  const hours = Math.floor(minutes / 60);
  const remaining = minutes % 60;
  return `${hours}h ${remaining.toString().padStart(2, "0")}m`;
}


export default function CourseDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const user = useAppSelector((state) => state.auth.user);
  const [activeTab, setActiveTab] = useState<Tab>("Overview");
  const [openModules, setOpenModules] = useState<Set<string>>(new Set());
  const [activeLessonId, setActiveLessonId] = useState<string | null>(null);
  const certificateRequestedRef = useRef(false);

  const { data, isLoading, refetch } = useGetCourseQuery(id ?? "", {
    skip: !id,
    refetchOnMountOrArgChange: true,
  });
  const [enrollCourse, { isLoading: isEnrolling }] = useEnrollCourseMutation();
  const [completeLesson, { isLoading: isCompleting }] = useCompleteLessonMutation();
  const [generateCertificate] = useGenerateCertificateMutation();

  const course = data?.data;
  const isEnrolled = Boolean(course?.enrollment);
  const progressPercent = course?.enrollment?.progress ?? 0;
  const courseCompleted = Boolean(course?.enrollment?.completed) || progressPercent >= 100;
  const totalModules = course?.modules?.length ?? 0;

  const { data: assignmentsRes } = useListAssignmentsQuery(id ? { courseId: id } : undefined, {
    skip: !id || !isEnrolled,
  });
  const assignments = assignmentsRes?.data ?? [];

  // Flatten every lesson in watch order, carrying its module along for display.
  const orderedLessons = useMemo(() => {
    if (!course?.modules) return [];
    return course.modules.flatMap((module: any) =>
      (module.lessons ?? []).map((lesson: any) => ({ ...lesson, moduleTitle: module.title }))
    );
  }, [course]);

  const totalLessons = orderedLessons.length;
  const totalDuration = course ? formatDuration(course.duration) : "0h 00m";

  const activeLesson = useMemo(
    () => orderedLessons.find((lesson: any) => lesson.id === activeLessonId) ?? null,
    [orderedLessons, activeLessonId]
  );

  // Default: open the module containing the first not-yet-completed lesson,
  // and select that lesson as the active one to play.
  useEffect(() => {
    if (course && openModules.size === 0) {
      const firstModuleWithLessons = course.modules?.find((module: any) => module.lessons?.length > 0);
      if (firstModuleWithLessons) {
        setOpenModules(new Set([firstModuleWithLessons.id]));
      }
    }
    if (!activeLessonId && orderedLessons.length > 0) {
      const nextUp = orderedLessons.find((lesson: any) => !lesson.completed) ?? orderedLessons[0];
      setActiveLessonId(nextUp.id);
    }
  }, [course, openModules.size, orderedLessons, activeLessonId]);

  // If the course is already 100% complete (e.g. the learner returns later),
  // make sure a certificate exists for it. generateCertificate is idempotent
  // on the backend — it just returns the existing one if already issued.
  useEffect(() => {
    if (courseCompleted && id && !certificateRequestedRef.current) {
      certificateRequestedRef.current = true;
      generateCertificate(id).catch(() => {
        // Silent — this is a background sync, not a user-initiated action.
      });
    }
  }, [courseCompleted, id, generateCertificate]);

  const handleEnroll = async () => {
    if (!user) {
      toast.error("Please log in to enroll in this course.");
      navigate("/");
      return;
    }
    if (!id) return;

    try {
      await enrollCourse(id).unwrap();
      toast.success("Enrolled! Your first lesson is ready to watch.");
      refetch();
    } catch (err: any) {
      toast.error(err?.data?.message ?? "Enrollment failed.");
    }
  };

  const handleSelectLesson = (lesson: any) => {
    if (!isEnrolled) {
      toast.error("Enroll in the course first to start lessons.");
      return;
    }
    if (lesson.locked) {
      toast.error("Complete the previous lesson to unlock this one.");
      return;
    }
    setActiveLessonId(lesson.id);
    setActiveTab("Overview");
  };

  const handleMarkComplete = async () => {
    if (!activeLesson || !id) return;
    try {
      const result = await completeLesson(activeLesson.id).unwrap();
      toast.success("Lesson complete!");
      await refetch();
      if (result.data.nextLessonId) {
        setActiveLessonId(result.data.nextLessonId);
      } else if (result.data.courseCompleted) {
        certificateRequestedRef.current = true;
        try {
          await generateCertificate(id).unwrap();
          toast.success("You finished the course! Your certificate is ready.", { duration: 5000 });
        } catch {
          toast.success("You finished the course! Your certificate is being prepared.");
        }
      }
    } catch (err: any) {
      toast.error(err?.data?.message ?? "Unable to update lesson progress.");
    }
  };

  if (isLoading) {
    return (
     <div className="flex h-screen items-center justify-center bg-surface">
      <Loader2 className="animate-spin text-primary" size={32} />
    </div>
    );
  }

  if (!course) {
    return (
      <div className="max-w-3xl mx-auto py-xl text-center">
        <h2 className="text-2xl font-semibold mb-2">Course not found</h2>
        <p className="text-on-surface-variant mb-md">We couldn't find the course you requested.</p>
        <Link to="/courses" className="text-primary font-semibold hover:underline">
          Back to Courses
        </Link>
      </div>
    );
  }

  const courseIncludes = [
    { icon: Clock, label: `${totalDuration} on-demand video` },
    { icon: FileText, label: `${totalLessons} lessons` },
    { icon: Smartphone, label: "Access on mobile and TV" },
    { icon: Award, label: "Certificate of completion" },
    { icon: InfinityIcon, label: "Lifetime access" },
  ];

  return (
    <div className="-m-margin-mobile md:-m-margin-desktop animate-fade-in">
      <div className="relative h-[320px] md:h-[400px] overflow-hidden">
        <img
          src={course.thumbnail ?? "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?auto=format&fit=crop&w=1200&q=80"}
          alt={course.title}
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-black/50" />
        <div className="relative z-10 h-full max-w-6xl mx-auto px-lg flex flex-col justify-end pb-xl gap-md text-white">
          <div className="flex items-center gap-sm">
            <span className="bg-tertiary-container text-on-tertiary-container px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider">
              {course.category}
            </span>
            <span className="flex items-center gap-1 text-xs font-semibold bg-white/10 backdrop-blur-md px-3 py-1 rounded-full border border-white/20">
              <Star className="w-4 h-4" fill="currentColor" strokeWidth={0} />
              {course.rating?.toFixed(1) ?? "0.0"}
            </span>
          </div>
          <h1 className="text-3xl md:text-5xl font-bold leading-tight max-w-3xl">{course.title}</h1>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-6">
            <div className="flex items-center gap-2">
              <img src={course.instructor.avatar} alt={course.instructor.name} className="w-10 h-10 rounded-full border-2 border-white object-cover" />
              <div>
                <p className="text-sm font-medium">{course.instructor.name}</p>
                <p className="text-xs text-white/70">{course.instructor.title ?? "Instructor"}</p>
              </div>
            </div>
            <div className="text-sm text-white/70">Last updated {new Date(course.updatedAt).toLocaleDateString()}</div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl! mx-auto px-margin-mobile md:px-margin-desktop py-xl grid grid-cols-1 lg:grid-cols-12 gap-lg">
        <div className="lg:col-span-8">
          {isEnrolled ? (
            <div className="mb-lg flex flex-col gap-md">
              <VideoPlayer url={activeLesson?.videoUrl} title={activeLesson?.title ?? course.title} />

              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-md bg-surface-container rounded-xl">
                <div>
                  <p className="text-xs text-on-surface-variant">
                    {activeLesson?.moduleTitle ?? "Lesson"}
                  </p>
                  <h3 className="text-lg font-semibold">{activeLesson?.title ?? "Select a lesson to begin"}</h3>
                </div>
                {activeLesson && !activeLesson.completed && (
                  <button
                    type="button"
                    onClick={handleMarkComplete}
                    disabled={isCompleting}
                    className="inline-flex items-center justify-center gap-2 bg-primary text-on-primary font-semibold px-5 py-2.5 rounded-xl hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-60"
                  >
                    <CheckCircle2 className="w-5 h-5" />
                    {isCompleting ? "Saving..." : "Mark Complete & Continue"}
                  </button>
                )}
                {activeLesson?.completed && (
                  <span className="inline-flex items-center gap-2 text-sm font-medium text-secondary">
                    <CheckCircle2 className="w-5 h-5" /> Completed
                  </span>
                )}
              </div>

              <div className="p-lg bg-primary/5 border border-primary/20 rounded-xl flex flex-col gap-2">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold text-primary">Your Progress</h3>
                  <span className="font-bold text-primary">{progressPercent}% Completed</span>
                </div>
                <div className="w-full bg-surface-container-high h-2 rounded-full overflow-hidden">
                  <div className="bg-primary h-full transition-all duration-700" style={{ width: `${progressPercent}%` }} />
                </div>
                {courseCompleted && (
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 mt-2 text-sm">
                    <span className="inline-flex items-center gap-2 text-secondary font-medium">
                      <Award className="w-4 h-4" /> Course complete — your certificate is ready.
                    </span>
                    <Link to="/certificates" className="text-primary font-semibold hover:underline sm:ml-auto">
                      View certificate →
                    </Link>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="mb-lg relative rounded-xl overflow-hidden aspect-video bg-black flex items-center justify-center">
              <img src={course.thumbnail} alt={course.title} className="absolute inset-0 w-full h-full object-cover opacity-50" />
              <button
                type="button"
                onClick={handleEnroll}
                disabled={isEnrolling}
                className="relative z-10 inline-flex items-center gap-2 bg-primary text-on-primary font-semibold px-6 py-3 rounded-xl hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-60"
              >
                <PlayCircle className="w-5 h-5" />
                {isEnrolling ? "Enrolling..." : "Enroll to Start Watching"}
              </button>
            </div>
          )}

          <div className="flex gap-lg border-b border-outline-variant mb-lg overflow-x-auto sticky top-0 bg-surface z-20 pt-1">
            {TABS.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`pb-3 text-sm font-medium whitespace-nowrap transition-colors relative ${
                  activeTab === tab
                    ? "text-primary after:absolute after:bottom-[-1px] after:left-0 after:w-full after:h-0.5 after:bg-primary"
                    : "text-on-surface-variant hover:text-primary"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {activeTab === "Overview" && (
            <div className="flex flex-col gap-xl">
              <section>
                <h2 className="text-2xl font-semibold mb-md">Course Description</h2>
                <p className="text-on-surface-variant leading-relaxed">{course.description}</p>
              </section>

              <section>
                <div className="flex justify-between items-center mb-md">
                  <h2 className="text-2xl font-semibold">Course Content</h2>
                  <span className="text-sm text-on-surface-variant">
                    {totalModules} Modules • {totalLessons} Lessons • {totalDuration} total
                  </span>
                </div>
                <div className="border border-outline-variant rounded-xl overflow-hidden">
                  {course.modules.map((module: any) => {
                    const isOpen = openModules.has(module.id);
                    return (
                      <div key={module.id} className="border-b border-outline-variant last:border-b-0">
                        <button
                          onClick={() => {
                            setOpenModules((prev) => {
                              const next = new Set(prev);
                              next.has(module.id) ? next.delete(module.id) : next.add(module.id);
                              return next;
                            });
                          }}
                          className="w-full flex items-center justify-between p-md bg-surface-container-low hover:bg-surface-container transition-colors text-left"
                        >
                          <div className="flex items-center gap-md">
                            {isOpen ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
                            <div>
                              <h4 className="text-sm font-semibold">{module.title}</h4>
                              <p className="text-xs text-on-surface-variant">{module.lessons?.length ?? 0} Lessons</p>
                            </div>
                          </div>
                        </button>
                        {isOpen && (
                          <div className="p-md space-y-2">
                            {(module.lessons?.length ?? 0) > 0 ? (
                              module.lessons.map((lesson: any) => {
                                const isActive = lesson.id === activeLessonId;
                                const isLocked = isEnrolled && lesson.locked;
                                return (
                                  <button
                                    key={lesson.id}
                                    type="button"
                                    onClick={() => handleSelectLesson(lesson)}
                                    disabled={isLocked}
                                    className={`w-full flex items-center justify-between rounded-lg px-md py-2 transition-colors text-left ${
                                      isActive ? "bg-primary/10" : "hover:bg-surface"
                                    } ${isLocked ? "opacity-50 cursor-not-allowed" : ""}`}
                                  >
                                    <div className="flex items-center gap-md">
                                      {isLocked ? (
                                        <Lock className="w-5 h-5 text-on-surface-variant" />
                                      ) : lesson.completed ? (
                                        <CheckCircle2 className="w-5 h-5 text-secondary" fill="currentColor" strokeWidth={0} />
                                      ) : (
                                        <PlayCircle className="w-5 h-5 text-primary" fill="currentColor" strokeWidth={0} />
                                      )}
                                      <span className={`text-sm text-left ${isActive ? "font-semibold text-primary" : ""}`}>
                                        {lesson.title}
                                      </span>
                                    </div>
                                    {isLocked && <span className="text-xs text-on-surface-variant">Locked</span>}
                                  </button>
                                );
                              })
                            ) : (
                              <p className="text-sm text-on-surface-variant px-md py-2">No lessons in this module yet.</p>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </section>
            </div>
          )}

          {activeTab !== "Overview" && (
            <div className="py-xl text-center text-on-surface-variant text-sm">{activeTab} content coming soon.</div>
          )}


<div className="grid grid-cols-1 lg:grid-cols-2 gap-lg mt-lg">
   <div className="p-lg bg-surface-container-lowest border border-outline-variant rounded-2xl">
            <h4 className="text-sm font-semibold mb-md">Meet the Instructor</h4>
            <div className="flex items-center gap-md mb-md">
              <img src={course.instructor.avatar} alt={course.instructor.name} className="w-16 h-16 rounded-full object-cover" />
              <div>
                <p className="text-lg font-semibold text-primary">{course.instructor.name}</p>
                <p className="text-xs text-on-surface-variant">{course.instructor.title ?? "Instructor"}</p>
              </div>
            </div>
            <p className="text-sm text-on-surface-variant mb-md">{course.instructor.bio ?? "Experienced instructor helping students succeed."}</p>
            <button className="text-primary font-semibold text-sm hover:underline flex items-center gap-1">
              View Profile <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          <div className="p-lg bg-tertiary/5 border border-tertiary-container/20 rounded-2xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-lg opacity-10 group-hover:opacity-20 transition-opacity">
              <Bot className="w-16 h-16 text-tertiary" />
            </div>
            <h4 className="text-sm font-semibold text-tertiary mb-2">AI Learning Path</h4>
            <p className="text-sm text-on-surface-variant relative z-10 mb-md">
              Continue learning with recommended lessons as you progress through this course.
            </p>
            <button className="bg-tertiary text-on-tertiary px-md py-2 rounded-lg text-sm font-semibold relative z-10 hover:opacity-90 active:scale-95 transition-all">
              Personalize My Path
            </button>
          </div>
          </div>

          {isEnrolled && assignments.length > 0 && (
            <section className="mt-lg">
              <div className="flex items-center justify-between mb-md">
                <h2 className="text-2xl font-semibold">Course Assignments</h2>
                <span className="text-sm text-on-surface-variant">
                  {assignments.length} {assignments.length === 1 ? "assignment" : "assignments"}
                </span>
              </div>
              <div className="flex flex-col gap-md">
                {assignments.map((a: any) => (
                  <CourseAssignmentCard key={a.id} assignment={a} unlocked={courseCompleted} />
                ))}
              </div>
            </section>
          )}
        </div>

        <aside className="lg:col-span-4 space-y-lg">
          <div className="bg-surface-container-lowest p-lg rounded-2xl shadow-sm border border-outline-variant sticky top-[80px]">
            <div className="mb-lg">
              <span className="text-3xl font-bold text-on-surface">{course.level}</span>
              <p className="text-on-surface-variant mt-1">{course.category}</p>
            </div>

            <div className="flex flex-col gap-sm mb-lg">
              {!isEnrolled && (
                <button
                  type="button"
                  onClick={handleEnroll}
                  disabled={isEnrolling}
                  className="w-full bg-primary text-on-primary font-semibold py-3 rounded-xl hover:opacity-90 active:scale-[0.98] transition-all shadow-lg shadow-primary/20 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {isEnrolling ? "Enrolling..." : "Enroll Now"}
                </button>
              )}
              {isEnrolled && !courseCompleted && (
                <button
                  type="button"
                  onClick={() => document.getElementById("root")?.scrollIntoView({ behavior: "smooth" })}
                  className="w-full bg-primary text-on-primary font-semibold py-3 rounded-xl hover:opacity-90 active:scale-[0.98] transition-all shadow-lg shadow-primary/20"
                >
                  Resume Course
                </button>
              )}
              {isEnrolled && courseCompleted && (
                <Link
                  to="/certificates"
                  className="w-full inline-flex items-center justify-center gap-2 bg-secondary text-on-secondary font-semibold py-3 rounded-xl hover:opacity-90 active:scale-[0.98] transition-all shadow-lg shadow-secondary/20"
                >
                  <Award className="w-5 h-5" /> View Your Certificate
                </Link>
              )}
            </div>

            <div className="space-y-2">
              <h4 className="text-sm font-semibold mb-1">This course includes:</h4>
              {courseIncludes.map((item, index) => {
                const Icon = item.icon;
                return (
                  <div key={index} className="flex items-center gap-2 text-on-surface-variant">
                    <Icon className="w-5 h-5" />
                    <span className="text-sm">{item.label}</span>
                  </div>
                );
              })}
            </div>

            <div className="mt-lg pt-lg border-t border-outline-variant flex justify-between items-center">
              <div className="flex flex-col">
                <span className="font-semibold text-sm">Share</span>
                <div className="flex gap-2 mt-1">
                  <button className="text-primary hover:bg-primary/10 p-1 rounded">
                    <Share2 className="w-5 h-5" />
                  </button>
                  <button className="text-primary hover:bg-primary/10 p-1 rounded">
                    <Heart className="w-5 h-5" />
                  </button>
                </div>
              </div>
              <button className="flex items-center gap-1 text-primary font-semibold text-sm hover:underline">
                Apply Coupon <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}