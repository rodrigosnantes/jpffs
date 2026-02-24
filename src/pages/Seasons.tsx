import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/useAuthStore';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { CalendarRange, Plus, CheckCircle, XCircle, Clock, Trophy, ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '../utils/cn';
import { SeasonStats } from '../components/season/SeasonStats';

// ─── Types ────────────────────────────────────────────────────────────────

interface Season {
    id: string;
    name: string;
    start_date: string;
    end_date: string | null;
    is_active: boolean;
    created_at: string;
    match_count?: number;
}

// ─── Component ────────────────────────────────────────────────────────────

export const Seasons = () => {
    const [seasons, setSeasons] = useState<Season[]>([]);
    const [loading, setLoading] = useState(true);
    const [creating, setCreating] = useState(false);
    const [form, setForm] = useState({ name: '', start_date: new Date().toISOString().split('T')[0] });
    const [showForm, setShowForm] = useState(false);
    const [expandedSeasonId, setExpandedSeasonId] = useState<string | null>(null);
    const { isAdmin } = useAuthStore();

    // ── Load seasons ──────────────────────────────────────────────────────
    const load = useCallback(async () => {
        setLoading(true);
        const { data } = await supabase
            .from('seasons')
            .select('*')
            .order('created_at', { ascending: false });
        if (!data) { setLoading(false); return; }

        // Count matches per season
        const ids = data.map((s: Season) => s.id);
        const { data: matchCounts } = await supabase
            .from('matches')
            .select('season_id')
            .in('season_id', ids);

        const countMap: Record<string, number> = {};
        (matchCounts ?? []).forEach((m: { season_id: string }) => {
            countMap[m.season_id] = (countMap[m.season_id] ?? 0) + 1;
        });

        setSeasons(data.map((s: Season) => ({ ...s, match_count: countMap[s.id] ?? 0 })));
        setLoading(false);
    }, []);

    useEffect(() => { load(); }, [load]);

    // ── Create season ─────────────────────────────────────────────────────
    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.name || !form.start_date) return;
        setCreating(true);
        await supabase.from('seasons').insert([{ ...form, is_active: false }]);
        setForm({ name: '', start_date: new Date().toISOString().split('T')[0] });
        setShowForm(false);
        setCreating(false);
        load();
    };

    // ── Activate season ───────────────────────────────────────────────────
    const handleActivate = async (id: string) => {
        if (!confirm('Ativar esta temporada? A temporada atual será desativada.')) return;
        await supabase.from('seasons').update({ is_active: true }).eq('id', id);
        load();
    };

    // ── Close season ──────────────────────────────────────────────────────
    const handleClose = async (id: string) => {
        if (!confirm('Encerrar esta temporada? As partidas ficam preservadas, mas a temporada não poderá mais receber novas partidas.')) return;
        const today = new Date().toISOString().split('T')[0];
        await supabase.from('seasons').update({ is_active: false, end_date: today }).eq('id', id);
        load();
    };

    const activeSeason = seasons.find(s => s.is_active);

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold font-header text-primary flex items-center gap-3">
                        <CalendarRange className="text-primary" />
                        Temporadas
                    </h1>
                    {activeSeason && (
                        <p className="text-sm text-green-400 mt-1 flex items-center gap-1.5">
                            <CheckCircle size={13} />
                            Temporada ativa: <strong>{activeSeason.name}</strong>
                        </p>
                    )}
                </div>
                {isAdmin && (
                    <Button onClick={() => setShowForm(v => !v)}>
                        <Plus size={18} className="mr-2" />
                        Nova Temporada
                    </Button>
                )}
            </div>

            {/* Create form */}
            {showForm && (
                <Card className="animate-in slide-in-from-top-2 duration-200 border-primary/30">
                    <h2 className="text-base font-bold text-white mb-4">Nova Temporada</h2>
                    <form onSubmit={handleCreate} className="flex flex-wrap gap-4 items-end">
                        <div className="flex-1 min-w-[200px] space-y-1.5">
                            <label className="text-xs text-gray-400 uppercase tracking-wider">Nome</label>
                            <input
                                type="text"
                                value={form.name}
                                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                                placeholder="Ex: Temporada 1 · 2025"
                                required
                                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-primary/50"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-xs text-gray-400 uppercase tracking-wider">Início</label>
                            <input
                                type="date"
                                value={form.start_date}
                                onChange={e => setForm(f => ({ ...f, start_date: e.target.value }))}
                                required
                                className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-primary/50"
                            />
                        </div>
                        <div className="flex gap-2">
                            <Button type="submit" disabled={creating}>
                                {creating ? 'Criando...' : 'Criar'}
                            </Button>
                            <Button type="button" variant="ghost" onClick={() => setShowForm(false)}>
                                Cancelar
                            </Button>
                        </div>
                    </form>
                </Card>
            )}

            {/* Seasons list */}
            {loading ? (
                <div className="space-y-3">
                    {[1, 2].map(i => <div key={i} className="h-20 bg-white/3 rounded-xl animate-pulse" />)}
                </div>
            ) : seasons.length === 0 ? (
                <Card className="py-16 flex flex-col items-center gap-3 text-gray-600">
                    <CalendarRange size={36} className="opacity-30" />
                    <p className="text-sm">Nenhuma temporada criada ainda.</p>
                    <p className="text-xs">Crie a primeira temporada para começar a agrupar suas partidas.</p>
                </Card>
            ) : (
                <div className="space-y-3">
                    {seasons.map(season => (
                        <Card key={season.id} className={cn(
                            'p-4 flex flex-col sm:flex-row sm:items-center gap-4',
                            season.is_active && 'border-green-500/30 bg-green-500/5'
                        )}>
                            {/* Left: info */}
                            <div className="flex items-center gap-4 flex-1">
                                <div className={cn(
                                    'w-10 h-10 rounded-full flex items-center justify-center shrink-0',
                                    season.is_active ? 'bg-green-500/20 text-green-400' :
                                        season.end_date ? 'bg-gray-500/20 text-gray-500' :
                                            'bg-white/5 text-gray-400'
                                )}>
                                    {season.is_active ? <CheckCircle size={20} /> :
                                        season.end_date ? <XCircle size={20} /> :
                                            <Clock size={20} />}
                                </div>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <h3 className="font-bold text-white">{season.name}</h3>
                                        {season.is_active && (
                                            <span className="text-[10px] font-bold bg-green-500/20 text-green-400 border border-green-500/30 px-2 py-0.5 rounded-full uppercase tracking-wider">
                                                Ativa
                                            </span>
                                        )}
                                        {season.end_date && !season.is_active && (
                                            <span className="text-[10px] font-bold bg-gray-500/20 text-gray-500 border border-gray-500/30 px-2 py-0.5 rounded-full uppercase tracking-wider">
                                                Encerrada
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-xs text-gray-500 mt-0.5">
                                        {new Date(season.start_date + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })}
                                        {season.end_date && ` → ${new Date(season.end_date + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })}`}
                                    </p>
                                </div>
                            </div>

                            {/* Stats */}
                            <div className="flex items-center gap-4 text-center">
                                <div>
                                    <div className="text-lg font-bold text-white">{season.match_count}</div>
                                    <div className="text-[10px] text-gray-500 uppercase tracking-wider">Partidas</div>
                                </div>
                                <button
                                    onClick={() => setExpandedSeasonId(expandedSeasonId === season.id ? null : season.id)}
                                    className="p-2 ml-2 hover:bg-white/10 rounded-full text-gray-400 transition-colors"
                                >
                                    {expandedSeasonId === season.id ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                                </button>
                            </div>

                            {/* Actions — admin only */}
                            {isAdmin && (
                                <div className="flex gap-2 shrink-0">
                                    {!season.is_active && !season.end_date && (
                                        <Button
                                            variant="ghost"
                                            onClick={() => handleActivate(season.id)}
                                            className="text-green-400 hover:bg-green-500/10 text-xs"
                                        >
                                            <Trophy size={14} className="mr-1" />
                                            Ativar
                                        </Button>
                                    )}
                                    {season.is_active && (
                                        <Button
                                            variant="ghost"
                                            onClick={() => handleClose(season.id)}
                                            className="text-red-400 hover:bg-red-500/10 text-xs"
                                        >
                                            <XCircle size={14} className="mr-1" />
                                            Encerrar
                                        </Button>
                                    )}
                                </div>
                            )}

                            {expandedSeasonId === season.id && (
                                <SeasonStats seasonId={season.id} />
                            )}
                        </Card>
                    ))}
                </div>
            )
            }
        </div >
    );
};
