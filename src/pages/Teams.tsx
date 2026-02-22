import { useState, useEffect } from 'react';
import { useStore } from '../store/useStore';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Shield, Users, RefreshCw, Trophy } from 'lucide-react';
import { generateTeams } from '../utils/teamSorter';
import { cn } from '../utils/cn';
import { MatchControlPanel } from '../components/match/MatchControlPanel';
import { supabase } from '../lib/supabase';

export const Teams = () => {
    const { players, generatedTeams, setGeneratedTeams } = useStore();
    const [selectedPlayerIds, setSelectedPlayerIds] = useState<string[]>([]);
    const [confirmedIds, setConfirmedIds] = useState<string[]>([]);
    const [attendanceLoaded, setAttendanceLoaded] = useState(false);

    // Load today's confirmed players
    useEffect(() => {
        const today = new Date().toISOString().split('T')[0];
        supabase
            .from('attendance')
            .select('player_id')
            .eq('date', today)
            .then(({ data }) => {
                const ids = (data ?? []).map((r: { player_id: string }) => r.player_id);
                setConfirmedIds(ids);
                setSelectedPlayerIds(ids); // auto-select all confirmed
                setAttendanceLoaded(true);
            });
    }, []);

    // Only show players confirmed in attendance
    const attendedPlayers = players.filter(p => confirmedIds.includes(p.id));

    const handleTogglePlayer = (id: string) => {
        if (selectedPlayerIds.includes(id)) {
            setSelectedPlayerIds(selectedPlayerIds.filter(pid => pid !== id));
        } else {
            setSelectedPlayerIds([...selectedPlayerIds, id]);
        }
    };

    const handleSelectAll = () => {
        if (selectedPlayerIds.length === attendedPlayers.length) {
            setSelectedPlayerIds([]);
        } else {
            setSelectedPlayerIds(attendedPlayers.map(p => p.id));
        }
    };

    const handleGenerateTeams = () => {
        const selectedPlayers = attendedPlayers.filter(p => selectedPlayerIds.includes(p.id));
        if (selectedPlayers.length < 2) {
            alert("Selecione pelo menos 2 jogadores.");
            return;
        }
        const [teamA, teamB] = generateTeams(selectedPlayers);
        setGeneratedTeams({ teamA: teamA.players, teamB: teamB.players });
    };

    // Helper to render a team card
    const TeamCard = ({ name, players: teamPlayers, colorClass, totalLevel }: { name: string, players: any[], colorClass: string, totalLevel: number }) => (
        <Card className={cn("border-t-4", colorClass)}>
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold font-header">{name}</h2>
                <div className="bg-white/10 px-3 py-1 rounded-full text-sm font-mono">
                    Nível: {totalLevel}
                </div>
            </div>
            <div className="space-y-2">
                {teamPlayers.map(p => (
                    <div key={p.id} className="flex items-center justify-between p-2 rounded bg-white/5">
                        <div className="flex items-center gap-2">
                            {p.position === 'Goalkeeper' && <Shield size={14} className="text-yellow-500" />}
                            <span className="font-medium">{p.name}</span>
                        </div>
                        <div className="flex gap-0.5">
                            {[...Array(p.level)].map((_, i) => (
                                <div key={i} className="w-1 h-3 rounded-full bg-white/20" />
                            ))}
                        </div>
                    </div>
                ))}
            </div>
            <div className="mt-4 pt-4 border-t border-white/10 flex justify-between text-sm text-gray-400">
                <span>{teamPlayers.length} Jogadores</span>
            </div>
        </Card>
    );

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold font-header text-primary">Sorteio de Times</h1>
                {generatedTeams && (
                    <Button variant="secondary" onClick={() => setGeneratedTeams({ teamA: [], teamB: [] })}>
                        <RefreshCw size={18} className="mr-2" />
                        Novo Sorteio
                    </Button>
                )}
            </div>

            {!generatedTeams?.teamA.length ? (
                <div className="space-y-4">
                    <Card>
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-lg font-bold flex items-center gap-2">
                                <Users size={20} className="text-primary" />
                                Selecione os Jogadores
                            </h2>
                            <div className="flex items-center gap-3">
                                <span className="text-sm text-gray-400">
                                    {confirmedIds.length} confirmados · {selectedPlayerIds.length} selecionados
                                </span>
                            </div>
                        </div>

                        {/* Empty state OR player list */}
                        {attendanceLoaded && attendedPlayers.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-12 text-gray-500 gap-3">
                                <p className="text-sm">Nenhum jogador confirmado para hoje.</p>
                                <a href="/attendance" className="text-primary text-sm hover:underline">
                                    → Fazer a chamada primeiro
                                </a>
                            </div>
                        ) : (
                            <>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                                    {attendedPlayers.map(player => (
                                        <div
                                            key={player.id}
                                            onClick={() => handleTogglePlayer(player.id)}
                                            className={cn(
                                                "cursor-pointer p-3 rounded-lg border transition-all duration-200 flex items-center justify-between",
                                                selectedPlayerIds.includes(player.id)
                                                    ? "bg-primary/10 border-primary text-white"
                                                    : "bg-surface border-white/5 text-gray-400 hover:border-white/20"
                                            )}
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className={cn(
                                                    "w-2 h-2 rounded-full",
                                                    player.position === 'Goalkeeper' ? "bg-yellow-500" : "bg-blue-400"
                                                )} />
                                                <span className="font-medium">{player.name}</span>
                                            </div>
                                            <div className="text-xs font-mono bg-black/20 px-1.5 py-0.5 rounded">
                                                Lvl {player.level}
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <div className="mt-6 flex gap-3">
                                    <Button variant="ghost" onClick={handleSelectAll}>
                                        {selectedPlayerIds.length === attendedPlayers.length ? 'Desmarcar Todos' : 'Selecionar Todos'}
                                    </Button>
                                    <Button onClick={handleGenerateTeams} disabled={selectedPlayerIds.length < 2} className="flex-1">
                                        <Trophy size={18} className="mr-2" />
                                        Gerar Times
                                    </Button>
                                </div>
                            </>
                        )}
                    </Card>
                </div>

            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-in slide-in-from-bottom-4 duration-500">
                    <TeamCard
                        name="Time Amarelo"
                        players={generatedTeams.teamA}
                        colorClass="border-t-yellow-500"
                        totalLevel={generatedTeams.teamA.reduce((acc, p) => acc + p.level, 0)}
                    />
                    <TeamCard
                        name="Time Azul"
                        players={generatedTeams.teamB}
                        colorClass="border-t-blue-500"
                        totalLevel={generatedTeams.teamB.reduce((acc, p) => acc + p.level, 0)}
                    />
                </div>
            )}


            {/* Match Control Panel */}
            {generatedTeams && generatedTeams.teamA.length > 0 && (
                <div className="pt-8 border-t border-white/5">
                    <MatchControlPanel />
                </div>
            )}
        </div>
    );
};
