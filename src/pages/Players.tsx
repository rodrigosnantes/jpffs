import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { useAuthStore } from '../store/useAuthStore';
import { supabase } from '../lib/supabase';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Plus, Trash2, Edit2, Shield, User, Lock, Mail, KeyRound, AlertCircle, CheckCircle, Search } from 'lucide-react';
import { Modal } from '../components/ui/Modal';
import { Input } from '../components/ui/Input';
import type { Position, PlayerPlan } from '../types';
import { cn } from '../utils/cn';

// ─── Default player form ──────────────────────────────────────────────────────

const defaultForm = () => ({
    name: '',
    email: '',
    password: '',
    nickname: '',
    birth_date: '',
    phone: '',
    age: '',
    favorite_team: '',
    status: 'active',
    position: 'Line' as Position,
    level: 3,
    plan: 'Amateur' as PlayerPlan,
});

// ─── Component ────────────────────────────────────────────────────────────────

export const Players = () => {
    const navigate = useNavigate();
    const { players, fetchPlayers, deletePlayer } = useStore();
    const { isAdmin } = useAuthStore();

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [form, setForm] = useState(defaultForm());
    const [submitting, setSubmitting] = useState(false);
    const [feedback, setFeedback] = useState<{ type: 'error' | 'success'; msg: string } | null>(null);

    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const playersPerPage = 10;

    // Reset page on search change
    React.useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm]);

    // ── Pagination and Search filtering ────────────────────────────────────
    const filteredPlayers = React.useMemo(() => {
        if (!searchTerm) return players;
        const term = searchTerm.toLowerCase();
        return players.filter(p => p.name.toLowerCase().includes(term));
    }, [players, searchTerm]);

    const totalPages = Math.ceil(filteredPlayers.length / playersPerPage);
    const currentPlayers = filteredPlayers.slice(
        (currentPage - 1) * playersPerPage,
        currentPage * playersPerPage
    );

    // ── Create player (3 steps) ────────────────────────────────────────────
    const handleCreatePlayer = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.name || !form.email || !form.password) return;
        setSubmitting(true);
        setFeedback(null);

        try {
            // ── Step 1: Save admin session ─────────────────────────────────
            const { data: { session: adminSession } } = await supabase.auth.getSession();

            // ── Step 2: Create auth user ───────────────────────────────────
            const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
                email: form.email,
                password: form.password,
                options: { data: { name: form.name } },
            });

            if (signUpError) throw new Error(signUpError.message);

            const newUserId = signUpData.user?.id;
            if (!newUserId) throw new Error('Não foi possível obter o ID do novo usuário.');

            // ── Step 3: Restore admin session (if signUp created a new one) ──
            const { data: { session: currentSession } } = await supabase.auth.getSession();
            if (currentSession?.user?.id !== adminSession?.user?.id && adminSession) {
                await supabase.auth.setSession({
                    access_token: adminSession.access_token,
                    refresh_token: adminSession.refresh_token!,
                });
            }

            // ── Step 4: Upsert profile (trigger may have created it) ───────
            await supabase.from('profiles').upsert({
                id: newUserId,
                email: form.email,
                name: form.name,
                nickname: form.nickname,
                birth_date: form.birth_date || null,
                phone: form.phone,
                age: form.age ? parseInt(form.age.toString()) : null,
                favorite_team: form.favorite_team,
                status: form.status,
                role: 'user',
            });

            // ── Step 5: Update the automatically created player ────────────────
            // A Supabase trigger automatically creates the profile & player on auth.users insert.
            // Wait briefly for the trigger to finish processing
            await new Promise(resolve => setTimeout(resolve, 1000));

            const { error: playerError } = await supabase.from('players').update({
                name: form.name,
                position: form.position,
                level: form.level,
                plan: form.plan,
                // Stats and Attributes are defaulted by the trigger.
            }).eq('profile_id', newUserId);

            if (playerError) throw new Error(playerError.message);

            // ── Done ───────────────────────────────────────────────────────
            setFeedback({ type: 'success', msg: `Jogador "${form.name}" criado com acesso em ${form.email}!` });
            setForm(defaultForm());
            fetchPlayers();

        } catch (err: any) {
            setFeedback({ type: 'error', msg: err.message ?? 'Erro inesperado.' });
        } finally {
            setSubmitting(false);
            handleClose();
        }
    };

    const handleClose = () => {
        setIsModalOpen(false);
        setFeedback(null);
        setForm(defaultForm());
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <h1 className="text-3xl font-bold font-header text-primary">Jogadores</h1>
                    <span className="text-xs text-gray-600 bg-white/5 px-2 py-1 rounded-full whitespace-nowrap hidden sm:inline-block">
                        {filteredPlayers.length} total
                    </span>
                </div>

                <div className="flex flex-col sm:flex-row flex-wrap items-center gap-3 w-full sm:w-auto">
                    {/* Search Field */}
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

                    {isAdmin ? (
                        <Button onClick={() => setIsModalOpen(true)} className="w-full sm:w-auto shrink-0">
                            <Plus size={20} />
                            Novo Jogador
                        </Button>
                    ) : (
                        <span className="flex items-center justify-center gap-1.5 text-xs text-gray-500 border border-white/10 px-3 py-2 rounded-lg w-full sm:w-auto shrink-0">
                            <Lock size={12} /> Somente leitura
                        </span>
                    )}
                </div>
            </div>

            <Card className="overflow-hidden p-0 w-full max-w-full">
                <div className="overflow-x-auto w-full">
                    <table className="w-full text-left min-w-[700px] whitespace-nowrap">
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
                            {currentPlayers.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="p-8 text-center text-gray-500 text-sm">
                                        Nenhum jogador encontrado.
                                    </td>
                                </tr>
                            ) : currentPlayers.map((player) => (
                                <tr key={player.id} className="hover:bg-white/5 transition-colors">
                                    <td className="p-4 font-medium">
                                        <div className="flex items-center gap-3 group/name">
                                            <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-xs font-bold text-primary transition-colors">
                                                {player.name.substring(0, 2).toUpperCase()}
                                            </div>
                                            <div className="flex flex-col">
                                                <span>{player.name}</span>
                                                {player.plan === 'Legendary' && <span className="text-[10px] text-yellow-500 font-bold uppercase flex items-center gap-1"><Shield size={10} /> Lendário</span>}
                                                {player.plan === 'Pro' && <span className="text-[10px] text-blue-400 font-bold uppercase">PRO</span>}
                                                {(!player.plan || player.plan === 'Amateur') && <span className="text-[10px] text-gray-500 uppercase">Amador</span>}
                                            </div>
                                        </div>
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
                                                <div key={i} className={`w-1.5 h-4 rounded-sm ${i < player.level ? 'bg-primary' : 'bg-white/10'}`} />
                                            ))}
                                        </div>
                                    </td>
                                    <td className="p-4 text-center text-gray-400">
                                        {player.stats.matches_played}
                                    </td>
                                    <td className="p-4 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <button
                                                onClick={() => navigate(`/jogadores/${player.id}`)}
                                                className="p-2 hover:bg-white/10 rounded text-gray-400 hover:text-white transition-colors"
                                                title="Visualizar Perfil"
                                            >
                                                <User size={18} />
                                            </button>
                                            {isAdmin && (
                                                <>
                                                    <button
                                                        onClick={() => navigate(`/players/${player.id}`)}
                                                        className="p-2 hover:bg-white/10 rounded text-gray-400 hover:text-white transition-colors"
                                                        title="Editar"
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
                                                        title="Excluir"
                                                    >
                                                        <Trash2 size={18} />
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Pagination Controls */}
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

            {/* ── Create Player Modal ─────────────────────────────────────── */}
            <Modal isOpen={isModalOpen} onClose={handleClose} title="Novo Jogador" className="max-w-2xl">
                <form onSubmit={handleCreatePlayer} className="space-y-5">

                    {/* ── Player info ─────────────────────────────── */}
                    <div className="space-y-1">
                        <p className="text-[10px] uppercase tracking-wider text-gray-500 font-bold">Dados do jogador</p>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                        <Input
                            label="Nome"
                            placeholder="Ex: Rodrigo Nantes"
                            autoFocus
                            required
                            value={form.name}
                            onChange={(e) => setForm({ ...form, name: e.target.value })}
                        />

                        <Input
                            label="Apelido"
                            placeholder="Ex: Digão"
                            value={form.nickname}
                            onChange={(e) => setForm({ ...form, nickname: e.target.value })}
                        />

                        <Input
                            label="Data de Nascimento"
                            type="date"
                            value={form.birth_date}
                            onChange={(e) => setForm({ ...form, birth_date: e.target.value })}
                        />
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                        <Input
                            label="Idade"
                            type="number"
                            placeholder="Ex: 30"
                            value={form.age}
                            onChange={(e) => setForm({ ...form, age: e.target.value })}
                        />
                        <Input
                            label="Telefone"
                            type="tel"
                            placeholder="(11) 99999-9999"
                            value={form.phone}
                            onChange={(e) => setForm({ ...form, phone: e.target.value })}
                        />
                        <Input
                            label="Time do Coração"
                            placeholder="Ex: São Paulo"
                            value={form.favorite_team}
                            onChange={(e) => setForm({ ...form, favorite_team: e.target.value })}
                        />
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-sm font-medium text-gray-400">Situação do Jogador</label>
                        <div className="flex items-center gap-4 mt-2">
                            <label className="flex items-center gap-2 cursor-pointer text-sm text-gray-300 hover:text-white transition-colors">
                                <input
                                    type="radio"
                                    name="status"
                                    value="active"
                                    checked={form.status === 'active'}
                                    onChange={(e) => setForm({ ...form, status: e.target.value })}
                                    className="accent-primary w-4 h-4 cursor-pointer"
                                />
                                Ativo
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer text-sm text-gray-300 hover:text-white transition-colors">
                                <input
                                    type="radio"
                                    name="status"
                                    value="inactive"
                                    checked={form.status === 'inactive'}
                                    onChange={(e) => setForm({ ...form, status: e.target.value })}
                                    className="accent-primary w-4 h-4 cursor-pointer"
                                />
                                Inativo
                            </label>
                        </div>
                    </div>

                    {/* Position */}
                    <div className="space-y-1.5">
                        <label className="text-sm font-medium text-gray-400">Posição</label>
                        <div className="grid grid-cols-2 gap-2">
                            {(['Line', 'Goalkeeper'] as Position[]).map(pos => (
                                <button
                                    key={pos}
                                    type="button"
                                    onClick={() => setForm({ ...form, position: pos })}
                                    className={cn(
                                        'p-2.5 rounded-lg border text-sm font-medium transition-colors flex items-center justify-center gap-2',
                                        form.position === pos
                                            ? pos === 'Line'
                                                ? 'bg-blue-500/20 border-blue-500 text-blue-400'
                                                : 'bg-yellow-500/20 border-yellow-500 text-yellow-400'
                                            : 'bg-surface border-white/10 text-gray-400 hover:border-white/20'
                                    )}
                                >
                                    {pos === 'Line' ? <User size={14} /> : <Shield size={14} />}
                                    {pos === 'Line' ? 'Linha' : 'Goleiro'}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Level */}
                    <div className="space-y-1.5">
                        <label className="text-sm font-medium text-gray-400">Nível — {form.level}/5</label>
                        <input
                            type="range" min="1" max="5" step="1"
                            value={form.level}
                            onChange={(e) => setForm({ ...form, level: parseInt(e.target.value) })}
                            className="w-full accent-primary h-2 bg-white/10 rounded-lg appearance-none cursor-pointer"
                        />
                        <div className="flex justify-between text-xs text-gray-600">
                            <span>Iniciante</span><span>Amador</span><span>Intermed.</span><span>Avançado</span><span>Pro</span>
                        </div>
                    </div>

                    {/* Plan */}
                    <div className="space-y-1.5">
                        <label className="text-sm font-medium text-gray-400">Plano de Sócio</label>
                        <div className="grid grid-cols-3 gap-2">
                            {(['Legendary', 'Pro', 'Amateur'] as const).map(plan => (
                                <button
                                    key={plan}
                                    type="button"
                                    onClick={() => setForm({ ...form, plan })}
                                    className={cn(
                                        'p-2 rounded-lg border text-xs font-bold transition-colors uppercase tracking-wide',
                                        form.plan === plan
                                            ? plan === 'Legendary'
                                                ? 'bg-yellow-500/20 border-yellow-500 text-yellow-400'
                                                : plan === 'Pro'
                                                    ? 'bg-blue-500/20 border-blue-500 text-blue-400'
                                                    : 'bg-gray-500/20 border-gray-500 text-gray-300'
                                            : 'bg-surface border-white/10 text-gray-500 hover:border-white/20'
                                    )}
                                >
                                    {plan === 'Legendary' ? 'Lendário' : plan === 'Amateur' ? 'Amador' : plan}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* ── Divider ────────────────────────────────────*/}
                    <div className="border-t border-white/5 pt-1">
                        <p className="text-[10px] uppercase tracking-wider text-gray-500 font-bold mb-4">Acesso ao sistema</p>

                        <div className="flex items-center gap-4">
                            <div className='w-1/2'>
                                <label className="text-sm font-medium text-gray-400 flex items-center gap-1.5">
                                    <Mail size={12} /> E-mail *
                                </label>
                                <input
                                    type="email" required
                                    value={form.email}
                                    onChange={e => setForm({ ...form, email: e.target.value })}
                                    placeholder="jogador@email.com"
                                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-primary/50"
                                />
                            </div>

                            <div className='w-1/2'>
                                <label className="text-sm font-medium text-gray-400 flex items-center gap-1.5">
                                    <KeyRound size={12} /> Senha temporária *
                                </label>
                                <input
                                    type="password" required minLength={6}
                                    value={form.password}
                                    onChange={e => setForm({ ...form, password: e.target.value })}
                                    placeholder="Mínimo 6 caracteres"
                                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-primary/50"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Feedback */}
                    {feedback && (
                        <div className={cn(
                            'flex items-start gap-2 p-3 rounded-lg text-sm',
                            feedback.type === 'success'
                                ? 'bg-green-500/10 border border-green-500/20 text-green-400'
                                : 'bg-red-500/10 border border-red-500/20 text-red-400'
                        )}>
                            {feedback.type === 'success'
                                ? <CheckCircle size={15} className="shrink-0 mt-0.5" />
                                : <AlertCircle size={15} className="shrink-0 mt-0.5" />
                            }
                            {feedback.msg}
                        </div>
                    )}

                    <div className="pt-2 flex gap-3">
                        <Button type="button" variant="ghost" onClick={handleClose} className="flex-1">
                            Cancelar
                        </Button>
                        <Button type="submit" disabled={submitting} className="flex-1">
                            {submitting ? 'Criando...' : 'Criar Jogador'}
                        </Button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};
