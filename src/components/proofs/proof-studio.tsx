"use client";

import React, { useState, useRef, useMemo, useCallback } from "react";
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
} from "lucide-react";
import { cn } from "@/lib/utils";

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

export default function ProofStudio() {
  const [role, setRole] = useState<Role>("client");
  const [versions, setVersions] = useState<Version[]>(SEED_VERSIONS);
  const [curId, setCurId] = useState("v2");
  const [annotations, setAnnotations] =
    useState<Annotation[]>(SEED_ANNOTATIONS);
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

  const cur = versions.find((v) => v.id === curId)!;
  const prev = versions.find((v) => v.n === cur.n - 1);
  const locked =
    cur.status === "APPROVED" || cur.status === "SUPERSEDED";

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

  const toNorm = (clientX: number, clientY: number) => {
    const r = overlayRef.current!.getBoundingClientRect();
    return {
      x: (clientX - r.left) / r.width,
      y: (clientY - r.top) / r.height,
    };
  };

  const addAnnotation = useCallback(
    (
      geo: { x: number; y: number; w?: number; h?: number },
      type: AnnotationType
    ) => {
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
      setAnnotations((p) => [...p, a]);
      setSelected(id);
      setTool("select");
      setFilter("ALL");
    },
    [curId, role]
  );

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

  const postReply = (annoId: string) => {
    const body = (draft[annoId] || "").trim();
    if (!body) return;
    setAnnotations((p) =>
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
    setDraft((d) => ({ ...d, [annoId]: "" }));
    setNewInternal(false);
  };

  const setStatus = (annoId: string, status: AnnotationStatus) =>
    setAnnotations((p) =>
      p.map((a) => (a.id === annoId ? { ...a, status } : a))
    );

  const requestChanges = () => {
    setVersions((p) =>
      p.map((v) =>
        v.id === curId
          ? { ...v, status: "CHANGES_REQUESTED" as VersionStatus }
          : v
      )
    );
    setSelected(null);
  };

  const confirmApprove = () => {
    setVersions((p) =>
      p.map((v) =>
        v.id === curId
          ? { ...v, status: "APPROVED" as VersionStatus }
          : v
      )
    );
    setShowApprove(false);
    setSelected(null);
  };

  const publishRevision = () => {
    const nextN = Math.max(...versions.map((v) => v.n)) + 1;
    const nv: Version = {
      id: "v" + nextN,
      n: nextN,
      status: "SENT",
      by: "CCC Admin",
      at: "just now",
      logo: "leftchest",
    };
    setVersions((p) => [
      ...p.map((v) =>
        v.id === curId
          ? { ...v, status: "SUPERSEDED" as VersionStatus }
          : v
      ),
      nv,
    ]);
    setAnnotations((p) => [
      ...p,
      ...annotations
        .filter((a) => a.versionId === curId && a.status === "OPEN")
        .map((a) => ({ ...a, id: a.id + "_r", versionId: nv.id })),
    ]);
    setCurId(nv.id);
    setCompare(false);
  };

  const canApprove =
    role === "client" && cur.status !== "APPROVED" && openCount === 0;

  return (
    <div className="flex min-h-[640px] flex-col overflow-hidden rounded-lg border border-surface-border bg-surface-bg">
      {/* Header */}
      <div className="flex items-center gap-4 border-b border-surface-border bg-surface-card px-5 py-3.5">
        <div className="min-w-0 flex-1">
          <div className="label-eyebrow text-[10px]">
            PROOF · ORD-2026-001 · ACME CORP
          </div>
          <div className="mt-1 flex items-center gap-3">
            <h2 className="text-lg font-bold tracking-tight">
              Acme Polo — Left Chest Logo
            </h2>
            <StatusPill status={cur.status} />
          </div>
        </div>

        <div className="flex items-center gap-1.5 text-xs text-ink-muted">
          <Users size={14} />
          <div className="flex">
            <div className="-mr-2">
              <Avatar name="CCC Admin" role="staff" size={24} />
            </div>
            <Avatar name="Jane Smith" role="client" size={24} />
          </div>
        </div>

        <div className="flex rounded-lg border border-surface-border bg-surface-card p-0.5">
          {(["client", "staff"] as Role[]).map((r) => (
            <button
              key={r}
              onClick={() => {
                setRole(r);
                setSelected(null);
              }}
              className={cn(
                "rounded-md px-3 py-1.5 text-xs font-bold tracking-wide",
                role === r
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
                v{cur.n}
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
                    <div className="absolute inset-0">
                      <PoloProof logo={prev.logo} guides={guides} />
                    </div>
                    <div
                      className="absolute inset-0 overflow-hidden border-r-2 border-purple-400"
                      style={{ width: `${wipe}%` }}
                    >
                      <div style={{ width: 460, height: 460 }}>
                        <PoloProof logo={cur.logo} guides={guides} />
                      </div>
                    </div>
                    <div className="absolute left-2.5 top-2 rounded bg-purple-500 px-1.5 py-0.5 text-[10px] font-bold text-white">
                      v{cur.n}
                    </div>
                    <div className="absolute right-2.5 top-2 rounded bg-black/50 px-1.5 py-0.5 text-[10px] font-bold text-white">
                      v{prev.n}
                    </div>
                  </>
                ) : (
                  <PoloProof logo={cur.logo} guides={guides} />
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

                {cur.status === "APPROVED" && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-2.5 bg-black/55">
                    <div className="flex h-[54px] w-[54px] items-center justify-center rounded-full bg-emerald-500">
                      <Lock size={24} color="#0A0A0C" />
                    </div>
                    <div className="text-[13px] font-extrabold tracking-[0.14em] text-emerald-400">
                      APPROVED FOR PRODUCTION
                    </div>
                    <div className="text-[11px] text-ink-muted">
                      Signed by Jane Smith
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
              cur.status === "APPROVED" ? (
                <div className="flex items-center gap-2.5 text-[13px] font-bold text-emerald-400">
                  <ShieldCheck size={18} /> You approved this proof.
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
                  {!canApprove && (cur.status as string) !== "APPROVED" && (
                    <div className="mt-2 flex items-center gap-1.5 text-[11.5px] text-yellow-400">
                      <AlertTriangle size={13} /> {openCount} open
                      comment{openCount !== 1 ? "s" : ""} must be
                      resolved before approval.
                    </div>
                  )}
                </>
              )
            ) : (
              <div className="flex gap-2.5">
                <button
                  onClick={publishRevision}
                  className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-coral py-2.5 text-[13px] font-extrabold text-white hover:bg-coral-dark"
                >
                  <PenLine size={15} /> Publish revision (v
                  {Math.max(...versions.map((v) => v.n)) + 1})
                </button>
              </div>
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
              const col = isResolved ? "emerald" : "coral";
              const canResolve =
                role === "staff" ||
                a.author ===
                  (role === "client" ? "Jane Smith" : "CCC Admin");

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
                                setStatus(a.id, "RESOLVED");
                              }}
                              className="flex items-center gap-1.5 rounded-md border border-emerald-500 px-2.5 py-1 text-[11px] font-bold text-emerald-500 hover:bg-emerald-500/10"
                            >
                              <Check size={12} /> Resolve
                            </button>
                          ) : (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setStatus(a.id, "OPEN");
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
          onClick={() => setShowApprove(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-[420px] rounded-xl border border-surface-border bg-surface-card p-6 shadow-lg"
          >
            <div className="mb-1.5 flex items-center justify-between">
              <div className="flex items-center gap-2.5 font-display text-base">
                <ShieldCheck size={19} className="text-emerald-400" />{" "}
                Approve for production
              </div>
              <X
                size={18}
                className="cursor-pointer text-ink-dim hover:text-ink"
                onClick={() => setShowApprove(false)}
              />
            </div>
            <div className="mb-4 text-[12.5px] leading-relaxed text-ink-muted">
              This locks{" "}
              <b className="text-ink">v{cur.n}</b> and authorizes
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
              placeholder="Jane Smith"
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
              Sign & approve v{cur.n}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
