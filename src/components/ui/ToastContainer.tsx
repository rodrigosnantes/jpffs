import { useToast } from '../../contexts/ToastContext';
import { cn } from '../../utils/cn';
import { X } from 'lucide-react';

// ─── Color config ─────────────────────────────────────────────────────────

const TOAST_STYLES = {
    goal: 'border-green-500/50 bg-green-500/10 shadow-green-500/10',
    owngoal: 'border-orange-500/50 bg-orange-500/10 shadow-orange-500/10',
    yellow: 'border-yellow-500/50 bg-yellow-500/10 shadow-yellow-500/10',
    red: 'border-red-500/50 bg-red-500/10 shadow-red-500/10',
    assist: 'border-cyan-500/50 bg-cyan-500/10 shadow-cyan-500/10',
    info: 'border-white/20 bg-white/5 shadow-white/5',
};

const TEAM_BADGE = {
    A: 'bg-yellow-500/20 text-yellow-400',
    B: 'bg-blue-500/20 text-blue-400',
};

// ─── Single toast ─────────────────────────────────────────────────────────

const ToastItem = ({ id, type, title, subtitle, team }: {
    id: string; type: keyof typeof TOAST_STYLES;
    title: string; subtitle?: string; team?: 'A' | 'B';
}) => {
    const { removeToast } = useToast();
    return (
        <div className={cn(
            'flex items-start gap-3 min-w-[260px] max-w-xs rounded-xl border px-4 py-3 shadow-xl',
            'animate-in slide-in-from-right-4 fade-in duration-300',
            TOAST_STYLES[type] ?? TOAST_STYLES.info
        )}>
            <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-white leading-snug">{title}</p>
                {subtitle && <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>}
                {team && (
                    <span className={cn('text-[10px] font-bold uppercase px-1.5 py-0.5 rounded mt-1 inline-block', TEAM_BADGE[team])}>
                        Time {team === 'A' ? 'Amarelo' : 'Azul'}
                    </span>
                )}
            </div>
            <button onClick={() => removeToast(id)} className="text-gray-500 hover:text-white transition-colors shrink-0 mt-0.5">
                <X size={14} />
            </button>
        </div>
    );
};

// ─── Container ────────────────────────────────────────────────────────────

export const ToastContainer = () => {
    const { toasts } = useToast();
    if (toasts.length === 0) return null;

    return (
        <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-2 pointer-events-none">
            {toasts.map(toast => (
                <div key={toast.id} className="pointer-events-auto">
                    <ToastItem {...toast} />
                </div>
            ))}
        </div>
    );
};
