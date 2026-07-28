import { useRef, useState } from "react";
import { Camera, Loader2, X } from "lucide-react";
import { useAppDispatch } from "../../hooks/redux";
import { updateUser, persistAuthUser } from "../../store/authSlice";
import { useUpdateProfileMutation } from "../../store/api/apiSlice";
import { Button } from "../ui/Button";

interface EditProfileModalProps {
  open: boolean;
  onClose: () => void;
  user: {
    name?: string;
    avatar?: string | null;
    role?: string;
    email?: string;
  } | null;
}

const FALLBACK_AVATAR =
  "https://images.unsplash.com/photo-1633332755192-727a05c4013d?auto=format&fit=crop&w=200&q=80";

// Reads a File as a base64 data URL for local preview + submission.
// Swap this for a real upload endpoint (e.g. presigned S3 URL) if/when
// one exists — PATCH /users/me currently just stores whatever string
// lands in `avatar`, so a data URL works but isn't ideal for large images.
function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export function EditProfileModal({ open, onClose, user }: EditProfileModalProps) {
  const dispatch = useAppDispatch();
  const [updateProfile, { isLoading }] = useUpdateProfileMutation();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState(user?.name ?? "");
  const [avatarPreview, setAvatarPreview] = useState(user?.avatar || FALLBACK_AVATAR);
  const [error, setError] = useState<string | null>(null);

  if (!open) return null;

  async function handleAvatarPick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Please choose an image file.");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setError("Image must be under 2MB.");
      return;
    }

    setError(null);
    const dataUrl = await fileToDataUrl(file);
    setAvatarPreview(dataUrl);
  }

  async function handleSave() {
    const trimmed = name.trim();
    if (!trimmed) {
      setError("Name can't be empty.");
      return;
    }

    try {
      const res = await updateProfile({ name: trimmed, avatar: avatarPreview }).unwrap();

      dispatch(updateUser({ name: res.data.name, avatar: res.data.avatar }));

      
      const merged = user ? { ...user, name: res.data.name, avatar: res.data.avatar } : null;
      persistAuthUser(merged as any);

      onClose();
    } catch {
      setError("Couldn't save your changes. Try again.");
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

      <div className="card relative z-10 w-full max-w-6xl bg-surface-container-lowest p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-on-surface">Edit profile</h2>
          <button
            onClick={onClose}
            aria-label="Close"
            className="flex h-9 w-9 items-center justify-center rounded-xl text-on-surface-variant hover:bg-surface-container hover:text-on-surface"
          >
            <X size={20} />
          </button>
        </div>

        {/* Avatar */}
        <div className="mt-6 flex flex-col items-center">
          <div className="relative">
            <div
              className="flex h-24 w-24 items-center justify-center rounded-full p-1"
              style={{ background: "conic-gradient(from 180deg, var(--color-tertiary), var(--color-accent), var(--color-tertiary))" }}
            >
              <img
                src={avatarPreview}
                alt=""
                className="h-full w-full rounded-full border-4 border-surface-container-lowest object-cover"
              />
            </div>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              aria-label="Change avatar"
              className="absolute bottom-0 right-0 flex h-8 w-8 items-center justify-center rounded-full bg-primary text-on-primary shadow-sm hover:opacity-90"
            >
              <Camera size={14} />
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleAvatarPick}
            />
          </div>
          <p className="mt-2 text-xs text-on-surface-variant">Tap the camera to change your photo</p>
        </div>

        {/* Name */}
        <div className="mt-6">
          <label htmlFor="profile-name" className="mb-1.5 block text-xs font-semibold text-on-surface-variant">
            Name
          </label>
          <input
            id="profile-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="input"
            placeholder="Your name"
          />
        </div>

        {/* Role — read only, cannot be changed by the user */}
        <div className="mt-4">
          <label className="mb-1.5 block text-xs font-semibold text-on-surface-variant">Role</label>
          <input
            type="text"
            value={user?.role === "INSTRUCTOR" ? "Instructor" : "Student"}
            disabled
            className="input cursor-not-allowed opacity-60"
          />
        </div>

        {error && <p className="mt-3 text-sm text-error">{error}</p>}

        <div className="mt-6 flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button type="button" variant="primary" onClick={handleSave} disabled={isLoading}>
            {isLoading && <Loader2 size={16} className="animate-spin" />}
            Save changes
          </Button>
        </div>
      </div>
    </div>
  );
}