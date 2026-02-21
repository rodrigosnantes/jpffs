import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Trophy, ArrowRight, AlertCircle, User, Mail, Lock } from 'lucide-react';

export const SignUp = () => {
    const navigate = useNavigate();
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [position, setPosition] = useState<'Goalkeeper' | 'Line'>('Line');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSignUp = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);

        const defaultAttributes = {
            attack: 50,
            defense: 50,
            pace: 50,
            shooting: 50,
            physical: 50,
            passing: 50,
        };

        try {
            const { data, error } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    data: {
                        name,
                        position
                    }
                }
            });

            if (error) throw error;

            if (data.user) {
                // Wait briefly for the trigger to create the player row
                await new Promise(resolve => setTimeout(resolve, 1000));

                // Find the player created by the trigger and ensure attributes are set
                const { data: players, error: fetchError } = await supabase
                    .from('players')
                    .select('id, attributes')
                    .eq('profile_id', data.user.id)
                    .limit(1);

                if (!fetchError && players && players.length > 0) {
                    const player = players[0];
                    const hasAttributes = player.attributes &&
                        Object.keys(player.attributes).length > 0;

                    if (!hasAttributes) {
                        await supabase
                            .from('players')
                            .update({ attributes: defaultAttributes })
                            .eq('id', player.id);
                    }
                }

                alert('Conta criada com sucesso! Você já pode fazer login.');
                navigate('/login');
            }
        } catch (err: any) {
            setError(err.message || 'Ocorreu um erro ao criar a conta');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#050608] relative overflow-hidden">
            {/* Background Effects */}
            <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-primary/10 rounded-full blur-[120px]" />
            <div className="absolute bottom-[-20%] right-[-10%] w-[600px] h-[600px] bg-secondary/10 rounded-full blur-[120px]" />

            <div className="w-full max-w-md p-8 relative z-10 animate-in fade-in slide-in-from-bottom-8 duration-700">
                <div className="flex flex-col items-center mb-8">
                    <div className="w-16 h-16 bg-gradient-to-br from-primary to-amber-600 rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-primary/20 transform rotate-3">
                        <Trophy className="text-white w-8 h-8" />
                    </div>
                    <h1 className="text-4xl font-header font-bold text-white mb-2">Criar Conta</h1>
                    <p className="text-gray-400 text-center">Junte-se ao JPFFS Manager</p>
                </div>

                <div className="bg-surface/50 backdrop-blur-xl border border-white/10 p-8 rounded-2xl shadow-2xl">
                    <form onSubmit={handleSignUp} className="space-y-4">
                        <Input
                            label="Nome Completo"
                            placeholder="Seu nome de craque"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required
                            icon={User}
                        />

                        <Input
                            label="Email"
                            type="email"
                            placeholder="seu@email.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            icon={Mail}
                        />

                        <Input
                            label="Senha"
                            type="password"
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            minLength={6}
                            icon={Lock}
                        />

                        <div className="space-y-2">
                            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider ml-1">
                                Posição Principal
                            </label>
                            <div className="grid grid-cols-2 gap-2">
                                <button
                                    type="button"
                                    onClick={() => setPosition('Line')}
                                    className={`p-3 rounded-lg border text-sm font-medium transition-all ${position === 'Line'
                                        ? 'bg-primary/20 border-primary text-primary'
                                        : 'bg-surface border-white/10 text-gray-400 hover:bg-white/5'
                                        }`}
                                >
                                    Linha
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setPosition('Goalkeeper')}
                                    className={`p-3 rounded-lg border text-sm font-medium transition-all ${position === 'Goalkeeper'
                                        ? 'bg-secondary/20 border-secondary text-secondary'
                                        : 'bg-surface border-white/10 text-gray-400 hover:bg-white/5'
                                        }`}
                                >
                                    Goleiro
                                </button>
                            </div>
                        </div>

                        {error && (
                            <div className="bg-red-500/10 border border-red-500/20 p-3 rounded-lg flex items-center gap-2 text-red-500 text-sm">
                                <AlertCircle size={16} />
                                {error}
                            </div>
                        )}

                        <Button
                            type="submit"
                            className="w-full py-4 text-lg font-bold shadow-lg shadow-primary/25 mt-4"
                            isLoading={isLoading}
                        >
                            Cadastrar <ArrowRight className="ml-2" size={20} />
                        </Button>
                    </form>

                    <div className="mt-8 pt-6 border-t border-white/10 text-center">
                        <Link
                            to="/login"
                            className="text-gray-400 text-sm hover:text-white transition-colors"
                        >
                            Já tem uma conta? <span className="text-primary font-bold">Faça Login</span>
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
};
