import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useStore } from '../../store/useStore';
import { Card } from '../ui/Card';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import type { Match, MatchEvent } from '../../types';
import { Trophy, Target, Crosshair, Star, Activity } from 'lucide-react';

interface SeasonStatsProps {
    seasonId: string;
}

interface PlayerSeasonStat {
    id: string;
    name: string;
    matches: number;
    wins: number;
    draws: number;
    losses: number;
    points: number; // 3 per win, 1 per draw
    goals: number;
    assists: number;
}

export const SeasonStats = ({ seasonId }: SeasonStatsProps) => {
    const { players } = useStore();
    const [stats, setStats] = useState<PlayerSeasonStat[]>([]);
    const [loading, setLoading] = useState(true);
    const [totalMatches, setTotalMatches] = useState(0);

    useEffect(() => {
        const fetchStats = async () => {
            setLoading(true);

            // Fetch finished matches for the season
            const { data: matchesData } = await supabase
                .from('matches')
                .select('*')
                .eq('season_id', seasonId)
                .eq('status', 'finished');

            const matches = (matchesData ?? []) as Match[];
            setTotalMatches(matches.length);

            if (matches.length === 0) {
                setStats([]);
                setLoading(false);
                return;
            }

            const matchIds = matches.map(m => m.id);

            // Fetch events to count goals and assists
            const { data: eventsData } = await supabase
                .from('match_events')
                .select('*')
                .in('match_id', matchIds);

            const events = (eventsData ?? []) as MatchEvent[];

            // Aggregate Data
            const playerMap = new Map<string, PlayerSeasonStat>();

            // Initialize map
            players.forEach(p => {
                playerMap.set(p.id, {
                    id: p.id,
                    name: p.name.split(' ')[0], // First name or short name
                    matches: 0,
                    wins: 0,
                    draws: 0,
                    losses: 0,
                    points: 0,
                    goals: 0,
                    assists: 0
                });
            });

            // Process Matches
            matches.forEach(match => {
                const teamAScore = match.team_a_score ?? 0;
                const teamBScore = match.team_b_score ?? 0;

                let winA = false, winB = false, draw = false;
                if (teamAScore > teamBScore) winA = true;
                else if (teamBScore > teamAScore) winB = true;
                else draw = true;

                const processTeam = (teamIds: string[], isWin: boolean, isDraw: boolean) => {
                    teamIds.forEach(pid => {
                        const p = playerMap.get(pid);
                        if (p) {
                            p.matches += 1;
                            if (isWin) {
                                p.wins += 1;
                                p.points += 3;
                            } else if (isDraw) {
                                p.draws += 1;
                                p.points += 1;
                            } else {
                                p.losses += 1;
                            }
                        }
                    });
                };

                processTeam(match.team_a_players ?? [], winA, draw);
                processTeam(match.team_b_players ?? [], winB, draw);
            });

            // Process Events
            events.forEach(event => {
                if (event.type === 'Goal') {
                    const p = playerMap.get(event.playerId);
                    if (p) p.goals += 1;
                }
                if (event.assistId) {
                    const ap = playerMap.get(event.assistId);
                    if (ap) ap.assists += 1;
                }
            });

            // Filter out players with 0 matches
            const activePlayers = Array.from(playerMap.values()).filter(p => p.matches > 0);

            setStats(activePlayers);
            setLoading(false);
        };

        if (players.length > 0) {
            fetchStats();
        }
    }, [seasonId, players]);

    if (loading) {
        return <div className="p-8 text-center text-gray-400 animate-pulse text-sm">Carregando estatísticas...</div>;
    }

    if (totalMatches === 0 || stats.length === 0) {
        return (
            <div className="p-8 text-center text-gray-500 text-sm bg-black/20 rounded-xl my-4 border border-white/5">
                Nenhuma partida finalizada nesta temporada para gerar estatísticas.
            </div>
        );
    }

    // Rankings
    const topPoints = [...stats].sort((a, b) => b.points - a.points || b.wins - a.wins).slice(0, 5);
    const topScorers = [...stats].sort((a, b) => b.goals - a.goals || b.matches - a.matches).slice(0, 5);
    const topAssists = [...stats].sort((a, b) => b.assists - a.assists || b.matches - a.matches).slice(0, 5);

    // Chart Data (Points)
    const chartData = [...stats].sort((a, b) => b.points - a.points).slice(0, 10);

    const CustomTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
            const data = payload[0].payload;
            return (
                <div className="bg-surface border border-white/10 p-3 rounded-lg shadow-xl outline-none">
                    <p className="font-bold text-white mb-2">{label}</p>
                    <div className="space-y-1 text-xs">
                        <p className="text-primary font-semibold">Pontos: {data.points}</p>
                        <p className="text-gray-400">Partidas: {data.matches}</p>
                        <p className="text-green-400">Vitórias: {data.wins}</p>
                        <p className="text-blue-400">Empates: {data.draws}</p>
                        <p className="text-red-400">Derrotas: {data.losses}</p>
                    </div>
                </div>
            );
        }
        return null;
    };

    return (
        <div className="mt-4 pt-4 border-t border-white/10 space-y-6 animate-in fade-in duration-500">

            <h4 className="text-sm font-bold text-white uppercase tracking-widest flex items-center gap-2">
                <Star size={16} className="text-primary" />
                Resumo da Temporada ({totalMatches} Partidas)
            </h4>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {/* Ranking de Pontos */}
                <Card className="bg-black/20 border-white/5 p-4">
                    <h5 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                        <Trophy size={14} className="text-yellow-500" />
                        Líderes em Pontos
                    </h5>
                    <div className="space-y-3">
                        {topPoints.map((p, i) => (
                            <div key={p.id} className="flex items-center justify-between text-sm">
                                <div className="flex items-center gap-3">
                                    <span className={`font-bold w-4 text-center ${i === 0 ? 'text-yellow-500' : 'text-gray-500'}`}>
                                        {i + 1}
                                    </span>
                                    <span className="text-gray-200">{p.name}</span>
                                </div>
                                <div className="flex items-center gap-3 font-mono">
                                    <span className="text-xs text-gray-500">{p.matches}J</span>
                                    <span className="font-bold text-primary">{p.points}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </Card>

                {/* Artilheiros */}
                <Card className="bg-black/20 border-white/5 p-4">
                    <h5 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                        <Target size={14} className="text-green-500" />
                        Artilheiros (Gols)
                    </h5>
                    <div className="space-y-3">
                        {topScorers.map((p, i) => (
                            <div key={p.id} className="flex items-center justify-between text-sm flex-1">
                                <div className="flex items-center gap-3">
                                    <span className={`font-bold w-4 text-center ${i === 0 ? 'text-green-500' : 'text-gray-500'}`}>
                                        {i + 1}
                                    </span>
                                    <span className="text-gray-200">{p.name}</span>
                                </div>
                                <div className="flex items-center gap-3 font-mono">
                                    <span className="text-xs text-gray-500">{p.matches}J</span>
                                    <span className="font-bold text-green-400">{p.goals}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </Card>

                {/* Garçons */}
                <Card className="bg-black/20 border-white/5 p-4">
                    <h5 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                        <Crosshair size={14} className="text-cyan-500" />
                        Maiores Garçons (Assists)
                    </h5>
                    <div className="space-y-3">
                        {topAssists.map((p, i) => (
                            <div key={p.id} className="flex items-center justify-between text-sm">
                                <div className="flex items-center gap-3">
                                    <span className={`font-bold w-4 text-center ${i === 0 ? 'text-cyan-500' : 'text-gray-500'}`}>
                                        {i + 1}
                                    </span>
                                    <span className="text-gray-200">{p.name}</span>
                                </div>
                                <div className="flex items-center gap-3 font-mono">
                                    <span className="text-xs text-gray-500">{p.matches}J</span>
                                    <span className="font-bold text-cyan-400">{p.assists}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </Card>
            </div>

            {/* Chart */}
            <Card className="bg-black/20 border-white/5 p-4">
                <h5 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-6 flex items-center gap-2">
                    <Activity size={14} className="text-primary" />
                    Gráfico: Top 10 Pontuação
                </h5>
                <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                            <XAxis
                                dataKey="name"
                                axisLine={false}
                                tickLine={false}
                                tick={{ fill: '#6b7280', fontSize: 12 }}
                                dy={10}
                            />
                            <YAxis
                                axisLine={false}
                                tickLine={false}
                                tick={{ fill: '#6b7280', fontSize: 12 }}
                            />
                            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.05)', radius: 8 }} />
                            <Bar dataKey="points" radius={[4, 4, 0, 0]} maxBarSize={40}>
                                {chartData.map((_, index) => (
                                    <Cell key={`cell-${index}`} fill={index === 0 ? '#d97706' : '#ea580c'} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </Card>

        </div>
    );
};
