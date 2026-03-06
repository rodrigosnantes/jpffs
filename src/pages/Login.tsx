import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { useAuthStore } from '../store/useAuthStore';
import { Input } from '../components/ui/Input';
import { ArrowRight } from 'lucide-react';
import Logo from '../assets/Logo.png'


export const Login = () => {
    const navigate = useNavigate();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const [error, setError] = useState<string | null>(null);

    const signIn = useAuthStore((state) => state.signIn);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);

        try {
            const { error } = await signIn(email, password);
            if (error) throw error;
            navigate('/');
        } catch (err: any) {
            setError(err.message || 'Erro ao fazer login');
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
                        <img src={Logo} alt="Logo" />
                    </div>
                    <h1 className="text-4xl font-header font-bold text-white mb-2">JPFFS Manager</h1>
                    <p className="text-gray-400 text-center">Gerencie suas peladas de forma profissional</p>
                </div>

                <div className="bg-surface/50 backdrop-blur-xl border border-white/10 p-8 rounded-2xl shadow-2xl">
                    <form onSubmit={handleLogin} className="space-y-6">
                        <Input
                            label="Email"
                            type="email"
                            placeholder="seu@email.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />

                        <div className="space-y-2">
                            <Input
                                label="Senha"
                                type="password"
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                            <div className="flex justify-end">
                                <a href="#" className="text-xs text-primary hover:underline">Esqueceu a senha?</a>
                            </div>
                        </div>

                        {error && (
                            <div className="bg-red-500/10 border border-red-500/20 p-3 rounded-lg text-red-500 text-sm text-center">
                                {error}
                            </div>
                        )}

                        <Button
                            type="submit"
                            className="w-full py-6 text-lg font-bold shadow-lg shadow-primary/25"
                            isLoading={isLoading}
                        >
                            Entrar <ArrowRight className="ml-2" size={20} />
                        </Button>
                    </form>

                    {/* <div className="mt-8 pt-6 border-t border-white/10 text-center">
                        <p className="text-gray-500 text-sm">
                            Ainda não tem conta? <Link to="/signup" className="text-white hover:text-primary font-bold transition-colors">Criar conta</Link>
                        </p>
                    </div> */}
                </div>
            </div>
        </div>
    );
};
