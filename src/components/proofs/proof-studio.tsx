"use client";

import React, { useState, useRef, useMemo, useCallback } from "react";
import { useSession } from "next-auth/react";
import { trpc } from "@/lib/trpc";
import {
  MousePointer2,
  MapPin,
  Square,
  ZoomIn,
  ZoomOut,
  Maximize2,
  GitCompareArrows,
  Lock,
  Check,
  Eye,
  EyeOff,
  CheckCircle2,
  CircleDot,
  ChevronDown,
  ShieldCheck,
  Send,
  X,
  PenLine,
  Ruler,
  AlertTriangle,
  Users,
  Upload,
  FileText,
  Loader2,
  Image as ImageIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────

type Role = "staff" | "client";
type AnnotationType = "pin" | "region";
type AnnotationStatus = "OPEN" | "RESOLVED";
type VersionStatus =
  | "DRAFT"
  | "SENT"
  | "CHANGES_REQUESTED"
  | "APPROVED"
  | "SUPERSEDED";

type Comment = {
  id: string;
  author: string;
  role: Role;
  at: string;
  internal: boolean;
  body: string;
};

type Annotation = {
  id: string;
  versionId: string;
  type: AnnotationType;
  x: number;
  y: number;
  w?: number;
  h?: number;
  status: AnnotationStatus;
  author: string;
  role: Role;
  at: string;
  comments: Comment[];
};

type Version = {
  id: string;
  n: number;
  status: VersionStatus;
  by: string;
  at: string;
  logo: string;
};

type FileEntry = {
  file: File;
  preview?: string;
  status: "pending" | "uploading" | "done" | "error";
};

// ─── Constants ────────────────────────────────────────────────────────

const STATUS_META: Record<
  VersionStatus,
  { color: string; label: string }
> = {
  DRAFT: { color: "text-ink-dim", label: "Draft" },
  SENT: { color: "text-blue-400", label: "Awaiting review" },
  CHANGES_REQUESTED: { color: "text-yellow-400", label: "Changes requested" },
  APPROVED: { color: "text-emerald-400", label: "Approved" },
  SUPERSEDED: { color: "text-ink-dim", label: "Superseded" },
};

const STATUS_BG: Record<VersionStatus, string> = {
  DRAFT: "bg-ink-dim/20",
  SENT: "bg-blue-400/20",
  CHANGES_REQUESTED: "bg-yellow-400/20",
  APPROVED: "bg-emerald-400/20",
  SUPERSEDED: "bg-ink-dim/20",
};

const STATUS_DOT: Record<VersionStatus, string> = {
  DRAFT: "bg-ink-dim",
  SENT: "bg-blue-400",
  CHANGES_REQUESTED: "bg-yellow-400",
  APPROVED: "bg-emerald-400",
  SUPERSEDED: "bg-ink-dim",
};

// ─── Helpers ──────────────────────────────────────────────────────────

function timeAgo(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const diff = Date.now() - d.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return d.toLocaleDateString();
}

function toRole(serverRole: string): Role {
  return serverRole === "CCC_STAFF" ? "staff" : "client";
}

function getImageDimensions(
  file: File,
): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new window.Image();
    img.onload = () => {
      resolve({ width: img.naturalWidth, height: img.naturalHeight });
      URL.revokeObjectURL(img.src);
    };
    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });
}

// ─── Sub-components ───────────────────────────────────────────────────

function Avatar({
  name,
  role,
  size = 26,
}: {
  name: string;
  role: Role;
  size?: number;
}) {
  const initials = name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-center rounded-full text-white",
        role === "staff"
          ? "bg-gradient-to-br from-coral to-purple-400"
          : "bg-gradient-to-br from-blue-400 to-cyan-400"
      )}
      style={{
        width: size,
        height: size,
        fontSize: size * 0.4,
        fontWeight: 700,
      }}
    >
      {initials}
    </div>
  );
}

function RoleBadge({ role }: { role: Role }) {
  return (
    <span
      className={cn(
        "rounded px-1.5 py-0.5 font-label text-[9px] font-bold uppercase tracking-label",
        role === "staff"
          ? "bg-coral/15 text-coral"
          : "bg-blue-400/15 text-blue-400"
      )}
    >
      {role === "staff" ? "CCC" : "Client"}
    </span>
  );
}

function StatusPill({ status }: { status: VersionStatus }) {
  const m = STATUS_META[status];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold tracking-wide",
        STATUS_BG[status],
        m.color
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", STATUS_DOT[status])} />
      {m.label}
    </span>
  );
}

function PoloProof({
  logo,
  guides,
}: {
  logo: string;
  guides: boolean;
}) {
  const emblem = (cx: number, cy: number, scale: number) => (
    <g transform={`translate(${cx} ${cy}) scale(${scale})`}>
      <circle r="34" fill="none" stroke="#da5245" strokeWidth="4" />
      <path d="M-16 8 L0 -18 L16 8 Z" fill="#da5245" />
      <text
        y="26"
        textAnchor="middle"
        fontSize="13"
        fontWeight="800"
        fill="#1d1d22"
        letterSpacing="1"
      >
        ACME
      </text>
    </g>
  );
  return (
    <svg
      viewBox="0 0 600 600"
      width="100%"
      height="100%"
      className="block"
    >
      <rect width="600" height="600" fill="#dadde2" />
      <path
        d="M150 120 L230 95 Q300 130 370 95 L450 120 L430 200 L400 190 L400 510 Q300 530 200 510 L200 190 L170 200 Z"
        fill="#f4f5f7"
        stroke="#c4c8cf"
        strokeWidth="2"
      />
      <path
        d="M255 100 Q300 140 345 100 L330 150 Q300 168 270 150 Z"
        fill="#eceef1"
        stroke="#c4c8cf"
        strokeWidth="2"
      />
      <rect
        x="293"
        y="150"
        width="14"
        height="120"
        fill="#eceef1"
        stroke="#c4c8cf"
        strokeWidth="1.5"
      />
      <circle cx="300" cy="178" r="3.5" fill="#c4c8cf" />
      <circle cx="300" cy="232" r="3.5" fill="#c4c8cf" />
      <path
        d="M150 120 L120 230 L175 250 L200 175 Z"
        fill="#eef0f3"
        stroke="#c4c8cf"
        strokeWidth="2"
      />
      <path
        d="M450 120 L480 230 L425 250 L400 175 Z"
        fill="#eef0f3"
        stroke="#c4c8cf"
        strokeWidth="2"
      />
      {logo === "center"
        ? emblem(300, 300, 1.55)
        : emblem(228, 207, 0.92)}

      {guides && (
        <g>
          <rect
            x="36"
            y="36"
            width="528"
            height="528"
            fill="none"
            stroke="#5BDBEF"
            strokeWidth="1.5"
            strokeDasharray="8 6"
            opacity="0.7"
          />
          <rect
            x="18"
            y="18"
            width="564"
            height="564"
            fill="none"
            stroke="#da5245"
            strokeWidth="1.5"
            strokeDasharray="4 4"
            opacity="0.6"
          />
          <text x="44" y="28" fontSize="11" fill="#5BDBEF" fontWeight="700">
            SAFE
          </text>
          <text x="520" y="576" fontSize="11" fill="#da5245" fontWeight="700">
            BLEED
          </text>
        </g>
      )}
    </svg>
  );
}

