import React, { useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../supabaseClient";
import VenetianBackground from "./VenetianBackground";

export function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/update-password`,
      });
      
      if (error) throw error;
      setSuccess(true);
    } catch (error) {
      setError(error instanceof Error ? error.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      <VenetianBackground />
      
      <div className="max-w-md w-full space-y-8 relative z-10">
        {success ? (
          <div className="text-center">
            <div className="text-6xl mb-6">📧</div>
            <h2 className="mt-6 text-center text-3xl font-extrabold text-foreground">
              Revisa tu Email
            </h2>
            <div className="bg-card/90 backdrop-blur-sm py-8 px-6 shadow-xl rounded-lg border border-border/20 mt-8">
              <p className="text-sm text-muted-foreground text-center">
                Si el email está registrado en nuestro sistema, recibirás las instrucciones para restablecer tu contraseña.
              </p>
              <div className="mt-6 text-center">
                <Link 
                  to="/login" 
                  className="font-medium text-blue-600 hover:text-blue-800 transition-colors dark:text-blue-400 dark:hover:text-blue-300"
                >
                  ← Volver al inicio de sesión
                </Link>
              </div>
            </div>
          </div>
        ) : (
          <>
            <div className="text-center">
              <div className="text-6xl mb-6">🔑</div>
              <h2 className="mt-6 text-center text-3xl font-extrabold text-foreground">
                Restablecer Contraseña
              </h2>
              <p className="mt-4 text-center text-sm text-muted-foreground">
                Ingresa tu email para recibir las instrucciones de restablecimiento
              </p>
            </div>

            <div className="bg-card/90 backdrop-blur-sm py-8 px-6 shadow-xl rounded-lg border border-border/20">
              <form onSubmit={handleForgotPassword} className="space-y-6">
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-card-foreground">
                    Email
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="mt-1 appearance-none relative block w-full px-3 py-2 border border-border placeholder-muted-foreground text-foreground rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm dark:focus:ring-blue-400 dark:focus:border-blue-400"
                    placeholder="tu@email.com"
                  />
                </div>
                
                {error && (
                  <div className="text-sm text-red-500 bg-red-50 p-3 rounded border border-red-200 dark:bg-red-900/20 dark:border-red-800">
                    {error}
                  </div>
                )}
                
                <button
                  type="submit"
                  disabled={isLoading}
                  className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-blue-600 dark:hover:bg-blue-700"
                >
                  {isLoading ? "Enviando..." : "Enviar Email de Restablecimiento"}
                </button>
              </form>
              
              <div className="mt-6 text-center">
                <Link 
                  to="/login" 
                  className="font-medium text-blue-600 hover:text-blue-800 transition-colors dark:text-blue-400 dark:hover:text-blue-300"
                >
                  ← Volver al inicio de sesión
                </Link>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
