import React from 'react';

interface IconProps {
    size?: number;
    className?: string;
}

// Official Kubernetes helm/wheel logo (simplified)
export const K8sLogo: React.FC<IconProps> = ({ size = 18, className }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
        <path d="M12 2L3 7V17L12 22L21 17V7L12 2Z" stroke="currentColor" strokeWidth="1.5" fill="currentColor" fillOpacity="0.15" />
        <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.5" />
        <line x1="12" y1="4" x2="12" y2="9" stroke="currentColor" strokeWidth="1.2" />
        <line x1="12" y1="15" x2="12" y2="20" stroke="currentColor" strokeWidth="1.2" />
        <line x1="5" y1="8" x2="9.5" y2="10.5" stroke="currentColor" strokeWidth="1.2" />
        <line x1="14.5" y1="13.5" x2="19" y2="16" stroke="currentColor" strokeWidth="1.2" />
        <line x1="5" y1="16" x2="9.5" y2="13.5" stroke="currentColor" strokeWidth="1.2" />
        <line x1="14.5" y1="10.5" x2="19" y2="8" stroke="currentColor" strokeWidth="1.2" />
    </svg>
);

// Pod — hexagon with inner circle (the core unit)
export const K8sPodIcon: React.FC<IconProps> = ({ size = 18, className }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
        <path d="M12 2L21 7V17L12 22L3 17V7L12 2Z" stroke="currentColor" strokeWidth="1.5" fill="currentColor" fillOpacity="0.12" />
        <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="1.5" />
        <circle cx="12" cy="12" r="1.5" fill="currentColor" />
    </svg>
);

// Deployment — hexagon with stacked layers (represents rollout)
export const K8sDeployIcon: React.FC<IconProps> = ({ size = 18, className }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
        <path d="M12 2L21 7V17L12 22L3 17V7L12 2Z" stroke="currentColor" strokeWidth="1.5" fill="currentColor" fillOpacity="0.12" />
        <rect x="8" y="8" width="8" height="3" rx="0.5" stroke="currentColor" strokeWidth="1.2" fill="currentColor" fillOpacity="0.3" />
        <rect x="8" y="13" width="8" height="3" rx="0.5" stroke="currentColor" strokeWidth="1.2" fill="currentColor" fillOpacity="0.15" />
    </svg>
);

// ReplicaSet — hexagon with multiple small circles (replicas)
export const K8sReplicaSetIcon: React.FC<IconProps> = ({ size = 18, className }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
        <path d="M12 2L21 7V17L12 22L3 17V7L12 2Z" stroke="currentColor" strokeWidth="1.5" fill="currentColor" fillOpacity="0.12" />
        <circle cx="9" cy="10" r="2" stroke="currentColor" strokeWidth="1.2" fill="currentColor" fillOpacity="0.2" />
        <circle cx="15" cy="10" r="2" stroke="currentColor" strokeWidth="1.2" fill="currentColor" fillOpacity="0.2" />
        <circle cx="12" cy="15" r="2" stroke="currentColor" strokeWidth="1.2" fill="currentColor" fillOpacity="0.2" />
    </svg>
);

// StatefulSet — hexagon with numbered stack
export const K8sStatefulIcon: React.FC<IconProps> = ({ size = 18, className }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
        <path d="M12 2L21 7V17L12 22L3 17V7L12 2Z" stroke="currentColor" strokeWidth="1.5" fill="currentColor" fillOpacity="0.12" />
        <rect x="8" y="7" width="8" height="2.5" rx="0.5" stroke="currentColor" strokeWidth="1" fill="currentColor" fillOpacity="0.35" />
        <rect x="8" y="11" width="8" height="2.5" rx="0.5" stroke="currentColor" strokeWidth="1" fill="currentColor" fillOpacity="0.25" />
        <rect x="8" y="15" width="8" height="2.5" rx="0.5" stroke="currentColor" strokeWidth="1" fill="currentColor" fillOpacity="0.15" />
    </svg>
);

// DaemonSet — hexagon with a "D" shape / daemon eye
export const K8sDaemonIcon: React.FC<IconProps> = ({ size = 18, className }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
        <path d="M12 2L21 7V17L12 22L3 17V7L12 2Z" stroke="currentColor" strokeWidth="1.5" fill="currentColor" fillOpacity="0.12" />
        <circle cx="12" cy="12" r="4.5" stroke="currentColor" strokeWidth="1.5" strokeDasharray="3 2" />
        <circle cx="12" cy="12" r="1.5" fill="currentColor" />
    </svg>
);

// Service — hexagon with a diamond/rhombus inside (networking)
export const K8sServiceIcon: React.FC<IconProps> = ({ size = 18, className }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
        <path d="M12 2L21 7V17L12 22L3 17V7L12 2Z" stroke="currentColor" strokeWidth="1.5" fill="currentColor" fillOpacity="0.12" />
        <path d="M12 7L17 12L12 17L7 12L12 7Z" stroke="currentColor" strokeWidth="1.5" fill="currentColor" fillOpacity="0.2" />
    </svg>
);

