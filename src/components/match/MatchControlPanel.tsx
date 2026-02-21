import { useState, useEffect } from 'react';
import { useStore } from '../../store/useStore';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Play, Square, Goal, ShieldAlert, Flag, ShieldBan } from 'lucide-react';
import { EventModal } from './EventModal';
import type { EventType } from '../../types';
import { cn } from '../../utils/cn';

export const MatchControlPanel = () => {
    const { currentMatch, generatedTeams, players, startMatch, pauseMatch, resumeMatch, endMatch, addEvent } = useStore();
    const [modalOpen, setModalOpen] = useState(false);
    const [activeTeam, setActiveTeam] = useState<'A' | 'B' | null>(null);
    const [eventType, setEventType] = useState<EventType | null>(null);
    const [timeDisplay, setTimeDisplay] = useState('10:00');

    // Timer Logic
    useEffect(() => {
        let interval: ReturnType<typeof setInterval>;

        const updateTimer = () => {
            let elapsed = currentMatch.totalElapsedTime;

            if (currentMatch.isActive && currentMatch.startTime) {
                const startTime = new Date(currentMatch.startTime).getTime();
                const now = new Date().getTime();
                elapsed += (now - startTime);
            }

            const totalDuration = 10 * 60 * 1000; // 10 minutes in ms
            const remaining = Math.max(0, totalDuration - elapsed);

            const minutes = Math.floor(remaining / 60000);
            const seconds = Math.floor((remaining % 60000) / 1000);

            setTimeDisplay(
                `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
            );
        };

        // Update immediately to show correct state (e.g. paused time)
        updateTimer();

        if (currentMatch.isActive) {
            interval = setInterval(updateTimer, 1000);
        }

        return () => clearInterval(interval);
    }, [currentMatch.isActive, currentMatch.startTime, currentMatch.totalElapsedTime]);

    if (!generatedTeams) return null;

    const handleEventClick = (team: 'A' | 'B', type: EventType) => {
        setActiveTeam(team);
        setEventType(type);
        setModalOpen(true);
    };

    const handleConfirmEvent = (data: { playerId: string, assistId?: string, type: EventType }) => {
        if (!activeTeam) return;

        addEvent({
            ...data,
            team: activeTeam
        });
    };

    const getTeamPlayers = (team: 'A' | 'B') => {
        if (team === 'A') return generatedTeams.teamA;
        return generatedTeams.teamB;
    };

    const getPlayerName = (id: string) => {
        return players.find(p => p.id === id)?.name || 'Desconhecido';
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold font-header text-primary">Painel da Partida</h2>
                <div className="flex gap-3">
                    {!currentMatch.isActive && currentMatch.totalElapsedTime === 0 ? (
                        <Button onClick={startMatch} className="bg-green-600 hover:bg-green-700 text-white">
                            <Play size={20} className="mr-2" /> Iniciar Partida
                        </Button>
                    ) : (
                        <>
                            {currentMatch.isActive ? (
                                <Button onClick={pauseMatch} className="bg-yellow-600 hover:bg-yellow-700 text-white">
                                    <Square size={20} className="mr-2 fill-current" /> Pausar
                                </Button>
                            ) : (
                                <Button onClick={resumeMatch} className="bg-green-600 hover:bg-green-700 text-white">
                                    <Play size={20} className="mr-2" /> Retomar
                                </Button>
                            )}

                            <Button onClick={endMatch} variant="danger">
                                <Flag size={20} className="mr-2" /> Encerrar
                            </Button>
                        </>
                    )}
                </div>
            </div>

            {/* Scoreboard */}
            <Card className="bg-gradient-to-br from-surface to-black/80 border-white/10">
                <div className="flex items-center justify-between px-4 py-2">
                    {/* Team A */}
                    <div className="text-center flex-1">
                        <h3 className="text-2xl font-bold text-yellow-500 mb-2">Time Amarelo</h3>
                        <div className="text-6xl font-header font-bold">{currentMatch.teamAScore}</div>
                    </div>

                    {/* Timer / Status */}
                    <div className="flex flex-col items-center px-8 border-x border-white/5">
                        <div className={cn(
                            "text-sm font-bold uppercase tracking-widest mb-2 px-3 py-1 rounded-full",
                            currentMatch.isActive ? "bg-green-500/20 text-green-500 animate-pulse" :
                                currentMatch.totalElapsedTime > 0 ? "bg-yellow-500/20 text-yellow-500" : "bg-gray-500/20 text-gray-500"
                        )}>
                            {currentMatch.isActive ? 'Em Andamento' :
                                currentMatch.totalElapsedTime > 0 ? 'Pausado' : 'Aguardando'}
                        </div>
                        <div className={cn(
                            "text-4xl font-mono",
                            currentMatch.isActive ? "text-white" : "text-gray-400"
                        )}>
                            {timeDisplay}
                        </div>
                    </div>

                    {/* Team B */}
                    <div className="text-center flex-1">
                        <h3 className="text-2xl font-bold text-blue-500 mb-2">Time Azul</h3>
                        <div className="text-6xl font-header font-bold">{currentMatch.teamBScore}</div>
                    </div>
                </div>

                {/* Controls */}
                {currentMatch.isActive && (
                    <div className="grid grid-cols-2 gap-8 mt-8 pt-6 border-t border-white/5">
                        {/* Team A Controls */}
                        <div className="flex justify-center gap-3">
                            <Button
                                onClick={() => handleEventClick('A', 'Goal')}
                                className="bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500/20 border border-yellow-500/50"
                            >
                                <Goal size={20} className="mr-2" /> Gol
                            </Button>
                            <Button
                                variant="ghost"
                                onClick={() => handleEventClick('A', 'YellowCard')}
                                className="text-yellow-200 hover:text-white"
                                title="Cartão Amarelo"
                            >
                                <ShieldAlert size={20} />
                            </Button>
                            <Button
                                variant="ghost"
                                onClick={() => handleEventClick('A', 'RedCard')}
                                className="text-red-500 hover:text-red-400 hover:bg-red-500/10"
                                title="Cartão Vermelho"
                            >
                                <ShieldBan size={20} />
                            </Button>
                            <Button
                                variant="ghost"
                                onClick={() => handleEventClick('A', 'OwnGoal')}
                                className="text-orange-500 hover:text-orange-400 hover:bg-orange-500/10"
                                title="Gol Contra"
                            >
                                <Goal size={20} className="transform rotate-180" />
                            </Button>
                        </div>

                        {/* Team B Controls */}
                        <div className="flex justify-center gap-3">
                            <Button
                                onClick={() => handleEventClick('B', 'Goal')}
                                className="bg-blue-500/10 text-blue-500 hover:bg-blue-500/20 border border-blue-500/50"
                            >
                                <Goal size={20} className="mr-2" /> Gol
                            </Button>
                            <Button
                                variant="ghost"
                                onClick={() => handleEventClick('B', 'YellowCard')}
                                className="text-blue-200 hover:text-white"
                                title="Cartão Amarelo"
                            >
                                <ShieldAlert size={20} />
                            </Button>
                            <Button
                                variant="ghost"
                                onClick={() => handleEventClick('B', 'RedCard')}
                                className="text-red-500 hover:text-red-400 hover:bg-red-500/10"
                                title="Cartão Vermelho"
                            >
                                <ShieldBan size={20} />
                            </Button>
                            <Button
                                variant="ghost"
                                onClick={() => handleEventClick('B', 'OwnGoal')}
                                className="text-orange-500 hover:text-orange-400 hover:bg-orange-500/10"
                                title="Gol Contra"
                            >
                                <Goal size={20} className="transform rotate-180" />
                            </Button>
                        </div>
                    </div>
                )}
            </Card>

            {/* Match Feed */}
            {currentMatch.events.length > 0 && (
                <Card>
                    <h3 className="text-lg font-bold font-header mb-4 flex items-center gap-2">
                        <Flag className="text-gray-400" /> Timeline do Jogo
                    </h3>
                    <div className="space-y-3 max-h-60 overflow-y-auto pr-2">
                        {currentMatch.events.map((event) => (
                            <div key={event.id} className={cn(
                                "flex items-center gap-4 p-3 rounded-lg border",
                                event.team === 'A' ? "border-yellow-500/20 bg-yellow-500/5" : "border-blue-500/20 bg-blue-500/5"
                            )}>
                                <div className="text-xs font-mono text-gray-500">
                                    {new Date(event.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </div>
                                <div className={cn(
                                    "p-2 rounded-full",
                                    event.type === 'Goal' ? "bg-green-500/20 text-green-500" :
                                        event.type === 'OwnGoal' ? "bg-orange-500/20 text-orange-500" :
                                            event.type === 'YellowCard' ? "bg-yellow-500/20 text-yellow-500" :
                                                "bg-red-500/20 text-red-500"
                                )}>
                                    {event.type === 'Goal' ? <Goal size={16} /> :
                                        event.type === 'OwnGoal' ? <Goal size={16} className="rotate-180" /> :
                                            event.type === 'YellowCard' ? <ShieldAlert size={16} /> :
                                                <ShieldBan size={16} />}
                                </div>
                                <div className="flex-1">
                                    <div className="font-bold text-sm">
                                        {event.type === 'Goal' ? 'GOL!' :
                                            event.type === 'OwnGoal' ? 'GOL CONTRA!' :
                                                event.type === 'YellowCard' ? 'Cartão Amarelo' : 'Cartão Vermelho'}
                                    </div>
                                    <div className="text-sm text-gray-400">
                                        {getPlayerName(event.playerId)}
                                        {event.assistId && (
                                            <span className="text-gray-500 text-xs ml-2">
                                                (Assist: {getPlayerName(event.assistId)})
                                            </span>
                                        )}
                                    </div>
                                </div>
                                <div className={cn(
                                    "text-xs font-bold px-2 py-1 rounded",
                                    event.team === 'A' ? "text-yellow-500 bg-yellow-500/10" : "text-blue-500 bg-blue-500/10"
                                )}>
                                    {event.team === 'A' ? 'Time A' : 'Time B'}
                                </div>
                            </div>
                        ))}
                    </div>
                </Card>
            )}

            <EventModal
                isOpen={modalOpen}
                onClose={() => setModalOpen(false)}
                teamName={activeTeam === 'A' ? 'Time Amarelo' : 'Time Azul'}
                players={activeTeam ? getTeamPlayers(activeTeam) : []}
                eventType={eventType}
                onConfirm={handleConfirmEvent}
            />
        </div>
    );
};
