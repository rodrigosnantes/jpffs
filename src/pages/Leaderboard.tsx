import { useMemo, useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { supabase } from '../lib/supabase';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Trophy, Medal, TrendingUp, Target, Handshake, AlertTriangle, Percent, CalendarRange, Search } from 'lucide-react';
import { cn } from '../utils/cn';

interface Season { id: string; name: string; is_active: boolean; }

// ─── Tab config ───────────────────────────────────────────────────────────────

type TabId = 'classification' | 'goals' | 'assists' | 'cards' | 'winrate';

const TABS: { id: TabId; label: string; icon: React.ReactNode; color: string }[] = [
    { id: 'classification', label: 'Classificação', icon: <Trophy size={15} />, color: 'text-primary' },
    { id: 'goals', label: 'Goleadores', icon: <Target size={15} />, color: 'text-green-400' },
    { id: 'assists', label: 'Assistentes', icon: <Handshake size={15} />, color: 'text-cyan-400' },
    { id: 'cards', label: 'Cartões', icon: <AlertTriangle size={15} />, color: 'text-yellow-400' },
    { id: 'winrate', label: 'Aproveitamento', icon: <Percent size={15} />, color: 'text-purple-400' },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

const getRankIcon = (index: number) => {
    if (index === 0) return <Medal className="text-yellow-500" size={20} />;
    if (index === 1) return <Medal className="text-gray-400" size={20} />;
    if (index === 2) return <Medal className="text-amber-700" size={20} />;
    return <span className="font-mono text-gray-500 text-sm">#{index + 1}</span>;
};

const WinDot = ({ result }: { result: 'W' | 'D' | 'L' }) => (
    <div className={cn('w-2 h-2 rounded-full',
        result === 'W' ? 'bg-green-500' : result === 'D' ? 'bg-gray-500' : 'bg-red-500'
    )} title={result === 'W' ? 'Vitória' : result === 'D' ? 'Empate' : 'Derrota'} />
);

// ─── Component ────────────────────────────────────────────────────────────────

export const Leaderboard = () => {
    const { players, matches } = useStore();
    const [activeTab, setActiveTab] = useState<TabId>('classification');

    const [currentPage, setCurrentPage] = useState(1);
    const [searchTerm, setSearchTerm] = useState('');
    const playersPerPage = 10;

    // ── Season filter ────────────────────────────────────────────────────────
    const [seasons, setSeasons] = useState<Season[]>([]);
    const [selectedSeason, setSelectedSeason] = useState('');
    const [seasonEvents, setSeasonEvents] = useState<{ match_id: string; player_id: string; assist_id: string | null; type: string }[]>([]);
    const [seasonMatchIds, setSeasonMatchIds] = useState<string[]>([]);
    const [loadingSeason, setLoadingSeason] = useState(false);

    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, activeTab, selectedSeason]);

    useEffect(() => {
        supabase.from('seasons').select('id,name,is_active').order('created_at', { ascending: false })
            .then(({ data }) => {
                const fetchedSeasons = (data ?? []) as Season[];
                setSeasons(fetchedSeasons);
                const active = fetchedSeasons.find(s => s.is_active);
                if (active) {
                    setSelectedSeason(active.id);
                }
            });
    }, []);

    useEffect(() => {
        if (!selectedSeason) { setSeasonEvents([]); setSeasonMatchIds([]); return; }
        setLoadingSeason(true);
        (async () => {
            const { data: mData } = await supabase
                .from('matches').select('id').eq('season_id', selectedSeason).eq('status', 'finished');
            const ids = (mData ?? []).map((m: { id: string }) => m.id);
            setSeasonMatchIds(ids);
            if (ids.length === 0) { setSeasonEvents([]); setLoadingSeason(false); return; }
            const { data: evData } = await supabase
                .from('match_events').select('match_id,player_id,assist_id,type').in('match_id', ids);
            setSeasonEvents(evData ?? []);
            setLoadingSeason(false);
        })();
    }, [selectedSeason]);

    // ── Finished matches (filtered by season) ───────────────────────────────
    const finishedMatches = useMemo(() => {
        const all = matches.filter(m => m.status === 'finished')
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        if (!selectedSeason) return all;
        return all.filter(m => seasonMatchIds.includes(m.id));
    }, [matches, selectedSeason, seasonMatchIds]);

    // ── Base stats (dynamic when season selected) ────────────────────────────
    const basePlayers = useMemo(() => {
        if (!selectedSeason) {
            return players.map(p => {
                const points = p.stats.wins * 3 + p.stats.draws;
                const played = p.stats.matches_played || 1;
                const winrate = Math.round((p.stats.wins / played) * 100);
                const cards = (p.stats.yellow_cards ?? 0) + (p.stats.red_cards ?? 0) * 2;
                return { ...p, points, winrate, cards };
            });
        }
        return players.map(p => {
            let wins = 0, draws = 0, losses = 0;
            finishedMatches.forEach(m => {
                const inA = (m.team_a_players ?? []).includes(p.id);
                const inB = (m.team_b_players ?? []).includes(p.id);
                if (!inA && !inB) return;
                const sA = m.team_a_score ?? 0, sB = m.team_b_score ?? 0;
                if (sA === sB) draws++;
                else if (inA ? sA > sB : sB > sA) wins++;
                else losses++;
            });
            const goals = seasonEvents.filter(e => e.player_id === p.id && e.type === 'Goal').length;
            const assists = seasonEvents.filter(e => e.assist_id === p.id).length;
            const yellow = seasonEvents.filter(e => e.player_id === p.id && e.type === 'YellowCard').length;
            const red = seasonEvents.filter(e => e.player_id === p.id && e.type === 'RedCard').length;
            const matches_played = wins + draws + losses;
            const points = wins * 3 + draws;
            const winrate = matches_played > 0 ? Math.round((wins / matches_played) * 100) : 0;
            const cards = yellow + red * 2;
            return {
                ...p,
                stats: { ...p.stats, wins, draws, losses, goals, assists, matches_played, yellow_cards: yellow, red_cards: red },
                points, winrate, cards
            };
        });
    }, [players, finishedMatches, selectedSeason, seasonEvents]);

    // ── Sorted lists per tab ────────────────────────────────────────────────
    const sortedAll = useMemo(() => {
        const copy = [...basePlayers];
        let sorted;
        switch (activeTab) {
            case 'classification':
                sorted = copy.sort((a, b) => b.points - a.points || b.stats.wins - a.stats.wins || b.stats.goals - a.stats.goals);
                break;
            case 'goals':
                sorted = copy.sort((a, b) => b.stats.goals - a.stats.goals || b.stats.assists - a.stats.assists);
                break;
            case 'assists':
                sorted = copy.sort((a, b) => b.stats.assists - a.stats.assists || b.stats.goals - a.stats.goals);
                break;
            case 'cards':
                sorted = copy.sort((a, b) => b.cards - a.cards);
                break;
            case 'winrate':
                sorted = copy
                    .filter(p => p.stats.matches_played > 0)
                    .sort((a, b) => b.winrate - a.winrate || b.stats.wins - a.stats.wins);
                break;
            default:
                sorted = copy;
        }
        return sorted.map((p, index) => ({ ...p, rank: index }));
    }, [basePlayers, activeTab]);

    // ── Search & Pagination ─────────────────────────────────────────────────
    const filteredPlayers = useMemo(() => {
        if (!searchTerm) return sortedAll;
        const term = searchTerm.toLowerCase();
        return sortedAll.filter(p => p.name.toLowerCase().includes(term));
    }, [sortedAll, searchTerm]);

    const totalPages = Math.ceil(filteredPlayers.length / playersPerPage);
    const currentPlayers = filteredPlayers.slice(
        (currentPage - 1) * playersPerPage,
        currentPage * playersPerPage
    );

    // ── Last 5 results ───────────────────────────────────────────────────
    const getLast5 = (playerId: string): ('W' | 'D' | 'L')[] => {
        const playerMatches = finishedMatches.filter(m =>
            (m.team_a_players ?? []).includes(playerId) ||
            (m.team_b_players ?? []).includes(playerId)
        );
        return playerMatches.slice(0, 5).reverse().map(m => {
            const inA = (m.team_a_players ?? []).includes(playerId);
            const sA = m.team_a_score ?? 0, sB = m.team_b_score ?? 0;
            if (sA === sB) return 'D';
            return (inA ? sA > sB : sB > sA) ? 'W' : 'L';
        });
    };

    // ── Column config ────────────────────────────────────────────────────
    type ColDef = { label: string; cell: (p: typeof basePlayers[0], i: number) => React.ReactNode; className?: string };

    const columnsByTab: Record<TabId, ColDef[]> = {
        classification: [
            { label: 'Pts', className: 'text-center font-bold text-white w-12', cell: p => <span className="text-primary font-bold text-lg">{p.points}</span> },
            { label: 'J', className: 'text-center w-10', cell: p => p.stats.matches_played },
            { label: 'V', className: 'text-center text-green-400 w-10', cell: p => p.stats.wins },
            { label: 'E', className: 'text-center text-gray-400 w-10', cell: p => p.stats.draws },
            { label: 'D', className: 'text-center text-red-400 w-10', cell: p => p.stats.losses },
            { label: 'G', className: 'text-center w-10', cell: p => p.stats.goals },
            {
                label: 'Últimos 5', className: 'text-center', cell: p => {
                    const last5 = getLast5(p.id);
                    return last5.length > 0
                        ? <div className="flex justify-center gap-1">{last5.map((r, i) => <WinDot key={i} result={r} />)}</div>
                        : <span className="text-gray-600 text-xs">—</span>;
                }
            },
        ],
        goals: [
            { label: '⚽ Gols', className: 'text-center text-green-400 font-bold w-20', cell: p => <span className="text-green-400 font-bold text-lg">{p.stats.goals}</span> },
            { label: 'Assists', className: 'text-center text-cyan-400 w-20', cell: p => p.stats.assists },
            { label: 'Jogos', className: 'text-center w-16', cell: p => p.stats.matches_played },
            { label: 'G/Jogo', className: 'text-center w-20', cell: p => (p.stats.matches_played > 0 ? (p.stats.goals / p.stats.matches_played).toFixed(2) : '—') },
        ],
        assists: [
            { label: '🅰 Assists', className: 'text-center text-cyan-400 font-bold w-20', cell: p => <span className="text-cyan-400 font-bold text-lg">{p.stats.assists}</span> },
            { label: 'Gols', className: 'text-center text-green-400 w-20', cell: p => p.stats.goals },
            { label: 'Jogos', className: 'text-center w-16', cell: p => p.stats.matches_played },
            { label: 'A/Jogo', className: 'text-center w-20', cell: p => (p.stats.matches_played > 0 ? (p.stats.assists / p.stats.matches_played).toFixed(2) : '—') },
        ],
        cards: [
            { label: '🟡 Amarelos', className: 'text-center text-yellow-400 font-bold w-28', cell: p => <span className="text-yellow-400 font-bold text-lg">{p.stats.yellow_cards ?? 0}</span> },
            { label: '🔴 Vermelhos', className: 'text-center text-red-500 w-28', cell: p => <span className="text-red-500 font-bold text-lg">{p.stats.red_cards ?? 0}</span> },
            { label: 'Total*', className: 'text-center text-gray-400 w-20', cell: p => p.cards },
        ],
        winrate: [
            { label: '% Aproveit.', className: 'text-center text-purple-400 font-bold w-28', cell: p => <span className="text-purple-400 font-bold text-lg">{p.winrate}%</span> },
            { label: 'V', className: 'text-center text-green-400 w-14', cell: p => p.stats.wins },
            { label: 'E', className: 'text-center text-gray-400 w-14', cell: p => p.stats.draws },
            { label: 'D', className: 'text-center text-red-400 w-14', cell: p => p.stats.losses },
            { label: 'J', className: 'text-center w-14', cell: p => p.stats.matches_played },
        ],
    };

    const activeCols = columnsByTab[activeTab];

    return (
        <div className="space-y-6 animate-in fade-in duration-300">
            {/* Header */}
            <div className="flex flex-wrap items-center justify-between gap-4">
                <h1 className="text-3xl font-bold font-header text-primary flex items-center gap-3">
                    <Trophy className="text-primary" />
                    Rankings
                </h1>

                {/* Season selector */}
                {seasons.length > 0 && (
                    <div className="flex items-center gap-2">
                        <CalendarRange size={14} className="text-gray-500" />
                        <select
                            value={selectedSeason}
                            onChange={e => setSelectedSeason(e.target.value)}
                            className="bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-gray-300 focus:outline-none focus:border-primary/50"
                        >
                            <option value="">Geral (todos os tempos)</option>
                            {seasons.map(s => (
                                <option key={s.id} value={s.id}>
                                    {s.name}{s.is_active ? ' ★' : ''}
                                </option>
                            ))}
                        </select>
                        {loadingSeason && <span className="text-xs text-gray-600 animate-pulse">Carregando...</span>}
                    </div>
                )}
            </div>

            {/* Tabs & Search */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex flex-wrap gap-2">
                    {TABS.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={cn(
                                'flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all border',
                                activeTab === tab.id
                                    ? `bg-white/10 border-white/20 text-white shadow-lg`
                                    : 'border-white/5 text-gray-500 hover:text-gray-300 hover:border-white/10 bg-white/3'
                            )}
                        >
                            <span className={activeTab === tab.id ? tab.color : ''}>{tab.icon}</span>
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Search */}
                <div className="relative w-full sm:w-64 shrink-0">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                    <input
                        type="text"
                        placeholder="Buscar jogador..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-lg pl-9 pr-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-primary/50"
                    />
                </div>
            </div>

            {/* Table */}
            <Card className="overflow-hidden p-0 w-full max-w-full">
                <div className="overflow-x-auto w-full">
                    <table className="w-full text-left border-collapse min-w-[800px] whitespace-nowrap">
                        <thead className="bg-white/5 text-gray-400 text-xs uppercase tracking-wider border-b border-white/5">
                            <tr>
                                <th className="p-4 w-14 text-center">Pos</th>
                                <th className="p-4">Jogador</th>
                                {activeCols.map(col => (
                                    <th key={col.label} className={cn('p-4', col.className)}>{col.label}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {currentPlayers.map((player) => {
                                const index = player.rank;
                                return (
                                    <tr key={player.id} className="hover:bg-white/5 transition-colors group">
                                        {/* Rank */}
                                        <td className="p-4 text-center">
                                            <div className="flex justify-center">{getRankIcon(index)}</div>
                                        </td>
                                        {/* Player */}
                                        <td className="p-4">
                                            <Link to={`/jogadores/${player.id}`}
                                                className="flex items-center gap-3 hover:text-white transition-colors">
                                                <div className={cn(
                                                    'w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-colors shrink-0',
                                                    index === 0 ? 'bg-yellow-500/20 text-yellow-400 group-hover:bg-yellow-500 group-hover:text-background'
                                                        : 'bg-white/10 text-primary group-hover:bg-primary group-hover:text-background'
                                                )}>
                                                    {player.name.substring(0, 2).toUpperCase()}
                                                </div>
                                                <span className="font-medium text-gray-200 group-hover:text-white">
                                                    {player.name}
                                                </span>
                                                {index < 3 && (
                                                    <TrendingUp size={13} className="text-green-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                                                )}
                                            </Link>
                                        </td>
                                        {/* Dynamic columns */}
                                        {activeCols.map(col => (
                                            <td key={col.label} className={cn('p-4', col.className)}>
                                                {col.cell(player, index)}
                                            </td>
                                        ))}
                                    </tr>
                                )
                            })}
                        </tbody>
                    </table>
                </div>
                {activeTab === 'cards' && (
                    <p className="text-[10px] text-gray-600 px-4 py-2 border-t border-white/5">
                        * Total ponderado: amarelo = 1pt, vermelho = 2pts
                    </p>
                )}
                {totalPages > 1 && (
                    <div className="flex items-center justify-between px-4 py-3 border-t border-white/5">
                        <Button
                            variant="ghost"
                            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                            disabled={currentPage === 1}
                            className="text-sm px-3 py-1.5 h-auto text-gray-400"
                        >
                            Anterior
                        </Button>

                        <span className="text-sm text-gray-500 font-medium">
                            Página {currentPage} de {totalPages}
                        </span>

                        <Button
                            variant="ghost"
                            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                            disabled={currentPage === totalPages}
                            className="text-sm px-3 py-1.5 h-auto text-gray-400"
                        >
                            Próxima
                        </Button>
                    </div>
                )}
            </Card>
        </div>
    );
};
