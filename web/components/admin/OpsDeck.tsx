"use client";

import { useEffect, useState } from "react";
import {
  fetchFleetHealth,
  fetchGitTelemetry,
  triggerCachePurge,
  fetchEnvAudit,
  fetchVercelStatus,
  triggerVercelRedeploy,
  type FleetTargetResult,
  type GitCommitInfo,
  type GitWorkflowRunInfo,
  type EnvAuditItem,
  type VercelDeploymentInfo,
} from "@/lib/adminClient";

type OpsTab = "fleet" | "deploy" | "git" | "audit";

interface OpsDeckProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenManager: () => void;
  onOpenCortex?: () => void;
  onLogout?: () => void;
}

export function OpsDeck({
  isOpen,
  onClose,
  onOpenManager,
  onOpenCortex,
  onLogout,
}: OpsDeckProps) {
  const [activeTab, setActiveTab] = useState<OpsTab>("fleet");

  // Fleet state
  const [fleetTargets, setFleetTargets] = useState<FleetTargetResult[]>([]);
  const [isPingingFleet, setIsPingingFleet] = useState(false);
  const [fleetCheckedAt, setFleetCheckedAt] = useState<number | null>(null);

  // Custom ping tool
  const [customUrl, setCustomUrl] = useState("");
  const [customPingResult, setCustomPingResult] = useState<{
    status: number;
    latencyMs: number;
    ok: boolean;
    error?: string;
  } | null>(null);
  const [isPingingCustom, setIsPingingCustom] = useState(false);

  // Deploy & Cache state
  const [isPurgingCache, setIsPurgingCache] = useState(false);
  const [cachePurgedAt, setCachePurgedAt] = useState<number | null>(null);
  const [cachePurgeStatus, setCachePurgeStatus] = useState<string | null>(null);

  const [vercelDeployments, setVercelDeployments] = useState<VercelDeploymentInfo[]>([]);
  const [isVercelConfigured, setIsVercelConfigured] = useState(false);
  const [vercelHint, setVercelHint] = useState<string | null>(null);
  const [isTriggeringVercel, setIsTriggeringVercel] = useState(false);
  const [vercelDeployMessage, setVercelDeployMessage] = useState<string | null>(null);

  // Git state
  const [gitCommits, setGitCommits] = useState<GitCommitInfo[]>([]);
  const [gitRuns, setGitRuns] = useState<GitWorkflowRunInfo[]>([]);
  const [gitRepo, setGitRepo] = useState<string>("sebastian420-hub/burmanlabs");
  const [gitBranch, setGitBranch] = useState<string>("main");
  const [isLoadingGit, setIsLoadingGit] = useState(false);

  // Audit state
  const [auditItems, setAuditItems] = useState<EnvAuditItem[]>([]);
  const [nodeEnv, setNodeEnv] = useState<string>("production");
  const [isLoadingAudit, setIsLoadingAudit] = useState(false);

  // 1. Lock body scroll on open
  useEffect(() => {
    if (isOpen) {
      const origBodyOverflow = document.body.style.overflow;
      const origHtmlOverflow = document.documentElement.style.overflow;
      document.body.style.overflow = "hidden";
      document.documentElement.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = origBodyOverflow;
        document.documentElement.style.overflow = origHtmlOverflow;
      };
    }
  }, [isOpen]);

  // 2. Escape key handler
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // 3. Load tab data
  useEffect(() => {
    if (!isOpen) return;

    if (activeTab === "fleet" && fleetTargets.length === 0 && !isPingingFleet) {
      runFleetPing();
    } else if (activeTab === "git" && gitCommits.length === 0 && !isLoadingGit) {
      runGitLoad();
    } else if (activeTab === "deploy") {
      runVercelLoad();
    } else if (activeTab === "audit" && auditItems.length === 0 && !isLoadingAudit) {
      runAuditLoad();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, activeTab]);

  async function runFleetPing() {
    setIsPingingFleet(true);
    const res = await fetchFleetHealth();
    setIsPingingFleet(false);
    if (res.ok) {
      setFleetTargets(res.targets);
      setFleetCheckedAt(Date.now());
    }
  }

  async function handleCustomPing(e: React.FormEvent) {
    e.preventDefault();
    if (!customUrl.trim()) return;

    let target = customUrl.trim();
    if (!target.startsWith("http://") && !target.startsWith("https://")) {
      target = `https://${target}`;
    }

    setIsPingingCustom(true);
    setCustomPingResult(null);

    const start = performance.now();
    try {
      const res = await fetch(target, {
        method: "HEAD",
        mode: "no-cors",
        signal: AbortSignal.timeout(5000),
      });
      const latencyMs = Math.round(performance.now() - start);
      setCustomPingResult({
        status: res.status || 200,
        latencyMs,
        ok: true,
      });
    } catch (err: unknown) {
      const latencyMs = Math.round(performance.now() - start);
      setCustomPingResult({
        status: 0,
        latencyMs,
        ok: false,
        error: err instanceof Error ? err.message : "Target unreachable",
      });
    } finally {
      setIsPingingCustom(false);
    }
  }

  async function handlePurgeCache() {
    setIsPurgingCache(true);
    setCachePurgeStatus(null);
    const res = await triggerCachePurge();
    setIsPurgingCache(false);
    if (res.ok) {
      setCachePurgedAt(Date.now());
      setCachePurgeStatus("All route layouts revalidated worldwide.");
    } else {
      setCachePurgeStatus(`Purge error: ${res.error || "Unknown error"}`);
    }
  }

  async function runVercelLoad() {
    const res = await fetchVercelStatus();
    setIsVercelConfigured(res.configured);
    if (res.hint) setVercelHint(res.hint);
    if (res.deployments) setVercelDeployments(res.deployments);
  }

  async function handleTriggerVercel() {
    setIsTriggeringVercel(true);
    setVercelDeployMessage(null);
    const res = await triggerVercelRedeploy();
    setIsTriggeringVercel(false);
    if (res.ok) {
      setVercelDeployMessage(res.message || "Redeployment triggered successfully.");
      runVercelLoad();
    } else {
      setVercelDeployMessage(`Failed: ${res.error || "Unknown error"}`);
    }
  }

  async function runGitLoad() {
    setIsLoadingGit(true);
    const res = await fetchGitTelemetry();
    setIsLoadingGit(false);
    if (res.ok) {
      if (res.repo) setGitRepo(res.repo);
      if (res.branch) setGitBranch(res.branch);
      setGitCommits(res.commits);
      setGitRuns(res.runs);
    }
  }

  async function runAuditLoad() {
    setIsLoadingAudit(true);
    const res = await fetchEnvAudit();
    setIsLoadingAudit(false);
    if (res.ok) {
      setAuditItems(res.items);
      if (res.nodeEnv) setNodeEnv(res.nodeEnv);
    }
  }

  if (!isOpen) return null;

  const fleetHealthyCount = fleetTargets.filter((t) => t.ok).length;
  const avgLatency =
    fleetTargets.length > 0
      ? Math.round(
          fleetTargets.reduce((acc, curr) => acc + (curr.ok ? curr.latencyMs : 0), 0) /
            (fleetHealthyCount || 1)
        )
      : 0;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <aside
        className="w-full max-w-2xl h-[100dvh] max-h-[100dvh] bg-ink border-l border-line shadow-2xl flex flex-col justify-between overflow-hidden overscroll-contain touch-manipulation"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header */}
        <div className="p-4 sm:p-6 pb-4 border-b border-line bg-ink shrink-0 space-y-3.5 pt-[max(1rem,env(safe-area-inset-top,0px))]">
          <div className="flex items-center justify-between gap-2">
            <div>
              <div className="font-mono text-[10px] uppercase tracking-wider text-muted flex items-center gap-1.5">
                <span className="size-1.5 rounded-full bg-signal inline-block" />
                <span>Burmanlabs Infrastructure</span>
              </div>
              <h2 className="font-mono text-base font-semibold text-paper mt-0.5">
                DevOps & Fleet Deck
              </h2>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={onOpenManager}
                className="px-3 py-1.5 rounded-md bg-ink-2 border border-line-2 hover:border-paper text-bone font-mono text-xs transition-colors cursor-pointer flex items-center active:scale-95"
                title="Switch to Content Manager"
              >
                <span>Content</span>
              </button>
              {onOpenCortex && (
                <button
                  type="button"
                  onClick={onOpenCortex}
                  className="px-3 py-1.5 rounded-md bg-ink-2 border border-line-2 hover:border-signal text-bone font-mono text-xs transition-colors cursor-pointer flex items-center active:scale-95"
                  title="Switch to Cortex Dispatcher"
                >
                  <span>Cortex</span>
                </button>
              )}
              <button
                type="button"
                onClick={onClose}
                className="px-3 py-1.5 rounded-md bg-ink-2 border border-line-2 hover:border-white text-bone font-mono text-xs cursor-pointer transition-all active:scale-95 flex items-center gap-1.5"
                aria-label="Close Ops Deck"
              >
                <span>✕</span>
                <span>Close</span>
              </button>
            </div>
          </div>

          {/* Sub-Navigation Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-1 -mx-4 px-4 sm:-mx-6 sm:px-6">
            <button
              type="button"
              onClick={() => setActiveTab("fleet")}
              className={`h-8 px-3 rounded-full text-xs font-mono transition-colors whitespace-nowrap cursor-pointer flex items-center gap-1.5 shrink-0 ${
                activeTab === "fleet"
                  ? "bg-paper text-ink font-semibold shadow-sm"
                  : "bg-ink-2 text-muted hover:text-paper hover:bg-line/40 border border-line"
              }`}
            >
              <span
                className={`size-1.5 rounded-full ${
                  fleetHealthyCount === fleetTargets.length && fleetTargets.length > 0
                    ? "bg-emerald-500"
                    : "bg-signal"
                }`}
              />
              <span>Fleet Health</span>
              {fleetTargets.length > 0 && (
                <span className="text-[10px] opacity-75">
                  ({fleetHealthyCount}/{fleetTargets.length})
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("deploy")}
              className={`h-8 px-3 rounded-full text-xs font-mono transition-colors whitespace-nowrap cursor-pointer flex items-center gap-1.5 shrink-0 ${
                activeTab === "deploy"
                  ? "bg-paper text-ink font-semibold shadow-sm"
                  : "bg-ink-2 text-muted hover:text-paper hover:bg-line/40 border border-line"
              }`}
            >
              <span>Deploy & Cache</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("git")}
              className={`h-8 px-3 rounded-full text-xs font-mono transition-colors whitespace-nowrap cursor-pointer flex items-center gap-1.5 shrink-0 ${
                activeTab === "git"
                  ? "bg-paper text-ink font-semibold shadow-sm"
                  : "bg-ink-2 text-muted hover:text-paper hover:bg-line/40 border border-line"
              }`}
            >
              <span>Git Telemetry</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("audit")}
              className={`h-8 px-3 rounded-full text-xs font-mono transition-colors whitespace-nowrap cursor-pointer flex items-center gap-1.5 shrink-0 ${
                activeTab === "audit"
                  ? "bg-paper text-ink font-semibold shadow-sm"
                  : "bg-ink-2 text-muted hover:text-paper hover:bg-line/40 border border-line"
              }`}
            >
              <span>Security & Backup</span>
            </button>
          </div>
        </div>

        {/* Scrollable Main Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {/* TAB 1: FLEET HEALTH */}
          {activeTab === "fleet" && (
            <div className="space-y-5">
              {/* Fleet Overview Bar */}
              <div className="p-4 bg-ink-2 border border-line rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="font-mono text-xs uppercase tracking-wider text-muted">
                    Fleet Status Board
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <span
                      className={`size-2 rounded-full ${
                        fleetHealthyCount === fleetTargets.length && fleetTargets.length > 0
                          ? "bg-emerald-500 animate-pulse"
                          : "bg-signal"
                      }`}
                    />
                    <span className="font-mono text-sm font-semibold text-paper">
                      {isPingingFleet
                        ? "Pinging ecosystem targets…"
                        : fleetHealthyCount === fleetTargets.length && fleetTargets.length > 0
                        ? "All Deployments Operational"
                        : `${fleetHealthyCount} of ${fleetTargets.length} Operational`}
                    </span>
                  </div>
                  {fleetCheckedAt && (
                    <div className="font-mono text-[10px] text-muted mt-1">
                      Avg latency: {avgLatency}ms · Checked{" "}
                      {new Date(fleetCheckedAt).toLocaleTimeString()}
                    </div>
                  )}
                </div>

                <button
                  type="button"
                  onClick={runFleetPing}
                  disabled={isPingingFleet}
                  className="px-3.5 py-1.5 bg-paper text-ink font-mono text-xs font-semibold rounded hover:bg-white active:scale-95 transition-all disabled:opacity-50 cursor-pointer shrink-0"
                >
                  {isPingingFleet ? "Checking…" : "Ping All Targets"}
                </button>
              </div>

              {/* Targets List */}
              <div className="space-y-2">
                <div className="font-mono text-[11px] uppercase tracking-wider text-muted px-1 flex items-center justify-between">
                  <span>Target Service</span>
                  <span>Status · Latency</span>
                </div>

                {fleetTargets.map((target) => {
                  const isHealthy = target.ok && target.status === 200;
                  const isRedirect = target.status >= 300 && target.status < 400;

                  return (
                    <div
                      key={target.id}
                      className="p-3 bg-ink-2 border border-line rounded-md flex items-center justify-between gap-3 hover:border-line-2 transition-colors"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span
                            className={`size-1.5 rounded-full shrink-0 ${
                              isHealthy
                                ? "bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.8)]"
                                : isRedirect
                                ? "bg-gold"
                                : "bg-signal shadow-[0_0_6px_rgba(255,49,49,0.8)]"
                            }`}
                          />
                          <span className="font-mono text-xs font-semibold text-paper truncate">
                            {target.name}
                          </span>
                          <span className="font-mono text-[10px] text-muted uppercase">
                            [{target.code}]
                          </span>
                        </div>
                        <a
                          href={target.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-mono text-[11px] text-muted/80 hover:text-signal truncate block mt-0.5"
                        >
                          {target.url.replace(/^https?:\/\//, "")} ↗
                        </a>
                      </div>

                      <div className="text-right shrink-0">
                        <div className="font-mono text-xs font-semibold text-paper">
                          {target.status > 0 ? (
                            <span
                              className={
                                isHealthy
                                  ? "text-emerald-400"
                                  : isRedirect
                                  ? "text-gold"
                                  : "text-signal"
                              }
                            >
                              {target.status} {isHealthy ? "OK" : isRedirect ? "Redirect" : "Error"}
                            </span>
                          ) : (
                            <span className="text-signal">Offline</span>
                          )}
                        </div>
                        <div className="font-mono text-[10px] text-muted mt-0.5">
                          {target.latencyMs > 0 ? `${target.latencyMs}ms` : target.error || "Failed"}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Custom Ping Inspector */}
              <div className="p-4 bg-ink-2/60 border border-line rounded-lg space-y-3">
                <div className="font-mono text-[11px] uppercase tracking-wider text-muted">
                  Custom Endpoint Ping
                </div>
                <form onSubmit={handleCustomPing} className="flex gap-2">
                  <input
                    type="text"
                    value={customUrl}
                    onChange={(e) => setCustomUrl(e.target.value)}
                    placeholder="https://example.com or API URL"
                    className="flex-1 bg-ink border border-line px-3 py-1.5 text-xs text-paper font-mono focus:border-paper focus:outline-none rounded"
                  />
                  <button
                    type="submit"
                    disabled={isPingingCustom || !customUrl.trim()}
                    className="px-3 py-1.5 bg-ink-2 border border-line hover:border-paper text-bone font-mono text-xs rounded transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
                  >
                    {isPingingCustom ? "Pinging…" : "Test Ping"}
                  </button>
                </form>

                {customPingResult && (
                  <div className="p-2.5 bg-ink border border-line rounded flex items-center justify-between font-mono text-xs">
                    <div className="flex items-center gap-2">
                      <span
                        className={`size-2 rounded-full ${
                          customPingResult.ok ? "bg-emerald-500" : "bg-signal"
                        }`}
                      />
                      <span className="text-paper">
                        Status: {customPingResult.status || "Error"}
                      </span>
                    </div>
                    <span className="text-muted">
                      Latency: {customPingResult.latencyMs}ms
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: DEPLOY & CACHE */}
          {activeTab === "deploy" && (
            <div className="space-y-6">
              {/* Next.js Global Cache Invalidation Card */}
              <div className="p-4 bg-ink-2 border border-line rounded-lg space-y-3.5">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <div className="font-mono text-[10px] uppercase tracking-wider text-muted">
                      Edge Cache Control
                    </div>
                    <h3 className="font-mono text-sm font-semibold text-paper mt-0.5">
                      Next.js ISR Cache Purging
                    </h3>
                  </div>
                  <button
                    type="button"
                    onClick={handlePurgeCache}
                    disabled={isPurgingCache}
                    className="px-3.5 py-1.5 bg-paper text-ink font-mono text-xs font-semibold rounded hover:bg-white active:scale-95 transition-all disabled:opacity-50 cursor-pointer shrink-0"
                  >
                    {isPurgingCache ? "Purging Cache…" : "Purge Next.js Cache"}
                  </button>
                </div>

                <p className="font-mono text-xs text-muted leading-relaxed">
                  Forces immediate server-side revalidation across the root layout and all locale
                  routes (<code className="text-paper">/en</code> and{" "}
                  <code className="text-paper">/my</code>). Visitors worldwide immediately receive
                  fresh static HTML without waiting for background cache invalidation.
                </p>

                {cachePurgeStatus && (
                  <div className="p-2.5 bg-ink border border-line rounded font-mono text-xs text-paper flex items-center gap-2">
                    <span className="size-1.5 rounded-full bg-emerald-500" />
                    <span>{cachePurgeStatus}</span>
                    {cachePurgedAt && (
                      <span className="text-muted ml-auto">
                        {new Date(cachePurgedAt).toLocaleTimeString()}
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Vercel Production Pipeline */}
              <div className="p-4 bg-ink-2 border border-line rounded-lg space-y-4">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <div className="font-mono text-[10px] uppercase tracking-wider text-muted">
                      Production Pipeline
                    </div>
                    <h3 className="font-mono text-sm font-semibold text-paper mt-0.5">
                      Vercel Deployments
                    </h3>
                  </div>

                  {isVercelConfigured && (
                    <button
                      type="button"
                      onClick={handleTriggerVercel}
                      disabled={isTriggeringVercel}
                      className="px-3.5 py-1.5 bg-signal text-white font-mono text-xs font-semibold rounded hover:opacity-90 active:scale-95 transition-all disabled:opacity-50 cursor-pointer shrink-0"
                    >
                      {isTriggeringVercel ? "Triggering…" : "Trigger Production Build"}
                    </button>
                  )}
                </div>

                {isVercelConfigured ? (
                  <div className="space-y-3">
                    {vercelDeployMessage && (
                      <div className="p-2.5 bg-ink border border-line rounded font-mono text-xs text-paper">
                        {vercelDeployMessage}
                      </div>
                    )}

                    <div className="space-y-2">
                      <div className="font-mono text-[10px] uppercase tracking-wider text-muted">
                        Recent Deployments
                      </div>
                      {vercelDeployments.map((d) => (
                        <div
                          key={d.uid}
                          className="p-3 bg-ink border border-line rounded flex items-center justify-between gap-3 text-xs font-mono"
                        >
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span
                                className={`size-1.5 rounded-full ${
                                  d.state === "READY"
                                    ? "bg-emerald-500"
                                    : d.state === "BUILDING"
                                    ? "bg-gold animate-pulse"
                                    : "bg-signal"
                                }`}
                              />
                              <span className="font-semibold text-paper">{d.state}</span>
                              {d.commitSha && (
                                <span className="text-muted">commit {d.commitSha}</span>
                              )}
                            </div>
                            {d.commitMessage && (
                              <p className="text-muted truncate mt-0.5">{d.commitMessage}</p>
                            )}
                          </div>
                          <div className="text-right shrink-0">
                            <span className="text-muted">
                              {new Date(d.created).toLocaleDateString()}
                            </span>
                            {d.url && (
                              <a
                                href={d.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="block text-bone hover:text-signal text-[11px] mt-0.5"
                              >
                                View ↗
                              </a>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="p-3.5 bg-ink border border-line rounded space-y-2.5">
                    <div className="font-mono text-xs font-semibold text-paper flex items-center gap-2">
                      <span className="size-1.5 rounded-full bg-gold" />
                      <span>Vercel Integration Optional</span>
                    </div>
                    <p className="font-mono text-xs text-muted leading-relaxed">
                      To view live Vercel build status and trigger redeployments directly from this
                      admin deck, add your personal access token to{" "}
                      <code className="text-paper">web/.env.local</code>:
                    </p>
                    <div className="p-2.5 bg-ink-2 border border-line font-mono text-xs text-paper rounded">
                      <div>VERCEL_TOKEN=your_token_here</div>
                      <div>VERCEL_PROJECT_ID=your_project_id_here</div>
                    </div>
                    {vercelHint && (
                      <p className="font-mono text-[11px] text-muted">{vercelHint}</p>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: GIT TELEMETRY */}
          {activeTab === "git" && (
            <div className="space-y-5">
              {/* Repo Status Card */}
              <div className="p-4 bg-ink-2 border border-line rounded-lg flex items-center justify-between gap-3">
                <div>
                  <div className="font-mono text-[10px] uppercase tracking-wider text-muted">
                    Source Control
                  </div>
                  <div className="font-mono text-sm font-semibold text-paper mt-0.5 flex items-center gap-2">
                    <span className="size-1.5 rounded-full bg-emerald-500" />
                    <span>{gitRepo}</span>
                  </div>
                  <div className="font-mono text-xs text-muted mt-1">
                    Target branch: <code className="text-paper">{gitBranch}</code>
                  </div>
                </div>

                <a
                  href={`https://github.com/${gitRepo}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 bg-ink border border-line hover:border-paper text-bone font-mono text-xs rounded transition-colors active:scale-95"
                >
                  GitHub ↗
                </a>
              </div>

              {/* Commit Stream */}
              <div className="space-y-2">
                <div className="font-mono text-[11px] uppercase tracking-wider text-muted px-1 flex items-center justify-between">
                  <span>Recent Commits on {gitBranch}</span>
                  <span>Author · Time</span>
                </div>

                {gitCommits.length > 0 ? (
                  gitCommits.map((c) => (
                    <div
                      key={c.sha}
                      className="p-3 bg-ink-2 border border-line rounded-md flex items-center justify-between gap-3 hover:border-line-2 transition-colors font-mono text-xs"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="px-1.5 py-0.5 bg-ink border border-line text-bone text-[11px] rounded font-mono">
                            {c.sha}
                          </span>
                          <span className="text-paper truncate font-medium">{c.message}</span>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="text-muted block text-[11px]">{c.author}</span>
                        <a
                          href={c.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-bone hover:text-signal text-[11px]"
                        >
                          Diff ↗
                        </a>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-4 bg-ink-2 border border-line rounded text-center font-mono text-xs text-muted">
                    {isLoadingGit ? "Fetching git commits…" : "No commits found or token missing."}
                  </div>
                )}
              </div>

              {/* Workflow Runs */}
              <div className="space-y-2">
                <div className="font-mono text-[11px] uppercase tracking-wider text-muted px-1">
                  GitHub Actions CI/CD
                </div>
                {gitRuns.length > 0 ? (
                  gitRuns.map((r) => (
                    <div
                      key={r.id}
                      className="p-3 bg-ink-2 border border-line rounded-md flex items-center justify-between gap-3 text-xs font-mono"
                    >
                      <div className="flex items-center gap-2">
                        <span
                          className={`size-1.5 rounded-full ${
                            r.conclusion === "success"
                              ? "bg-emerald-500"
                              : r.status === "in_progress"
                              ? "bg-gold animate-pulse"
                              : "bg-signal"
                          }`}
                        />
                        <span className="text-paper font-semibold">{r.name}</span>
                        <span className="text-muted">[{r.status}]</span>
                      </div>
                      <a
                        href={r.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-bone hover:text-signal text-[11px]"
                      >
                        Logs ↗
                      </a>
                    </div>
                  ))
                ) : (
                  <div className="p-3 bg-ink-2/60 border border-line rounded font-mono text-xs text-muted">
                    No active GitHub Actions workflows recorded in repository.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 4: SECURITY AUDIT & DISASTER RECOVERY */}
          {activeTab === "audit" && (
            <div className="space-y-6">
              {/* Disaster Recovery & Snapshot Card */}
              <div className="p-4 bg-ink-2 border border-line rounded-lg space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <div className="font-mono text-[10px] uppercase tracking-wider text-muted">
                      Disaster Recovery
                    </div>
                    <h3 className="font-mono text-sm font-semibold text-paper mt-0.5">
                      Content Snapshot Backup
                    </h3>
                  </div>
                  <a
                    href="/api/admin/ops/backup"
                    download
                    className="px-3.5 py-1.5 bg-paper text-ink font-mono text-xs font-semibold rounded hover:bg-white active:scale-95 transition-all cursor-pointer inline-flex items-center gap-1.5 shrink-0"
                  >
                    <span>Download Snapshot</span>
                    <span>↓</span>
                  </a>
                </div>
                <p className="font-mono text-xs text-muted leading-relaxed">
                  Downloads a complete offline backup of all project catalogs, art pieces, and
                  bilingual dictionaries (<code className="text-paper">catalog.json</code>,{" "}
                  <code className="text-paper">studio.json</code>,{" "}
                  <code className="text-paper">en.json</code>, and{" "}
                  <code className="text-paper">my.json</code>).
                </p>
              </div>

              {/* Environment Security Audit Table */}
              <div className="space-y-3">
                <div className="font-mono text-[11px] uppercase tracking-wider text-muted px-1 flex items-center justify-between">
                  <span>Configuration Key</span>
                  <span>Security & Status</span>
                </div>

                <div className="space-y-2">
                  {auditItems.map((item) => {
                    const isGood =
                      item.status === "active" ||
                      item.status === "connected" ||
                      item.status === "configured";
                    const isOptional = item.status === "optional_missing";

                    return (
                      <div
                        key={item.key}
                        className="p-3 bg-ink-2 border border-line rounded-md flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs font-mono"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span
                              className={`size-1.5 rounded-full shrink-0 ${
                                isGood
                                  ? "bg-emerald-500"
                                  : isOptional
                                  ? "bg-muted"
                                  : "bg-signal"
                              }`}
                            />
                            <span className="font-semibold text-paper">{item.key}</span>
                          </div>
                          <div className="text-[11px] text-muted mt-0.5">{item.label}</div>
                        </div>

                        <div className="sm:text-right">
                          <span
                            className={
                              isGood
                                ? "text-emerald-400 font-semibold"
                                : isOptional
                                ? "text-muted"
                                : "text-signal font-semibold"
                            }
                          >
                            {item.statusText}
                          </span>
                          {item.hint && (
                            <div className="text-[10px] text-muted/70 mt-0.5">{item.hint}</div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="p-3 bg-ink-2/60 border border-line rounded font-mono text-[11px] text-muted">
                  Runtime Environment: <code className="text-paper">{nodeEnv}</code> · Secret values
                  are masked and checked using timing-safe comparisons.
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Navigator Footer matching EditDrawer balanced 2-row layout */}
        <div className="p-4 sm:p-5 border-t border-line bg-ink shrink-0 space-y-3 pb-[max(1rem,env(safe-area-inset-bottom,0px))]">
          <div className="flex items-center justify-between text-xs font-mono text-muted">
            <span className="flex items-center gap-1.5">
              <span className="size-1.5 rounded-full bg-signal" />
              <span>Burmanlabs DevOps Active</span>
            </span>
            <span>Target: {gitBranch}</span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {onLogout && (
              <button
                type="button"
                onClick={onLogout}
                className="w-full py-2.5 px-3 rounded-md bg-ink-2 border border-line hover:border-signal text-bone font-mono text-xs transition-colors cursor-pointer text-center active:scale-95"
              >
                Exit Admin
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className={`w-full py-2.5 px-3 rounded-md bg-paper text-ink font-semibold font-mono text-xs hover:bg-white active:scale-95 transition-all shadow-md cursor-pointer text-center ${
                !onLogout ? "col-span-2" : ""
              }`}
            >
              Close Ops Deck
            </button>
          </div>
        </div>
      </aside>
    </div>
  );
}
