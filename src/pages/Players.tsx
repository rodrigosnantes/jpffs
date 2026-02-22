import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { useAuthStore } from '../store/useAuthStore';
import { supabase } from '../lib/supabase';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Plus, Trash2, Edit2, Shield, User, Lock, Mail, KeyRound, AlertCircle, CheckCircle } from 'lucide-react';
import { Modal } from '../components/ui/Modal';
import { Input } from '../components/ui/Input';
import type { Position } from '../types';
import { cn } from '../utils/cn';

// ─── Default player form ──────────────────────────────────────────────────────

const defaultForm = () => ({
    name: '',
    email: '',
    password: '',
    position: 'Line' as Position,
    level: 3,
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
                role: 'user',
            });

            // ── Step 5: Insert player linked to user_id ────────────────────
            const { error: playerError } = await supabase.from('players').insert([{
                name: form.name,
                position: form.position,
                level: form.level,
                profile_id: newUserId,
                stats: {
                    goals: 0, assists: 0, wins: 0, draws: 0, losses: 0,
                    matches_played: 0, yellow_cards: 0, red_cards: 0,
                },
                attributes: {
                    attack: 50, defense: 50, pace: 50,
                    shooting: 50, passing: 50, physical: 50,
                },
            }]);

            if (playerError) throw new Error(playerError.message);

            // ── Done ───────────────────────────────────────────────────────
            setFeedback({ type: 'success', msg: `Jogador "${form.name}" criado com acesso em ${form.email}!` });
            setForm(defaultForm());
            fetchPlayers();

        } catch (err: any) {
            setFeedback({ type: 'error', msg: err.message ?? 'Erro inesperado.' });
        } finally {
            setSubmitting(false);
        }
    };

    const handleClose = () => {
        setIsModalOpen(false);
        setFeedback(null);
        setForm(defaultForm());
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold font-header text-primary">Jogadores</h1>
                {isAdmin ? (
                    <Button onClick={() => setIsModalOpen(true)}>
                        <Plus size={20} />
                        Novo Jogador
                    </Button>
                ) : (
                    <span className="flex items-center gap-1.5 text-xs text-gray-500 border border-white/10 px-3 py-1.5 rounded-lg">
                        <Lock size={12} /> Somente leitura
                    </span>
                )}
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
                                {isAdmin && <th className="p-4 font-medium text-right">Ações</th>}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {players.map((player) => (
                                <tr key={player.id} className="hover:bg-white/5 transition-colors">
                                    <td className="p-4 font-medium">
                                        <Link to={`/jogadores/${player.id}`} className="flex items-center gap-3 hover:text-white transition-colors group/name">
                                            <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-xs font-bold text-primary group-hover/name:bg-primary group-hover/name:text-background transition-colors">
                                                {player.name.substring(0, 2).toUpperCase()}
                                            </div>
                                            {player.name}
                                        </Link>
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
                                    {isAdmin && (
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
                                    )}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </Card>

            {/* ── Create Player Modal ─────────────────────────────────────── */}
            <Modal isOpen={isModalOpen} onClose={handleClose} title="Novo Jogador">
                <form onSubmit={handleCreatePlayer} className="space-y-5">

                    {/* ── Player info ─────────────────────────────── */}
                    <div className="space-y-1">
                        <p className="text-[10px] uppercase tracking-wider text-gray-500 font-bold">Dados do jogador</p>
                    </div>

                    <Input
                        label="Nome"
                        placeholder="Ex: Rodrigo Nantes"
                        autoFocus
                        required
                        value={form.name}
                        onChange={(e) => setForm({ ...form, name: e.target.value })}
                    />

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

                    {/* ── Divider ────────────────────────────────────*/}
                    <div className="border-t border-white/5 pt-1">
                        <p className="text-[10px] uppercase tracking-wider text-gray-500 font-bold mb-4">Acesso ao sistema</p>

                        <div className="space-y-3">
                            <div className="space-y-1.5">
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

                            <div className="space-y-1.5">
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
