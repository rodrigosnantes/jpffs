import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { supabase } from '../lib/supabase';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { ArrowLeft, Save, Trash2, Shield, User, Target, Footprints, Activity, Zap, Trophy, Calendar } from 'lucide-react';
import { cn } from '../utils/cn';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
    ResponsiveContainer, Legend, PieChart, Pie, Cell
} from 'recharts';

// ─── Types ───────────────────────────────────────────────────────────────────

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

// ─── Helpers ─────────────────────────────────────────────────────────────────

const RESULT_LABEL: Record<'W' | 'D' | 'L', string> = { W: 'Vitória', D: 'Empate', L: 'Derrota' };
const RESULT_COLOR: Record<'W' | 'D' | 'L', string> = {
    W: 'bg-green-500/20 text-green-400 border-green-500/30',
    D: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
    L: 'bg-red-500/20 text-red-400 border-red-500/30',
};
const PIE_COLORS = ['#22c55e', '#6b7280', '#ef4444'];

// ─── Custom Tooltip ───────────────────────────────────────────────────────────

const CustomBarTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    return (
        <div className="bg-surface border border-white/10 rounded-lg p-3 text-sm shadow-xl">
            <p className="text-gray-300 mb-1 font-semibold">{label}</p>
            {payload.map((entry: any) => (
                <p key={entry.name} style={{ color: entry.fill }}>
                    {entry.name}: <span className="font-bold">{entry.value}</span>
                </p>
            ))}
        </div>
    );
};

// ─── Component ────────────────────────────────────────────────────────────────

