import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useStore } from '../store/useStore';
import { Card } from '../components/ui/Card';
import { ClipboardList, Shield, Check, X, ChevronRight, Users } from 'lucide-react';
import { cn } from '../utils/cn';

// ─── Helpers ─────────────────────────────────────────────────────────────────

const todayISO = () => new Date().toISOString().split('T')[0];

const todayLabel = () =>
    new Date().toLocaleDateString('pt-BR', {
        weekday: 'long', day: '2-digit', month: 'long', year: 'numeric',
    });

// ─── Component ────────────────────────────────────────────────────────────────

export const Attendance = () => {
    const { players } = useStore();
    const navigate = useNavigate();

    const [confirmed, setConfirmed] = useState<Set<string>>(new Set());
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState<string | null>(null); // player id being toggled

    // ── Load today's attendance ────────────────────────────────────────────
    useEffect(() => {
        const load = async () => {
            const { data } = await supabase
                .from('attendance')
                .select('player_id')
                .eq('date', todayISO());
            setConfirmed(new Set((data ?? []).map((r: { player_id: string }) => r.player_id)));
            setLoading(false);
        };
        load();
    }, []);

    // ── Toggle presence ────────────────────────────────────────────────────
    const toggle = useCallback(async (playerId: string) => {
        setSaving(playerId);
        const isConfirmed = confirmed.has(playerId);

        if (isConfirmed) {
            await supabase
                .from('attendance')
                .delete()
                .eq('player_id', playerId)
                .eq('date', todayISO());
            setConfirmed(prev => { const s = new Set(prev); s.delete(playerId); return s; });
        } else {
            await supabase
                .from('attendance')
                .upsert({ player_id: playerId, date: todayISO(), confirmed: true });
            setConfirmed(prev => new Set([...prev, playerId]));
        }
        setSaving(null);
    }, [confirmed]);

    // ── Mark all / Clear all ───────────────────────────────────────────────
    const markAll = async () => {
        const rows = players.map(p => ({ player_id: p.id, date: todayISO(), confirmed: true }));
        await supabase.from('attendance').upsert(rows);
        setConfirmed(new Set(players.map(p => p.id)));
    };

    const clearAll = async () => {
        await supabase.from('attendance').delete().eq('date', todayISO());
        setConfirmed(new Set());
    };

    const confirmedCount = confirmed.size;
    const allConfirmed = confirmedCount === players.length;

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
                    disabled={confirmedCount < 2}
                    className={cn(
                        'flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all',
                        confirmedCount >= 2
                            ? 'bg-primary text-background hover:bg-primary/90 shadow-lg shadow-primary/20'
                            : 'bg-white/5 text-gray-600 cursor-not-allowed'
                    )}
                >
                    Ir para Sorteio
                    <ChevronRight size={16} />
                </button>
            </div>

            {/* Summary bar */}
            <Card className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-4">
                <div className="flex items-center gap-6">
                    <div className="text-center">
                        <div className="text-2xl font-bold text-white">{players.length}</div>
                        <div className="text-[10px] text-gray-500 uppercase tracking-wider">Total</div>
                    </div>
                    <div className="w-px h-8 bg-white/10" />
                    <div className="text-center">
                        <div className="text-2xl font-bold text-green-400">{confirmedCount}</div>
                        <div className="text-[10px] text-gray-500 uppercase tracking-wider">Presentes</div>
                    </div>
                    <div className="w-px h-8 bg-white/10" />
                    <div className="text-center">
                        <div className="text-2xl font-bold text-gray-500">{players.length - confirmedCount}</div>
                        <div className="text-[10px] text-gray-500 uppercase tracking-wider">Ausentes</div>
                    </div>
                </div>

                {/* Progress bar */}
                <div className="flex-1 max-w-sm">
                    <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-green-500 rounded-full transition-all duration-500"
                            style={{ width: players.length ? `${(confirmedCount / players.length) * 100}%` : '0%' }}
                        />
                    </div>
                </div>

                {/* Bulk actions */}
                <div className="flex items-center gap-2">
                    <button
                        onClick={allConfirmed ? clearAll : markAll}
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
            ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                    {players.map(player => {
                        const isPresent = confirmed.has(player.id);
                        const isSaving = saving === player.id;

                        return (
                            <button
                                key={player.id}
                                onClick={() => toggle(player.id)}
                                disabled={isSaving}
                                className={cn(
                                    'relative flex flex-col items-center justify-center gap-2 p-4 rounded-xl border-2 transition-all duration-200 text-center',
                                    isPresent
                                        ? 'bg-green-500/10 border-green-500/50 text-white shadow-lg shadow-green-500/10'
                                        : 'bg-white/3 border-white/5 text-gray-500 hover:border-white/20 hover:text-gray-300',
                                    isSaving && 'opacity-60 cursor-wait'
                                )}
                            >
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
                                    {player.name.substring(0, 2).toUpperCase()}
                                </div>

                                {/* Name */}
                                <span className="text-xs font-semibold leading-tight">
                                    {player.name.split(' ')[0]}
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
            {confirmedCount >= 2 && (
                <p className="text-center text-xs text-gray-600 animate-in fade-in duration-500">
                    {confirmedCount} jogadores confirmados — pronto para sortear os times!
                </p>
            )}
        </div>
    );
};
