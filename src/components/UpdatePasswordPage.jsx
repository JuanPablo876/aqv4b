import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import VenetianBackground from './VenetianBackground';

export default function UpdatePasswordPage() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    // Check if we have the required session/tokens from the email link
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    const accessToken = hashParams.get('access_token');
    const refreshToken = hashParams.get('refresh_token');
    
    if (!accessToken || !refreshToken) {
      setError('Enlace de restablecimiento inválido o expirado');
    }
  }, []);

  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    setError('');
    
    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }
    
    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({
        password: password
      });

      if (error) throw error;
      
      setSuccess(true);
      
      // Redirect to login after success
      setTimeout(() => {
        navigate('/login');
      }, 3000);
      
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      <VenetianBackground />
      
      <div className="max-w-md w-full space-y-8 relative z-10">
        {success ? (
          <div className="text-center">
            <div className="text-6xl mb-6">✅</div>
            <h2 className="mt-6 text-center text-3xl font-extrabold text-foreground">
              Contraseña Actualizada
            </h2>
            <div className="bg-card/90 backdrop-blur-sm py-8 px-6 shadow-xl rounded-lg border border-border/20 mt-8">
              <p className="text-sm text-muted-foreground text-center">
                Tu contraseña ha sido actualizada exitosamente. Serás redirigido al inicio de sesión.
              </p>
            </div>
          </div>
        ) : (
          <>
            <div className="text-center">
              <div className="text-6xl mb-6">🔐</div>
              <h2 className="mt-6 text-center text-3xl font-extrabold text-foreground">
                Nueva Contraseña
              </h2>
              <p className="mt-4 text-center text-sm text-muted-foreground">
                Ingresa tu nueva contraseña
              </p>
            </div>

            <div className="bg-card/90 backdrop-blur-sm py-8 px-6 shadow-xl rounded-lg border border-border/20">
              <form onSubmit={handleUpdatePassword} className="space-y-6">
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-card-foreground">
                    Nueva Contraseña
                  </label>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="mt-1 appearance-none relative block w-full px-3 py-2 border border-border placeholder-muted-foreground text-foreground rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary sm:text-sm"
                    placeholder="Mínimo 6 caracteres"
                  />
                </div>
                
                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-card-foreground">
                    Confirmar Nueva Contraseña
                  </label>
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="mt-1 appearance-none relative block w-full px-3 py-2 border border-border placeholder-muted-foreground text-foreground rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary sm:text-sm"
                    placeholder="Repite la nueva contraseña"
                  />
                </div>
                
                {error && (
                  <div className="text-sm text-red-500 bg-red-50 p-3 rounded border border-red-200">
                    {error}
                  </div>
                )}
                
                <button
                  type="submit"
                  disabled={loading}
                  className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? "Actualizando..." : "Actualizar Contraseña"}
                </button>
              </form>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
