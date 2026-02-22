import { useState, useEffect } from 'react';
import { useStore } from '../store/useStore';
import { useAuthStore } from '../store/useAuthStore';
import { supabase } from '../lib/supabase';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Shield, User, Save, TrendingUp, Award, Target, Zap, Trophy, Link2 } from 'lucide-react';
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

// ─── Constants ────────────────────────────────────────────────────────────────

const LINKED_PLAYER_KEY = 'jpffs-linked-player';

// ─── Component ────────────────────────────────────────────────────────────────

export const Profile = () => {
    const { players, updatePlayer } = useStore();
    const { user } = useAuthStore();

    // Profile data fetched from Supabase `profiles` table
    const [profileName, setProfileName] = useState<string>('');
    const [profileLoading, setProfileLoading] = useState(true);

    // The player linked to this auth account
    const [linkedPlayerId, setLinkedPlayerId] = useState<string | null>(null);
    const [showPlayerPicker, setShowPlayerPicker] = useState(false);

    const [formData, setFormData] = useState({
        name: '',
        position: 'Line' as 'Goalkeeper' | 'Line',
    });

    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);

    // ── 1. Load auth profile from Supabase ────────────────────────────────
    useEffect(() => {
        if (!user) return;

        const init = async () => {
            setProfileLoading(true);

            // Fetch profile row
            const { data: profile } = await supabase
                .from('profiles')
                .select('name, email')
                .eq('id', user.id)
                .maybeSingle();

            const name = profile?.name ?? user.email?.split('@')[0] ?? '';
            setProfileName(name);

            // Try to find linked player from localStorage first (persisted choice)
            const savedId = localStorage.getItem(LINKED_PLAYER_KEY);
            if (savedId && players.find(p => p.id === savedId)) {
                setLinkedPlayerId(savedId);
                const p = players.find(pl => pl.id === savedId)!;
                setFormData({ name: p.name, position: p.position });
            } else {
                // Auto-match by name (case-insensitive)
                const match = players.find(
                    p => p.name.trim().toLowerCase() === name.trim().toLowerCase()
                );
                if (match) {
                    setLinkedPlayerId(match.id);
                    setFormData({ name: match.name, position: match.position });
                }
            }

            setProfileLoading(false);
        };

        if (players.length > 0) init();
    }, [user, players]);

    // ── 2. Save changes ────────────────────────────────────────────────────
    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!linkedPlayerId || !user) return;
        setSaving(true);

        // Update player record
        await updatePlayer(linkedPlayerId, {
            name: formData.name,
            position: formData.position,
        });

        // Also update the profile name
        await supabase
            .from('profiles')
            .update({ name: formData.name })
            .eq('id', user.id);

        setSaving(false);
        setSaved(true);
        setTimeout(() => setSaved(false), 2500);
    };

    // ── 3. Player picker ───────────────────────────────────────────────────
    const handleSelectPlayer = (playerId: string) => {
        const p = players.find(pl => pl.id === playerId);
        if (!p) return;
        setLinkedPlayerId(playerId);
        setFormData({ name: p.name, position: p.position });
        localStorage.setItem(LINKED_PLAYER_KEY, playerId);
        setShowPlayerPicker(false);
    };

    // ── Render ─────────────────────────────────────────────────────────────
    if (profileLoading) {
        return (
            <div className="space-y-4 animate-pulse">
                <div className="h-8 w-48 bg-white/5 rounded-lg" />
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="h-80 bg-white/5 rounded-xl" />
                    <div className="lg:col-span-2 h-80 bg-white/5 rounded-xl" />
                </div>
            </div>
        );
    }

    const player = linkedPlayerId ? players.find(p => p.id === linkedPlayerId) : null;

    const radarData = player ? [
        { subject: 'Ataque', A: player.attributes?.attack || 50, fullMark: 100 },
        { subject: 'Defesa', A: player.attributes?.defense || 50, fullMark: 100 },
        { subject: 'Passe', A: player.attributes?.passing || 50, fullMark: 100 },
        { subject: 'Físico', A: player.attributes?.physical || 50, fullMark: 100 },
        { subject: 'Velocid.', A: player.attributes?.pace || 50, fullMark: 100 },
        { subject: 'Chute', A: player.attributes?.shooting || 50, fullMark: 100 },
    ] : [];

    const performanceData = [
        { match: 'J1', rating: 6.5 },
        { match: 'J2', rating: 7.0 },
        { match: 'J3', rating: 8.5 },
        { match: 'J4', rating: 7.8 },
        { match: 'J5', rating: 9.0 },
    ];

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold font-header text-primary">Meu Perfil</h1>
                <span className="text-xs text-gray-600">{user?.email}</span>
            </div>

            {/* No player linked — show picker */}
            {!player && (
                <Card className="border-yellow-500/20 bg-yellow-500/5">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                        <div className="p-3 bg-yellow-500/10 rounded-full">
                            <Link2 size={20} className="text-yellow-400" />
                        </div>
                        <div className="flex-1">
                            <p className="font-bold text-white text-sm">Nenhum jogador vinculado</p>
                            <p className="text-xs text-gray-500 mt-0.5">
                                Nenhum jogador com o nome <strong className="text-white">"{profileName}"</strong> foi encontrado.
                                Selecione qual jogador da lista é você.
                            </p>
                        </div>
                        <Button variant="ghost" onClick={() => setShowPlayerPicker(v => !v)} className="text-yellow-400 border-yellow-500/30 hover:bg-yellow-500/10 text-sm shrink-0">
                            Vincular jogador
                        </Button>
                    </div>

                    {showPlayerPicker && (
                        <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-2">
                            {players.map(p => (
                                <button
                                    key={p.id}
                                    onClick={() => handleSelectPlayer(p.id)}
                                    className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 border border-white/10 hover:border-primary/40 hover:bg-primary/5 text-sm text-gray-300 hover:text-white transition-all text-left"
                                >
                                    <div className="w-7 h-7 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-[10px] font-black text-primary shrink-0">
                                        {p.name.substring(0, 2).toUpperCase()}
                                    </div>
                                    <span className="truncate">{p.name}</span>
                                </button>
                            ))}
                        </div>
                    )}
                </Card>
            )}

            {/* Change linked player */}
            {player && (
                <div className="flex justify-end">
                    <button
                        onClick={() => setShowPlayerPicker(v => !v)}
                        className="text-xs text-gray-600 hover:text-gray-400 flex items-center gap-1 transition-colors"
                    >
                        <Link2 size={11} /> Trocar jogador vinculado
                    </button>
                    {showPlayerPicker && (
                        <div className="absolute right-6 mt-6 z-50 bg-surface border border-white/10 rounded-xl shadow-xl p-3 w-60">
                            <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-2">Selecionar jogador</p>
                            <div className="space-y-1 max-h-48 overflow-y-auto">
                                {players.map(p => (
                                    <button
                                        key={p.id}
                                        onClick={() => handleSelectPlayer(p.id)}
                                        className={cn(
                                            'w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all text-left',
                                            p.id === linkedPlayerId
                                                ? 'bg-primary/10 text-primary'
                                                : 'hover:bg-white/5 text-gray-400 hover:text-white'
                                        )}
                                    >
                                        <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center text-[9px] font-black shrink-0">
                                            {p.name.substring(0, 2).toUpperCase()}
                                        </div>
                                        {p.name}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {player && (
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

                            <Button type="submit" disabled={saving} className="w-full mt-4">
                                {saved ? (
                                    <span className="text-green-300">✓ Salvo!</span>
                                ) : (
                                    <><Save size={18} className="mr-2" /> {saving ? 'Salvando...' : 'Salvar Perfil'}</>
                                )}
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
                            {/* Radar Chart */}
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
                                                stroke="var(--color-primary)"
                                                strokeWidth={2}
                                                fill="var(--color-primary)"
                                                fillOpacity={0.4}
                                            />
                                            <Tooltip
                                                contentStyle={{ backgroundColor: '#1a1a1a', borderColor: '#333', color: '#fff' }}
                                                itemStyle={{ color: 'var(--color-primary)' }}
                                            />
                                        </RadarChart>
                                    </ResponsiveContainer>
                                </div>
                            </Card>

                            {/* Area Chart */}
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
                                            <Tooltip contentStyle={{ backgroundColor: '#1a1a1a', borderColor: '#333', color: '#fff' }} />
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
            )}
        </div>
    );
};