// Ingress — hexagon with arrow pointing in
export const K8sIngressIcon: React.FC<IconProps> = ({ size = 18, className }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
        <path d="M12 2L21 7V17L12 22L3 17V7L12 2Z" stroke="currentColor" strokeWidth="1.5" fill="currentColor" fillOpacity="0.12" />
        <path d="M6 12H16M16 12L13 9M16 12L13 15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
);

// ConfigMap — hexagon with key/settings lines
export const K8sConfigMapIcon: React.FC<IconProps> = ({ size = 18, className }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
        <path d="M12 2L21 7V17L12 22L3 17V7L12 2Z" stroke="currentColor" strokeWidth="1.5" fill="currentColor" fillOpacity="0.12" />
        <line x1="8" y1="9" x2="16" y2="9" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
        <line x1="8" y1="12" x2="14" y2="12" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
        <line x1="8" y1="15" x2="16" y2="15" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
);

// Secret — hexagon with lock
export const K8sSecretIcon: React.FC<IconProps> = ({ size = 18, className }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
        <path d="M12 2L21 7V17L12 22L3 17V7L12 2Z" stroke="currentColor" strokeWidth="1.5" fill="currentColor" fillOpacity="0.12" />
        <rect x="9" y="11" width="6" height="5" rx="1" stroke="currentColor" strokeWidth="1.2" fill="currentColor" fillOpacity="0.15" />
        <path d="M10.5 11V9.5C10.5 8.67 11.17 8 12 8C12.83 8 13.5 8.67 13.5 9.5V11" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
        <circle cx="12" cy="13.5" r="0.8" fill="currentColor" />
    </svg>
);

// PVC — hexagon with disk/cylinder
export const K8sPVCIcon: React.FC<IconProps> = ({ size = 18, className }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
        <path d="M12 2L21 7V17L12 22L3 17V7L12 2Z" stroke="currentColor" strokeWidth="1.5" fill="currentColor" fillOpacity="0.12" />
        <ellipse cx="12" cy="9" rx="4" ry="1.5" stroke="currentColor" strokeWidth="1.2" fill="currentColor" fillOpacity="0.15" />
        <path d="M8 9V15C8 15.83 9.79 16.5 12 16.5C14.21 16.5 16 15.83 16 15V9" stroke="currentColor" strokeWidth="1.2" />
    </svg>
);

// Job — hexagon with single checkmark
export const K8sJobIcon: React.FC<IconProps> = ({ size = 18, className }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
        <path d="M12 2L21 7V17L12 22L3 17V7L12 2Z" stroke="currentColor" strokeWidth="1.5" fill="currentColor" fillOpacity="0.12" />
        <path d="M8 12.5L11 15.5L16 9.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
);

// CronJob — hexagon with clock
export const K8sCronJobIcon: React.FC<IconProps> = ({ size = 18, className }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
        <path d="M12 2L21 7V17L12 22L3 17V7L12 2Z" stroke="currentColor" strokeWidth="1.5" fill="currentColor" fillOpacity="0.12" />
        <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="1.2" />
        <line x1="12" y1="10" x2="12" y2="12" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
        <line x1="12" y1="12" x2="14" y2="13" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
);

// HPA — hexagon with scaling arrows
export const K8sHPAIcon: React.FC<IconProps> = ({ size = 18, className }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
        <path d="M12 2L21 7V17L12 22L3 17V7L12 2Z" stroke="currentColor" strokeWidth="1.5" fill="currentColor" fillOpacity="0.12" />
        <path d="M8 12H16M8 12L10 10M8 12L10 14M16 12L14 10M16 12L14 14" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
);

// Namespace — rounded container border (not hexagonal — this is a grouping node)
export const K8sNamespaceIcon: React.FC<IconProps> = ({ size = 18, className }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
        <rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="1.5" strokeDasharray="4 2" fill="currentColor" fillOpacity="0.06" />
        <text x="12" y="13" textAnchor="middle" dominantBaseline="middle" fill="currentColor" fontSize="7" fontWeight="bold" fontFamily="sans-serif">NS</text>
    </svg>
);

// Map for easy lookup by type suffix
export const k8sIcons: Record<string, React.FC<IconProps>> = {
    'k8s-pod': K8sPodIcon,
    'k8s-deployment': K8sDeployIcon,
    'k8s-replicaset': K8sReplicaSetIcon,
    'k8s-statefulset': K8sStatefulIcon,
    'k8s-daemonset': K8sDaemonIcon,
    'k8s-service': K8sServiceIcon,
    'k8s-ingress': K8sIngressIcon,
    'k8s-configmap': K8sConfigMapIcon,
    'k8s-secret': K8sSecretIcon,
    'k8s-pvc': K8sPVCIcon,
    'k8s-job': K8sJobIcon,
    'k8s-cronjob': K8sCronJobIcon,
    'k8s-hpa': K8sHPAIcon,
    'k8s-namespace': K8sNamespaceIcon,
};
