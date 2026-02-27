import { useState, useEffect } from 'react';
import { useAuthStore } from '../store/useAuthStore';
import { supabase } from '../lib/supabase';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Shield, User, Save, TrendingUp, Award, Target, Zap, Trophy, UserX } from 'lucide-react';
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
    PolarRadiusAxis,
} from 'recharts';
import type { Player } from '../types';

// ─── Component ────────────────────────────────────────────────────────────────

export const Profile = () => {
    const { user } = useAuthStore();

    const [player, setPlayer] = useState<Player | null>(null);
    const [loading, setLoading] = useState(true);

    const [formData, setFormData] = useState({
        name: '',
        position: 'Line' as 'Goalkeeper' | 'Line',
    });

    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [fetchError, setFetchError] = useState<string | null>(null);

    // ── Fetch player linked to the logged-in user ─────────────────────────
    const [sessionUserId, setSessionUserId] = useState<string | null>(null);

    const loadPlayer = async () => {
        if (!user) return;
        setLoading(true);
        setFetchError(null);

        // Always verify the actual session user from the JWT — don't rely on store
        const { data: { user: sessionUser } } = await supabase.auth.getUser();
        const userId = sessionUser?.id ?? user.id;
        setSessionUserId(userId);

        const { data, error } = await supabase
            .from('players')
            .select('*')
            .eq('profile_id', userId)
            .limit(1);

        if (error) {
            console.error('Profile fetch error:', error);
            setFetchError(`[${error.code}] ${error.message}`);
            setPlayer(null);
        } else if (data && data.length > 0) {
            setPlayer(data[0] as Player);
            setFormData({ name: data[0].name, position: data[0].position });
        } else {
            setPlayer(null);
        }

        setLoading(false);
    };

    useEffect(() => { loadPlayer(); }, [user?.id]);

    // ── Save profile changes ──────────────────────────────────────────────
    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!player || !user) return;
        setSaving(true);

        await supabase
            .from('players')
            .update({ name: formData.name, position: formData.position })
            .eq('id', player.id);

        await supabase
            .from('profiles')
            .update({ name: formData.name })
            .eq('id', user.id);

        setPlayer(prev => prev ? { ...prev, name: formData.name, position: formData.position } : null);
        setSaving(false);
        setSaved(true);
        setTimeout(() => setSaved(false), 2500);
    };

    // ── Loading state ─────────────────────────────────────────────────────
    if (loading) {
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

    // ── No player linked ──────────────────────────────────────────────────
    if (!player) {
        return (
            <div className="space-y-6 animate-in fade-in duration-500">
                <h1 className="text-3xl font-bold font-header text-primary">Meu Perfil</h1>
                <Card className="py-12 flex flex-col items-center gap-4 text-center border-white/10">
                    <div className="w-16 h-16 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
                        <UserX size={28} className="text-gray-600" />
                    </div>
                    <div className="space-y-1">
                        <p className="font-bold text-white text-base">Nenhum jogador vinculado</p>
                        <p className="text-sm text-gray-500 max-w-sm">
                            Sua conta ainda não está associada a um jogador.
                            Peça ao administrador para cadastrar seu jogador com o e-mail{' '}
                            <strong className="text-gray-400">{user?.email}</strong>.
                        </p>
                    </div>

                    {/* Debug info — helps diagnose the root cause */}
                    <div className="mt-4 w-full max-w-md bg-white/3 border border-white/10 rounded-xl p-4 text-left space-y-2">
                        <p className="text-[10px] uppercase tracking-wider text-gray-600 font-bold">Info de diagnóstico</p>
                        <div className="font-mono text-xs space-y-1">
                            <p><span className="text-gray-500">store user id:   </span><span className="text-gray-300 break-all">{user?.id}</span></p>
                            <p><span className="text-gray-500">session user id: </span><span className={(sessionUserId && user?.id && sessionUserId !== user?.id) ? 'text-red-400' : 'text-green-400'}>{sessionUserId ?? '...'}</span></p>
                            <p><span className="text-gray-500">filtrando por:   </span><span className="text-gray-300">players.profile_id = session_id</span></p>
                            {fetchError
                                ? <p><span className="text-red-500">erro: </span><span className="text-red-400">{fetchError}</span></p>
                                : <p><span className="text-yellow-500">resultado: </span><span className="text-yellow-400">query ok, mas sem linhas correspondentes</span></p>
                            }
                        </div>
                    </div>

                </Card>
            </div>
        );
    }

    // ── Chart data ────────────────────────────────────────────────────────
    const radarData = [
        { subject: 'Ataque', A: player.attributes?.attack ?? 50, fullMark: 100 },
        { subject: 'Defesa', A: player.attributes?.defense ?? 50, fullMark: 100 },
        { subject: 'Passe', A: player.attributes?.passing ?? 50, fullMark: 100 },
        { subject: 'Físico', A: player.attributes?.physical ?? 50, fullMark: 100 },
        { subject: 'Velocid.', A: player.attributes?.pace ?? 50, fullMark: 100 },
        { subject: 'Chute', A: player.attributes?.shooting ?? 50, fullMark: 100 },
    ];

    const performanceData = [
        { match: 'J1', rating: 6.5 },
        { match: 'J2', rating: 7.0 },
        { match: 'J3', rating: 8.5 },
        { match: 'J4', rating: 7.8 },
        { match: 'J5', rating: 9.0 },
    ];

    // ── Render ────────────────────────────────────────────────────────────
    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold font-header text-primary">Meu Perfil</h1>
                <span className="text-xs text-gray-600">{user?.email}</span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* ── Edit Card ────────────────────────────────────────── */}
                <Card className="col-span-1 space-y-6 h-fit bg-gradient-to-br from-surface to-black/40 relative overflow-hidden">
                    {/* Decorative glow based on plan */}
                    {player.plan === 'Legendary' && <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-yellow-600 via-yellow-400 to-yellow-600" />}
                    {player.plan === 'Pro' && <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-600 via-blue-400 to-blue-600" />}

                    <div className="flex flex-col items-center mb-6 pt-4">
                        <div className="relative">
                            <div className={cn(
                                "w-24 h-24 rounded-full flex items-center justify-center text-3xl font-bold mb-4 shadow-lg",
                                player.plan === 'Legendary' ? "bg-yellow-500/20 text-yellow-500 border-4 border-yellow-500/50 shadow-yellow-500/20" :
                                    player.plan === 'Pro' ? "bg-blue-500/20 text-blue-500 border-4 border-blue-500/50 shadow-blue-500/20" :
                                        "bg-primary/20 text-primary border-4 border-primary/20 shadow-primary/10"
                            )}>
                                {player.name.substring(0, 2).toUpperCase()}
                            </div>

                            {/* Plan Badge */}
                            {player.plan === 'Legendary' && (
                                <div className="absolute -bottom-2 -right-2 bg-yellow-500 text-black text-[10px] font-black uppercase px-2 py-1 rounded-full flex items-center gap-1 border-2 border-surface shadow-xl">
                                    <Shield size={10} /> Lendário
                                </div>
                            )}
                            {player.plan === 'Pro' && (
                                <div className="absolute -bottom-2 -right-2 bg-blue-500 text-white text-[10px] font-black uppercase px-2 py-1 rounded-full border-2 border-surface shadow-xl">
                                    ⭐ PRO
                                </div>
                            )}
                        </div>

                        <h2 className="text-2xl font-bold text-white mt-2">{player.name}</h2>
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
                            {saved
                                ? <span className="text-green-300">✓ Salvo!</span>
                                : <><Save size={18} className="mr-2" />{saving ? 'Salvando...' : 'Salvar Perfil'}</>
                            }
                        </Button>
                    </form>
                </Card>

                {/* ── Stats & Charts ────────────────────────────────────── */}
                <div className="col-span-1 lg:col-span-2 space-y-6">
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

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Radar */}
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

                        {/* Area chart */}
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
        </div>
    );
};
