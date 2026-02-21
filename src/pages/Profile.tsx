import { useState, useEffect } from 'react';
import { useStore } from '../store/useStore';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Shield, User, Save, TrendingUp, Award, Target, Zap, Trophy } from 'lucide-react';
import { cn } from '../utils/cn';
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Radar,
    RadarChart,
    PolarGrid,
    PolarAngleAxis,
    PolarRadiusAxis
} from 'recharts';

export const Profile = () => {
    const { players, updatePlayer } = useStore();
    // In a real app, we would get the logged-in user's ID from an auth context
    // For this MVP, we'll Mock it by using the first player in the list or a specific one
    const [userId, setUserId] = useState<string | null>(null);

    const [formData, setFormData] = useState({
        name: '',
        position: 'Line' as 'Goalkeeper' | 'Line',
    });

    useEffect(() => {
        if (players.length > 0) {
            // Mock: Select the first player as the "Logged In User" if not set
            const currentUser = players[0];
            setUserId(currentUser.id);
            setFormData({
                name: currentUser.name,
                position: currentUser.position,
            });
        }
    }, [players]);

    const handleSave = (e: React.FormEvent) => {
        e.preventDefault();
        if (userId) {
            updatePlayer(userId, {
                name: formData.name,
                position: formData.position
            });
            alert('Perfil atualizado com sucesso!');
        }
    };

    if (!userId) return <div>Carregando perfil...</div>;

    const player = players.find(p => p.id === userId);
    if (!player) return <div>Usuário não encontrado</div>;

    // Mock Data for Charts
    const performanceData = [
        { match: 'J1', rating: 6.5 },
        { match: 'J2', rating: 7.0 },
        { match: 'J3', rating: 8.5 },
        { match: 'J4', rating: 7.8 },
        { match: 'J5', rating: 9.0 },
    ];

    const radarData = [
        { subject: 'Ataque', A: player.attributes?.attack || 50, fullMark: 100 },
        { subject: 'Defesa', A: player.attributes?.defense || 50, fullMark: 100 },
        { subject: 'Passe', A: player.attributes?.passing || 50, fullMark: 100 },
        { subject: 'Físico', A: player.attributes?.physical || 50, fullMark: 100 },
        { subject: 'Velocid.', A: player.attributes?.pace || 50, fullMark: 100 },
        { subject: 'Chute', A: player.attributes?.shooting || 50, fullMark: 100 },
    ];

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <h1 className="text-3xl font-bold font-header text-primary">Meu Perfil</h1>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Profile Edit Card */}
                <Card className="col-span-1 space-y-6 h-fit bg-gradient-to-br from-surface to-black/40">
                    <div className="flex flex-col items-center mb-6">
                        <div className="w-24 h-24 rounded-full bg-primary/20 flex items-center justify-center text-3xl font-bold text-primary border-4 border-primary/20 mb-4 shadow-lg shadow-primary/10">
                            {player.name.substring(0, 2).toUpperCase()}
                        </div>
                        <h2 className="text-2xl font-bold text-white">{player.name}</h2>
                        <span className="text-gray-400 font-medium">Nível {player.level}</span>
                    </div>

                    <form onSubmit={handleSave} className="space-y-4">
                        <Input
                            label="Seu Nome"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        />

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-400">Posição Preferida</label>
                            <div className="grid grid-cols-2 gap-3">
                                <button
                                    type="button"
                                    onClick={() => setFormData({ ...formData, position: 'Line' })}
                                    className={cn(
                                        "p-3 rounded-xl border flex flex-col items-center gap-2 transition-all",
                                        formData.position === 'Line'
                                            ? "bg-blue-500/20 border-blue-500 text-blue-400 shadow-lg shadow-blue-500/10"
                                            : "bg-white/5 border-white/10 text-gray-400 hover:bg-white/10"
                                    )}
                                >
                                    <User size={20} />
                                    <span className="font-bold text-sm">Linha</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setFormData({ ...formData, position: 'Goalkeeper' })}
                                    className={cn(
                                        "p-3 rounded-xl border flex flex-col items-center gap-2 transition-all",
                                        formData.position === 'Goalkeeper'
                                            ? "bg-yellow-500/20 border-yellow-500 text-yellow-500 shadow-lg shadow-yellow-500/10"
                                            : "bg-white/5 border-white/10 text-gray-400 hover:bg-white/10"
                                    )}
                                >
                                    <Shield size={20} />
                                    <span className="font-bold text-sm">Goleiro</span>
                                </button>
                            </div>
                        </div>

                        <Button type="submit" className="w-full mt-4">
                            <Save size={18} className="mr-2" /> Salvar Perfil
                        </Button>
                    </form>
                </Card>

                {/* Statistics & Charts */}
                <div className="col-span-1 lg:col-span-2 space-y-6">
                    {/* Key Stats Row */}
                    <div className="grid grid-cols-2 gap-4">
                        <Card className="p-4 flex items-center gap-4 bg-gradient-to-br from-green-900/20 to-green-900/5 border-green-500/20">
                            <div className="p-3 bg-green-500/20 rounded-full text-green-500"><Trophy size={24} /></div>
                            <div>
                                <div className="text-2xl font-bold text-white">{player.stats.wins}</div>
                                <div className="text-xs text-green-400 font-bold uppercase">Vitórias</div>
                            </div>
                        </Card>
                        <Card className="p-4 flex items-center gap-4 bg-gradient-to-br from-blue-900/20 to-blue-900/5 border-blue-500/20">
                            <div className="p-3 bg-blue-500/20 rounded-full text-blue-500"><Target size={24} /></div>
                            <div>
                                <div className="text-2xl font-bold text-white">{player.stats.goals}</div>
                                <div className="text-xs text-blue-400 font-bold uppercase">Gols</div>
                            </div>
                        </Card>
                        <Card className="p-4 flex items-center gap-4">
                            <div className="p-3 bg-white/10 rounded-full text-gray-400"><Award size={24} /></div>
                            <div>
                                <div className="text-2xl font-bold text-white">{player.stats.matches_played}</div>
                                <div className="text-xs text-gray-500 font-bold uppercase">Jogos</div>
                            </div>
                        </Card>
                        <Card className="p-4 flex items-center gap-4">
                            <div className="p-3 bg-purple-500/20 rounded-full text-purple-500"><Zap size={24} /></div>
                            <div>
                                <div className="text-2xl font-bold text-white">
                                    {player.stats.matches_played > 0
                                        ? Math.round((player.stats.wins / player.stats.matches_played) * 100)
                                        : 0}%
                                </div>
                                <div className="text-xs text-purple-400 font-bold uppercase">Win Rate</div>
                            </div>
                        </Card>
                    </div>

                    {/* Charts Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Radar Chart - Attributes */}
                        <Card className="min-h-[300px] flex flex-col">
                            <h3 className="text-lg font-bold font-header mb-4 flex items-center gap-2">
                                <Target className="text-primary" size={18} /> Radar de Habilidades
                            </h3>
                            <div className="flex-1 w-full min-h-[250px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
                                        <PolarGrid stroke="#333" />
                                        <PolarAngleAxis dataKey="subject" tick={{ fill: '#999', fontSize: 10 }} />
                                        <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                                        <Radar
                                            name={player.name}
                                            dataKey="A"
                                            stroke="#FFD700"
                                            strokeWidth={2}
                                            fill="#FFD700"
                                            fillOpacity={0.4}
                                        />
                                        <Tooltip
                                            contentStyle={{ backgroundColor: '#1a1a1a', borderColor: '#333', color: '#fff' }}
                                            itemStyle={{ color: '#FFD700' }}
                                        />
                                    </RadarChart>
                                </ResponsiveContainer>
                            </div>
                        </Card>

                        {/* Area Chart - Recent Form (Mock) */}
                        <Card className="min-h-[300px] flex flex-col">
                            <h3 className="text-lg font-bold font-header mb-4 flex items-center gap-2">
                                <TrendingUp className="text-green-500" size={18} /> Performance Recente
                            </h3>
                            <div className="flex-1 w-full min-h-[250px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={performanceData}>
                                        <defs>
                                            <linearGradient id="colorRating" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#10B981" stopOpacity={0.3} />
                                                <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                                        <XAxis dataKey="match" stroke="#666" fontSize={12} tickLine={false} axisLine={false} />
                                        <YAxis stroke="#666" fontSize={12} tickLine={false} axisLine={false} domain={[0, 10]} />
                                        <Tooltip
                                            contentStyle={{ backgroundColor: '#1a1a1a', borderColor: '#333', color: '#fff' }}
                                        />
                                        <Area
                                            type="monotone"
                                            dataKey="rating"
                                            stroke="#10B981"
                                            strokeWidth={3}
                                            fillOpacity={1}
                                            fill="url(#colorRating)"
                                        />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    );
};
