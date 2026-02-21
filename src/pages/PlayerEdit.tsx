import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { ArrowLeft, Save, Trash2, Shield, User } from 'lucide-react';
import { cn } from '../utils/cn';

export const PlayerEdit = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { players, updatePlayer, deletePlayer } = useStore();

    // Local state for the form
    const [formData, setFormData] = useState({
        name: '',
        position: 'Line' as 'Goalkeeper' | 'Line',
        level: 3,
        attributes: {
            attack: 50,
            defense: 50,
            pace: 50,
            shooting: 50,
            physical: 50,
            passing: 50
        }
    });

    // Load player data
    useEffect(() => {
        const player = players.find(p => p.id === id);
        console.log(player)
        if (player) {
            setFormData({
                name: player.name,
                position: player.position,
                level: player.level,
                attributes: player.attributes || {
                    attack: 50,
                    defense: 50,
                    pace: 50,
                    shooting: 50,
                    physical: 50,
                    passing: 50
                }
            });
        } else {
            navigate('/players');
        }
    }, [id, players]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (id) {
            updatePlayer(id, formData);
            navigate('/players');
        }
    };

    const handleDelete = () => {
        if (confirm('Tem certeza que deseja excluir este jogador?')) {
            if (id) {
                deletePlayer(id);
                navigate('/players');
            }
        }
    };

    const handleAttributeChange = (attr: keyof typeof formData.attributes, value: number) => {
        setFormData(prev => ({
            ...prev,
            attributes: {
                ...prev.attributes,
                [attr]: value
            }
        }));
    };

    if (!id) return null;

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

            <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Info */}
                <Card className="col-span-1 lg:col-span-1 space-y-6">
                    <h2 className="text-xl font-bold text-white mb-4">Informações Básicas</h2>

                    <Input
                        label="Nome"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        required
                    />

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-400">Posição</label>
                        <div className="grid grid-cols-2 gap-3">
                            <button
                                type="button"
                                onClick={() => setFormData({ ...formData, position: 'Line' })}
                                className={cn(
                                    "p-4 rounded-xl border flex flex-col items-center gap-2 transition-all",
                                    formData.position === 'Line'
                                        ? "bg-blue-500/20 border-blue-500 text-blue-400"
                                        : "bg-white/5 border-white/10 text-gray-400 hover:bg-white/10"
                                )}
                            >
                                <User size={24} />
                                <span className="font-bold">Linha</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => setFormData({ ...formData, position: 'Goalkeeper' })}
                                className={cn(
                                    "p-4 rounded-xl border flex flex-col items-center gap-2 transition-all",
                                    formData.position === 'Goalkeeper'
                                        ? "bg-yellow-500/20 border-yellow-500 text-yellow-500"
                                        : "bg-white/5 border-white/10 text-gray-400 hover:bg-white/10"
                                )}
                            >
                                <Shield size={24} />
                                <span className="font-bold">Goleiro</span>
                            </button>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <div className="flex justify-between">
                            <label className="text-sm font-medium text-gray-400">Nível Geral</label>
                            <span className="text-primary font-bold">{formData.level}</span>
                        </div>
                        <input
                            type="range"
                            min="1"
                            max="5"
                            step="1"
                            value={formData.level}
                            onChange={(e) => setFormData({ ...formData, level: parseInt(e.target.value) })}
                            className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-primary"
                        />
                        <div className="flex justify-between text-xs text-gray-500 font-mono">
                            <span>Iniciante</span>
                            <span>Pro</span>
                        </div>
                    </div>
                </Card>

                {/* Attributes */}
                <Card className="col-span-1 lg:col-span-2 space-y-6">
                    <h2 className="text-xl font-bold text-white mb-4">Atributos (Radar)</h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {Object.entries(formData.attributes).map(([key, value]) => (
                            <div key={key} className="space-y-2">
                                <div className="flex justify-between">
                                    <label className="text-sm font-medium text-gray-300 capitalize">
                                        {key === 'attack' ? 'Ataque' :
                                            key === 'defense' ? 'Defesa' :
                                                key === 'pace' ? 'Velocidade' :
                                                    key === 'shooting' ? 'Chute' :
                                                        key === 'physical' ? 'Físico' : 'Passe'}
                                    </label>
                                    <span className="text-gray-400 font-mono">{value}</span>
                                </div>
                                <input
                                    type="range"
                                    min="0"
                                    max="100"
                                    value={value}
                                    onChange={(e) => handleAttributeChange(key as keyof typeof formData.attributes, parseInt(e.target.value))}
                                    className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-blue-500"
                                />
                            </div>
                        ))}
                    </div>

                    <div className="pt-6 border-t border-white/10 flex justify-end">
                        <Button type="submit" className="w-full md:w-auto min-w-[200px]">
                            <Save size={20} className="mr-2" />
                            Salvar Alterações
                        </Button>
                    </div>
                </Card>
            </form>
        </div>
    );
};
