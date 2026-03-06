import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useStore } from '../store/useStore';
import { Card } from '../components/ui/Card';
import { ArrowLeft, Target, Shield, Star, Clock, AlertTriangle, XCircle } from 'lucide-react';
import { cn } from '../utils/cn';
import type { Match } from '../types';

// ─── Types ────────────────────────────────────────────────────────────────────

interface MatchEvent {
    id: string;
    match_id: string;
    player_id: string | null;
    assist_id: string | null;
    type: 'Goal' | 'OwnGoal' | 'YellowCard' | 'RedCard';
    team: 'A' | 'B';
    timestamp: string;
}

interface PlayerMVP {
    id: string;
    name: string;
    goals: number;
    assists: number;
    score: number; // goals*2 + assists
    team: 'A' | 'B';
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const EVENT_CONFIG = {
    Goal: { icon: Target, color: 'text-green-400', bg: 'bg-green-500/10', label: 'Gol' },
    OwnGoal: { icon: Target, color: 'text-orange-400', bg: 'bg-orange-500/10', label: 'Gol Contra' },
    YellowCard: { icon: AlertTriangle, color: 'text-yellow-400', bg: 'bg-yellow-500/10', label: 'Cartão Amarelo' },
    RedCard: { icon: XCircle, color: 'text-red-500', bg: 'bg-red-500/10', label: 'Cartão Vermelho' },
};

// ─── Component ────────────────────────────────────────────────────────────────

export const MatchDetail = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { players } = useStore();

    const [match, setMatch] = useState<Match | null>(null);
    const [events, setEvents] = useState<MatchEvent[]>([]);
    const [loading, setLoading] = useState(true);

    // ── Fetch ──────────────────────────────────────────────────────────────
    useEffect(() => {
        if (!id) return;
        const load = async () => {
            setLoading(true);
            const [{ data: m }, { data: ev }] = await Promise.all([
                supabase.from('matches').select('*').eq('id', id).single(),
                supabase.from('match_events').select('*').eq('match_id', id).order('timestamp'),
            ]);
            if (!m) { navigate('/matches'); return; }
            setMatch(m as Match);
            setEvents((ev as MatchEvent[]) ?? []);
            setLoading(false);
        };
        load();
    }, [id]);

    // ── Helpers ────────────────────────────────────────────────────────────
    const getPlayer = (pid: string | null) =>
        pid ? players.find(p => p.id === pid) : null;

    const getPlayerName = (pid: string | null, fallback = '?') => {
        const p = getPlayer(pid);
        return p ? (p.nickname || p.name) : fallback;
    };

    // ── MVP calculation ────────────────────────────────────────────────────
    const mvp: PlayerMVP | null = (() => {
        if (!match || events.length === 0) return null;
        const allIds = [
            ...(match.team_a_players ?? []).map(id => ({ id, team: 'A' as const })),
            ...(match.team_b_players ?? []).map(id => ({ id, team: 'B' as const })),
        ];
        const scores = allIds.map(({ id, team }) => {
            const goals = events.filter(e => e.player_id === id && e.type === 'Goal').length;
            const assists = events.filter(e => e.assist_id === id).length;
            return {
                id, team, goals, assists, score: goals * 2 + assists,
                name: getPlayerName(id, 'Desconhecido')
            };
        }).filter(p => p.score > 0);
        if (scores.length === 0) return null;
        return scores.sort((a, b) => b.score - a.score)[0];
    })();

    // ── Result ─────────────────────────────────────────────────────────────
    const scoreA = match?.team_a_score ?? 0;
    const scoreB = match?.team_b_score ?? 0;
    const winner = scoreA > scoreB ? 'A' : scoreB > scoreA ? 'B' : 'D';

