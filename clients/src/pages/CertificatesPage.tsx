import { Award, Download, Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import { useState } from "react";
import { useListCertificatesQuery } from "../store/api/apiSlice";
import { Skeleton } from "../components/Skeleton";
import { EmptyState } from "../components/EmptyState";
import { useAppSelector } from "../hooks/redux";
import { downloadCertificate } from "../lib/downloadCertificate";

export default function CertificatesPage() {
  const { data, isLoading } = useListCertificatesQuery();
  const accessToken = useAppSelector((s) => s.auth.accessToken);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const certificates = data?.data;

  async function handleDownload(id: string) {
    setDownloadingId(id);
    try {
      await downloadCertificate(id, accessToken);
    } catch {
      toast.error("Failed to download certificate");
    } finally {
      setDownloadingId(null);
    }
  }

  return (
    <div>
      <h1 className="mb-1 text-2xl font-bold">Certificates</h1>
      <p className="mb-6 text-sm text-on-surface-variant">Your earned certificates.</p>

      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">{Array.from({ length: 2 }).map((_, i) => <Skeleton key={i} className="h-40" />)}</div>
      ) : !certificates?.length ? (
        <EmptyState icon={Award} title="No certificates yet" description="Complete a course to earn your first certificate." />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {certificates.map((cert: any) => (
            <div key={cert.id} className="card overflow-hidden border-2 border-primary-container">
              <div className="bg-gradient-to-br from-primary to-tertiary p-5 text-on-primary">
                <Award size={28} className="mb-2" />
                <p className="text-sm opacity-90">Certificate of Completion</p>
                <h3 className="text-lg font-bold">{cert.courseName}</h3>
              </div>
              <div className="p-4 text-sm">
                <p className="text-on-surface-variant">Issued {new Date(cert.issueDate).toLocaleDateString()}</p>
                <p className="mt-1 text-xs text-on-surface-variant">Certificate No: {cert.certificateNumber}</p>
                <button
                  onClick={() => handleDownload(cert.id)}
                  disabled={downloadingId === cert.id}
                  className="btn-secondary mt-3 w-full"
                >
                  {downloadingId === cert.id ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
                  Download PDF
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}