function assetUrl(s3Key: string): string {
  return `/api/proof-assets/serve?key=${encodeURIComponent(s3Key)}`;
}

function ProofImage({ s3Key, alt }: { s3Key: string; alt: string }) {
  const [error, setError] = useState(false);
  if (error) {
    return (
      <div className="flex h-full w-full flex-col items-center justify-center gap-3 bg-surface-bg">
        <ImageIcon className="h-12 w-12 text-ink-faint" />
        <p className="max-w-[200px] truncate text-xs text-ink-muted">{alt}</p>
      </div>
    );
  }
  return (
    <img
      src={assetUrl(s3Key)}
      alt={alt}
      className="h-full w-full object-contain"
      onError={() => setError(true)}
    />
  );
}

// ─── Seed Data (demo mode) ────────────────────────────────────────────

const SEED_VERSIONS: Version[] = [
  {
    id: "v1",
    n: 1,
    status: "SUPERSEDED",
    by: "CCC Admin",
    at: "May 12",
    logo: "center",
  },
  {
    id: "v2",
    n: 2,
    status: "SENT",
    by: "CCC Admin",
    at: "May 18",
    logo: "leftchest",
  },
];

const SEED_ANNOTATIONS: Annotation[] = [
  {
    id: "a1",
    versionId: "v2",
    type: "pin",
    x: 0.355,
    y: 0.345,
    status: "OPEN",
    author: "Jane Smith",
    role: "client",
    at: "1d ago",
    comments: [
      {
        id: "c1",
        author: "Jane Smith",
        role: "client",
        at: "1d ago",
        internal: false,
        body: 'Left chest looks great. Can we take the emblem down ~0.25" — feels a touch large vs the mock.',
      },
      {
        id: "c2",
        author: "CCC Admin",
        role: "staff",
        at: "22h ago",
        internal: false,
        body: 'Easy — I\'ll resize to 3.25" wide on the next pass.',
      },
    ],
  },
  {
    id: "a2",
    versionId: "v2",
    type: "region",
    x: 0.3,
    y: 0.135,
    w: 0.16,
    h: 0.07,
    status: "OPEN",
    author: "Jane Smith",
    role: "client",
    at: "1d ago",
    comments: [
      {
        id: "c3",
        author: "Jane Smith",
        role: "client",
        at: "1d ago",
        internal: false,
        body: "Collar — confirm this is navy thread, not black?",
      },
      {
        id: "c4",
        author: "CCC Admin",
        role: "staff",
        at: "20h ago",
        internal: true,
        body: "INTERNAL: need to check with production if navy thread is in stock for this run before I promise it.",
      },
    ],
  },
  {
    id: "a3",
    versionId: "v2",
    type: "pin",
    x: 0.5,
    y: 0.72,
    status: "RESOLVED",
    author: "CCC Admin",
    role: "staff",
    at: "20h ago",
    comments: [
      {
        id: "c5",
        author: "CCC Admin",
        role: "staff",
        at: "20h ago",
        internal: false,
        body: "Hem tag placement confirmed against spec sheet.",
      },
    ],
  },
];

// ─── Main Component ───────────────────────────────────────────────────

type ProofStudioProps = {
  proofId?: string;
};