export const PlayerEdit = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { players, matches, updatePlayer, deletePlayer } = useStore();

    const player = players.find(p => p.id === id);

    const [formData, setFormData] = useState({
        name: '',
        position: 'Line' as 'Goalkeeper' | 'Line',
        level: 3,
        attributes: { attack: 50, defense: 50, pace: 50, shooting: 50, physical: 50, passing: 50 }
    });

    const [matchStats, setMatchStats] = useState<MatchStat[]>([]);
    const [loadingStats, setLoadingStats] = useState(true);

    // ── Load player into form ──────────────────────────────────────────────
    useEffect(() => {
        if (player) {
            setFormData({
                name: player.name,
                position: player.position,
                level: player.level,
                attributes: player.attributes || { attack: 50, defense: 50, pace: 50, shooting: 50, physical: 50, passing: 50 }
            });
        } else {
            navigate('/players');
        }
    }, [id, players]);

    // ── Fetch match-level stats (goals/assists per match) ──────────────────
    useEffect(() => {
        if (!id) return;

        const fetchStats = async () => {
            setLoadingStats(true);

            const playerMatches = matches
                .filter(m =>
                    m.status === 'finished' &&
                    ((m.team_a_players ?? []).includes(id) || (m.team_b_players ?? []).includes(id))
                )
                .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

            if (playerMatches.length === 0) {
                setMatchStats([]);
                setLoadingStats(false);
                return;
            }

            const matchIds = playerMatches.map(m => m.id);
            const { data: events } = await supabase
                .from('match_events')
                .select('match_id, player_id, assist_id, type')
                .in('match_id', matchIds);

            const stats: MatchStat[] = playerMatches.map(m => {
                const mEvents = (events || []).filter(e => e.match_id === m.id);
                const goals = mEvents.filter(e => e.player_id === id && e.type === 'Goal').length;
                const assists = mEvents.filter(e => e.assist_id === id).length;
                const inTeamA = (m.team_a_players ?? []).includes(id);
                const scoreA = m.team_a_score ?? 0;
                const scoreB = m.team_b_score ?? 0;
                let result: 'W' | 'D' | 'L';
                if (scoreA === scoreB) result = 'D';
                else if (inTeamA ? scoreA > scoreB : scoreB > scoreA) result = 'W';
                else result = 'L';
                return {
                    matchId: m.id,
                    date: new Date(m.date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
                    goals, assists, result, scoreA, scoreB, inTeamA
                };
            });

            setMatchStats(stats);
            setLoadingStats(false);
        };

        fetchStats();
    }, [id, matches]);

    // ── Form handlers ──────────────────────────────────────────────────────
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (id) { updatePlayer(id, formData); navigate('/players'); }
    };

    const handleDelete = () => {
        if (confirm('Tem certeza que deseja excluir este jogador?')) {
            if (id) { deletePlayer(id); navigate('/players'); }
        }
    };

    const handleAttributeChange = (attr: keyof typeof formData.attributes, value: number) => {
        setFormData(prev => ({ ...prev, attributes: { ...prev.attributes, [attr]: value } }));
    };

    if (!id || !player) return null;

    // ── Derived values ─────────────────────────────────────────────────────
    const { stats } = player;
    const winRate = stats.matches_played > 0
        ? Math.round((stats.wins / stats.matches_played) * 100)
        : 0;

    const pieData = [
        { name: 'Vitórias', value: stats.wins },
        { name: 'Empates', value: stats.draws },
        { name: 'Derrotas', value: stats.losses },
    ].filter(d => d.value > 0);

    const last5 = [...matchStats].reverse().slice(0, 5);

    // ── Render ─────────────────────────────────────────────────────────────
    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" onClick={() => navigate('/players')}>
                        <ArrowLeft size={20} />
                    </Button>
                    <h1 className="text-3xl font-bold font-header text-primary">Editar Jogador</h1>
                </div>
                <Button variant="danger" onClick={handleDelete}>
                    <Trash2 size={20} className="mr-2" />
                    Excluir Jogador
                </Button>
            </div>

            {/* Edit Form */}
            <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="col-span-1 space-y-6">
                    <h2 className="text-xl font-bold text-white mb-4">Informações Básicas</h2>
                    <Input label="Nome" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-400">Posição</label>
                        <div className="grid grid-cols-2 gap-3">
                            <button type="button" onClick={() => setFormData({ ...formData, position: 'Line' })}
                                className={cn("p-4 rounded-xl border flex flex-col items-center gap-2 transition-all",
                                    formData.position === 'Line' ? "bg-blue-500/20 border-blue-500 text-blue-400" : "bg-white/5 border-white/10 text-gray-400 hover:bg-white/10")}>
                                <User size={24} /><span className="font-bold">Linha</span>
                            </button>
                            <button type="button" onClick={() => setFormData({ ...formData, position: 'Goalkeeper' })}
                                className={cn("p-4 rounded-xl border flex flex-col items-center gap-2 transition-all",
                                    formData.position === 'Goalkeeper' ? "bg-yellow-500/20 border-yellow-500 text-yellow-500" : "bg-white/5 border-white/10 text-gray-400 hover:bg-white/10")}>
                                <Shield size={24} /><span className="font-bold">Goleiro</span>
                            </button>
                        </div>
                    </div>
                    <div className="space-y-2">
                        <div className="flex justify-between">
                            <label className="text-sm font-medium text-gray-400">Nível Geral</label>
                            <span className="text-primary font-bold">{formData.level}</span>
                        </div>
                        <input type="range" min="1" max="5" step="1" value={formData.level}
                            onChange={(e) => setFormData({ ...formData, level: parseInt(e.target.value) })}
                            className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-primary" />
                        <div className="flex justify-between text-xs text-gray-500 font-mono">
                            <span>Iniciante</span><span>Pro</span>
                        </div>
                    </div>
                </Card>

                <Card className="col-span-1 lg:col-span-2 space-y-6">
                    <h2 className="text-xl font-bold text-white mb-4">Atributos (Radar)</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {Object.entries(formData.attributes).map(([key, value]) => (
                            <div key={key} className="space-y-2">
                                <div className="flex justify-between">
                                    <label className="text-sm font-medium text-gray-300 capitalize">
                                        {key === 'attack' ? 'Ataque' : key === 'defense' ? 'Defesa' : key === 'pace' ? 'Velocidade' : key === 'shooting' ? 'Chute' : key === 'physical' ? 'Físico' : 'Passe'}
                                    </label>
                                    <span className="text-gray-400 font-mono">{value}</span>
                                </div>
                                <input type="range" min="0" max="100" value={value}
                                    onChange={(e) => handleAttributeChange(key as keyof typeof formData.attributes, parseInt(e.target.value))}
                                    className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-blue-500" />
                            </div>
                        ))}
                    </div>
                    <div className="pt-6 border-t border-white/10 flex justify-end">
                        <Button type="submit" className="w-full md:w-auto min-w-[200px]">
                            <Save size={20} className="mr-2" />Salvar Alterações
                        </Button>
                    </div>
                </Card>
            </form>

            {/* ── Stats Dashboard ── */}
            <div className="space-y-6">
                <h2 className="text-2xl font-bold font-header text-white flex items-center gap-3">
                    <Activity className="text-primary" size={24} />
                    Estatísticas de {player.name}
                </h2>

                {/* Metric Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
                    {[
                        { label: 'Jogos', value: stats.matches_played, icon: <Calendar size={16} />, color: 'text-blue-400', bg: 'bg-blue-500/10' },
                        { label: 'Gols', value: stats.goals, icon: <Target size={16} />, color: 'text-green-400', bg: 'bg-green-500/10' },
                        { label: 'Assists', value: stats.assists, icon: <Footprints size={16} />, color: 'text-cyan-400', bg: 'bg-cyan-500/10' },
                        { label: 'Aproveitem.', value: `${winRate}%`, icon: <Zap size={16} />, color: 'text-amber-400', bg: 'bg-amber-500/10' },
                        { label: 'Vitórias', value: stats.wins, icon: <Trophy size={16} />, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
                        { label: 'Empates', value: stats.draws, icon: <Activity size={16} />, color: 'text-gray-400', bg: 'bg-gray-500/10' },
                        { label: 'Derrotas', value: stats.losses, icon: <Shield size={16} />, color: 'text-red-400', bg: 'bg-red-500/10' },
                        { label: 'Cartões', value: stats.yellow_cards + stats.red_cards, icon: <Zap size={16} />, color: 'text-yellow-400', bg: 'bg-yellow-500/10' },
                    ].map(({ label, value, icon, color, bg }) => (
                        <Card key={label} className="p-3 flex flex-col items-center gap-2 text-center">
                            <div className={cn('p-2 rounded-full', bg, color)}>{icon}</div>
                            <div className={cn('text-xl font-bold', color)}>{value}</div>
                            <div className="text-[11px] text-gray-500 uppercase tracking-wider">{label}</div>
                        </Card>
                    ))}
                </div>

                {loadingStats ? (
                    <Card className="py-12 flex items-center justify-center text-gray-500">
                        Carregando estatísticas...
                    </Card>
                ) : matchStats.length === 0 ? (
                    <Card className="py-12 flex flex-col items-center justify-center text-gray-500 gap-2">
                        <Activity size={32} className="opacity-30" />
                        <p>Nenhuma partida finalizada encontrada para este jogador.</p>
                    </Card>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Bar Chart – Gols & Assists por partida */}
                        <Card className="col-span-1 lg:col-span-2">
                            <h3 className="text-base font-bold text-white mb-4 flex items-center gap-2">
                                <Target size={16} className="text-primary" />
                                Gols & Assistências por Partida
                            </h3>
                            <div className="h-[240px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={matchStats} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
                                        <XAxis dataKey="date" tick={{ fill: '#6b7280', fontSize: 11 }} />
                                        <YAxis tick={{ fill: '#6b7280', fontSize: 11 }} allowDecimals={false} />
                                        <Tooltip content={<CustomBarTooltip />} />
                                        <Legend wrapperStyle={{ fontSize: 12, color: '#9ca3af' }} />
                                        <Bar dataKey="goals" name="Gols" fill="#22c55e" radius={[4, 4, 0, 0]} />
                                        <Bar dataKey="assists" name="Assists" fill="#38bdf8" radius={[4, 4, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </Card>

                        {/* Pie Chart – Aproveitamento */}
                        <Card>
                            <h3 className="text-base font-bold text-white mb-4 flex items-center gap-2">
                                <Trophy size={16} className="text-primary" />
                                Aproveitamento
                            </h3>
                            <div className="h-[180px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={80}
                                            dataKey="value" nameKey="name" paddingAngle={3}>
                                            {pieData.map((_, i) => (
                                                <Cell key={i} fill={PIE_COLORS[i]} />
                                            ))}
                                        </Pie>
                                        <Tooltip
                                            contentStyle={{ background: '#1a1b1e', border: '1px solid #ffffff15', borderRadius: 8, fontSize: 12 }}
                                            itemStyle={{ color: '#d1d5db' }}
                                        />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                            <div className="flex justify-center gap-4 mt-2">
                                {[['Vitórias', '#22c55e'], ['Empates', '#6b7280'], ['Derrotas', '#ef4444']].map(([label, color]) => (
                                    <div key={label} className="flex items-center gap-1.5 text-xs text-gray-400">
                                        <div className="w-2 h-2 rounded-full" style={{ background: color }} />
                                        {label}
                                    </div>
                                ))}
                            </div>
                        </Card>

                        {/* Last 5 Matches Timeline */}
                        <Card className="col-span-1 lg:col-span-3">
                            <h3 className="text-base font-bold text-white mb-4 flex items-center gap-2">
                                <Calendar size={16} className="text-primary" />
                                Últimas Partidas
                            </h3>
                            <div className="space-y-3">
                                {last5.map((m) => (
                                    <div key={m.matchId}
                                        className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/5 hover:bg-white/8 transition-colors">
                                        <div className="flex items-center gap-3">
                                            <span className={cn('px-2 py-0.5 rounded text-xs font-bold border', RESULT_COLOR[m.result])}>
                                                {RESULT_LABEL[m.result]}
                                            </span>
                                            <span className="text-gray-400 text-sm">{m.date}</span>
                                        </div>
                                        <div className="flex items-center gap-6">
                                            <div className="text-center text-sm">
                                                <span className="text-gray-500 mr-3">
                                                    Time {m.inTeamA ? 'A' : 'B'}
                                                </span>
                                                <span className={cn('font-bold font-mono text-base',
                                                    m.result === 'W' ? 'text-green-400' : m.result === 'L' ? 'text-red-400' : 'text-gray-300')}>
                                                    {m.inTeamA ? m.scoreA : m.scoreB}
                                                </span>
                                                <span className="text-gray-600 mx-2">—</span>
                                                <span className="font-bold font-mono text-base text-gray-300">
                                                    {m.inTeamA ? m.scoreB : m.scoreA}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-3 text-sm">
                                                {m.goals > 0 && (
                                                    <span className="flex items-center gap-1 text-green-400">
                                                        <Target size={13} /> {m.goals}
                                                    </span>
                                                )}
                                                {m.assists > 0 && (
                                                    <span className="flex items-center gap-1 text-cyan-400">
                                                        <Footprints size={13} /> {m.assists}
                                                    </span>
                                                )}
                                                {m.goals === 0 && m.assists === 0 && (
                                                    <span className="text-gray-600 text-xs">sem participações</span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </Card>
                    </div>
                )}
            </div>
        </div>
    );
};
