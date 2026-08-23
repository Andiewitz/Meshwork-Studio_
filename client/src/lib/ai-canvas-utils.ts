import type { Node, Edge } from "@xyflow/react";

/** Maps common AI hallucinations to valid Meshwork types */
const TYPE_ALIASES: Record<string, string> = {
  // database variants
  postgres: "database",
  postgresql: "database",
  mongo: "database",
  mongodb: "database",
  mysql: "database",
  dynamodb: "database",
  redis: "cache",
  elasticache: "cache",
  memcached: "cache",
  // gateway variants
  "api-gateway": "gateway",
  apigw: "gateway",
  api_gateway: "gateway",
  nginx: "loadBalancer",
  alb: "loadBalancer",
  elb: "loadBalancer",
  haproxy: "loadBalancer",
  // compute
  lambda: "logic",
  "aws-lambda": "logic",
  "azure-function": "logic",
  service: "microservice",
  docker: "microservice",
  container: "microservice",
  // messaging
  kafka: "bus",
  kinesis: "bus",
  rabbitmq: "queue",
  sqs: "queue",
  celery: "queue",
  // storage
  s3: "storage",
  blob: "storage",
  gcs: "storage",
  // networking
  cloudfront: "cdn",
  fastly: "cdn",
  akamai: "cdn",
  // frontend
  react: "app",
  vue: "app",
  angular: "app",
  nextjs: "app",
  nuxt: "app",
  // text
  text: "annotation",
};

/** Exact sizes from dimensions.ts */
const NODE_SIZES: Record<string, { w: number; h: number }> = {
  server: { w: 168, h: 96 },
  database: { w: 144, h: 120 },
  storage: { w: 144, h: 120 },
  microservice: { w: 168, h: 72 },
  cache: { w: 144, h: 120 },
  worker: { w: 168, h: 72 },
  logic: { w: 120, h: 72 },
  user: { w: 96, h: 96 },
  app: { w: 168, h: 72 },
  search: { w: 144, h: 120 },
  gateway: { w: 192, h: 72 },
  loadBalancer: { w: 192, h: 72 },
  cdn: { w: 192, h: 72 },
  bus: { w: 192, h: 72 },
  queue: { w: 192, h: 72 },
  route53: { w: 192, h: 72 },
  nats: { w: 192, h: 72 },
  socketio: { w: 144, h: 72 },
  github_actions: { w: 168, h: 72 },
  jenkins: { w: 168, h: 72 },
  gitlab: { w: 168, h: 72 },
  argocd: { w: 168, h: 72 },
  vault: { w: 168, h: 72 },
  auth0: { w: 168, h: 72 },
  waf: { w: 168, h: 72 },
  prometheus: { w: 168, h: 72 },
  grafana: { w: 168, h: 72 },
  datadog: { w: 168, h: 72 },
  stripe: { w: 168, h: 72 },
  twilio: { w: 168, h: 72 },
  shopify: { w: 168, h: 72 },
  annotation: { w: 160, h: 48 },
  note: { w: 192, h: 192 },
  vpc: { w: 408, h: 312 },
  region: { w: 600, h: 408 },
  "k8s-namespace": { w: 408, h: 312 },
  "k8s-pod": { w: 144, h: 96 },
  "k8s-deployment": { w: 192, h: 96 },
  "k8s-service": { w: 168, h: 72 },
  "k8s-ingress": { w: 168, h: 72 },
  "k8s-configmap": { w: 168, h: 72 },
  "k8s-secret": { w: 168, h: 72 },
  "k8s-pvc": { w: 168, h: 96 },
  "k8s-job": { w: 144, h: 72 },
  "k8s-cronjob": { w: 168, h: 96 },
  "k8s-hpa": { w: 168, h: 96 },
  influxdb: { w: 144, h: 120 },
  snowflake: { w: 144, h: 120 },
  clickhouse: { w: 144, h: 120 },
  api: { w: 168, h: 72 },
};

const VALID_TYPES = new Set(Object.keys(NODE_SIZES));

/** Shape of a raw node as returned by the AI (loosely typed) */
interface RawNode {
  id?: string;
  type?: string;
  position?: { x?: number; y?: number };
  parentId?: string;
  data?: {
    label?: string;
    category?: string;
    description?: string;
    tags?: string[];
    provider?: string;
    accentColor?: string;
    note?: string;
    ai?: { summary?: string; notes?: string; lastAnalyzed?: string | null };
  };
  style?: {
    width?: number;
    height?: number;
    backgroundColor?: string;
    borderColor?: string;
    borderRadius?: number;
    opacity?: number;
    fontColor?: string;
    fontSize?: number;
    icon?: string | null;
    theme?: string;
    strokeDasharray?: string;
    stroke?: string;
    strokeWidth?: number;
  };
}

/** Shape of a raw edge as returned by the AI (loosely typed) */
interface RawEdge {
  id?: string;
  source: string;
  target: string;
  type?: string;
  label?: string;
  markerEnd?: unknown;
  data?: {
    label?: string;
    description?: string;
    ai?: { notes?: string };
  };
  style?: {
    stroke?: string;
    strokeWidth?: number;
    strokeDasharray?: string;
  };
}

/** Shape of the raw canvas payload from the AI */
interface RawCanvas {
  nodes: RawNode[];
  edges: RawEdge[];
}

/**
 * Calculates optimal source and target handles based on relative geometric positions
 */