export default function ProofStudio({ proofId }: ProofStudioProps) {
  const isLive = !!proofId;

  // ── Session ───────────────────────────────────────────────────────
  const { data: session } = useSession();
  const sessionRole: Role = (session?.user as any)?.role === "CCC_STAFF" ? "staff" : "client";

  // ── tRPC query ────────────────────────────────────────────────────
  const [activeVersionId, setActiveVersionId] = useState<string | null>(null);
  const utils = trpc.useUtils();
  const { data: proofData } = trpc.proof.byId.useQuery(
    { proofId: proofId!, versionId: activeVersionId ?? undefined },
    { enabled: isLive }
  );

  // ── tRPC mutations ────────────────────────────────────────────────
  const createRevisionMut = trpc.proof.createRevision.useMutation();
  const confirmAssetMut = trpc.proof.confirmAsset.useMutation();
  const publishMut = trpc.proof.publish.useMutation();
  const addAnnotationMut = trpc.proof.addAnnotation.useMutation();
  const addCommentMut = trpc.proof.addComment.useMutation();
  const setAnnotationStatusMut = trpc.proof.setAnnotationStatus.useMutation();
  const decideMut = trpc.proof.decide.useMutation();

  const refetch = () => {
    if (proofId) utils.proof.byId.invalidate({ proofId });
  };

  // ── Map server data to local types ────────────────────────────────
  const liveVersions = useMemo((): Version[] => {
    if (!proofData) return [];
    return proofData.versions.map((v: any) => ({
      id: v.id,
      n: v.versionNumber,
      status: v.status as VersionStatus,
      by: "",
      at: "",
      logo: "",
    }));
  }, [proofData]);

  const liveAnnotations = useMemo((): Annotation[] => {
    if (!proofData?.version) return [];
    const ver = proofData.version;
    return (ver.annotations ?? []).map((a: any) => ({
      id: a.id,
      versionId: ver.id,
      type: (a.type as string).toLowerCase() as AnnotationType,
      x: Number(a.x),
      y: Number(a.y),
      w: a.w != null ? Number(a.w) : undefined,
      h: a.h != null ? Number(a.h) : undefined,
      status: a.status as AnnotationStatus,
      author: a.author.name ?? "Unknown",
      role: toRole(a.author.role),
      at: timeAgo(a.createdAt),
      comments: (a.comments ?? []).map((c: any) => ({
        id: c.id,
        author: c.author.name ?? "Unknown",
        role: toRole(c.author.role),
        at: timeAgo(c.createdAt),
        internal: c.isInternal,
        body: c.body,
      })),
    }));
  }, [proofData]);

  const liveAssets = useMemo(() => {
    if (!proofData?.version) return [];
    return proofData.version.assets ?? [];
  }, [proofData]);

  const liveCurId = proofData?.version?.id ?? "";
  const liveApproval = proofData?.version?.approvals?.[0];

  // ── Demo state ────────────────────────────────────────────────────
  const [demoRole, setDemoRole] = useState<Role>("client");
  const [demoVersions, setDemoVersions] = useState<Version[]>(SEED_VERSIONS);
  const [demoCurId, setDemoCurId] = useState("v2");
  const [demoAnnotations, setDemoAnnotations] = useState<Annotation[]>(SEED_ANNOTATIONS);

  // ── Resolved state (live vs demo) ─────────────────────────────────
  const role = isLive ? sessionRole : demoRole;
  const versions = isLive ? liveVersions : demoVersions;
  const curId = isLive ? liveCurId : demoCurId;
  const annotations = isLive ? liveAnnotations : demoAnnotations;

  const setCurId = (id: string) => {
    if (isLive) {
      setActiveVersionId(id);
    } else {
      setDemoCurId(id);
    }
  };

  // ── Shared UI state ───────────────────────────────────────────────
  const [tool, setTool] = useState<"select" | "pin" | "region">("select");
  const [zoom, setZoom] = useState(1);
  const [guides, setGuides] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);
  const [filter, setFilter] = useState<"OPEN" | "RESOLVED" | "ALL">("OPEN");
  const [compare, setCompare] = useState(false);
  const [wipe, setWipe] = useState(50);
  const [draft, setDraft] = useState<Record<string, string>>({});
  const [newInternal, setNewInternal] = useState(false);
  const [showApprove, setShowApprove] = useState(false);
  const [signName, setSignName] = useState("");
  const [signChecked, setSignChecked] = useState(false);
  const [verDropdown, setVerDropdown] = useState(false);
  const [dragRegion, setDragRegion] = useState<{
    x0: number;
    y0: number;
    x1: number;
    y1: number;
  } | null>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

  // ── Pending annotation (live mode: user must type before saving) ──
  const [pendingAnno, setPendingAnno] = useState<{
    geo: { x: number; y: number; w?: number; h?: number };
    type: AnnotationType;
  } | null>(null);
  const [pendingBody, setPendingBody] = useState("");

  // ── Error feedback ────────────────────────────────────────────────
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // ── File upload state (live DRAFT mode) ───────────────────────────
  const [uploadFiles, setUploadFiles] = useState<FileEntry[]>([]);
  const [uploadDragOver, setUploadDragOver] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [isCreatingRevision, setIsCreatingRevision] = useState(false);
  const uploadInputRef = useRef<HTMLInputElement>(null);

  // ── Derived ───────────────────────────────────────────────────────
  const cur = versions.find((v) => v.id === curId);
  const curStatus = cur?.status ?? "DRAFT";
  const prev = cur ? versions.find((v) => v.n === cur.n - 1) : undefined;
  const locked = curStatus === "APPROVED" || curStatus === "SUPERSEDED";

  const visibleAnnos = useMemo(() => {
    return annotations
      .filter((a) => a.versionId === curId)
      .map((a) => ({
        ...a,
        comments: a.comments.filter(
          (c) => role === "staff" || !c.internal
        ),
      }))
      .filter((a) => a.comments.length > 0 || a.author);
  }, [annotations, curId, role]);

  const openCount = visibleAnnos.filter(
    (a) => a.status === "OPEN"
  ).length;
  const railList = visibleAnnos.filter((a) =>
    filter === "ALL" ? true : a.status === filter
  );
  const numberOf = (id: string) =>
    visibleAnnos.findIndex((a) => a.id === id) + 1;

  // ── Canvas helpers ────────────────────────────────────────────────
  const toNorm = (clientX: number, clientY: number) => {
    const r = overlayRef.current!.getBoundingClientRect();
    return {
      x: (clientX - r.left) / r.width,
      y: (clientY - r.top) / r.height,
    };
  };

  // ── Handlers ──────────────────────────────────────────────────────

  const addAnnotation = useCallback(
    (
      geo: { x: number; y: number; w?: number; h?: number },
      type: AnnotationType
    ) => {
      if (isLive) {
        if (!liveAssets[0]?.id || !curId) return;
        setPendingAnno({ geo, type });
        setPendingBody("");
        setTool("select");
        setFilter("ALL");
      } else {
        const id = "a" + Math.random().toString(36).slice(2, 7);
        const a: Annotation = {
          id,
          versionId: curId,
          type,
          ...geo,
          status: "OPEN",
          author: role === "staff" ? "CCC Admin" : "Jane Smith",
          role,
          at: "just now",
          comments: [],
        };
        setDemoAnnotations((p) => [...p, a]);
        setSelected(id);
        setTool("select");
        setFilter("ALL");
      }
    },
    [curId, role, isLive, liveAssets]
  );

  const commitPendingAnnotation = async () => {
    if (!pendingAnno || !pendingBody.trim() || !isLive) return;
    const assetId = liveAssets[0]?.id;
    if (!assetId || !curId) return;
    try {
      await addAnnotationMut.mutateAsync({
        versionId: curId,
        assetId,
        type: pendingAnno.type.toUpperCase() as "PIN" | "REGION",
        x: pendingAnno.geo.x,
        y: pendingAnno.geo.y,
        w: pendingAnno.geo.w,
        h: pendingAnno.geo.h,
        body: pendingBody.trim(),
      });
      refetch();
    } catch (err: any) {
      setErrorMsg(err.message ?? "Failed to add annotation");
    }
    setPendingAnno(null);
    setPendingBody("");
  };

  const onOverlayDown = (e: React.MouseEvent) => {
    if (locked || compare) return;
    if (tool === "pin") {
      addAnnotation(toNorm(e.clientX, e.clientY), "pin");
    } else if (tool === "region") {
      const p = toNorm(e.clientX, e.clientY);
      setDragRegion({ x0: p.x, y0: p.y, x1: p.x, y1: p.y });
    } else {
      setSelected(null);
    }
  };
  const onOverlayMove = (e: React.MouseEvent) => {
    if (!dragRegion) return;
    const p = toNorm(e.clientX, e.clientY);
    setDragRegion((d) => (d ? { ...d, x1: p.x, y1: p.y } : null));
  };
  const onOverlayUp = () => {
    if (!dragRegion) return;
    const { x0, y0, x1, y1 } = dragRegion;
    const w = Math.abs(x1 - x0);
    const h = Math.abs(y1 - y0);
    if (w > 0.02 && h > 0.02) {
      addAnnotation(
        { x: Math.min(x0, x1), y: Math.min(y0, y1), w, h },
        "region"
      );
    }
    setDragRegion(null);
  };

  const postReply = async (annoId: string) => {
    const body = (draft[annoId] || "").trim();
    if (!body) return;

    if (isLive) {
      try {
        await addCommentMut.mutateAsync({
          annotationId: annoId,
          body,
          isInternal: role === "staff" ? newInternal : false,
        });
        refetch();
      } catch (err: any) {
        setErrorMsg(err.message ?? "Failed to post comment");
        return;
      }
    } else {
      setDemoAnnotations((p) =>
        p.map((a) =>
          a.id === annoId
            ? {
                ...a,
                comments: [
                  ...a.comments,
                  {
                    id: "c" + Math.random().toString(36).slice(2, 6),
                    author:
                      role === "staff" ? "CCC Admin" : "Jane Smith",
                    role,
                    at: "just now",
                    internal: role === "staff" ? newInternal : false,
                    body,
                  },
                ],
              }
            : a
        )
      );
    }
    setDraft((d) => ({ ...d, [annoId]: "" }));
    setNewInternal(false);
  };

  const setAnnotationStatus = async (annoId: string, status: AnnotationStatus) => {
    if (isLive) {
      try {
        await setAnnotationStatusMut.mutateAsync({
          annotationId: annoId,
          status,
        });
        refetch();
      } catch (err: any) {
        setErrorMsg(err.message ?? "Failed to update status");
        return;
      }
    } else {
      setDemoAnnotations((p) =>
        p.map((a) => (a.id === annoId ? { ...a, status } : a))
      );
    }
  };

  const requestChanges = async () => {
    if (isLive) {
      try {
        await decideMut.mutateAsync({
          versionId: curId,
          decision: "CHANGES_REQUESTED",
        });
        refetch();
      } catch (err: any) {
        setErrorMsg(err.message ?? "Failed to request changes");
        return;
      }
    } else {
      setDemoVersions((p) =>
        p.map((v) =>
          v.id === curId
            ? { ...v, status: "CHANGES_REQUESTED" as VersionStatus }
            : v
        )
      );
    }
    setSelected(null);
  };

  const confirmApprove = async () => {
    if (isLive) {
      try {
        await decideMut.mutateAsync({
          versionId: curId,
          decision: "APPROVED",
          signedName: signName.trim(),
        });
        refetch();
      } catch (err: any) {
        setErrorMsg(err.message ?? "Failed to approve proof");
        return;
      }
    } else {
      setDemoVersions((p) =>
        p.map((v) =>
          v.id === curId
            ? { ...v, status: "APPROVED" as VersionStatus }
            : v
        )
      );
    }
    setShowApprove(false);
    setSignName("");
    setSignChecked(false);
    setSelected(null);
  };

  const closeApproveModal = () => {
    setShowApprove(false);
    setSignName("");
    setSignChecked(false);
  };

  const handleCreateRevision = async () => {
    if (!isLive || !proofId) return;
    setIsCreatingRevision(true);
    try {
      const newVersion = await createRevisionMut.mutateAsync({
        proofId,
        fromVersionId: curId,
      });
      setActiveVersionId(newVersion.id);
      refetch();
      setUploadFiles([]);
    } finally {
      setIsCreatingRevision(false);
    }
  };

  const addUploadFiles = useCallback((incoming: FileList | File[]) => {
    const allowed = ["image/png", "image/jpeg", "image/webp", "application/pdf"];
    const entries: FileEntry[] = Array.from(incoming)
      .filter((f) => allowed.includes(f.type))
      .map((file) => ({
        file,
        preview: file.type.startsWith("image/")
          ? URL.createObjectURL(file)
          : undefined,
        status: "pending" as const,
      }));
    setUploadFiles((prev) => [...prev, ...entries]);
  }, []);

  const removeUploadFile = useCallback((index: number) => {
    setUploadFiles((prev) => {
      const entry = prev[index];
      if (entry?.preview) URL.revokeObjectURL(entry.preview);
      return prev.filter((_, i) => i !== index);
    });
  }, []);

  const handleUploadFiles = async () => {
    if (!isLive || !curId || uploadFiles.length === 0) return;
    setIsUploading(true);
    try {
      for (let i = 0; i < uploadFiles.length; i++) {
        const entry = uploadFiles[i];
        setUploadFiles((prev) =>
          prev.map((f, idx) => (idx === i ? { ...f, status: "uploading" } : f))
        );

        const kind = entry.file.type === "application/pdf" ? ("PDF" as const) : ("IMAGE" as const);
        let width: number | undefined;
        let height: number | undefined;
        if (entry.file.type.startsWith("image/")) {
          try {
            const dims = await getImageDimensions(entry.file);
            width = dims.width;
            height = dims.height;
          } catch {}
        }

        const s3Key = `proofs/${proofId}/${curId}/${entry.file.name}`;

        const form = new FormData();
        form.append("file", entry.file);
        form.append("s3Key", s3Key);
        const uploadRes = await fetch("/api/proof-assets/upload", { method: "POST", body: form });
        if (!uploadRes.ok) {
          console.error("Upload failed:", await uploadRes.text());
        }

        await confirmAssetMut.mutateAsync({
          versionId: curId,
          s3Key,
          fileName: entry.file.name,
          mimeType: entry.file.type,
          kind,
          width,
          height,
        });

        setUploadFiles((prev) =>
          prev.map((f, idx) => (idx === i ? { ...f, status: "done" } : f))
        );
      }
      refetch();
    } finally {
      setIsUploading(false);
    }
  };

  const handlePublish = async () => {
    if (!isLive || !curId) return;
    setIsPublishing(true);
    try {
      await publishMut.mutateAsync({ versionId: curId });
      refetch();
      utils.proof.list.invalidate();
    } finally {
      setIsPublishing(false);
    }
  };

  // Demo-only: publish revision with local state
  const demoPublishRevision = () => {
    const nextN = Math.max(...demoVersions.map((v) => v.n)) + 1;
    const nv: Version = {
      id: "v" + nextN,
      n: nextN,
      status: "SENT",
      by: "CCC Admin",
      at: "just now",
      logo: "leftchest",
    };
    setDemoVersions((p) => [
      ...p.map((v) =>
        v.id === demoCurId
          ? { ...v, status: "SUPERSEDED" as VersionStatus }
          : v
      ),
      nv,
    ]);
    setDemoAnnotations((p) => [
      ...p,
      ...demoAnnotations
        .filter((a) => a.versionId === demoCurId && a.status === "OPEN")
        .map((a) => ({ ...a, id: a.id + "_r", versionId: nv.id })),
    ]);
    setDemoCurId(nv.id);
    setCompare(false);
  };

  const canApprove =
    role === "client" && curStatus !== "APPROVED" && openCount === 0;

  // ── Loading state ─────────────────────────────────────────────────
  if (isLive && !proofData) {
    return (
      <div className="flex h-[640px] items-center justify-center rounded-lg border border-surface-border bg-surface-bg">
        <Loader2 className="h-6 w-6 animate-spin text-coral" />
      </div>
    );
  }

  // ── Render ────────────────────────────────────────────────────────

  return (
    <div className="relative flex min-h-[640px] flex-col overflow-hidden rounded-lg border border-surface-border bg-surface-bg">
      {/* Error toast */}
      {errorMsg && (
        <div className="absolute left-1/2 top-4 z-50 flex -translate-x-1/2 items-center gap-2 rounded-lg border border-red-500/30 bg-red-950 px-4 py-2.5 shadow-lg">
          <AlertTriangle size={14} className="text-red-400" />
          <span className="text-xs text-red-300">{errorMsg}</span>
          <button onClick={() => setErrorMsg(null)} className="ml-2 text-red-400 hover:text-white">
            <X size={14} />
          </button>
        </div>
      )}

      {/* Pending annotation prompt */}
      {pendingAnno && (
        <div className="absolute left-1/2 top-4 z-50 flex -translate-x-1/2 items-center gap-2 rounded-lg border border-coral/30 bg-surface-card px-4 py-3 shadow-lg">
          <MapPin size={14} className="text-coral" />
          <input
            value={pendingBody}
            onChange={(e) => setPendingBody(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") commitPendingAnnotation(); if (e.key === "Escape") { setPendingAnno(null); setPendingBody(""); } }}
            placeholder="Type your comment and press Enter..."
            autoFocus
            className="w-64 rounded-md border border-surface-border bg-surface-bg px-2.5 py-1.5 text-xs text-ink outline-none focus:border-coral"
          />
          <button onClick={commitPendingAnnotation} disabled={!pendingBody.trim()} className="rounded-md bg-coral px-3 py-1.5 text-xs font-bold text-white disabled:opacity-40">
            Post
          </button>
          <button onClick={() => { setPendingAnno(null); setPendingBody(""); }} className="text-ink-faint hover:text-white">
            <X size={14} />
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center gap-4 border-b border-surface-border bg-surface-card px-5 py-3.5">
        <div className="min-w-0 flex-1">
          <div className="label-eyebrow text-[10px]">
            {isLive
              ? `PROOF${proofData?.order?.number ? " · " + proofData.order.number : ""}${proofData?.company?.name ? " · " + proofData.company.name.toUpperCase() : ""}`
              : "PROOF · ORD-2026-001 · ACME CORP"}
          </div>
          <div className="mt-1 flex items-center gap-3">
            <h2 className="text-lg font-bold tracking-tight">
              {isLive ? proofData?.title : "Acme Polo — Left Chest Logo"}
            </h2>
            <StatusPill status={curStatus} />
          </div>
        </div>

        {!isLive && (
          <div className="flex items-center gap-1.5 text-xs text-ink-muted">
            <Users size={14} />
            <div className="flex">
              <div className="-mr-2">
                <Avatar name="CCC Admin" role="staff" size={24} />
              </div>
              <Avatar name="Jane Smith" role="client" size={24} />
            </div>
          </div>
        )}
        {isLive && proofData?.company && (
          <div className="flex items-center gap-2 text-xs text-ink-muted">
            <span className="rounded bg-surface-bg px-2 py-1 font-label text-[10px] uppercase tracking-label">
              {proofData.company.name}
            </span>
          </div>
        )}

        {/* Role toggle — demo mode only */}
        {!isLive && (
          <div className="flex rounded-lg border border-surface-border bg-surface-card p-0.5">
            {(["client", "staff"] as Role[]).map((r) => (
              <button
                key={r}
                onClick={() => {
                  setDemoRole(r);
                  setSelected(null);
                }}
                className={cn(
                  "rounded-md px-3 py-1.5 text-xs font-bold tracking-wide",
                  demoRole === r
                    ? r === "staff"
                      ? "bg-coral text-white"
                      : "bg-blue-500 text-white"
                    : "text-ink-muted"
                )}
              >
                {r === "staff" ? "CCC Staff" : "Client"}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="flex min-h-0 flex-1">
        {/* Stage (left) */}
        <div className="flex min-w-0 flex-1 flex-col">
          {/* Toolbar */}
          <div className="flex items-center gap-2 border-b border-surface-border bg-surface-card px-3.5 py-2.5">
            {(
              [
                { id: "select", icon: MousePointer2, label: "Select" },
                { id: "pin", icon: MapPin, label: "Pin" },
                { id: "region", icon: Square, label: "Region" },
              ] as const
            ).map((t) => {
              const dis = locked || compare;
              const active = tool === t.id;
              return (
                <button
                  key={t.id}
                  disabled={dis}
                  onClick={() => setTool(t.id)}
                  title={t.label}
                  className={cn(
                    "flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-xs font-semibold transition-colors",
                    active
                      ? "border-coral bg-coral/15 text-coral"
                      : dis
                        ? "border-surface-border bg-surface-card text-ink-dim cursor-not-allowed"
                        : "border-surface-border bg-surface-card text-ink-muted hover:text-ink"
                  )}
                >
                  <t.icon size={15} />
                  {t.label}
                </button>
              );
            })}

            <div className="mx-1 h-5 w-px bg-surface-border" />

            <button
              onClick={() => setGuides((g) => !g)}
              title="Print guides"
              className={cn(
                "flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-xs font-semibold transition-colors",
                guides
                  ? "border-cyan-400 bg-cyan-400/15 text-cyan-400"
                  : "border-surface-border bg-surface-card text-ink-muted hover:text-ink"
              )}
            >
              <Ruler size={15} />
              Guides
            </button>

            <div className="flex-1" />

            {prev && (
              <button
                onClick={() => {
                  setCompare((c) => !c);
                  setTool("select");
                  setSelected(null);
                }}
                title="Compare versions"
                className={cn(
                  "flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-xs font-semibold transition-colors",
                  compare
                    ? "border-purple-400 bg-purple-400/15 text-purple-400"
                    : "border-surface-border bg-surface-card text-ink-muted hover:text-ink"
                )}
              >
                <GitCompareArrows size={15} />
                Compare
              </button>
            )}

            {/* Version dropdown */}
            <div className="relative">
              <button
                onClick={() => setVerDropdown((d) => !d)}
                className="flex items-center gap-1.5 rounded-md border border-surface-border bg-surface-card px-2.5 py-1.5 text-xs font-bold text-ink"
              >
                v{cur?.n ?? 1}
                <ChevronDown size={14} />
              </button>
              {verDropdown && (
                <div className="absolute right-0 top-9 z-30 w-48 rounded-lg border border-surface-border bg-surface-card p-1.5 shadow-lg">
                  {[...versions]
                    .sort((a, b) => b.n - a.n)
                    .map((v) => (
                      <div
                        key={v.id}
                        onClick={() => {
                          setCurId(v.id);
                          setVerDropdown(false);
                          setCompare(false);
                          setSelected(null);
                          setZoom(1);
                          setFilter("OPEN");
                          setDraft({});
                          setNewInternal(false);
                          setPendingAnno(null);
                          setPendingBody("");
                          setErrorMsg(null);
                        }}
                        className={cn(
                          "flex cursor-pointer items-center justify-between rounded-md px-2.5 py-2",
                          v.id === curId
                            ? "bg-white/5"
                            : "hover:bg-white/5"
                        )}
                      >
                        <span className="text-[13px] font-bold">
                          v{v.n}
                        </span>
                        <span
                          className={cn(
                            "text-[10px] font-bold",
                            STATUS_META[v.status].color
                          )}
                        >
                          {STATUS_META[v.status].label}
                        </span>
                      </div>
                    ))}
                </div>
              )}
            </div>

            {/* Zoom controls */}
            <div className="flex items-center gap-0 rounded-md border border-surface-border bg-surface-card">
              <button
                onClick={() =>
                  setZoom((z) => Math.max(0.6, +(z - 0.2).toFixed(2)))
                }
                className="p-1.5 text-ink-muted hover:text-ink"
              >
                <ZoomOut size={15} />
              </button>
              <span className="w-9 text-center text-[11px] font-bold text-ink-muted">
                {Math.round(zoom * 100)}%
              </span>
              <button
                onClick={() =>
                  setZoom((z) => Math.min(2.4, +(z + 0.2).toFixed(2)))
                }
                className="p-1.5 text-ink-muted hover:text-ink"
              >
                <ZoomIn size={15} />
              </button>
              <button
                onClick={() => setZoom(1)}
                title="Fit"
                className="p-1.5 text-ink-muted hover:text-ink"
              >
                <Maximize2 size={14} />
              </button>
            </div>
          </div>

          {/* Stage area */}
          <div
            className="flex flex-1 items-start justify-center overflow-auto p-7"
            style={{
              background: "#070709",
              backgroundImage:
                "radial-gradient(circle, rgba(255,255,255,.04) 1px, transparent 1px)",
              backgroundSize: "22px 22px",
            }}
          >
            <div
              style={{
                transform: `scale(${zoom})`,
                transformOrigin: "top center",
                transition: "transform .12s ease",
              }}
            >
              <div className="relative overflow-hidden rounded-lg border border-surface-border shadow-lg"
                style={{ width: 460, height: 460 }}>
                {compare && prev ? (
                  <>
                    {/* Compare mode: wipe slider between versions */}
                    <div className="absolute inset-0">
                      {!isLive ? (
                        <PoloProof logo={prev.logo} guides={guides} />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center bg-surface-bg text-xs text-ink-faint">v{prev.n}</div>
                      )}
                    </div>
                    <div
                      className="absolute inset-0 overflow-hidden border-r-2 border-purple-400"
                      style={{ width: `${wipe}%` }}
                    >
                      <div style={{ width: 460, height: 460 }}>
                        {!isLive ? (
                          <PoloProof logo={cur?.logo ?? "leftchest"} guides={guides} />
                        ) : liveAssets[0] ? (
                          <ProofImage s3Key={liveAssets[0].s3Key} alt={liveAssets[0].fileName} />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center bg-surface-bg text-xs text-ink-faint">No assets</div>
                        )}
                      </div>
                    </div>
                    <div className="absolute left-2.5 top-2 rounded bg-purple-500 px-1.5 py-0.5 text-[10px] font-bold text-white">
                      v{cur?.n}
                    </div>
                    <div className="absolute right-2.5 top-2 rounded bg-black/50 px-1.5 py-0.5 text-[10px] font-bold text-white">
                      v{prev.n}
                    </div>
                  </>
                ) : (
                  /* Normal mode: show current version's proof image */
                  !isLive ? (
                    <PoloProof logo={cur?.logo ?? "leftchest"} guides={guides} />
                  ) : liveAssets[0] ? (
                    <ProofImage s3Key={liveAssets[0].s3Key} alt={liveAssets[0].fileName} />
                  ) : (
                    <div className="flex h-full w-full flex-col items-center justify-center gap-3 bg-surface-bg">
                      <Upload className="h-10 w-10 text-ink-faint" />
                      <p className="text-xs text-ink-muted">No assets uploaded yet</p>
                      {role === "staff" && curStatus === "DRAFT" && (
                        <p className="text-[10px] text-ink-faint">Upload files in the panel on the right</p>
                      )}
                    </div>
                  )
                )}

                {!compare && (
                  <div
                    ref={overlayRef}
                    onMouseDown={onOverlayDown}
                    onMouseMove={onOverlayMove}
                    onMouseUp={onOverlayUp}
                    onMouseLeave={onOverlayUp}
                    className="absolute inset-0"
                    style={{
                      cursor:
                        tool === "select" ? "default" : "crosshair",
                    }}
                  >
                    {visibleAnnos.map((a) => {
                      const num = numberOf(a.id);
                      const isSel = selected === a.id;
                      const isResolved = a.status === "RESOLVED";
                      const col = isResolved ? "#34C759" : "#da5245";

                      if (a.type === "region") {
                        return (
                          <div
                            key={a.id}
                            onMouseDown={(e) => {
                              if (tool === "select") {
                                e.stopPropagation();
                                setSelected(a.id);
                              }
                            }}
                            className="absolute rounded-sm"
                            style={{
                              left: `${a.x * 100}%`,
                              top: `${a.y * 100}%`,
                              width: `${(a.w ?? 0) * 100}%`,
                              height: `${(a.h ?? 0) * 100}%`,
                              border: `2px solid ${col}`,
                              background: `${col}1a`,
                              boxShadow: isSel
                                ? `0 0 0 3px ${col}55`
                                : "none",
                            }}
                          >
                            <span
                              className="absolute -left-[11px] -top-[11px] flex h-[22px] w-[22px] items-center justify-center rounded-full text-[11px] font-extrabold"
                              style={{
                                background: col,
                                color: "#1a1a1a",
                              }}
                            >
                              {num}
                            </span>
                          </div>
                        );
                      }
                      return (
                        <div
                          key={a.id}
                          onMouseDown={(e) => {
                            if (tool === "select") {
                              e.stopPropagation();
                              setSelected(a.id);
                            }
                          }}
                          className="absolute"
                          style={{
                            left: `${a.x * 100}%`,
                            top: `${a.y * 100}%`,
                            transform: "translate(-50%,-100%)",
                          }}
                        >
                          <div
                            className="flex h-[26px] w-[26px] items-center justify-center"
                            style={{
                              borderRadius: "50% 50% 50% 2px",
                              transform: "rotate(45deg)",
                              background: col,
                              boxShadow: isSel
                                ? `0 0 0 4px ${col}55`
                                : "0 2px 6px rgba(0,0,0,.4)",
                            }}
                          >
                            <span
                              className="text-xs font-extrabold"
                              style={{
                                transform: "rotate(-45deg)",
                                color: "#1a1a1a",
                              }}
                            >
                              {num}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                    {dragRegion && (
                      <div
                        className="absolute border-2 border-dashed border-coral bg-coral/10"
                        style={{
                          left: `${Math.min(dragRegion.x0, dragRegion.x1) * 100}%`,
                          top: `${Math.min(dragRegion.y0, dragRegion.y1) * 100}%`,
                          width: `${Math.abs(dragRegion.x1 - dragRegion.x0) * 100}%`,
                          height: `${Math.abs(dragRegion.y1 - dragRegion.y0) * 100}%`,
                        }}
                      />
                    )}
                  </div>
                )}

                {curStatus === "APPROVED" && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-2.5 bg-black/55">
                    <div className="flex h-[54px] w-[54px] items-center justify-center rounded-full bg-emerald-500">
                      <Lock size={24} color="#0A0A0C" />
                    </div>
                    <div className="text-[13px] font-extrabold tracking-[0.14em] text-emerald-400">
                      APPROVED FOR PRODUCTION
                    </div>
                    <div className="text-[11px] text-ink-muted">
                      {isLive && liveApproval
                        ? `Signed by ${liveApproval.signedBy.name}`
                        : "Signed by Jane Smith"}
                    </div>
                  </div>
                )}
              </div>

              {compare && (
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={wipe}
                  onChange={(e) => setWipe(+e.target.value)}
                  className="mt-3.5"
                  style={{ width: 460, accentColor: "#A78BFA" }}
                />
              )}
            </div>
          </div>
        </div>

        {/* Right rail */}
        <div className="flex w-[360px] flex-col border-l border-surface-border bg-surface-card">
          {/* Action panel */}
          <div className="border-b border-surface-border p-4">
            {role === "client" ? (
              /* ── Client actions ─── */
              curStatus === "APPROVED" ? (
                <div className="flex items-center gap-2.5 text-[13px] font-bold text-emerald-400">
                  <ShieldCheck size={18} /> You approved this proof.
                </div>
              ) : curStatus === "SUPERSEDED" ? (
                <div className="text-[12px] text-ink-muted">
                  This version has been superseded by a newer revision.
                </div>
              ) : curStatus === "DRAFT" ? (
                <div className="text-[12px] text-ink-muted">
                  This version is still being prepared.
                </div>
              ) : (
                <>
                  <div className="flex gap-2.5">
                    <button
                      disabled={!canApprove}
                      onClick={() => setShowApprove(true)}
                      className={cn(
                        "flex flex-1 items-center justify-center gap-2 rounded-lg py-2.5 text-[13px] font-extrabold tracking-wide",
                        canApprove
                          ? "bg-emerald-500 text-black cursor-pointer"
                          : "bg-surface-card text-ink-dim cursor-not-allowed"
                      )}
                    >
                      <Check size={16} /> Approve & lock
                    </button>
                    <button
                      onClick={requestChanges}
                      className="whitespace-nowrap rounded-lg border border-yellow-400 px-3.5 py-2.5 text-[13px] font-bold text-yellow-400 hover:bg-yellow-400/10"
                    >
                      Request changes
                    </button>
                  </div>
                  {!canApprove && (curStatus as string) !== "APPROVED" && openCount > 0 && (
                    <div className="mt-2 flex items-center gap-1.5 text-[11.5px] text-yellow-400">
                      <AlertTriangle size={13} /> {openCount} open
                      comment{openCount !== 1 ? "s" : ""} must be
                      resolved before approval.
                    </div>
                  )}
                </>
              )
            ) : (
              /* ── Staff actions ─── */
              isLive ? (
                /* Live mode staff actions — context-dependent */
                curStatus === "DRAFT" ? (
                  <div className="space-y-3">
                    <div className="text-[12px] font-bold text-ink-muted">
                      Draft — upload proof files and publish when ready.
                    </div>

                    {/* Existing assets */}
                    {liveAssets.length > 0 && (
                      <div className="space-y-1">
                        <div className="label-eyebrow text-[10px]">UPLOADED ASSETS</div>
                        {liveAssets.map((asset: any) => (
                          <div key={asset.id} className="flex items-center gap-2 rounded-md border border-surface-border bg-surface-bg px-2.5 py-1.5">
                            {asset.kind === "IMAGE" ? (
                              <ImageIcon className="h-4 w-4 text-ink-faint" />
                            ) : (
                              <FileText className="h-4 w-4 text-ink-faint" />
                            )}
                            <span className="flex-1 truncate text-[11px] text-white">{asset.fileName}</span>
                            {asset.width && asset.height && (
                              <span className="text-[10px] text-ink-faint">{asset.width}x{asset.height}</span>
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                    {/* File drop zone */}
                    <div>
                      <div
                        onDragOver={(e) => { e.preventDefault(); setUploadDragOver(true); }}
                        onDragLeave={() => setUploadDragOver(false)}
                        onDrop={(e) => {
                          e.preventDefault();
                          setUploadDragOver(false);
                          if (e.dataTransfer.files.length) addUploadFiles(e.dataTransfer.files);
                        }}
                        onClick={() => uploadInputRef.current?.click()}
                        className={cn(
                          "flex min-h-[80px] cursor-pointer flex-col items-center justify-center rounded-md border-2 border-dashed transition-colors",
                          uploadDragOver
                            ? "border-coral bg-coral/10"
                            : "border-surface-border bg-surface-bg/50 hover:border-ink-faint"
                        )}
                      >
                        <Upload className={cn("h-6 w-6", uploadDragOver ? "text-coral" : "text-ink-faint")} />
                        <p className="mt-1.5 text-[11px] text-ink-muted">
                          Drop files here or click to browse
                        </p>
                        <p className="text-[10px] text-ink-faint">PNG, JPG, WebP, PDF</p>
                      </div>
                      <input
                        ref={uploadInputRef}
                        type="file"
                        multiple
                        accept="image/png,image/jpeg,image/webp,application/pdf"
                        className="hidden"
                        onChange={(e) => {
                          if (e.target.files?.length) addUploadFiles(e.target.files);
                          e.target.value = "";
                        }}
                      />
                    </div>

                    {/* Pending files list */}
                    {uploadFiles.length > 0 && (
                      <div className="space-y-1">
                        {uploadFiles.map((entry, i) => (
                          <div key={i} className="flex items-center gap-2 rounded-md border border-surface-border bg-surface-bg px-2.5 py-1.5">
                            {entry.preview ? (
                              <img src={entry.preview} alt="" className="h-6 w-6 rounded object-cover" />
                            ) : (
                              <FileText className="h-4 w-4 text-ink-faint" />
                            )}
                            <span className="flex-1 truncate text-[11px] text-white">{entry.file.name}</span>
                            {entry.status === "uploading" ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin text-coral" />
                            ) : entry.status === "done" ? (
                              <span className="text-[10px] text-emerald-400">Done</span>
                            ) : (
                              <button
                                onClick={(e) => { e.stopPropagation(); removeUploadFile(i); }}
                                className="rounded p-0.5 text-ink-faint hover:text-white"
                              >
                                <X className="h-3 w-3" />
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Upload + Publish buttons */}
                    <div className="flex gap-2">
                      {uploadFiles.some((f) => f.status === "pending") && (
                        <button
                          onClick={handleUploadFiles}
                          disabled={isUploading}
                          className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-coral py-2 text-[12px] font-bold text-coral hover:bg-coral/10"
                        >
                          {isUploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload size={14} />}
                          {isUploading ? "Uploading..." : "Upload files"}
                        </button>
                      )}
                      <button
                        onClick={handlePublish}
                        disabled={isPublishing || liveAssets.length === 0}
                        className={cn(
                          "flex flex-1 items-center justify-center gap-2 rounded-lg py-2 text-[12px] font-extrabold text-white",
                          liveAssets.length > 0 && !isPublishing
                            ? "bg-coral hover:bg-coral-dark"
                            : "cursor-not-allowed bg-coral/40"
                        )}
                      >
                        {isPublishing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send size={14} />}
                        {isPublishing ? "Publishing..." : "Publish to client"}
                      </button>
                    </div>
                  </div>
                ) : curStatus === "SENT" ? (
                  <div className="flex items-center gap-2.5 text-[12px] text-blue-400">
                    <Eye size={16} />
                    <span className="font-bold">Awaiting client review</span>
                  </div>
                ) : curStatus === "CHANGES_REQUESTED" ? (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-[12px] font-bold text-yellow-400">
                      <AlertTriangle size={15} />
                      Client has requested changes
                    </div>
                    <button
                      onClick={handleCreateRevision}
                      disabled={isCreatingRevision}
                      className="flex w-full items-center justify-center gap-2 rounded-lg bg-coral py-2.5 text-[13px] font-extrabold text-white hover:bg-coral-dark"
                    >
                      {isCreatingRevision ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <PenLine size={15} />
                      )}
                      {isCreatingRevision
                        ? "Creating..."
                        : `Create revision (v${(cur?.n ?? 0) + 1})`}
                    </button>
                    <p className="text-[10px] text-ink-faint">
                      This creates a new draft version. The current version will be marked as superseded.
                    </p>
                  </div>
                ) : curStatus === "APPROVED" ? (
                  <div className="flex items-center gap-2.5 text-[13px] font-bold text-emerald-400">
                    <ShieldCheck size={18} /> Proof approved and locked.
                  </div>
                ) : (
                  <div className="text-[12px] text-ink-muted">
                    This version has been superseded.
                  </div>
                )
              ) : (
                /* Demo mode staff: simple "Publish revision" button */
                <div className="flex gap-2.5">
                  <button
                    onClick={demoPublishRevision}
                    className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-coral py-2.5 text-[13px] font-extrabold text-white hover:bg-coral-dark"
                  >
                    <PenLine size={15} /> Publish revision (v
                    {Math.max(...demoVersions.map((v) => v.n)) + 1})
                  </button>
                </div>
              )
            )}
          </div>

          {/* Filter row */}
          <div className="flex items-center gap-2 px-4 pb-1.5 pt-3">
            <div className="label-eyebrow text-[11px]">
              COMMENTS · {visibleAnnos.length}
            </div>
            <div className="flex-1" />
            {(["OPEN", "RESOLVED", "ALL"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={cn(
                  "rounded-md px-2 py-1 text-[11px] font-bold",
                  filter === f
                    ? "bg-surface-bg text-ink"
                    : "text-ink-dim hover:text-ink-muted"
                )}
              >
                {f[0] + f.slice(1).toLowerCase()}
              </button>
            ))}
          </div>

          {/* Annotation list */}
          <div className="flex-1 space-y-2.5 overflow-y-auto px-3 pb-4 pt-1.5">
            {railList.length === 0 && (
              <div className="px-4 py-10 text-center text-[12.5px] text-ink-dim">
                {tool === "select"
                  ? "No comments here. Pick the Pin or Region tool and click the proof to leave one."
                  : "Click anywhere on the proof to drop a comment."}
              </div>
            )}
            {railList.map((a) => {
              const num = numberOf(a.id);
              const sel = selected === a.id;
              const isResolved = a.status === "RESOLVED";
              const canResolve =
                role === "staff" ||
                a.author ===
                  (role === "client"
                    ? isLive
                      ? (session?.user as any)?.name ?? ""
                      : "Jane Smith"
                    : "CCC Admin");

              return (
                <div
                  key={a.id}
                  onClick={() => setSelected(a.id)}
                  className={cn(
                    "cursor-pointer rounded-lg border p-3",
                    sel
                      ? "border-surface-border bg-surface-bg shadow-[inset_3px_0_0_var(--anno-col)]"
                      : "border-surface-border bg-surface-bg/50 hover:bg-surface-bg"
                  )}
                  style={
                    {
                      "--anno-col": isResolved
                        ? "#34C759"
                        : "#da5245",
                    } as React.CSSProperties
                  }
                >
                  <div className="mb-2 flex items-center gap-2">
                    <span
                      className={cn(
                        "flex h-5 w-5 items-center justify-center rounded-full text-[11px] font-extrabold text-black",
                        isResolved ? "bg-emerald-500" : "bg-coral"
                      )}
                    >
                      {num}
                    </span>
                    <span className="label-eyebrow text-[10px]">
                      {a.type.toUpperCase()}
                    </span>
                    <div className="flex-1" />
                    {isResolved ? (
                      <span className="flex items-center gap-1 text-[10.5px] font-bold text-emerald-400">
                        <CheckCircle2 size={12} />
                        Resolved
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-[10.5px] font-bold text-coral">
                        <CircleDot size={12} />
                        Open
                      </span>
                    )}
                  </div>

                  {a.comments.map((c) => (
                    <div key={c.id} className="mb-2">
                      <div className="mb-0.5 flex items-center gap-1.5">
                        <Avatar name={c.author} role={c.role} size={20} />
                        <span className="text-xs font-bold">
                          {c.author}
                        </span>
                        <RoleBadge role={c.role} />
                        {c.internal && (
                          <span className="flex items-center gap-1 rounded bg-yellow-400/15 px-1.5 py-0.5 text-[9px] font-extrabold text-yellow-400">
                            <EyeOff size={9} /> INTERNAL
                          </span>
                        )}
                        <span className="ml-auto text-[10.5px] text-ink-dim">
                          {c.at}
                        </span>
                      </div>
                      <div
                        className={cn(
                          "text-[12.5px] leading-relaxed",
                          c.internal
                            ? "border-l-2 border-yellow-400 bg-yellow-400/5 pl-2 text-yellow-400"
                            : "pl-7"
                        )}
                      >
                        {c.body}
                      </div>
                    </div>
                  ))}

                  {sel && !locked && (
                    <div className="mt-2.5">
                      <div className="flex gap-1.5">
                        <input
                          value={draft[a.id] || ""}
                          placeholder="Reply..."
                          onChange={(e) =>
                            setDraft((d) => ({
                              ...d,
                              [a.id]: e.target.value,
                            }))
                          }
                          onKeyDown={(e) => {
                            if (e.key === "Enter") postReply(a.id);
                          }}
                          onClick={(e) => e.stopPropagation()}
                          className="flex-1 rounded-md border border-surface-border bg-surface-bg px-2.5 py-2 text-[12.5px] text-ink outline-none focus:border-coral"
                        />
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            postReply(a.id);
                          }}
                          className="rounded-md bg-coral px-2.5 text-white hover:bg-coral-dark"
                        >
                          <Send size={14} />
                        </button>
                      </div>
                      <div className="mt-2 flex items-center gap-2.5">
                        {role === "staff" && (
                          <label
                            onClick={(e) => e.stopPropagation()}
                            className="flex cursor-pointer items-center gap-1.5 text-[11px] text-ink-muted"
                          >
                            <input
                              type="checkbox"
                              checked={newInternal}
                              onChange={(e) =>
                                setNewInternal(e.target.checked)
                              }
                              className="accent-yellow-400"
                            />
                            <EyeOff size={12} /> Internal note
                          </label>
                        )}
                        <div className="flex-1" />
                        {canResolve &&
                          (a.status === "OPEN" ? (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setAnnotationStatus(a.id, "RESOLVED");
                              }}
                              className="flex items-center gap-1.5 rounded-md border border-emerald-500 px-2.5 py-1 text-[11px] font-bold text-emerald-500 hover:bg-emerald-500/10"
                            >
                              <Check size={12} /> Resolve
                            </button>
                          ) : (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setAnnotationStatus(a.id, "OPEN");
                              }}
                              className="rounded-md border border-surface-border px-2.5 py-1 text-[11px] font-bold text-ink-muted hover:text-ink"
                            >
                              Reopen
                            </button>
                          ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Approval ceremony modal */}
      {showApprove && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
          onClick={closeApproveModal}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="mx-4 w-full max-w-[420px] rounded-xl border border-surface-border bg-surface-card p-6 shadow-lg"
          >
            <div className="mb-1.5 flex items-center justify-between">
              <div className="flex items-center gap-2.5 font-display text-base">
                <ShieldCheck size={19} className="text-emerald-400" />{" "}
                Approve for production
              </div>
              <X
                size={18}
                className="cursor-pointer text-ink-dim hover:text-ink"
                onClick={closeApproveModal}
              />
            </div>
            <div className="mb-4 text-[12.5px] leading-relaxed text-ink-muted">
              This locks{" "}
              <b className="text-ink">v{cur?.n}</b> and authorizes
              Central Creative to begin production. No further edits or
              comments can be added after approval. This sign-off is
              recorded with your name and a timestamp.
            </div>
            <label className="label-eyebrow text-[10px]">
              TYPE YOUR FULL NAME TO SIGN
            </label>
            <input
              value={signName}
              onChange={(e) => setSignName(e.target.value)}
              placeholder={isLive ? (session?.user as any)?.name ?? "Your name" : "Jane Smith"}
              autoFocus
              className="mt-1.5 mb-3.5 w-full rounded-lg border border-surface-border bg-surface-bg px-3 py-2.5 text-base italic text-ink outline-none focus:border-coral"
            />
            <label className="mb-4 flex cursor-pointer items-start gap-2.5 text-[12.5px] text-ink-muted">
              <input
                type="checkbox"
                checked={signChecked}
                onChange={(e) => setSignChecked(e.target.checked)}
                className="mt-0.5 accent-emerald-500"
              />
              I confirm this proof is correct and approve it for
              production.
            </label>
            <button
              disabled={!signName.trim() || !signChecked}
              onClick={confirmApprove}
              className={cn(
                "w-full rounded-lg py-3 text-sm font-extrabold",
                signName.trim() && signChecked
                  ? "bg-emerald-500 text-black cursor-pointer"
                  : "bg-surface-bg text-ink-dim cursor-not-allowed"
              )}
            >
              Sign & approve v{cur?.n}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
