import { useState, useCallback, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { supabase } from '../lib/supabase';
import { Card } from '../components/ui/Card';
import { Calendar, Users, ChevronDown, ChevronUp, Search, CalendarRange } from 'lucide-react';
import { cn } from '../utils/cn';
import type { Match } from '../types';

interface Season { id: string; name: string; is_active: boolean; end_date: string | null; }

// ─── Types ───────────────────────────────────────────────────────────────────

// ─── Helpers ─────────────────────────────────────────────────────────────────

const STATUS_STYLE: Record<string, string> = {
    finished: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    live: 'bg-red-500/10 text-red-400 border-red-500/20 animate-pulse',
    scheduled: 'bg-gray-500/10 text-gray-400 border-gray-500/20',
};
const STATUS_LABEL: Record<string, string> = {
    finished: 'Finalizada',
    live: 'Ao Vivo',
    scheduled: 'Agendada',
};

// ─── Component ────────────────────────────────────────────────────────────────

export const Matches = () => {
    const { players } = useStore();

    // Seasons filter
    const [seasons, setSeasons] = useState<Season[]>([]);
    const [selectedSeason, setSelectedSeason] = useState('');

    useEffect(() => {
        supabase.from('seasons').select('id,name,is_active,end_date').order('created_at', { ascending: false })
            .then(({ data }) => setSeasons((data ?? []) as Season[]));
    }, []);

    // Date filters
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');

    // Fetched data
    const [results, setResults] = useState<Match[]>([]);
    const [loading, setLoading] = useState(false);
    const [searched, setSearched] = useState(false);
    const [expandedId, setExpandedId] = useState<string | null>(null);

    // ── Query ──────────────────────────────────────────────────────────────
    const handleSearch = useCallback(async () => {
        if (!dateFrom && !dateTo && !selectedSeason) return;
        setLoading(true);
        setSearched(true);
        setExpandedId(null);

        let query = supabase
            .from('matches')
            .select('*')
            .order('date', { ascending: false });

        if (selectedSeason) {
            query = query.eq('season_id', selectedSeason);
        } else {
            if (dateFrom) query = query.gte('date', dateFrom);
            if (dateTo) query = query.lte('date', dateTo + 'T23:59:59');
        }

        const { data, error } = await query;
        if (error) console.error('Error fetching matches:', error);
        setResults((data as Match[]) ?? []);
        setLoading(false);
    }, [dateFrom, dateTo, selectedSeason]);


    // ── Helpers ────────────────────────────────────────────────────────────
    const getPlayerName = (id: string) => {
        const p = players.find(pl => pl.id === id);
        return p ? p.name.split(' ')[0] : '?';
    };

    const getResult = (scoreA: number | null, scoreB: number | null) => {
        if (scoreA === null || scoreB === null) return null;
        if (scoreA > scoreB) return 'A';
        if (scoreB > scoreA) return 'B';
        return 'D';
    };

    const hasFilter = dateFrom || dateTo || selectedSeason;

    const handleClear = () => {
        setDateFrom(''); setDateTo(''); setSelectedSeason('');
        setResults([]); setSearched(false);
    };

    // ── Render ─────────────────────────────────────────────────────────────
    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Header */}
            <h1 className="text-3xl font-bold font-header text-primary flex items-center gap-3">
                <Calendar className="text-primary" />
                Histórico de Partidas
            </h1>

            {/* Search bar */}
            <Card className="flex flex-col sm:flex-row sm:items-end gap-4">
                <div className="flex flex-wrap items-center gap-4 flex-1">
                    {/* Season dropdown */}
                    {seasons.length > 0 && (
                        <div className="flex items-center gap-2">
                            <label className="text-xs text-gray-500 uppercase tracking-wider whitespace-nowrap flex items-center gap-1">
                                <CalendarRange size={12} /> Temporada
                            </label>
                            <select
                                value={selectedSeason}
                                onChange={e => { setSelectedSeason(e.target.value); setDateFrom(''); setDateTo(''); }}
                                className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-gray-300 focus:outline-none focus:border-primary/50"
                            >
                                <option value="">Todas</option>
                                {seasons.map(s => (
                                    <option key={s.id} value={s.id}>{s.name}{s.is_active ? ' ★' : ''}</option>
                                ))}
                            </select>
                        </div>
                    )}

                    {/* Date range (only when no season selected) */}
                    {!selectedSeason && (
                        <>
                            <div className="flex items-center gap-2">
                                <label className="text-xs text-gray-500 uppercase tracking-wider whitespace-nowrap">De</label>
                                <input
                                    type="date"
                                    value={dateFrom}
                                    onChange={e => setDateFrom(e.target.value)}
                                    className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-gray-300 focus:outline-none focus:border-primary/50 [color-scheme:dark]"
                                />
                            </div>
                            <div className="flex items-center gap-2">
                                <label className="text-xs text-gray-500 uppercase tracking-wider whitespace-nowrap">Até</label>
                                <input
                                    type="date"
                                    value={dateTo}
                                    onChange={e => setDateTo(e.target.value)}
                                    className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-gray-300 focus:outline-none focus:border-primary/50 [color-scheme:dark]"
                                />
                            </div>
                        </>
                    )}
                </div>
                <div className="flex items-center gap-3">
                    {hasFilter && (
                        <button
                            onClick={handleClear}
                            className="text-xs text-gray-500 hover:text-white border border-white/10 px-3 py-2 rounded-lg transition-colors"
                        >
                            Limpar
                        </button>
                    )}
                    <button
                        onClick={handleSearch}
                        disabled={!hasFilter || loading}
                        className={cn(
                            'flex items-center gap-2 px-5 py-2 rounded-lg font-semibold text-sm transition-all',
                            hasFilter
                                ? 'bg-primary text-background hover:bg-primary/90 shadow-lg shadow-primary/20'
                                : 'bg-white/5 text-gray-600 cursor-not-allowed'
                        )}
                    >
                        <Search size={15} />
                        {loading ? 'Buscando...' : 'Buscar'}
                    </button>
                </div>
            </Card>

            {/* Empty / Prompt state */}
            {!searched && (
                <Card className="py-16 flex flex-col items-center justify-center text-gray-600 gap-3">
                    <Calendar size={36} className="opacity-20" />
                    <p className="text-sm">Selecione uma data ou período e clique em <strong className="text-gray-400">Buscar</strong>.</p>
                </Card>
            )}

            {/* Summary strip */}
            {searched && !loading && (
                <div className="grid grid-cols-3 gap-3">
                    {[
                        { label: 'Encontradas', value: results.length, color: 'text-white' },
                        { label: 'Finalizadas', value: results.filter(m => m.status === 'finished').length, color: 'text-emerald-400' },
                        { label: 'Empates', value: results.filter(m => m.status === 'finished' && (m.team_a_score ?? 0) === (m.team_b_score ?? 0)).length, color: 'text-gray-400' },
                    ].map(({ label, value, color }) => (
                        <Card key={label} className="p-4 text-center">
                            <div className={cn('text-2xl font-bold', color)}>{value}</div>
                            <div className="text-xs text-gray-500 uppercase tracking-wider mt-1">{label}</div>
                        </Card>
                    ))}
                </div>
            )}

            {/* Result list */}
            {searched && !loading && results.length === 0 && (
                <Card className="py-12 flex flex-col items-center justify-center text-gray-500 gap-2">
                    <p className="text-sm">Nenhuma partida encontrada no período selecionado.</p>
                </Card>
            )}

            {!loading && results.length > 0 && (
                <div className="space-y-3">
                    {results.map((match) => {
                        const winner = getResult(match.team_a_score, match.team_b_score);
                        const isExpanded = expandedId === match.id;
                        const teamA = match.team_a_players ?? [];
                        const teamB = match.team_b_players ?? [];

                        return (
                            <Card key={match.id} className="p-0 overflow-hidden">
                                <button
                                    className="w-full text-left p-4 flex items-center gap-4 hover:bg-white/3 transition-colors"
                                    onClick={() => setExpandedId(isExpanded ? null : match.id)}
                                >
                                    {/* Date */}
                                    <div className="hidden sm:flex flex-col items-center w-14 shrink-0 text-center">
                                        <span className="text-xs text-gray-500 uppercase">
                                            {new Date(match.date).toLocaleDateString('pt-BR', { month: 'short' })}
                                        </span>
                                        <span className="text-xl font-bold text-white font-mono leading-tight">
                                            {new Date(match.date).getDate().toString().padStart(2, '0')}
                                        </span>
                                    </div>
                                    <div className="hidden sm:block w-px h-10 bg-white/5 shrink-0" />

                                    {/* Status + Score */}
                                    <div className="flex items-center gap-3 flex-1 min-w-0">
                                        <span className={cn('text-xs font-bold px-2 py-0.5 rounded border', STATUS_STYLE[match.status] ?? STATUS_STYLE.scheduled)}>
                                            {STATUS_LABEL[match.status] ?? match.status}
                                        </span>
                                        <div className="flex items-center gap-3 ml-auto sm:ml-0">
                                            <span className={cn('text-sm font-semibold', winner === 'A' ? 'text-emerald-400' : 'text-gray-300')}>Time A</span>
                                            <div className="flex items-center gap-2 bg-white/5 rounded-lg px-4 py-2 font-mono">
                                                <span className={cn('text-2xl font-bold', winner === 'A' ? 'text-emerald-400' : 'text-white')}>{match.team_a_score ?? '—'}</span>
                                                <span className="text-gray-600">:</span>
                                                <span className={cn('text-2xl font-bold', winner === 'B' ? 'text-emerald-400' : 'text-white')}>{match.team_b_score ?? '—'}</span>
                                            </div>
                                            <span className={cn('text-sm font-semibold', winner === 'B' ? 'text-emerald-400' : 'text-gray-300')}>Time B</span>
                                        </div>
                                        <div className="hidden md:flex items-center gap-1.5 ml-auto text-gray-500 text-xs">
                                            <Users size={13} />
                                            {teamA.length + teamB.length} jogadores
                                        </div>
                                    </div>
                                    <div className="shrink-0 text-gray-600">
                                        {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                                    </div>
                                </button>

                                {/* Expanded panel */}
                                {isExpanded && (
                                    <div className="border-t border-white/5 p-4 bg-black/20 animate-in fade-in slide-in-from-top-2 duration-200">
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                                            {[
                                                { ids: teamA, label: 'Time A', color: 'text-yellow-400', dot: 'bg-yellow-400' },
                                                { ids: teamB, label: 'Time B', color: 'text-blue-400', dot: 'bg-blue-400' },
                                            ].map(({ ids, label, color, dot }) => (
                                                <div key={label}>
                                                    <p className={cn('text-[11px] font-bold uppercase tracking-widest mb-2', color)}>
                                                        {label} — {ids.length} jogadores
                                                    </p>
                                                    <div className="flex flex-wrap gap-1.5">
                                                        {ids.length === 0 && <span className="text-gray-600 text-xs">—</span>}
                                                        {ids.map(pid => (
                                                            <span key={pid} className="flex items-center gap-1 text-xs text-gray-300 bg-white/5 px-2.5 py-1 rounded-full border border-white/5">
                                                                <span className={cn('w-1.5 h-1.5 rounded-full shrink-0', dot)} />
                                                                {getPlayerName(pid)}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                        <Link
                                            to={`/matches/${match.id}`}
                                            className="flex items-center justify-center gap-2 w-full py-2 rounded-lg text-xs font-semibold text-primary border border-primary/30 hover:bg-primary/10 transition-colors"
                                        >
                                            Ver detalhes completos →
                                        </Link>
                                    </div>
                                )}
                            </Card>

                        );
                    })}
                </div>
            )}
        </div>
    );
};