    const STATUS_BADGE: Record<string, string> = {
        finished: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
        live: 'bg-red-500/10 text-red-400 border-red-500/20',
        scheduled: 'bg-gray-500/10 text-gray-400 border-gray-500/20',
    };
    const STATUS_LABEL: Record<string, string> = {
        finished: 'Finalizada', live: 'Ao Vivo', scheduled: 'Agendada',
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="text-gray-500 animate-pulse">Carregando partida...</div>
            </div>
        );
    }
    if (!match) return null;

    const teamAPlayers = match.team_a_players ?? [];
    const teamBPlayers = match.team_b_players ?? [];

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex items-center gap-4">
                <button onClick={() => navigate(-1)}
                    className="p-2 text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors">
                    <ArrowLeft size={20} />
                </button>
                <div>
                    <h1 className="text-2xl font-bold font-header text-white">Detalhe da Partida</h1>
                    <p className="text-gray-500 text-sm">
                        {new Date(match.date).toLocaleString('pt-BR', {
                            day: '2-digit', month: 'long', year: 'numeric',
                            hour: '2-digit', minute: '2-digit'
                        })}
                    </p>
                </div>
                <span className={cn('ml-auto text-xs font-bold px-3 py-1 rounded-full border',
                    STATUS_BADGE[match.status] ?? STATUS_BADGE.scheduled)}>
                    {STATUS_LABEL[match.status] ?? match.status}
                </span>
            </div>

            {/* Scoreboard */}
            <Card className="relative overflow-hidden bg-gradient-to-br from-surface to-black/40">
                <div className="absolute inset-0 bg-gradient-to-r from-yellow-500/5 via-transparent to-blue-500/5 pointer-events-none" />
                <div className="relative flex items-center justify-between px-4 sm:px-12 py-8 gap-4">
                    {/* Team A */}
                    <div className="flex flex-col items-center gap-2 flex-1">
                        <span className="text-xs font-bold uppercase tracking-widest text-yellow-500">Time A</span>
                        <span className={cn('text-6xl sm:text-8xl font-black font-mono',
                            winner === 'A' ? 'text-green-400' : 'text-white')}>
                            {scoreA}
                        </span>
                        {winner === 'A' && (
                            <span className="text-[10px] font-bold uppercase tracking-widest text-green-400 bg-green-500/10 px-2 py-0.5 rounded-full border border-green-500/20">
                                Vencedor
                            </span>
                        )}
                    </div>
                    {/* VS */}
                    <div className="flex flex-col items-center gap-1 shrink-0">
                        {winner === 'D' && (
                            <span className="text-xs font-bold text-gray-400 bg-white/5 px-3 py-1 rounded-full border border-white/10 mb-1">
                                Empate
                            </span>
                        )}
                        <span className="text-gray-600 font-mono text-2xl font-bold">×</span>
                    </div>
                    {/* Team B */}
                    <div className="flex flex-col items-center gap-2 flex-1">
                        <span className="text-xs font-bold uppercase tracking-widest text-blue-400">Time B</span>
                        <span className={cn('text-6xl sm:text-8xl font-black font-mono',
                            winner === 'B' ? 'text-green-400' : 'text-white')}>
                            {scoreB}
                        </span>
                        {winner === 'B' && (
                            <span className="text-[10px] font-bold uppercase tracking-widest text-green-400 bg-green-500/10 px-2 py-0.5 rounded-full border border-green-500/20">
                                Vencedor
                            </span>
                        )}
                    </div>
                </div>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Events Timeline */}
                <Card className="lg:col-span-2">
                    <h2 className="text-lg font-bold text-white mb-5 flex items-center gap-2">
                        <Clock size={18} className="text-primary" />
                        Eventos da Partida
                    </h2>
                    {events.length === 0 ? (
                        <p className="text-gray-600 text-sm py-8 text-center">Nenhum evento registrado.</p>
                    ) : (
                        <div className="space-y-2">
                            {events.map((ev) => {
                                const cfg = EVENT_CONFIG[ev.type] ?? EVENT_CONFIG.Goal;
                                const Icon = cfg.icon;
                                const playerName = getPlayerName(ev.player_id);
                                const assistName = ev.assist_id ? getPlayerName(ev.assist_id) : null;
                                return (
                                    <div key={ev.id}
                                        className={cn(
                                            'flex items-center gap-3 p-3 rounded-xl border border-white/5',
                                            ev.team === 'A' ? 'flex-row' : 'flex-row-reverse',
                                            'bg-white/3'
                                        )}>
                                        <div className={cn('p-2 rounded-full shrink-0', cfg.bg)}>
                                            <Icon size={15} className={cfg.color} />
                                        </div>
                                        <div className={cn('flex-1 min-w-0', ev.team === 'B' && 'text-right')}>
                                            <p className="text-sm font-semibold text-white truncate">
                                                {cfg.label} — <span className={cfg.color}>{playerName}</span>
                                            </p>
                                            {assistName && (
                                                <p className="text-xs text-gray-500">
                                                    Assistência: {assistName}
                                                </p>
                                            )}
                                        </div>
                                        <span className={cn(
                                            'text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded shrink-0',
                                            ev.team === 'A'
                                                ? 'text-yellow-500 bg-yellow-500/10'
                                                : 'text-blue-400 bg-blue-500/10'
                                        )}>
                                            Time {ev.team}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </Card>

                {/* Right column: MVP + Teams */}
                <div className="space-y-4">
                    {/* MVP */}
                    {mvp && (
                        <Card className="bg-gradient-to-br from-amber-500/10 to-surface border-amber-500/20">
                            <h2 className="text-sm font-bold uppercase tracking-widest text-amber-400 mb-4 flex items-center gap-2">
                                <Star size={15} className="text-amber-400" />
                                MVP da Partida
                            </h2>
                            <div className="flex flex-col items-center text-center gap-2">
                                <div className="w-16 h-16 rounded-full bg-amber-500/20 border-2 border-amber-500/40 flex items-center justify-center text-xl font-black text-amber-400">
                                    {mvp.name.substring(0, 2).toUpperCase()}
                                </div>
                                <p className="font-bold text-white text-lg">{mvp.name}</p>
                                <span className={cn('text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded',
                                    mvp.team === 'A' ? 'bg-yellow-500/10 text-yellow-500' : 'bg-blue-500/10 text-blue-400')}>
                                    Time {mvp.team}
                                </span>
                                <div className="grid grid-cols-2 gap-4 w-full mt-2 pt-3 border-t border-white/5">
                                    <div>
                                        <div className="text-2xl font-bold text-green-400">{mvp.goals}</div>
                                        <div className="text-[10px] text-gray-500 uppercase">Gols</div>
                                    </div>
                                    <div>
                                        <div className="text-2xl font-bold text-cyan-400">{mvp.assists}</div>
                                        <div className="text-[10px] text-gray-500 uppercase">Assists</div>
                                    </div>
                                </div>
                            </div>
                        </Card>
                    )}

                    {/* Teams */}
                    {[
                        { ids: teamAPlayers, label: 'Time A', color: 'text-yellow-500', dot: 'bg-yellow-500' },
                        { ids: teamBPlayers, label: 'Time B', color: 'text-blue-400', dot: 'bg-blue-400' },
                    ].map(({ ids, label, color, dot }) => (
                        <Card key={label} className="p-4">
                            <h3 className={cn('text-xs font-bold uppercase tracking-widest mb-3', color)}>
                                {label} — {ids.length} jogadores
                            </h3>
                            <div className="space-y-1.5">
                                {ids.map(pid => {
                                    const p = getPlayer(pid);
                                    const playerGoals = events.filter(e => e.player_id === pid && e.type === 'Goal').length;
                                    const playerAssists = events.filter(e => e.assist_id === pid).length;
                                    return (
                                        <div key={pid} className="flex items-center justify-between text-sm">
                                            <Link to={`/players/${pid}`}
                                                className="flex items-center gap-2 text-gray-300 hover:text-white transition-colors">
                                                <span className={cn('w-1.5 h-1.5 rounded-full shrink-0', dot)} />
                                                {p ? (p.nickname || p.name) : '?'}
                                                {p?.position === 'Goalkeeper' && (
                                                    <Shield size={11} className="text-yellow-500 opacity-60" />
                                                )}
                                            </Link>
                                            <div className="flex items-center gap-2 text-xs text-gray-600">
                                                {playerGoals > 0 && (
                                                    <span className="text-green-400 font-mono">⚽ {playerGoals}</span>
                                                )}
                                                {playerAssists > 0 && (
                                                    <span className="text-cyan-400 font-mono">🅰 {playerAssists}</span>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </Card>
                    ))}
                </div>
            </div>
        </div>
    );
};
