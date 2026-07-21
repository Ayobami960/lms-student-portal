"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import toast from "react-hot-toast";
import {
  Wrench,
  Radio,
  Send,
  Loader2,
  AlertTriangle,
  Users,
  GraduationCap,
  UserCheck,
  ShieldAlert,
  BellRing,
} from "lucide-react";
import {
  useGetMaintenanceStatusQuery,
  useSetMaintenanceStatusMutation,
  useListAnnouncementsQuery,
  useCreateAnnouncementMutation,
} from "../../../store/api/apiSlice";

import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/Switch";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const AUDIENCE_OPTIONS = [
  { value: "ALL", label: "Everyone", icon: Users, desc: "All active platform users" },
  { value: "STUDENT", label: "Students", icon: GraduationCap, desc: "Learners only" },
  { value: "INSTRUCTOR", label: "Instructors", icon: UserCheck, desc: "Teachers & TAs" },
  { value: "ADMIN", label: "Admins", icon: ShieldAlert, desc: "System admins only" },
] as const;

const AUDIENCE_STYLE: Record<
  string,
  { badge: "default" | "success" | "secondary" | "destructive"; bar: string }
> = {
  ALL: { badge: "default", bar: "bg-primary" },
  STUDENT: { badge: "success", bar: "bg-emerald-500" },
  INSTRUCTOR: { badge: "secondary", bar: "bg-slate-400" },
  ADMIN: { badge: "destructive", bar: "bg-rose-500" },
};

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-1 font-mono text-[10px] font-bold uppercase tracking-wider text-muted-foreground/80">
      {children}
    </p>
  );
}

function MaintenanceModeCard() {
  const { data, isLoading } = useGetMaintenanceStatusQuery();
  const [setMaintenance, { isLoading: saving }] = useSetMaintenanceStatusMutation();
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (data?.data.message) setMessage(data.data.message);
  }, [data?.data.message]);

  async function handleToggle(enabled: boolean) {
    if (
      enabled &&
      !confirm(
        "This will block all students and instructors from using the platform until turned off. Continue?"
      )
    )
      return;
    try {
      await setMaintenance({ enabled, message }).unwrap();
      toast.success(
        enabled
          ? "Maintenance mode enabled — email notifications dispatched"
          : "Maintenance mode disabled — platform restored"
      );
    } catch (e: any) {
      toast.error(e?.data?.message ?? "Failed to update maintenance mode");
    }
  }

  if (isLoading) return <Skeleton className="h-72 w-full rounded-2xl" />;

  const enabled = data?.data.enabled ?? false;

  return (
    <div
      className={cn(
        "relative flex flex-col justify-between overflow-hidden rounded-2xl border bg-card p-6 shadow-sm transition-all duration-300",
        enabled ? "border-amber-500/50 dark:border-amber-500/30 ring-1 ring-amber-500/20" : "border-border"
      )}
    >
      <div
        className={cn(
          "absolute inset-x-0 top-0 h-1 transition-colors duration-300",
          enabled ? "bg-amber-500" : "bg-transparent"
        )}
      />

      <div>
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <Eyebrow>Platform Control</Eyebrow>
            <h2 className="flex items-center gap-2 text-lg font-semibold tracking-tight">
              <Wrench size={18} className="text-primary" />
              Maintenance Mode
            </h2>
          </div>

          <div
            className={cn(
              "flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium transition-colors",
              enabled
                ? "border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400"
                : "border-border bg-muted/50 text-muted-foreground"
            )}
          >
            <span className="relative flex h-2 w-2">
              {enabled && (
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-75" />
              )}
              <span
                className={cn(
                  "relative inline-flex h-2 w-2 rounded-full",
                  enabled ? "bg-amber-500" : "bg-muted-foreground/50"
                )}
              />
            </span>
            <span className="font-mono text-[11px] uppercase tracking-wider">
              {enabled ? "Active" : "Disabled"}
            </span>
          </div>
        </div>

        <p className="mb-5 text-sm leading-relaxed text-muted-foreground">
          Locks down student and instructor access. Displays a custom banner to visitors and automatically dispatches standard notice emails upon toggling.
        </p>

        {enabled && (
          <div className="mb-5 flex items-center gap-2.5 rounded-xl border border-amber-500/20 bg-amber-500/10 p-3 text-xs text-amber-700 dark:text-amber-300">
            <AlertTriangle className="h-4 w-4 shrink-0 text-amber-500" />
            <span>Platform is currently restricted. Admin sessions remain unaffected.</span>
          </div>
        )}

        <Field>
          <FieldLabel htmlFor="maintenance-message" className="text-xs font-medium">
            User-Facing Notice (Optional)
          </FieldLabel>
          <Textarea
            id="maintenance-message"
            rows={3}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="e.g. Scheduled system upgrade in progress. Estimated return: 6:00 PM EST."
            className="resize-none bg-background/50 text-sm focus-visible:ring-primary"
          />
        </Field>
      </div>

      <div className="mt-6 flex items-center justify-between rounded-xl border border-border bg-muted/40 p-4">
        <div className="space-y-0.5">
          <p className="text-sm font-medium text-foreground">Restrict Access</p>
          <p className="text-xs text-muted-foreground">Toggle lockdown state instantly</p>
        </div>
        <Switch
          checked={enabled}
          onCheckedChange={handleToggle}
          disabled={saving}
          tone="danger"
          label="Toggle maintenance mode"
        />
      </div>
    </div>
  );
}

const announcementSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  message: z.string().min(5, "Message must be at least 5 characters"),
  audience: z.enum(["ALL", "STUDENT", "INSTRUCTOR", "ADMIN"]),
});
type AnnouncementForm = z.infer<typeof announcementSchema>;

function AnnouncementsCard() {
  const { data } = useListAnnouncementsQuery();
  const [createAnnouncement, { isLoading }] = useCreateAnnouncementMutation();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<AnnouncementForm>({
    resolver: zodResolver(announcementSchema),
    defaultValues: { audience: "ALL", title: "", message: "" },
  });

  const selectedAudience = watch("audience");

  async function onSubmit(values: AnnouncementForm) {
    try {
      await createAnnouncement(values).unwrap();
      toast.success("Broadcast sent successfully");
      reset({ title: "", message: "", audience: "ALL" });
    } catch (e: any) {
      toast.error(e?.data?.message ?? "Failed to send announcement");
    }
  }

  return (
    <div className="flex flex-col justify-between rounded-2xl border border-border bg-card p-6 shadow-sm">
      <div>
        <div className="mb-5">
          <Eyebrow>Broadcast Center</Eyebrow>
          <h2 className="flex items-center gap-2 text-lg font-semibold tracking-tight">
            <Radio size={18} className="text-primary" />
            System Announcements
          </h2>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <FieldGroup className="space-y-4">
            {/* Title Field */}
            <Field data-invalid={!!errors.title || undefined}>
              <FieldLabel className="text-xs font-medium">Headline</FieldLabel>
              <Input
                placeholder="e.g. Scheduled platform maintenance this weekend"
                className="bg-background/50 focus-visible:ring-primary"
                {...register("title")}
              />
              {errors.title?.message && (
                <FieldError>{errors.title.message}</FieldError>
              )}
            </Field>

            {/* Message Field */}
            <Field data-invalid={!!errors.message || undefined}>
              <FieldLabel className="text-xs font-medium">Broadcast Content</FieldLabel>
              <Textarea
                rows={3}
                placeholder="Write your announcement message..."
                className="resize-none bg-background/50 text-sm focus-visible:ring-primary"
                {...register("message")}
              />
              {errors.message?.message && (
                <FieldError>{errors.message.message}</FieldError>
              )}
            </Field>

            {/* Audience Field */}
            <Field data-invalid={!!errors.audience || undefined}>
              <FieldLabel className="text-xs font-medium">Target Audience</FieldLabel>
              <FieldDescription className="text-[11px] text-muted-foreground">
                Select who will receive this notification.
              </FieldDescription>

              <div className="grid grid-cols-2 gap-2 pt-1">
                {AUDIENCE_OPTIONS.map((opt) => {
                  const Icon = opt.icon;
                  const isSelected = selectedAudience === opt.value;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setValue("audience", opt.value as AnnouncementForm["audience"])}
                      className={cn(
                        "flex flex-col items-start rounded-xl border p-3 text-left transition-all",
                        isSelected
                          ? "border-primary bg-primary/5 text-primary ring-1 ring-primary/20"
                          : "border-border bg-background/50 text-muted-foreground hover:border-border/80 hover:bg-muted/30"
                      )}
                    >
                      <div className="flex w-full items-center justify-between mb-1">
                        <span className="text-xs font-semibold">{opt.label}</span>
                        <Icon
                          size={14}
                          className={isSelected ? "text-primary" : "text-muted-foreground"}
                        />
                      </div>
                      <span className="text-[10px] text-muted-foreground/80 line-clamp-1">
                        {opt.desc}
                      </span>
                    </button>
                  );
                })}
              </div>
              {errors.audience?.message && (
                <FieldError>{errors.audience.message}</FieldError>
              )}
            </Field>
          </FieldGroup>

          <Button type="submit" disabled={isLoading} className="w-full gap-2 font-medium">
            {isLoading ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Send size={15} />
            )}
            {isLoading ? "Dispatching..." : "Send Announcement"}
          </Button>
        </form>
      </div>

      <div className="mt-8 border-t border-border pt-5">
        <div className="mb-3 flex items-center justify-between">
          <Eyebrow>Recent History</Eyebrow>
          <span className="text-[10px] text-muted-foreground font-mono">
            {data?.data?.length ?? 0} total
          </span>
        </div>

        {!data?.data?.length ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border p-6 text-center">
            <BellRing className="mb-2 h-6 w-6 text-muted-foreground/40" />
            <p className="text-xs text-muted-foreground">No broadcasts recorded yet.</p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {data.data.slice(0, 4).map((a: any) => {
              const style = AUDIENCE_STYLE[a.audience] ?? AUDIENCE_STYLE.ALL;
              return (
                <div
                  key={a.id}
                  className="group relative flex gap-3 rounded-xl border border-border bg-background/40 p-3 text-sm transition-colors hover:bg-muted/30"
                >
                  <span className={cn("mt-1 w-1 shrink-0 rounded-full", style.bar)} />
                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="truncate text-xs font-semibold text-foreground">{a.title}</p>
                      <Badge variant={style.badge} className="text-[10px] px-1.5 py-0 capitalize">
                        {a.audience.toLowerCase()}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">{a.message}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default function SettingsPage() {
  return (
    <div className="mx-auto max-w-7xl space-y-6 p-4 sm:p-6 lg:p-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Platform Settings</h1>
        <p className="text-sm text-muted-foreground">
          Manage system maintenance modes and broadcast announcements to users.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <MaintenanceModeCard />
        <AnnouncementsCard />
      </div>
    </div>
  );
}