import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { supabase } from '../lib/supabase';
import { Card } from '../components/ui/Card';
import { cn } from '../utils/cn';
import {
    Trophy, Target, Shield, Star, Calendar,
    TrendingUp, ArrowLeft, Zap, Users
} from 'lucide-react';
import {
    RadarChart, Radar, PolarGrid, PolarAngleAxis,
    PolarRadiusAxis, ResponsiveContainer
} from 'recharts';

// ─── Types ─────────────────────────────────────────────────────────────────

interface MatchStat {
    matchId: string;
    date: string;
    goals: number;
    assists: number;
    result: 'W' | 'D' | 'L';
    scoreA: number;
    scoreB: number;
    inTeamA: boolean;
}

// ─── Helpers ──────────────────────────────────────────────────────────────

const RESULT_BG: Record<'W' | 'D' | 'L', string> = {
    W: 'bg-green-500/15 border-green-500/30 text-green-400',
    D: 'bg-gray-500/15 border-gray-500/30 text-gray-400',
    L: 'bg-red-500/15 border-red-500/30 text-red-400',
};
const RESULT_LABEL = { W: 'V', D: 'E', L: 'D' };

// ─── Component ────────────────────────────────────────────────────────────

export const PlayerProfile = () => {
    const { id } = useParams<{ id: string }>();
    const { players, matches } = useStore();

    const player = players.find(p => p.id === id);

    const [matchStats, setMatchStats] = useState<MatchStat[]>([]);
    const [loading, setLoading] = useState(true);

    // ── Fetch match history ──────────────────────────────────────────────
    useEffect(() => {
        if (!id) return;
        (async () => {
            setLoading(true);
            const playerMatches = matches
                .filter(m =>
                    m.status === 'finished' &&
                    ((m.team_a_players ?? []).includes(id) || (m.team_b_players ?? []).includes(id))
                )
                .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                .slice(0, 15);

            if (playerMatches.length === 0) { setMatchStats([]); setLoading(false); return; }

            const { data: events } = await supabase
                .from('match_events')
                .select('match_id, player_id, assist_id, type')
                .in('match_id', playerMatches.map(m => m.id));

            const stats: MatchStat[] = playerMatches.map(m => {
                const ev = (events || []).filter(e => e.match_id === m.id);
                const goals = ev.filter(e => e.player_id === id && e.type === 'Goal').length;
                const assists = ev.filter(e => e.assist_id === id).length;
                const inTeamA = (m.team_a_players ?? []).includes(id);
                const scoreA = m.team_a_score ?? 0;
                const scoreB = m.team_b_score ?? 0;
                const result: 'W' | 'D' | 'L' =
                    scoreA === scoreB ? 'D' :
                        (inTeamA ? scoreA > scoreB : scoreB > scoreA) ? 'W' : 'L';
                return {
                    matchId: m.id,
                    date: new Date(m.date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
                    goals, assists, result, scoreA, scoreB, inTeamA,
                };
            });
            setMatchStats(stats);
            setLoading(false);
        })();
    }, [id, matches]);

    if (!player) return (
        <div className="flex flex-col items-center justify-center py-24 gap-4 text-gray-500">
            <Users size={40} className="opacity-30" />
            <p>Jogador não encontrado.</p>
            <Link to="/players" className="text-primary text-sm hover:underline">← Voltar</Link>
        </div>
    );

    // ── Derived ──────────────────────────────────────────────────────────
    const { stats, attributes } = player;
    const winRate = stats.matches_played > 0 ? Math.round((stats.wins / stats.matches_played) * 100) : 0;
    const isGoalie = player.position === 'Goalkeeper';

    const radarData = [
        { subject: 'Ataque', value: attributes?.attack ?? 50 },
        { subject: 'Defesa', value: attributes?.defense ?? 50 },
        { subject: 'Velocidade', value: attributes?.pace ?? 50 },
        { subject: 'Chute', value: attributes?.shooting ?? 50 },
        { subject: 'Físico', value: attributes?.physical ?? 50 },
        { subject: 'Passe', value: attributes?.passing ?? 50 },
    ];

    const statCards = [
        { label: 'Jogos', value: stats.matches_played, icon: <Calendar size={15} />, color: 'text-blue-400', bg: 'bg-blue-500/10' },
        { label: 'Gols', value: stats.goals, icon: <Target size={15} />, color: 'text-green-400', bg: 'bg-green-500/10' },
        { label: 'Assists', value: stats.assists, icon: <TrendingUp size={15} />, color: 'text-cyan-400', bg: 'bg-cyan-500/10' },
        { label: 'Vitórias', value: stats.wins, icon: <Trophy size={15} />, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
        { label: 'Empates', value: stats.draws, icon: <Zap size={15} />, color: 'text-gray-400', bg: 'bg-gray-500/10' },
        { label: 'Derrotas', value: stats.losses, icon: <Shield size={15} />, color: 'text-red-400', bg: 'bg-red-500/10' },
        { label: '🟡', value: stats.yellow_cards, icon: null, color: 'text-yellow-400', bg: 'bg-yellow-500/10' },
        { label: '🔴', value: stats.red_cards, icon: null, color: 'text-red-500', bg: 'bg-red-500/10' },
    ];

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Back link */}
            <Link to="/players" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-white transition-colors">
                <ArrowLeft size={15} /> Todos os jogadores
            </Link>

            {/* ── Hero Card ──────────────────────────────────────────────── */}
            <Card className="relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent pointer-events-none" />
                <div className="relative flex flex-col sm:flex-row items-center sm:items-start gap-6 p-2">
                    {/* Avatar */}
                    <div className={cn(
                        'w-24 h-24 rounded-2xl flex items-center justify-center text-3xl font-black border-2 shrink-0',
                        isGoalie
                            ? 'bg-yellow-500/15 border-yellow-500/40 text-yellow-300'
                            : 'bg-primary/15 border-primary/40 text-primary'
                    )}>
                        {player.name.substring(0, 2).toUpperCase()}
                    </div>

                    {/* Name + meta */}
                    <div className="flex-1 text-center sm:text-left">
                        <h1 className="text-3xl font-black text-white">{player.name}</h1>
                        <div className="flex flex-wrap justify-center sm:justify-start items-center gap-3 mt-2">
                            <span className={cn(
                                'text-xs font-bold px-2.5 py-1 rounded-full border',
                                isGoalie
                                    ? 'bg-yellow-500/10 border-yellow-500/30 text-yellow-400'
                                    : 'bg-blue-500/10 border-blue-500/30 text-blue-400'
                            )}>
                                {isGoalie ? '🧤 Goleiro' : '👟 Linha'}
                            </span>
                            {/* Level stars */}
                            <span className="flex gap-0.5">
                                {Array.from({ length: 5 }).map((_, i) => (
                                    <Star key={i} size={14} className={cn(
                                        i < player.level ? 'text-primary fill-primary' : 'text-gray-700'
                                    )} />
                                ))}
                            </span>
                        </div>

                        {/* Win rate bar */}
                        <div className="mt-4 max-w-xs mx-auto sm:mx-0">
                            <div className="flex justify-between text-xs text-gray-500 mb-1">
                                <span>Aproveitamento</span>
                                <span className="font-bold text-white">{winRate}%</span>
                            </div>
                            <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-gradient-to-r from-primary to-emerald-500 rounded-full transition-all duration-700"
                                    style={{ width: `${winRate}%` }}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </Card>

            {/* ── Stats Grid ─────────────────────────────────────────────── */}
            <div className="grid grid-cols-4 sm:grid-cols-8 gap-3">
                {statCards.map(({ label, value, icon, color, bg }) => (
                    <Card key={label} className="p-3 flex flex-col items-center gap-1.5 text-center">
                        {icon && <div className={cn('p-1.5 rounded-full', bg, color)}>{icon}</div>}
                        <div className={cn('text-xl font-bold', color)}>{value}</div>
                        <div className="text-[10px] text-gray-500 uppercase tracking-wide leading-none">{label}</div>
                    </Card>
                ))}
            </div>

            {/* ── Radar + History ────────────────────────────────────────── */}
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                {/* Radar */}
                <Card className="lg:col-span-2 flex flex-col items-center">
                    <h2 className="text-base font-bold text-white mb-4 self-start">Atributos</h2>
                    <div className="w-full" style={{ height: 260 }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <RadarChart data={radarData} cx="50%" cy="50%" outerRadius="75%">
                                <PolarGrid stroke="rgba(255,255,255,0.07)" />
                                <PolarAngleAxis dataKey="subject" tick={{ fill: '#9ca3af', fontSize: 11 }} />
                                <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} />
                                <Radar
                                    name="Atributos" dataKey="value"
                                    stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.25}
                                    strokeWidth={2} dot={{ r: 3, fill: '#3b82f6' }}
                                />
                            </RadarChart>
                        </ResponsiveContainer>
                    </div>
                    {/* attribute list */}
                    <div className="w-full grid grid-cols-2 gap-x-4 gap-y-2 mt-2">
                        {radarData.map(({ subject, value }) => (
                            <div key={subject} className="flex items-center justify-between text-xs">
                                <span className="text-gray-500">{subject}</span>
                                <span className={cn(
                                    'font-bold font-mono',
                                    value >= 80 ? 'text-green-400' : value >= 60 ? 'text-yellow-400' : 'text-gray-400'
                                )}>{value}</span>
                            </div>
                        ))}
                    </div>
                </Card>

                {/* Match History */}
                <Card className="lg:col-span-3">
                    <h2 className="text-base font-bold text-white mb-4">Histórico de Partidas</h2>
                    {loading ? (
                        <div className="space-y-2">
                            {Array.from({ length: 5 }).map((_, i) => (
                                <div key={i} className="h-10 bg-white/3 rounded-lg animate-pulse" />
                            ))}
                        </div>
                    ) : matchStats.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-10 text-gray-600 gap-2">
                            <Calendar size={28} className="opacity-40" />
                            <p className="text-sm">Nenhuma partida encontrada.</p>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {matchStats.map((m) => (
                                <Link
                                    key={m.matchId}
                                    to={`/matches/${m.matchId}`}
                                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-white/3 hover:bg-white/7 border border-white/5 hover:border-white/10 transition-all group"
                                >
                                    {/* Result badge */}
                                    <span className={cn(
                                        'w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-black border shrink-0',
                                        RESULT_BG[m.result]
                                    )}>
                                        {RESULT_LABEL[m.result]}
                                    </span>

                                    {/* Date */}
                                    <span className="text-xs text-gray-500 w-10 shrink-0">{m.date}</span>

                                    {/* Score */}
                                    <span className="text-sm font-mono font-bold text-white">
                                        {m.inTeamA
                                            ? `${m.scoreA} – ${m.scoreB}`
                                            : `${m.scoreB} – ${m.scoreA}`
                                        }
                                    </span>

                                    {/* Player contrib */}
                                    <div className="flex items-center gap-2 ml-auto text-xs">
                                        {m.goals > 0 && (
                                            <span className="flex items-center gap-1 text-green-400 font-semibold">
                                                ⚽ {m.goals}
                                            </span>
                                        )}
                                        {m.assists > 0 && (
                                            <span className="flex items-center gap-1 text-cyan-400 font-semibold">
                                                🅰 {m.assists}
                                            </span>
                                        )}
                                        {m.goals === 0 && m.assists === 0 && (
                                            <span className="text-gray-700">—</span>
                                        )}
                                    </div>

                                    <ArrowLeft size={12} className="text-gray-700 group-hover:text-gray-400 rotate-180 transition-colors shrink-0" />
                                </Link>
                            ))}
                        </div>
                    )}
                </Card>
            </div>
        </div>
    );
};
