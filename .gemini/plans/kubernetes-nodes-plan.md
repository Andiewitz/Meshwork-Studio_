# 🚀 Kubernetes Node Implementation Plan

> **Inspired by:** [benc-uk/kubeview](https://github.com/benc-uk/kubeview) — a Kubernetes cluster visualization tool that renders K8s resources as graph nodes with status-colored icons and relationship edges.

---

## 📋 Overview

KubeView visualizes real Kubernetes resources (Pods, Deployments, Services, ConfigMaps, etc.) as graph nodes with SVG icons, color-coded health status (green/red/grey), and automatic relationship edges. 

Our implementation will bring this concept into **Weaving Studio** as a new **"Kubernetes"** category of draggable nodes, designed for **architecture diagramming** (not live cluster monitoring). Users can manually place K8s resource nodes, configure their properties, and connect them to visualize their cluster architecture.

---

## 🎨 Design Decisions

### What we take from KubeView:
1. **Resource types** — Pod, Deployment, ReplicaSet, StatefulSet, DaemonSet, Service, Ingress, ConfigMap, Secret, PVC, Job, CronJob, HPA, Namespace
2. **Status color coding** — Green (healthy), Red (error), Grey (pending/unknown) — as a user-configurable property
3. **SVG icons per resource** — Each K8s resource gets its own recognizable icon
4. **Relationship awareness** — Suggested connections (Deployment → ReplicaSet → Pod, Service → Pod, etc.)

### What we do differently:
1. **Static diagramming** — No live K8s API connection; this is for planning/documenting architecture
2. **Fits our existing node system** — Uses `SystemNode` component with a new `kubernetes` category
3. **Premium styling** — Matches our existing node aesthetic (borders, shadows, resize handles)
4. **Configurable properties** — Users set status, replicas, image, labels etc. in the properties panel

---

## 🏗️ Implementation Steps

### Phase 1: New Kubernetes Category & Node Types

**File: `client/src/pages/Workspace.tsx`**

Add new entries to `nodeTypesList` under a **"Kubernetes"** category:

```typescript
// Kubernetes Workloads
{ type: 'k8s-pod',          label: 'Pod',               icon: K8sPod,        category: 'Kubernetes' },
{ type: 'k8s-deployment',   label: 'Deployment',        icon: K8sDeploy,     category: 'Kubernetes' },
{ type: 'k8s-replicaset',   label: 'ReplicaSet',        icon: K8sReplicaSet, category: 'Kubernetes' },
{ type: 'k8s-statefulset',  label: 'StatefulSet',       icon: K8sStateful,   category: 'Kubernetes' },
{ type: 'k8s-daemonset',    label: 'DaemonSet',         icon: K8sDaemon,     category: 'Kubernetes' },
{ type: 'k8s-job',          label: 'Job',               icon: K8sJob,        category: 'Kubernetes' },
{ type: 'k8s-cronjob',      label: 'CronJob',           icon: K8sCronJob,    category: 'Kubernetes' },

// Kubernetes Networking
{ type: 'k8s-service',      label: 'Service',           icon: K8sService,    category: 'Kubernetes' },
{ type: 'k8s-ingress',      label: 'Ingress',           icon: K8sIngress,    category: 'Kubernetes' },

// Kubernetes Config & Storage
{ type: 'k8s-configmap',    label: 'ConfigMap',         icon: K8sConfigMap,  category: 'Kubernetes' },
{ type: 'k8s-secret',       label: 'Secret',            icon: K8sSecret,     category: 'Kubernetes' },
{ type: 'k8s-pvc',          label: 'PersistentVolumeClaim', icon: K8sPVC,    category: 'Kubernetes' },

// Kubernetes Scaling & Namespace
{ type: 'k8s-hpa',          label: 'HPA (Autoscaler)',  icon: K8sHPA,        category: 'Kubernetes' },
{ type: 'k8s-namespace',    label: 'Namespace',         icon: K8sNamespace,  category: 'Kubernetes' },
```

Register all in `nodeTypes` map → `SystemNode`.

Add default dimensions in `addNode()`:
```typescript
// Kubernetes nodes
'k8s-pod':        { w: 120, h: 80 },
'k8s-deployment': { w: 168, h: 80 },
'k8s-service':    { w: 156, h: 72 },
'k8s-namespace':  { w: 400, h: 300 },  // Container like VPC
// ... etc
```

---

### Phase 2: Kubernetes SVG Icons

**New file: `client/src/components/canvas/icons/KubernetesIcons.tsx`**

Create inline SVG React components for each K8s resource, using the official [Kubernetes icon set](https://github.com/kubernetes/community/tree/master/icons). Each icon will be a small functional component:

```tsx
export const K8sPodIcon = ({ size = 18, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 18 18" fill="none">
    {/* Official K8s Pod hex shape */}
    <path d="M9 1L16 5V13L9 17L2 13V5L9 1Z" fill={color} opacity="0.2" />
    <path d="M9 1L16 5V13L9 17L2 13V5L9 1Z" stroke={color} strokeWidth="1.5" />
  </svg>
);

// ... similar for Deployment, Service, Ingress, etc.
```

**Why inline SVGs instead of image URLs?**
- Works offline, no CDN dependency
- Can be colored dynamically based on status
- Matches our icon pattern (Lucide icons are also inline SVGs)

---

### Phase 3: Kubernetes Category Styling in SystemNode

**File: `client/src/components/canvas/nodes/SystemNode.tsx`**

Add a new `kubernetes` category style:

```typescript
// Category styles
kubernetes: { 
  bg: 'bg-[#326CE5]',           // Official Kubernetes blue
  border: 'border-[#2457B5]',
  text: 'text-white', 
  icon: 'text-blue-100' 
},

// Status-based overrides (read from data.status)
const k8sStatusStyles: Record<string, { bg: string, border: string }> = {
  healthy: { bg: 'bg-[#22C55E]', border: 'border-[#16A34A]' },   // Green
  error:   { bg: 'bg-[#EF4444]', border: 'border-[#DC2626]' },   // Red  
  pending: { bg: 'bg-[#6B7280]', border: 'border-[#4B5563]' },   // Grey
  default: { bg: 'bg-[#326CE5]', border: 'border-[#2457B5]' },   // K8s Blue
};
```

Add logic in `SystemNode` to detect `k8s-*` type nodes:
```typescript
const isKubernetes = (type as string)?.startsWith('k8s-');
const isK8sContainer = type === 'k8s-namespace';

// Override colors based on status
if (isKubernetes && data.status) {
  const statusStyle = k8sStatusStyles[data.status as string] || k8sStatusStyles.default;
  // Apply statusStyle.bg and statusStyle.border
}
```

For `k8s-namespace`, render as a container (dashed border, transparent background) similar to VPC/Region.

---

### Phase 4: Kubernetes Properties Panel

**File: `client/src/pages/Workspace.tsx`** (Properties sidebar section)

When a K8s node is selected, show relevant configuration fields:

| Node Type | Properties |
|-----------|-----------|
| **All K8s** | Status (dropdown: healthy/error/pending), Labels (key-value), Annotations |
| **Pod** | Image, Container Port, Restart Policy |
| **Deployment** | Replicas, Strategy (RollingUpdate/Recreate), Image |
| **Service** | Type (ClusterIP/NodePort/LoadBalancer), Port, Target Port |
| **Ingress** | Host, Path, TLS enabled |
| **ConfigMap/Secret** | Data keys (list) |
| **PVC** | Storage size, Access mode, Storage class |
| **HPA** | Min/Max replicas, Target CPU % |
| **Job/CronJob** | Schedule (cron only), Completions, Parallelism |
| **Namespace** | Just a label (container node) |

```tsx
{isKubernetesNode && (
  <div className="space-y-1.5">
    <div className="text-[9px] text-white/20 uppercase font-bold">Status</div>
    <select
      value={(selectedNode.data?.status as string) || 'default'}
      onChange={(e) => updateNodeData(selectedNode.id, { status: e.target.value })}
      className="w-full h-8 rounded-md bg-white/5 border-white/10 text-white text-[11px]"
    >
      <option value="default">Default (Blue)</option>
      <option value="healthy">Healthy (Green)</option>
      <option value="error">Error (Red)</option>
      <option value="pending">Pending (Grey)</option>
    </select>
  </div>
)}
```

---

### Phase 5: Smart Rendering for K8s Nodes

Within `SystemNode`, add a dedicated rendering branch for Kubernetes nodes:

```tsx
{isKubernetes && !isK8sContainer ? (
  <div className="flex items-center gap-3 flex-shrink-0">
    {/* Icon with status indicator dot */}
    <div className="relative p-2 rounded-md bg-white/10 w-10 h-10 flex items-center justify-center">
      {K8sIcon}
      {data.status && (
        <div className={`absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-current
          ${data.status === 'healthy' ? 'bg-green-400' : 
            data.status === 'error' ? 'bg-red-400' : 'bg-gray-400'}
        `} />
      )}
    </div>
    
    <div className="flex flex-col min-w-0">
      <span className="text-[12px] font-bold truncate leading-tight text-white">
        {data.label}
      </span>
      <span className="text-[9px] uppercase tracking-widest font-bold mt-0.5 opacity-60 text-white">
        {type?.replace('k8s-', '')}
      </span>
      {/* Show replicas badge for applicable types */}
      {data.replicas && (
        <span className="text-[8px] mt-1 px-1.5 py-0.5 bg-white/10 rounded-sm w-fit">
          {data.replicas} replicas
        </span>
      )}
    </div>
  </div>
) : null}
```

---

## 📁 Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `client/src/components/canvas/icons/KubernetesIcons.tsx` | **CREATE** | SVG icon components for all 14 K8s resource types |
| `client/src/components/canvas/nodes/SystemNode.tsx` | **MODIFY** | Add `kubernetes` category styles, K8s status colors, K8s-specific rendering |
| `client/src/pages/Workspace.tsx` | **MODIFY** | Add 14 K8s node types to library, register in nodeTypes, add dimensions, add K8s properties panel |

---

## 🎯 Milestone Checklist

- [ ] **M1:** Create `KubernetesIcons.tsx` with all 14 SVG icons
- [ ] **M2:** Add `kubernetes` category to `SystemNode` (blue theme + status colors)
- [ ] **M3:** Register all 14 K8s types in `Workspace.tsx` (library + nodeTypes + dimensions)
- [ ] **M4:** Add K8s-specific rendering in `SystemNode` (icon + status dot + replicas badge)
- [ ] **M5:** Add K8s properties panel (status dropdown, replicas, image, etc.)
- [ ] **M6:** Add `k8s-namespace` as container node (like VPC/Region)
- [ ] **M7:** Build and test

---

## 🎨 Visual Reference

```
┌─────────────────────────────────┐
│  k8s-namespace: production      │  ← Dashed border container
│                                 │
│  ┌──────────┐   ┌──────────┐   │
│  │ ⎈ nginx  │──▶│ ⎈ web-svc│   │  ← Deployment → Service
│  │ Deploy   │   │ Service  │   │
│  │ 3 repls  │   │ ClusterIP│   │
│  │ 🟢       │   │ :80      │   │
│  └──────────┘   └──────────┘   │
│       │                         │
│       ▼                         │
│  ┌──────────┐                   │
│  │ ⎈ nginx  │                   │  ← ReplicaSet (auto-linked)
│  │ RS       │                   │
│  │ 🟢       │                   │
│  └──────────┘                   │
│       │                         │
│    ┌──┼──┐                      │
│    ▼  ▼  ▼                      │
│  ┌──┐┌──┐┌──┐                   │  ← Individual Pods
│  │🟢││🟢││🟢│                   │
│  └──┘└──┘└──┘                   │
│                                 │
└─────────────────────────────────┘
```

**Color Key:**
- 🔵 `#326CE5` — Default K8s Blue (brand color)
- 🟢 `#22C55E` — Healthy/Running
- 🔴 `#EF4444` — Error/Failed
- ⚪ `#6B7280` — Pending/Unknown
