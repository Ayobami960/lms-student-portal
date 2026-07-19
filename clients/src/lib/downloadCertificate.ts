// RTK Query is built for JSON in/out; a binary file download is simpler as a
// plain authenticated fetch that hands the browser a blob URL to open.
const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8000/api/v1";

export function certificateDownloadUrl(id: string) {
  return `${API_URL}/certificates/${id}/download`;
}

export async function downloadCertificate(id: string, accessToken: string | null) {
  const res = await fetch(certificateDownloadUrl(id), {
    credentials: "include",
    headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined,
  });
  if (!res.ok) throw new Error("Failed to download certificate");
  const blob = await res.blob();
  const url = window.URL.createObjectURL(blob);
  window.open(url, "_blank");
  setTimeout(() => window.URL.revokeObjectURL(url), 10_000);
}
