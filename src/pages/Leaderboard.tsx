import { useMemo } from 'react';
import { useStore } from '../store/useStore';
import { Card } from '../components/ui/Card';
import { Trophy, Medal, TrendingUp } from 'lucide-react';

export const Leaderboard = () => {
    const { players, matches } = useStore();

    const sortedPlayers = useMemo(() => {
        return [...players]
            .map(player => {
                const points = (player.stats.wins * 3) + (player.stats.draws * 1);
                return { ...player, points };
            })
            .sort((a, b) => {
                if (b.points !== a.points) return b.points - a.points;
                if (b.stats.wins !== a.stats.wins) return b.stats.wins - a.stats.wins;
                return b.stats.goals - a.stats.goals;
            });
    }, [players]);


    // Finished matches ordered by most recent first
    const finishedMatches = useMemo(() => {
        return matches
            .filter(m => m.status === 'finished')
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [matches]);


    /**
     * Returns the last 5 match results for a given player based on real match data.
     * Returns an empty array if the player has no finished matches yet.
     */
    const getLast5 = (playerId: string): ('W' | 'D' | 'L')[] => {
        const playerMatches = finishedMatches.filter(m =>
            (m.team_a_players ?? []).includes(playerId) ||
            (m.team_b_players ?? []).includes(playerId)
        );

        return playerMatches.slice(0, 5).reverse().map(m => {
            const inTeamA = (m.team_a_players ?? []).includes(playerId);
            const scoreA = m.team_a_score ?? 0;
            const scoreB = m.team_b_score ?? 0;

            if (scoreA === scoreB) return 'D';
            const myTeamWon = inTeamA ? scoreA > scoreB : scoreB > scoreA;
            return myTeamWon ? 'W' : 'L';
        });
    };

    const getRankIcon = (index: number) => {
        switch (index) {
            case 0: return <Medal className="text-yellow-500" size={20} />;
            case 1: return <Medal className="text-gray-400" size={20} />;
            case 2: return <Medal className="text-amber-700" size={20} />;
            default: return <span className="font-mono text-gray-500">#{index + 1}</span>;
        }
    };

    const getLast5Icon = (result: 'W' | 'D' | 'L') => {
        switch (result) {
            case 'W': return <div className="w-2 h-2 rounded-full bg-green-500" title="Vitória" />;
            case 'D': return <div className="w-2 h-2 rounded-full bg-gray-500" title="Empate" />;
            case 'L': return <div className="w-2 h-2 rounded-full bg-red-500" title="Derrota" />;
        }
    };

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold font-header text-primary flex items-center gap-3">
                <Trophy className="text-primary" />
                Classificação Geral
            </h1>

            <Card className="overflow-hidden p-0">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-white/5 text-gray-400 text-sm uppercase tracking-wider">
                            <tr>
                                <th className="p-4 w-16 text-center">Pos</th>
                                <th className="p-4">Jogador</th>
                                <th className="p-4 text-center font-bold text-white">P</th>
                                <th className="p-4 text-center">J</th>
                                <th className="p-4 text-center text-green-400">V</th>
                                <th className="p-4 text-center text-gray-400">E</th>
                                <th className="p-4 text-center text-red-400">D</th>
                                <th className="p-4 text-center">GP</th>
                                <th className="p-4 text-center">Últimos 5</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {sortedPlayers.map((player, index) => {
                                const last5 = getLast5(player.id);
                                return (
                                    <tr key={player.id} className="hover:bg-white/5 transition-colors group">
                                        <td className="p-4 text-center font-bold">
                                            <div className="flex justify-center">{getRankIcon(index)}</div>
                                        </td>
                                        <td className="p-4 font-medium flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-xs font-bold text-primary group-hover:bg-primary group-hover:text-background transition-colors">
                                                {player.name.substring(0, 2).toUpperCase()}
                                            </div>
                                            {player.name}
                                            {index < 3 && <TrendingUp size={14} className="text-green-500 ml-2 opacity-0 group-hover:opacity-100 transition-opacity" />}
                                        </td>
                                        <td className="p-4 text-center font-bold text-lg text-primary bg-white/5">
                                            {player.points}
                                        </td>
                                        <td className="p-4 text-center text-gray-300">{player.stats.matches_played}</td>
                                        <td className="p-4 text-center text-green-400 font-medium">{player.stats.wins}</td>
                                        <td className="p-4 text-center text-gray-400 font-medium">{player.stats.draws}</td>
                                        <td className="p-4 text-center text-red-400 font-medium">{player.stats.losses}</td>
                                        <td className="p-4 text-center font-mono">{player.stats.goals}</td>
                                        <td className="p-4">
                                            {last5.length > 0 ? (
                                                <div className="flex items-center justify-center gap-1">
                                                    {last5.map((result, i) => (
                                                        <span key={i}>{getLast5Icon(result)}</span>
                                                    ))}
                                                </div>
                                            ) : (
                                                <span className="text-gray-600 text-xs text-center block">—</span>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </Card>
        </div>
    );
};
