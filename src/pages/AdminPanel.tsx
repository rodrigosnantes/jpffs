import { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/useAuthStore';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Shield, UserPlus, Users, Mail, Lock, CheckCircle, AlertCircle, Trash2, Crown, Search, Edit2, Save, X } from 'lucide-react';
import type { PlayerPlan } from '../types';
import { cn } from '../utils/cn';

// ─── Types ────────────────────────────────────────────────────────────────────

interface AdminUser {
    id: string;
    email: string;
    name: string | null;
    role: string;
    created_at: string;
}

// ─── Component ────────────────────────────────────────────────────────────────

export const AdminPanel = () => {
    const { isAdmin, user } = useAuthStore();

    // Guard: redirect non-admins
    if (!isAdmin) return <Navigate to="/" replace />;

    const [users, setUsers] = useState<AdminUser[]>([]);
    const [loadingUsers, setLoadingUsers] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const [searchTerm, setSearchTerm] = useState('');
    const usersPerPage = 10;

    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm]);

    const [form, setForm] = useState({
        email: '',
        password: '',
        name: '',
        role: 'user' as 'admin' | 'user',
        plan: 'Amateur' as PlayerPlan,
    });
    const [submitting, setSubmitting] = useState(false);
    const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

    // Edit user state
    const [editingUserId, setEditingUserId] = useState<string | null>(null);
    const [editForm, setEditForm] = useState({
        email: '',
        role: 'user' as 'admin' | 'user'
    });
    const [updatingUser, setUpdatingUser] = useState(false);

    // ── Load existing users from profiles ─────────────────────────────────
    const loadUsers = async () => {
        setLoadingUsers(true);
        const { data } = await supabase
            .from('profiles')
            .select('id, email, name, role, created_at')
            .order('created_at', { ascending: false });
        setUsers((data ?? []) as AdminUser[]);
        setLoadingUsers(false);
    };

    useEffect(() => { loadUsers(); }, []);

    // ── Create user ───────────────────────────────────────────────────────
    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.email || !form.password) return;
        setSubmitting(true);
        setFeedback(null);

        try {
            // Save current admin session before signUp potentially replaces it
            const { data: { session: adminSession } } = await supabase.auth.getSession();

            // Create the new user via signUp
            const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
                email: form.email,
                password: form.password,
                options: {
                    data: { name: form.name || form.email.split('@')[0], plan: form.plan },
                },
            });

            if (signUpError) {
                setFeedback({ type: 'error', msg: signUpError.message });
                setSubmitting(false);
                return;
            }

            const newUserId = signUpData.user?.id;

            // Restore admin session if it changed (email confirmation disabled case)
            const { data: { session: currentSession } } = await supabase.auth.getSession();
            if (currentSession?.user?.id !== adminSession?.user?.id && adminSession?.access_token) {
                await supabase.auth.setSession({
                    access_token: adminSession.access_token,
                    refresh_token: adminSession.refresh_token!,
                });
            }

            // Set role in profiles (upsert in case trigger already created the row)
            if (newUserId) {
                await supabase.from('profiles').upsert({
                    id: newUserId,
                    email: form.email,
                    name: form.name || form.email.split('@')[0],
                    role: form.role,
                });
            }

            setFeedback({
                type: 'success',
                msg: `Usuário "${form.email}" criado como ${form.role === 'admin' ? 'Administrador' : 'Membro'}!`,
            });
            setForm({ email: '', password: '', name: '', role: 'user', plan: 'Amateur' });
            loadUsers();

        } catch (err: any) {
            setFeedback({ type: 'error', msg: err.message ?? 'Erro inesperado.' });
        } finally {
            setSubmitting(false);
        }
    };

    // ── Change role ───────────────────────────────────────────────────────
    const handleChangeRole = async (userId: string, newRole: 'admin' | 'user') => {
        if (userId === user?.id) {
            alert('Você não pode alterar sua própria role.');
            return;
        }
        await supabase.from('profiles').update({ role: newRole }).eq('id', userId);
        loadUsers();
    };

    // ── Delete user (profile only) ────────────────────────────────────────
    const handleDelete = async (userId: string, email: string) => {
        if (userId === user?.id) { alert('Você não pode excluir sua própria conta.'); return; }
        if (!confirm(`Excluir o usuário "${email}"? Esta ação remove apenas o perfil — para remover o acesso ao auth, faça pelo Supabase Dashboard.`)) return;
        await supabase.from('profiles').delete().eq('id', userId);
        loadUsers();
    };

    // ── Edit user ─────────────────────────────────────────────────────────
    const handleEditClick = (u: AdminUser) => {
        setEditingUserId(u.id);
        setEditForm({ email: u.email, role: u.role as 'admin' | 'user' });
    };

    const handleCancelEdit = () => {
        setEditingUserId(null);
    };

    const handleUpdateUser = async (userId: string) => {
        if (!editForm.email) return;
        setUpdatingUser(true);

        try {
            // Se tiver que alterar o e-mail (Nota: alterar o email na auth só é possível via admin sdk no backend.
            // Aqui estamos apenas atualizando no perfil do app (profiles table), o que mudará sua representação mas
            // pode causar inconsistência de login se o admin não mudar no dashboard também, 
            // Porém o usuário pediu para "editar o email ou auth".
            const updates: { email?: string, role?: string } = {};
            const originalUser = users.find(u => u.id === userId);

            if (editForm.email !== originalUser?.email) {
                updates.email = editForm.email;
            }
            if (editForm.role !== originalUser?.role) {
                updates.role = editForm.role;
            }

            if (Object.keys(updates).length > 0) {
                const { error } = await supabase.from('profiles').update(updates).eq('id', userId);
                if (error) throw error;
            }

            setEditingUserId(null);
            loadUsers();
        } catch (err: any) {
            alert(err.message ?? 'Erro ao atualizar usuário');
        } finally {
            setUpdatingUser(false);
        }
    };

    // ── Pagination & Search Logic ─────────────────────────────────────────
    const filteredUsers = users.filter((u) => {
        const term = searchTerm.toLowerCase();
        const nameMatch = u.name?.toLowerCase().includes(term);
        const emailMatch = u.email.toLowerCase().includes(term);
        return nameMatch || emailMatch;
    });

    const indexOfLastUser = currentPage * usersPerPage;
    const indexOfFirstUser = indexOfLastUser - usersPerPage;
    const currentUsers = filteredUsers.slice(indexOfFirstUser, indexOfLastUser);
    const totalPages = Math.ceil(filteredUsers.length / usersPerPage);

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                    <Shield size={20} className="text-primary" />
                </div>
                <div>
                    <h1 className="text-3xl font-bold font-header text-primary">Painel Admin</h1>
                    <p className="text-sm text-gray-500">Gerenciar usuários e permissões</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                {/* ── Create User Form ──────────────────────────────────── */}
                <Card className="lg:col-span-2 h-fit space-y-5">
                    <div className="flex items-center gap-2">
                        <UserPlus size={18} className="text-primary" />
                        <h2 className="font-bold text-white text-base">Criar Novo Usuário</h2>
                    </div>

                    <form onSubmit={handleCreate} className="space-y-4">
                        {/* Name */}
                        <div className="space-y-1.5">
                            <label className="text-xs text-gray-500 uppercase tracking-wider">Nome</label>
                            <input
                                type="text"
                                value={form.name}
                                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                                placeholder="Nome do usuário"
                                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-primary/50"
                            />
                        </div>

                        {/* Email */}
                        <div className="space-y-1.5">
                            <label className="text-xs text-gray-500 uppercase tracking-wider flex items-center gap-1">
                                <Mail size={11} /> E-mail *
                            </label>
                            <input
                                type="email"
                                required
                                value={form.email}
                                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                                placeholder="usuario@email.com"
                                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-primary/50"
                            />
                        </div>

                        {/* Password */}
                        <div className="space-y-1.5">
                            <label className="text-xs text-gray-500 uppercase tracking-wider flex items-center gap-1">
                                <Lock size={11} /> Senha *
                            </label>
                            <input
                                type="password"
                                required
                                value={form.password}
                                onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                                placeholder="Mínimo 6 caracteres"
                                minLength={6}
                                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-primary/50"
                            />
                        </div>

                        {/* Role */}
                        <div className="space-y-1.5">
                            <label className="text-xs text-gray-500 uppercase tracking-wider">Perfil</label>
                            <div className="grid grid-cols-2 gap-2">
                                <button
                                    type="button"
                                    onClick={() => setForm(f => ({ ...f, role: 'user' }))}
                                    className={cn(
                                        'p-3 rounded-xl border flex flex-col items-center gap-1.5 text-xs font-bold transition-all',
                                        form.role === 'user'
                                            ? 'bg-blue-500/15 border-blue-500/40 text-blue-400'
                                            : 'bg-white/3 border-white/10 text-gray-500 hover:border-white/20'
                                    )}
                                >
                                    <Users size={18} />
                                    Membro
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setForm(f => ({ ...f, role: 'admin' }))}
                                    className={cn(
                                        'p-3 rounded-xl border flex flex-col items-center gap-1.5 text-xs font-bold transition-all',
                                        form.role === 'admin'
                                            ? 'bg-primary/15 border-primary/40 text-primary'
                                            : 'bg-white/3 border-white/10 text-gray-500 hover:border-white/20'
                                    )}
                                >
                                    <Crown size={18} />
                                    Admin
                                </button>
                            </div>
                        </div>

                        {/* Plan */}
                        <div className="space-y-1.5 pt-2 border-t border-white/5">
                            <label className="text-xs text-gray-500 uppercase tracking-wider">Plano de Sócio</label>
                            <div className="grid grid-cols-3 gap-2">
                                {(['Legendary', 'Pro', 'Amateur'] as const).map(plan => (
                                    <button
                                        key={plan}
                                        type="button"
                                        onClick={() => setForm(f => ({ ...f, plan }))}
                                        className={cn(
                                            'p-2 rounded-lg border text-[10px] font-bold transition-colors uppercase tracking-wide',
                                            form.plan === plan
                                                ? plan === 'Legendary'
                                                    ? 'bg-yellow-500/20 border-yellow-500 text-yellow-500'
                                                    : plan === 'Pro'
                                                        ? 'bg-blue-500/20 border-blue-500 text-blue-400'
                                                        : 'bg-gray-500/20 border-gray-500 text-gray-300'
                                                : 'bg-white/5 border-white/10 text-gray-500 hover:border-white/20'
                                        )}
                                    >
                                        {plan === 'Legendary' ? 'Lendário' : plan === 'Amateur' ? 'Amador' : plan}
                                    </button>
                                ))}
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

                        <Button type="submit" disabled={submitting} className="w-full">
                            <UserPlus size={16} className="mr-2" />
                            {submitting ? 'Criando...' : 'Criar Usuário'}
                        </Button>
                    </form>
                </Card>

                {/* ── Users List ─────────────────────────────────────────── */}
                <Card className="lg:col-span-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                        <div className="flex items-center gap-2">
                            <Users size={18} className="text-gray-400" />
                            <h2 className="font-bold text-white text-base">Usuários Cadastrados</h2>
                            <span className="text-xs text-gray-600 bg-white/5 px-2 py-1 rounded-full">
                                {filteredUsers.length} total
                            </span>
                        </div>
                        <div className="relative w-full sm:w-64">
                            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                            <input
                                type="text"
                                placeholder="Buscar por nome ou e-mail..."
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                                className="w-full bg-white/5 border border-white/10 rounded-lg pl-9 pr-3 py-1.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-primary/50"
                            />
                        </div>
                    </div>

                    {loadingUsers ? (
                        <div className="space-y-2">
                            {[1, 2, 3].map(i => (
                                <div key={i} className="h-14 bg-white/3 rounded-lg animate-pulse" />
                            ))}
                        </div>
                    ) : filteredUsers.length === 0 ? (
                        <div className="py-10 text-center text-gray-600 text-sm">
                            Nenhum usuário encontrado.
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {currentUsers.map(u => (
                                <div
                                    key={u.id}
                                    className={cn(
                                        'flex items-center gap-3 px-3 py-2.5 rounded-lg border transition-all',
                                        u.id === user?.id
                                            ? 'border-primary/20 bg-primary/5'
                                            : 'border-white/5 bg-white/2 hover:bg-white/5'
                                    )}
                                >
                                    {/* Avatar */}
                                    <div className={cn(
                                        'w-9 h-9 rounded-full flex items-center justify-center text-xs font-black shrink-0',
                                        u.role === 'admin'
                                            ? 'bg-primary/20 text-primary border border-primary/30'
                                            : 'bg-white/10 text-gray-400 border border-white/10'
                                    )}>
                                        {(u.name ?? u.email).substring(0, 2).toUpperCase()}
                                    </div>

                                    {/* Info Block -> Switches to Edit Inputs if modifying */}
                                    {editingUserId === u.id ? (
                                        <div className="flex-1 min-w-0 flex flex-col sm:flex-row items-start sm:items-center gap-2">
                                            <input
                                                type="email"
                                                value={editForm.email}
                                                onChange={(e) => setEditForm(prev => ({ ...prev, email: e.target.value }))}
                                                className="bg-white/5 border border-white/20 rounded px-2 py-1 text-sm text-white w-full sm:w-auto"
                                                placeholder="Novo e-mail"
                                            />
                                            <select
                                                value={editForm.role}
                                                onChange={(e) => setEditForm(prev => ({ ...prev, role: e.target.value as 'admin' | 'user' }))}
                                                className="bg-white/5 border border-white/20 rounded px-2 py-1 text-xs text-white uppercase font-bold"
                                            >
                                                <option value="user" className="bg-zinc-800">Membro</option>
                                                <option value="admin" className="bg-zinc-800">Admin</option>
                                            </select>
                                        </div>
                                    ) : (
                                        <>
                                            {/* Info */}
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-1.5">
                                                    <p className="text-sm font-semibold text-white truncate">
                                                        {u.name ?? u.email.split('@')[0]}
                                                    </p>
                                                    {u.id === user?.id && (
                                                        <span className="text-[9px] text-gray-500 bg-white/5 px-1.5 rounded-full">você</span>
                                                    )}
                                                </div>
                                                <p className="text-xs text-gray-600 truncate">{u.email}</p>
                                            </div>

                                            {/* Role badge + toggle (only if not editing) */}
                                            {u.id !== user?.id && (
                                                <button
                                                    onClick={() => handleChangeRole(u.id, u.role === 'admin' ? 'user' : 'admin')}
                                                    title="Clique para alternar role"
                                                    className={cn(
                                                        'text-[10px] font-black uppercase tracking-wider px-2 py-1 rounded-full border transition-all hover:opacity-80 hidden sm:block',
                                                        u.role === 'admin'
                                                            ? 'bg-primary/20 text-primary border-primary/30'
                                                            : 'bg-white/5 text-gray-500 border-white/10'
                                                    )}
                                                >
                                                    {u.role === 'admin' ? '★ Admin' : 'Membro'}
                                                </button>
                                            )}
                                            {u.id === user?.id && (
                                                <span className={cn(
                                                    'text-[10px] font-black uppercase tracking-wider px-2 py-1 rounded-full border hidden sm:block',
                                                    'bg-primary/20 text-primary border-primary/30'
                                                )}>
                                                    ★ Admin
                                                </span>
                                            )}
                                        </>
                                    )}

                                    {/* Action Buttons */}
                                    <div className="flex items-center gap-1">
                                        {/* Edit Action */}
                                        {u.id !== user?.id && editingUserId !== u.id && (
                                            <button
                                                onClick={() => handleEditClick(u)}
                                                className="p-1.5 text-gray-400 hover:text-blue-400 hover:bg-blue-500/10 rounded transition-colors"
                                                title="Editar usuário"
                                            >
                                                <Edit2 size={14} />
                                            </button>
                                        )}
                                        {editingUserId === u.id && (
                                            <>
                                                <button
                                                    onClick={() => handleUpdateUser(u.id)}
                                                    disabled={updatingUser}
                                                    className="p-1.5 text-green-400 hover:bg-green-500/10 rounded transition-colors"
                                                    title="Salvar alterações"
                                                >
                                                    <Save size={16} />
                                                </button>
                                                <button
                                                    onClick={handleCancelEdit}
                                                    className="p-1.5 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded transition-colors"
                                                    title="Cancelar"
                                                >
                                                    <X size={16} />
                                                </button>
                                            </>
                                        )}

                                        {/* Delete Action (hidden when editing to save space) */}
                                        {u.id !== user?.id && editingUserId !== u.id && (
                                            <button
                                                onClick={() => handleDelete(u.id, u.email)}
                                                className="p-1.5 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded transition-colors"
                                                title="Remover perfil"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Pagination Controls */}
                    {totalPages > 1 && (
                        <div className="flex items-center justify-between mt-6 pt-4 border-t border-white/5">
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
            </div >
        </div >
    );
};
