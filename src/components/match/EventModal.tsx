import { useState } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import type { Player, EventType } from '../../types';
import { cn } from '../../utils/cn';

interface EventModalProps {
    isOpen: boolean;
    onClose: () => void;
    teamName: string;
    players: Player[];
    eventType: EventType | null;
    onConfirm: (data: { playerId: string, assistId?: string, type: EventType }) => void;
}

export const EventModal: React.FC<EventModalProps> = ({
    isOpen,
    onClose,
    teamName,
    players,
    eventType,
    onConfirm
}) => {
    const [selectedPlayer, setSelectedPlayer] = useState<string>('');
    const [selectedAssist, setSelectedAssist] = useState<string>('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!eventType || !selectedPlayer) return;

        onConfirm({
            type: eventType,
            playerId: selectedPlayer,
            assistId: selectedAssist || undefined
        });

        handleClose();
    };

    const handleClose = () => {
        setSelectedPlayer('');
        setSelectedAssist('');
        onClose();
    };

    if (!eventType) return null;

    return (
        <Modal
            isOpen={isOpen}
            onClose={handleClose}
            title={`Registrar ${eventType === 'Goal' ? 'Gol' :
                eventType === 'Assist' ? 'Assistência' : // Assist usually linked to Goal
                    eventType === 'YellowCard' ? 'Cartão Amarelo' :
                        eventType === 'RedCard' ? 'Cartão Vermelho' :
                            eventType === 'OwnGoal' ? 'Gol Contra' : 'Evento'
                } - ${teamName}`}
        >
            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1.5">
                    <label className="text-sm font-medium text-gray-400">
                        {eventType === 'Goal' ? 'Quem fez o gol?' : 'Jogador'}
                    </label>
                    <div className="grid grid-cols-2 gap-2 max-h-60 overflow-y-auto">
                        {players.map(player => (
                            <button
                                key={player.id}
                                type="button"
                                onClick={() => setSelectedPlayer(player.id)}
                                className={cn(
                                    "p-2 rounded-lg border text-sm font-medium transition-colors text-left flex items-center gap-2",
                                    selectedPlayer === player.id
                                        ? "bg-primary/20 border-primary text-white"
                                        : "bg-surface border-white/5 text-gray-400 hover:border-white/20"
                                )}
                            >
                                <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center text-xs font-bold text-primary">
                                    {player.name.substring(0, 2).toUpperCase()}
                                </div>
                                {player.name}
                            </button>
                        ))}
                    </div>
                </div>

                {eventType === 'Goal' && (
                    <div className="space-y-1.5">
                        <label className="text-sm font-medium text-gray-400">
                            Assistência (Opcional)
                        </label>
                        <select
                            value={selectedAssist}
                            onChange={(e) => setSelectedAssist(e.target.value)}
                            className="w-full bg-surface border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-primary/50"
                        >
                            <option value="">Sem assistência</option>
                            {players.filter(p => p.id !== selectedPlayer).map(player => (
                                <option key={player.id} value={player.id}>
                                    {player.name}
                                </option>
                            ))}
                        </select>
                    </div>
                )}

                <div className="pt-4 flex gap-3">
                    <Button type="button" variant="ghost" onClick={handleClose} className="flex-1">
                        Cancelar
                    </Button>
                    <Button type="submit" disabled={!selectedPlayer} className="flex-1">
                        Confirmar
                    </Button>
                </div>
            </form>
        </Modal>
    );
};
