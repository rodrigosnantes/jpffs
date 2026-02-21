import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Plus, Trash2, Edit2, Shield, User } from 'lucide-react';
import { Modal } from '../components/ui/Modal';
import { Input } from '../components/ui/Input';
import type { Player, Position } from '../types';

export const Players = () => {
    const navigate = useNavigate();
    const { players, addPlayer, deletePlayer } = useStore();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [newPlayer, setNewPlayer] = useState<Partial<Player>>({
        name: '',
        position: 'Line',
        level: 3,
    });

    const handleCreatePlayer = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newPlayer.name) return;

        const player: Player = {
            id: crypto.randomUUID(),
            name: newPlayer.name,
            position: newPlayer.position as Position,
            level: newPlayer.level as number,
            role: 'User',
            stats: { matches_played: 0, wins: 0, draws: 0, losses: 0, goals: 0, assists: 0, yellow_cards: 0, red_cards: 0 },
            attributes: { attack: 50, defense: 50, pace: 50, shooting: 50, physical: 50, passing: 50 } // Default attributes
        };

        addPlayer(player);
        setIsModalOpen(false);
        setNewPlayer({ name: '', position: 'Line', level: 3 });
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold font-header text-primary">Jogadores</h1>
                <Button onClick={() => setIsModalOpen(true)}>
                    <Plus size={20} />
                    Novo Jogador
                </Button>
            </div>

            <Card className="overflow-hidden p-0">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-white/5 text-gray-400">
                            <tr>
                                <th className="p-4 font-medium">Nome</th>
                                <th className="p-4 font-medium">Posição</th>
                                <th className="p-4 font-medium text-center">Nível</th>
                                <th className="p-4 font-medium text-center">Partidas</th>
                                <th className="p-4 font-medium text-right">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {players.map((player) => (
                                <tr key={player.id} className="hover:bg-white/5 transition-colors">
                                    <td className="p-4 font-medium flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-xs font-bold text-primary">
                                            {player.name.substring(0, 2).toUpperCase()}
                                        </div>
                                        {player.name}
                                    </td>
                                    <td className="p-4 text-gray-300">
                                        <div className="flex items-center gap-2">
                                            {player.position === 'Goalkeeper' && <Shield size={16} className="text-yellow-500" />}
                                            {player.position === 'Line' && <User size={16} className="text-blue-400" />}
                                            {player.position === 'Goalkeeper' ? 'Goleiro' : 'Linha'}
                                        </div>
                                    </td>
                                    <td className="p-4 text-center">
                                        <div className="inline-flex gap-0.5">
                                            {[...Array(5)].map((_, i) => (
                                                <div
                                                    key={i}
                                                    className={`w-1.5 h-4 rounded-sm ${i < player.level ? 'bg-primary' : 'bg-white/10'}`}
                                                />
                                            ))}
                                        </div>
                                    </td>
                                    <td className="p-4 text-center text-gray-400">
                                        {player.stats.matches_played}
                                    </td>
                                    <td className="p-4 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <button
                                                onClick={() => navigate(`/players/${player.id}`)}
                                                className="p-2 hover:bg-white/10 rounded text-gray-400 hover:text-white transition-colors"
                                            >
                                                <Edit2 size={18} />
                                            </button>
                                            <button
                                                onClick={() => {
                                                    if (confirm('Tem certeza que deseja excluir este jogador?')) {
                                                        deletePlayer(player.id);
                                                    }
                                                }}
                                                className="p-2 hover:bg-secondary/10 rounded text-secondary hover:text-red-400 transition-colors"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </Card>

            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title="Novo Jogador"
            >
                <form onSubmit={handleCreatePlayer} className="space-y-4">
                    <Input
                        label="Nome do Jogador"
                        placeholder="Ex: Rodrigo"
                        autoFocus
                        value={newPlayer.name}
                        onChange={(e) => setNewPlayer({ ...newPlayer, name: e.target.value })}
                    />

                    <div className="space-y-1.5">
                        <label className="text-sm font-medium text-gray-400">Posição</label>
                        <div className="grid grid-cols-2 gap-2">
                            <button
                                type="button"
                                onClick={() => setNewPlayer({ ...newPlayer, position: 'Line' })}
                                className={`p-2 rounded-lg border text-sm font-medium transition-colors ${newPlayer.position === 'Line'
                                    ? 'bg-primary/20 border-primary text-primary'
                                    : 'bg-surface border-white/10 text-gray-400 hover:border-white/20'
                                    }`}
                            >
                                Linha
                            </button>
                            <button
                                type="button"
                                onClick={() => setNewPlayer({ ...newPlayer, position: 'Goalkeeper' })}
                                className={`p-2 rounded-lg border text-sm font-medium transition-colors ${newPlayer.position === 'Goalkeeper'
                                    ? 'bg-yellow-500/20 border-yellow-500 text-yellow-500' // Assuming GK is generic primary but maybe distinct
                                    : 'bg-surface border-white/10 text-gray-400 hover:border-white/20'
                                    }`}
                            >
                                Goleiro
                            </button>
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-sm font-medium text-gray-400">Nível (1-5)</label>
                        <input
                            type="range"
                            min="1"
                            max="5"
                            step="1"
                            value={newPlayer.level}
                            onChange={(e) => setNewPlayer({ ...newPlayer, level: parseInt(e.target.value) })}
                            className="w-full accent-primary h-2 bg-white/10 rounded-lg appearance-none cursor-pointer"
                        />
                        <div className="flex justify-between text-xs text-gray-500 font-mono">
                            <span>Iniciante</span>
                            <span>Amador</span>
                            <span>Intermed.</span>
                            <span>Avançado</span>
                            <span>Pro</span>
                        </div>
                    </div>

                    <div className="pt-4 flex gap-3">
                        <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)} className="flex-1">
                            Cancelar
                        </Button>
                        <Button type="submit" className="flex-1">
                            Salvar Jogador
                        </Button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};
