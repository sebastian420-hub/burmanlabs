export type CortexProject =
  | "cortex"
  | "burmanlabs"
  | "edusim"
  | "artcodex"
  | "spikebook"
  | "general";

export type CortexMode = "run" | "plan" | "remember";
export type CortexModel = "default" | "sonnet" | "deepseek" | "ollama";

export interface CortexTask {
  id: string;
  project: CortexProject;
  mode: CortexMode;
  prompt: string;
  model: CortexModel;
  createdAt: number;
  completed?: boolean;
}

export const CORTEX_PROJECTS: { id: CortexProject; label: string; code: string }[] = [
  { id: "cortex", label: "Cortex CLI", code: "BL-003" },
  { id: "burmanlabs", label: "Burmanlabs Web", code: "Core" },
  { id: "artcodex", label: "Artcodex", code: "BL-004" },
  { id: "edusim", label: "EduSim", code: "BL-001" },
  { id: "spikebook", label: "Spikebook", code: "BL-002" },
  { id: "general", label: "General", code: "Idea" },
];

export const CORTEX_MODES: { id: CortexMode; label: string; flag: string; hint: string }[] = [
  { id: "run", label: "Execute", flag: 'cortex "<prompt>"', hint: "Run agent with tools & bash" },
  { id: "plan", label: "Plan Mode", flag: 'cortex --plan "<prompt>"', hint: "Read-only architecture & task planning" },
  { id: "remember", label: "Remember", flag: 'cortex --remember "<prompt>"', hint: "Store in Cortex memory bank" },
];

export const CORTEX_MODELS: { id: CortexModel; label: string }[] = [
  { id: "default", label: "Default Model" },
  { id: "sonnet", label: "Claude Sonnet" },
  { id: "deepseek", label: "DeepSeek" },
  { id: "ollama", label: "Ollama (Local)" },
];

const STORAGE_KEY = "burmanlabs_cortex_queue_v1";

export function loadCortexTasks(): CortexTask[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as CortexTask[];
  } catch {
    return [];
  }
}

export function saveCortexTasks(tasks: CortexTask[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
  } catch {
    // ignore
  }
}

export function formatCortexCommand(task: CortexTask): string {
  const sanitized = task.prompt.replace(/"/g, '\\"');
  if (task.mode === "plan") {
    return `cortex --plan "${sanitized}"`;
  }
  if (task.mode === "remember") {
    return `cortex --remember "${sanitized}"`;
  }
  if (task.model && task.model !== "default") {
    return `cortex -m ${task.model} "${sanitized}"`;
  }
  return `cortex "${sanitized}"`;
}

export function formatAllCortexCommands(tasks: CortexTask[]): string {
  const pending = tasks.filter((t) => !t.completed);
  if (pending.length === 0) return "";
  return [
    "#!/usr/bin/env bash",
    "# Cortex task queue exported from Burmanlabs mobile deck",
    `# Generated at ${new Date().toLocaleString()}`,
    "",
    ...pending.map((t) => `# [${t.project.toUpperCase()}] ${t.mode.toUpperCase()}\n${formatCortexCommand(t)}\n`),
  ].join("\n");
}
