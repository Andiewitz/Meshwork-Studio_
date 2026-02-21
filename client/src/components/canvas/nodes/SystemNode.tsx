import { Handle, Position, NodeProps, NodeResizer } from '@xyflow/react';
import {
    Server,
    Database,
    Cpu,
    Globe,
    MessageSquare,
    HardDrive,
    Zap,
    Box,
    Share2,
    Search,
    User as UserIcon,
    Type,
    Circle
} from 'lucide-react';
import { k8sIcons } from '../icons/KubernetesIcons';

const icons: Record<string, any> = {
    server: Server,
    database: Database,
    loadBalancer: Cpu,
    gateway: Globe,
    queue: MessageSquare,
    storage: HardDrive,
    logic: Zap,
    cdn: Globe,
    microservice: Box,
    worker: Cpu,
    cache: Zap,
    search: Search,
    bus: Share2,
    user: UserIcon,
    app: Box,
    api: Globe,
    note: Type,
    junction: Circle,
    postgresql: Database,
    mongodb: Box,
    mysql: Database,
    redis: Zap,
    oracle: Database,
    dynamodb: HardDrive,
};

export function SystemNode({ data, selected, type }: NodeProps) {
    // Category-specific dimensions (multiples of 12)
    const dimensions: Record<string, { w: string, h: string }> = {
        compute: { w: 'w-[168px]', h: 'h-[72px]' },
        data: { w: 'w-[144px]', h: 'h-[120px]' }, // Cylindrical feel
        networking: { w: 'w-[192px]', h: 'h-[72px]' },
        external: { w: 'w-[144px]', h: 'h-[96px]' },
        infrastructure: { w: 'w-full', h: 'h-full' },
        documentation: { w: 'w-[192px]', h: 'h-[192px]' },
        utilities: { w: 'w-6', h: 'h-6' },
        kubernetes: { w: 'w-[168px]', h: 'h-[96px]' }
    };

    const category = (data.category as string || '').toLowerCase();
    const dim = dimensions[category] || dimensions.compute;

    // Premium Color Palette
    const categoryStyles: Record<string, { bg: string, border: string, text: string, icon: string }> = {
        compute: { bg: 'bg-[#4F46E5]', border: 'border-[#4338CA]', text: 'text-white', icon: 'text-indigo-100' },
        data: { bg: 'bg-[#F59E0B]', border: 'border-[#D97706]', text: 'text-white', icon: 'text-amber-100' },
        networking: { bg: 'bg-[#10B981]', border: 'border-[#059669]', text: 'text-white', icon: 'text-emerald-100' },
        external: { bg: 'bg-[#8B5CF6]', border: 'border-[#7C3AED]', text: 'text-white', icon: 'text-purple-100' },
        infrastructure: { bg: 'bg-white', border: 'border-black', text: 'text-black', icon: 'text-black/40' },
        documentation: { bg: 'bg-gradient-to-br from-[#FFF9C4] to-[#FFF176]', border: 'border-yellow-400/50', text: 'text-yellow-900/80', icon: 'text-yellow-700/30' },
        utilities: { bg: 'bg-white', border: 'border-black', text: 'text-black', icon: 'text-black/40' },
        kubernetes: { bg: 'bg-[#326CE5]', border: 'border-[#2457B5]', text: 'text-white', icon: 'text-blue-100' }
    };

    // Kubernetes status-based color overrides
    const k8sStatusStyles: Record<string, { bg: string, border: string }> = {
        healthy: { bg: 'bg-[#22C55E]', border: 'border-[#16A34A]' },
        error: { bg: 'bg-[#EF4444]', border: 'border-[#DC2626]' },
        pending: { bg: 'bg-[#6B7280]', border: 'border-[#4B5563]' },
    };

    // Provider Specific Branding (High Fidelity)
    const providerStyles: Record<string, { bg: string, border: string, logo?: React.ReactNode, radius?: string }> = {
        postgresql: {
            bg: 'bg-[#336791]',
            border: 'border-[#244e6d]',
            logo: <img src="https://cdn.simpleicons.org/postgresql/white" className="w-10 h-10 object-contain" alt="PostgreSQL" />
        },
        mongodb: {
            bg: 'bg-[#47A248]',
            border: 'border-[#3d8b3e]',
            logo: <img src="https://cdn.simpleicons.org/mongodb/white" className="w-10 h-10 object-contain" alt="MongoDB" />
        },
        redis: {
            bg: 'bg-[#D82C20]',
            border: 'border-[#b1241a]',
            radius: 'rounded-lg',
            logo: <img src="https://cdn.simpleicons.org/redis/white" className="w-10 h-10 object-contain" alt="Redis" />
        },
        mysql: {
            bg: 'bg-[#00758F]',
            border: 'border-[#005c70]',
            logo: <img src="https://cdn.simpleicons.org/mysql/white" className="w-10 h-10 object-contain" alt="MySQL" />
        },
        oracle: {
            bg: 'bg-[#F80000]',
            border: 'border-[#cc0000]',
            logo: <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/5/50/Oracle_logo.svg/512px-Oracle_logo.svg.png" className="w-10 h-3 object-contain brightness-0 invert" alt="Oracle" />
        },
        dynamodb: {
            bg: 'bg-[#2E27AD]',
            border: 'border-[#251f8a]',
            logo: <img src="https://raw.githubusercontent.com/awslabs/aws-icons-for-plantuml/master/dist/Database/AmazonDynamoDB.png" className="w-10 h-10 object-contain" alt="DynamoDB" />
        },
    };

    const style = categoryStyles[category] || categoryStyles.compute;
    const provider = (data.provider as string || '').toLowerCase();
    const customBrand = providerStyles[provider];

    const isData = category === 'data';
    const isInfrastructure = type === 'vpc' || type === 'region';
    const isNote = type === 'note';
    const isKubernetes = (type as string)?.startsWith('k8s-');
    const isK8sNamespace = type === 'k8s-namespace';
    const k8sStatus = (data.status as string) || '';

    // Override style for K8s nodes based on status
    const k8sOverride = isKubernetes && k8sStatus ? k8sStatusStyles[k8sStatus] : null;

    // Handle Specialized Icons/Logos
    let IconElement: React.ReactNode;
    if (isKubernetes) {
        const K8sIcon = k8sIcons[type as string];
        IconElement = K8sIcon ? <K8sIcon size={22} className={style.icon} /> : <Box size={18} />;
    } else if (customBrand?.logo) {
        IconElement = customBrand.logo;
    } else {
        const Icon = icons[provider] || icons[type as string] || Box;
        IconElement = <Icon size={isData ? 24 : 18} strokeWidth={selected ? 2.5 : 2} />;
    }

    const borderRadius = customBrand?.radius || (type === 'junction' ? 'rounded-full' : 'rounded-xl');

    if (type === 'junction') {
        return (
            <div className="relative w-6 h-6 group">
                <div className={`
                    absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 rounded-full transition-all border-2
                    ${selected ? 'bg-black border-black ring-4 ring-black/5' : 'bg-white border-black/40 group-hover:border-black'}
                `} />
                <Handle type="target" position={Position.Top} style={{ top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }} className="!opacity-0 !w-full !h-full !border-0" />
                <Handle type="source" position={Position.Top} style={{ top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }} className="!opacity-0 !w-full !h-full !border-0" />
            </div>
        );
    }

    return (
        <>
            <NodeResizer
                minWidth={24}
                minHeight={24}
                isVisible={selected}
                lineClassName={isNote ? "!border-yellow-500" : "!border-blue-500"}
                lineStyle={{ padding: 6 }}
                handleClassName="!h-3 !w-3 !bg-white !border-2 !border-blue-500 !rounded-sm !shadow-md"
                handleStyle={{ margin: -6 }}
            />
            <div className="group w-full h-full relative">
                {/* Connection Handles – hidden by default, visible on hover */}
                <Handle type="target" position={Position.Top} id="t-t" className="!w-2.5 !h-2.5 !rounded-sm !border-2 !border-blue-500 !bg-white !opacity-0 group-hover:!opacity-100 !transition-opacity !shadow-sm" />
                <Handle type="source" position={Position.Top} id="t-s" className="!w-2.5 !h-2.5 !rounded-sm !border-2 !border-blue-500 !bg-white !opacity-0 group-hover:!opacity-100 !transition-opacity !shadow-sm" />
                <Handle type="target" position={Position.Bottom} id="b-t" className="!w-2.5 !h-2.5 !rounded-sm !border-2 !border-blue-500 !bg-white !opacity-0 group-hover:!opacity-100 !transition-opacity !shadow-sm" />
                <Handle type="source" position={Position.Bottom} id="b-s" className="!w-2.5 !h-2.5 !rounded-sm !border-2 !border-blue-500 !bg-white !opacity-0 group-hover:!opacity-100 !transition-opacity !shadow-sm" />
                <Handle type="target" position={Position.Left} id="l-t" className="!w-2.5 !h-2.5 !rounded-sm !border-2 !border-blue-500 !bg-white !opacity-0 group-hover:!opacity-100 !transition-opacity !shadow-sm" />
                <Handle type="source" position={Position.Left} id="l-s" className="!w-2.5 !h-2.5 !rounded-sm !border-2 !border-blue-500 !bg-white !opacity-0 group-hover:!opacity-100 !transition-opacity !shadow-sm" />
                <Handle type="target" position={Position.Right} id="r-t" className="!w-2.5 !h-2.5 !rounded-sm !border-2 !border-blue-500 !bg-white !opacity-0 group-hover:!opacity-100 !transition-opacity !shadow-sm" />
                <Handle type="source" position={Position.Right} id="r-s" className="!w-2.5 !h-2.5 !rounded-sm !border-2 !border-blue-500 !bg-white !opacity-0 group-hover:!opacity-100 !transition-opacity !shadow-sm" />

                {/* Node Content */}
                <div
                    className={`
                        relative p-3 border-2 overflow-hidden
                        w-full h-full
                        ${isK8sNamespace
                            ? `bg-[#326CE5]/5 border-[#326CE5]/40 border-dashed ${selected ? 'bg-[#326CE5]/10 border-[#326CE5]/60' : 'hover:bg-[#326CE5]/8'}`
                            : k8sOverride
                                ? `${k8sOverride.bg} ${k8sOverride.border}`
                                : customBrand
                                    ? `${customBrand.bg} ${customBrand.border}`
                                    : `${style.bg} ${style.border}`
                        }
                        ${selected ? 'shadow-[8px_8px_0px_rgba(0,0,0,0.1)]' : 'group-hover:shadow-[4px_4px_0px_rgba(0,0,0,0.05)]'}
                        ${isNote ? 'rounded-sm' : isK8sNamespace ? 'rounded-lg' : borderRadius}
                        ${isInfrastructure ? 'bg-opacity-5' : ''}
                        flex flex-col
                    `}
                >
                    {/* Infrastructure label */}
                    {isInfrastructure && (
                        <div className="absolute -top-3 left-6 px-3 py-0.5 bg-white border rounded-none text-[10px] font-bold uppercase tracking-widest text-black/40">
                            {type}: {data.label as string}
                        </div>
                    )}

                    {/* K8s Namespace container label */}
                    {isK8sNamespace && (
                        <div className="absolute -top-3 left-4 px-2.5 py-0.5 bg-[#326CE5] rounded-sm text-[9px] font-bold uppercase tracking-widest text-white flex items-center gap-1.5 transition-all">
                            <svg width="10" height="10" viewBox="0 0 24 24" fill="none">
                                <path d="M12 2L21 7V17L12 22L3 17V7L12 2Z" stroke="currentColor" strokeWidth="2" fill="currentColor" fillOpacity="0.3" />
                            </svg>
                            ns: {data.label as string}
                        </div>
                    )}

                    {/* Sticky Note */}
                    {isNote ? (
                        <div className="flex-1 flex flex-col p-1">
                            <p className={`text-[14px] leading-relaxed font-semibold whitespace-pre-wrap break-all italic w-full max-w-full ${style.text}`} style={{ fontFamily: 'var(--font-serif)' }}>
                                {(data.label as string) || ''}
                            </p>
                        </div>

                        /* Kubernetes Nodes */
                    ) : isKubernetes && !isK8sNamespace ? (
                        <div className="flex items-center gap-3 flex-shrink-0">
                            {/* Icon with status indicator dot */}
                            <div className="relative p-2 rounded-md bg-white/15 w-10 h-10 flex items-center justify-center flex-shrink-0">
                                {IconElement}
                                {k8sStatus && (
                                    <div className={`absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full border-2 border-white/80
                                        ${k8sStatus === 'healthy' ? 'bg-green-400' :
                                            k8sStatus === 'error' ? 'bg-red-400' : 'bg-gray-400'}
                                    `}>
                                        <div className="k8s-status-pulse" />
                                    </div>
                                )}
                            </div>

                            <div className="flex flex-col min-w-0">
                                <span className="text-[12px] font-bold truncate leading-tight text-white">
                                    {data.label as string}
                                </span>
                                <span className="text-[9px] uppercase tracking-widest font-bold mt-0.5 opacity-60 text-white">
                                    {(type as string)?.replace('k8s-', '')}
                                </span>
                                {/* Metadata badges */}
                                <div className="flex gap-1 mt-1.5 flex-wrap">
                                    {Boolean(data.replicas) && (
                                        <span className="text-[8px] px-1.5 py-0.5 bg-white/10 rounded-sm text-white/80 font-semibold">
                                            {String(data.replicas)} replicas
                                        </span>
                                    )}
                                    {Boolean(data.image) && (
                                        <span className="text-[8px] px-1.5 py-0.5 bg-white/10 rounded-sm text-white/80 font-mono truncate max-w-[100px]">
                                            {String(data.image)}
                                        </span>
                                    )}
                                    {Boolean(data.serviceType) && (
                                        <span className="text-[8px] px-1.5 py-0.5 bg-white/10 rounded-sm text-white/80 font-semibold">
                                            {String(data.serviceType)}
                                        </span>
                                    )}
                                    {Boolean(data.schedule) && (
                                        <span className="text-[8px] px-1.5 py-0.5 bg-white/10 rounded-sm text-white/80 font-mono">
                                            {String(data.schedule)}
                                        </span>
                                    )}
                                    {Boolean(data.storageSize) && (
                                        <span className="text-[8px] px-1.5 py-0.5 bg-white/10 rounded-sm text-white/80 font-semibold">
                                            {String(data.storageSize)}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>

                        /* Default Nodes */
                    ) : (
                        <>
                            <div className={`flex ${isData ? 'flex-col items-center text-center mt-1' : 'items-center gap-3'} flex-shrink-0`}>
                                <div className={`
                                    p-2 rounded-none transition-colors w-10 h-10 flex items-center justify-center
                                    bg-white/10 ${style.icon}
                                `}>
                                    {IconElement}
                                </div>

                                <div className="flex flex-col min-w-0">
                                    <span className={`text-[12px] font-bold truncate leading-tight ${style.text}`}>
                                        {data.label as string}
                                    </span>
                                    <span className={`text-[9px] uppercase tracking-widest font-bold mt-0.5 opacity-60 ${style.text}`}>
                                        {provider || type}
                                    </span>
                                </div>
                            </div>

                            {/* Sub-Collections Display */}
                            {isData && Array.isArray(data.collections) && data.collections.length > 0 && (
                                <div className="mt-3 w-full space-y-1 flex-grow overflow-hidden">
                                    <div className="text-[8px] uppercase tracking-widest font-bold opacity-30 text-white mb-1">Collections</div>
                                    <div className="flex flex-col gap-1 overflow-y-auto max-h-[200px] pr-1 scrollbar-hide">
                                        {(data.collections as any[]).map((coll, i) => (
                                            <div key={i} className="px-2 py-1 bg-white/10 border border-white/5 text-[10px] font-medium text-white truncate flex items-center gap-1.5 shrink-0">
                                                <div className="w-1 h-1 rounded-full bg-white/40" />
                                                {String(coll)}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </>
    );
}