export function getSmartHandleIds(
  sourceNode: Node,
  targetNode: Node,
): { sourceHandle: string; targetHandle: string } {
  const sW = (sourceNode.style?.width as number) || 168;
  const sH = (sourceNode.style?.height as number) || 72;
  const tW = (targetNode.style?.width as number) || 168;
  const tH = (targetNode.style?.height as number) || 72;

  const sCenterX = sourceNode.position.x + sW / 2;
  const sCenterY = sourceNode.position.y + sH / 2;
  const tCenterX = targetNode.position.x + tW / 2;
  const tCenterY = targetNode.position.y + tH / 2;

  const dx = tCenterX - sCenterX;
  const dy = tCenterY - sCenterY;

  // Horizontal flow dominates if |dx| >= |dy|
  if (Math.abs(dx) >= Math.abs(dy)) {
    if (dx >= 0) {
      return { sourceHandle: "right", targetHandle: "left-target" };
    } else {
      return { sourceHandle: "left", targetHandle: "right-target" };
    }
  } else {
    // Vertical flow dominates
    if (dy >= 0) {
      return { sourceHandle: "bottom", targetHandle: "top-target" };
    } else {
      return { sourceHandle: "top", targetHandle: "bottom-target" };
    }
  }
}

export function validateAndRepairCanvas(
  raw: unknown,
): { nodes: Node[]; edges: Edge[] } | null {
  const r = raw as RawCanvas | null | undefined;
  if (!r || !Array.isArray(r.nodes) || !Array.isArray(r.edges)) return null;

  const seenIds = new Set<string>();

  const nodes: Node[] = r.nodes.map((n, i) => {
    // Resolve type alias
    let type = n.type ?? "server";
    if (TYPE_ALIASES[type.toLowerCase()])
      type = TYPE_ALIASES[type.toLowerCase()];
    if (!VALID_TYPES.has(type)) type = "server"; // last resort fallback

    // Enforce correct size
    const dim = NODE_SIZES[type] ?? { w: 168, h: 72 };
    const existingW = n.style?.width;
    const existingH = n.style?.height;
    const width =
      typeof existingW === "number" && existingW >= 48 ? existingW : dim.w;
    const height =
      typeof existingH === "number" && existingH >= 24 ? existingH : dim.h;

    // Deduplicate IDs
    let id = n.id ?? `node-${i}`;
    if (seenIds.has(id)) id = `${id}-${i}`;
    seenIds.add(id);

    // Ensure position exists and is on-screen
    const x = typeof n.position?.x === "number" ? n.position.x : i * 220 + 100;
    const y = typeof n.position?.y === "number" ? n.position.y : 100;

    return {
      id,
      type,
      position: { x, y },
      data: {
        label: n.data?.label ?? type,
        category: n.data?.category ?? "Core",
        description: n.data?.description ?? "",
        tags: n.data?.tags ?? [],
        fontColor: n.style?.fontColor ?? "#ffffff",
        icon: n.style?.icon ?? null,
        theme: n.style?.theme ?? "default",
        ai: {
          summary: n.data?.ai?.summary ?? "",
          notes: n.data?.ai?.notes ?? "",
          lastAnalyzed: n.data?.ai?.lastAnalyzed ?? null,
        },
        ...(n.data?.provider ? { provider: n.data.provider } : {}),
        ...(n.data?.accentColor ? { accentColor: n.data.accentColor } : {}),
        ...(n.data?.note ? { note: n.data.note } : {}),
      },
      style: {
        width,
        height,
        backgroundColor:
          n.style?.backgroundColor ?? n.data?.accentColor ?? "#1a1a2e",
        borderColor: n.style?.borderColor ?? "#555",
        borderRadius: n.style?.borderRadius ?? 8,
        opacity: n.style?.opacity ?? 1,
        fontSize: n.style?.fontSize ?? 13,
      },
      ...(n.parentId
        ? { parentId: n.parentId, extent: "parent" as const }
        : {}),
    };
  });

  const nodeMap = new Map<string, Node>(nodes.map((n) => [n.id, n]));

  const edges: Edge[] = r.edges
    .filter((e) => nodeMap.has(e.source) && nodeMap.has(e.target))
    .map((e, i) => {
      const sourceNode = nodeMap.get(e.source)!;
      const targetNode = nodeMap.get(e.target)!;
      const { sourceHandle, targetHandle } = getSmartHandleIds(
        sourceNode,
        targetNode,
      );
      const hasDash = e.style?.strokeDasharray;
      const hasArrow = e.markerEnd != null;

      return {
        id: e.id ?? `edge-${i}`,
        source: e.source,
        target: e.target,
        sourceHandle,
        targetHandle,
        type: e.type ?? "smoothstep",
        style: {
          stroke: e.style?.stroke ?? "#555",
          strokeWidth: e.style?.strokeWidth ?? 1.5,
          ...(hasDash ? { strokeDasharray: e.style!.strokeDasharray } : {}),
        },
        data: {
          label: e.data?.label ?? e.label ?? "",
          description: e.data?.description ?? "",
          ai: {
            notes: e.data?.ai?.notes ?? "",
          },
        },
        ...(hasArrow
          ? {
              markerEnd: {
                type: "arrowclosed",
                color: e.style?.stroke ?? "#555",
              },
            }
          : {}),
        ...(e.label
          ? {
              label: e.label,
              labelStyle: {
                fill: "#999",
                fontSize: 10,
                fontFamily: "var(--font-mono)",
                fontWeight: 500,
              },
              labelBgStyle: { fill: "#1A1A1A", fillOpacity: 0.9 },
              labelBgPadding: [6, 4] as [number, number],
              labelBgBorderRadius: 6,
            }
          : {}),
      };
    });

  return { nodes, edges };
}
