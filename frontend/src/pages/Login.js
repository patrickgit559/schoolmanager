import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { login } from '../lib/api';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { toast } from 'sonner';
import { GraduationCap, Mail, Lock, Loader2 } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { loginUser } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await login({ email, password });
      loginUser(response.data.user, response.data.access_token);
      toast.success('Connexion réussie');
      navigate('/dashboard');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Erreur de connexion');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      {/* Form Section */}
      <div className="login-form-section">
        <div className="max-w-md mx-auto w-full">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 rounded-xl bg-slate-900 flex items-center justify-center">
              <GraduationCap className="text-white" size={28} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">SUP'INTER</h1>
              <p className="text-sm text-slate-500">Système de Gestion Universitaire</p>
            </div>
          </div>

          <Card className="border-0 shadow-lg" data-testid="login-card">
            <CardHeader className="space-y-1 pb-6">
              <CardTitle className="text-2xl font-bold">Connexion</CardTitle>
              <CardDescription>
                Entrez vos identifiants pour accéder au système
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Adresse email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <Input
                      id="email"
                      type="email"
                      placeholder="exemple@supinter.edu"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-10 h-11"
                      required
                      data-testid="email-input"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Mot de passe</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <Input
                      id="password"
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-10 h-11"
                      required
                      data-testid="password-input"
                    />
                  </div>
                </div>

                <Button 
                  type="submit" 
                  className="w-full h-11 bg-slate-900 hover:bg-slate-800"
                  disabled={loading}
                  data-testid="login-submit-btn"
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Connexion...
                    </>
                  ) : (
                    'Se connecter'
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

          <p className="text-center text-sm text-slate-500 mt-6">
            © 2025 SUP'INTER - Tous droits réservés
          </p>
        </div>
      </div>

      {/* Image Section */}
      <div 
        className="login-image-section hidden lg:block"
        style={{ backgroundImage: 'url(https://images.unsplash.com/photo-1764058415544-6c5bd4659a88?crop=entropy&cs=srgb&fm=jpg&q=85)' }}
      >
        <div className="login-image-overlay">
          <div className="max-w-lg">
            <h2 className="text-4xl font-bold text-white mb-4 tracking-tight">
              Bienvenue sur le portail de gestion
            </h2>
            <p className="text-lg text-slate-300 leading-relaxed">
              Gérez efficacement votre établissement universitaire : étudiants, professeurs, finances et documents administratifs en un seul endroit.
            </p>
            <div className="mt-8 grid grid-cols-3 gap-6">
              <div>
                <p className="text-3xl font-bold text-orange-500">3</p>
                <p className="text-slate-400 text-sm">Campus</p>
              </div>
              <div>
                <p className="text-3xl font-bold text-orange-500">25+</p>
                <p className="text-slate-400 text-sm">Filières</p>
              </div>
              <div>
                <p className="text-3xl font-bold text-orange-500">1000+</p>
                <p className="text-slate-400 text-sm">Étudiants</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
