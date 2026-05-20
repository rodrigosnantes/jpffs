import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { Card } from '../components/ui/Card';
import { ClipboardList, Shield, Check, X, ChevronRight, Users } from 'lucide-react';
import { cn } from '../utils/cn';

// ─── Helpers ─────────────────────────────────────────────────────────────────

const todayLabel = () =>
    new Date().toLocaleDateString('pt-BR', {
        weekday: 'long', day: '2-digit', month: 'long', year: 'numeric',
    });

// ─── Component ────────────────────────────────────────────────────────────────

export const Attendance = () => {
    const { players, currentMatch, attendanceIds, fetchAttendance, toggleAttendance, markAllAttendance, clearAllAttendance } = useStore();
    const navigate = useNavigate();

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState<string | null>(null); // player id being toggled
    const [searchTerm, setSearchTerm] = useState('');

    // ── Load today's attendance ────────────────────────────────────────────
    useEffect(() => {
        fetchAttendance().then(() => setLoading(false));
    }, [fetchAttendance]);

    const isPlayerPlaying = useCallback((playerId: string) => {
        if (!currentMatch.id || !currentMatch.isActive) return false;
        const inA = currentMatch.teamAPlayers?.some((p: any) => p.id === playerId);
        const inB = currentMatch.teamBPlayers?.some((p: any) => p.id === playerId);
        return !!(inA || inB);
    }, [currentMatch]);

    // ── Toggle presence ────────────────────────────────────────────────────
    const toggle = useCallback(async (playerId: string) => {
        setSaving(playerId);
        await toggleAttendance(playerId);
        setSaving(null);
    }, [toggleAttendance]);

    // ── Mark all / Clear all ───────────────────────────────────────────────

    // Default active players only
    const activePlayers = players.filter(p => p.status === 'active');

    // Displayed players filtered by search term
    const displayedPlayers = activePlayers.filter(p => {
        const term = searchTerm.toLowerCase();
        const matchesName = p.name.toLowerCase().includes(term);
        const matchesNickname = p.nickname?.toLowerCase().includes(term);
        return matchesName || matchesNickname;
    });

    const handleMarkAll = async () => {
        setLoading(true);
        await markAllAttendance(activePlayers);
        setLoading(false);
    };

    const handleClearAll = async () => {
        setLoading(true);
        await clearAllAttendance();
        setLoading(false);
    };

    // Calculate counts strictly based on Active Players
    const activeConfirmedCount = activePlayers.filter(p => attendanceIds.includes(p.id)).length;
    const allConfirmed = activeConfirmedCount === activePlayers.length && activePlayers.length > 0;

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold font-header text-primary flex items-center gap-3">
                        <ClipboardList className="text-primary" />
                        Chamada do Dia
                    </h1>
                    <p className="text-gray-500 text-sm mt-1 capitalize">{todayLabel()}</p>
                </div>

                {/* CTA to Teams */}
                <button
                    onClick={() => navigate('/teams')}
                    disabled={activeConfirmedCount < 2}
                    className={cn(
                        'flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all',
                        activeConfirmedCount >= 2
                            ? 'bg-primary text-background hover:bg-primary/90 shadow-lg shadow-primary/20'
                            : 'bg-white/5 text-gray-600 cursor-not-allowed'
                    )}
                >
                    Ir para Sorteio
                    <ChevronRight size={16} />
                </button>
            </div>

            {/* Search */}
            <div className="relative">
                <input
                    type="text"
                    placeholder="Buscar jogador por nome ou apelido..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 pl-10 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                />
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                </div>
            </div>

            {/* Summary bar */}
            <Card className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-4">
                <div className="flex items-center gap-6">
                    <div className="text-center">
                        <div className="text-2xl font-bold text-white">{activePlayers.length}</div>
                        <div className="text-[10px] text-gray-500 uppercase tracking-wider">Total</div>
                    </div>
                    <div className="w-px h-8 bg-white/10" />
                    <div className="text-center">
                        <div className="text-2xl font-bold text-green-400">{activeConfirmedCount}</div>
                        <div className="text-[10px] text-gray-500 uppercase tracking-wider">Presentes</div>
                    </div>
                    <div className="w-px h-8 bg-white/10" />
                    <div className="text-center">
                        <div className="text-2xl font-bold text-gray-500">{activePlayers.length - activeConfirmedCount}</div>
                        <div className="text-[10px] text-gray-500 uppercase tracking-wider">Ausentes</div>
                    </div>
                </div>

                {/* Progress bar */}
                <div className="flex-1 max-w-sm">
                    <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-green-500 rounded-full transition-all duration-500"
                            style={{ width: activePlayers.length ? `${(activeConfirmedCount / activePlayers.length) * 100}%` : '0%' }}
                        />
                    </div>
                </div>

                {/* Bulk actions */}
                <div className="flex items-center gap-2">
                    <button
                        onClick={allConfirmed ? handleClearAll : handleMarkAll}
                        className="flex items-center gap-1.5 text-xs font-medium border border-white/10 px-3 py-1.5 rounded-lg text-gray-400 hover:text-white hover:border-white/20 transition-colors"
                    >
                        <Users size={13} />
                        {allConfirmed ? 'Desmarcar todos' : 'Marcar todos'}
                    </button>
                </div>
            </Card>

            {/* Player grid */}
            {loading ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                    {Array.from({ length: 8 }).map((_, i) => (
                        <div key={i} className="h-24 rounded-xl bg-white/3 animate-pulse" />
                    ))}
                </div>
            ) : displayedPlayers.length === 0 ? (
                <div className="py-12 text-center text-gray-500 bg-white/5 border border-white/10 rounded-xl">
                    Nenhum jogador encontrado com essa busca.
                </div>
            ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                    {displayedPlayers.map(player => {
                        const isPresent = attendanceIds.includes(player.id);
                        const isSaving = saving === player.id;
                        const isPlaying = isPlayerPlaying(player.id);

                        return (
                            <button
                                key={player.id}
                                onClick={() => toggle(player.id)}
                                disabled={isSaving || isPlaying}
                                className={cn(
                                    'relative flex flex-col items-center justify-center gap-2 p-4 rounded-xl border-2 transition-all duration-200 text-center',
                                    isPresent
                                        ? 'bg-green-500/10 border-green-500/50 text-white shadow-lg shadow-green-500/10'
                                        : 'bg-white/3 border-white/5 text-gray-500 hover:border-white/20 hover:text-gray-300',
                                    (isSaving || isPlaying) && 'opacity-60 cursor-wait'
                                )}
                            >
                                {/* Status overlay for playing */}
                                {isPlaying && (
                                    <div className="absolute inset-0 bg-black/60 z-10 rounded-xl flex items-center justify-center p-2">
                                        <div className="bg-primary/20 border border-primary/40 px-2 py-1 rounded text-[10px] font-black uppercase text-primary tracking-widest">
                                            Em Jogo
                                        </div>
                                    </div>
                                )}
                                {/* Status indicator */}
                                <div className={cn(
                                    'absolute top-2 right-2 w-5 h-5 rounded-full flex items-center justify-center transition-all',
                                    isPresent ? 'bg-green-500' : 'bg-white/5'
                                )}>
                                    {isPresent
                                        ? <Check size={11} className="text-white" />
                                        : <X size={11} className="text-gray-600" />
                                    }
                                </div>

                                {/* Avatar */}
                                <div className={cn(
                                    'w-12 h-12 rounded-full flex items-center justify-center text-sm font-bold border',
                                    isPresent
                                        ? 'bg-green-500/20 border-green-500/40 text-green-300'
                                        : 'bg-white/5 border-white/10 text-gray-500'
                                )}>
                                    {(player.nickname || player.name).substring(0, 2).toUpperCase()}
                                </div>

                                {/* Name */}
                                <span className="text-xs font-semibold leading-tight">
                                    {(player.nickname || player.name).split(' ')[0]}
                                </span>

                                {/* Position badge */}
                                <span className={cn(
                                    'flex items-center gap-0.5 text-[9px] uppercase tracking-wider',
                                    player.position === 'Goalkeeper' ? 'text-yellow-500' : 'text-gray-600'
                                )}>
                                    {player.position === 'Goalkeeper' && <Shield size={9} />}
                                    {player.position === 'Goalkeeper' ? 'Goleiro' : 'Linha'}
                                </span>
                            </button>
                        );
                    })}
                </div>
            )}

            {/* Footer hint */}
            {activeConfirmedCount >= 2 && (
                <p className="text-center text-xs text-gray-600 animate-in fade-in duration-500">
                    {activeConfirmedCount} jogadores confirmados — pronto para sortear os times!
                </p>
            )}
        </div>
    );
};
