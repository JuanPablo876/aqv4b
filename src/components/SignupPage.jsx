import React from 'react';
import { Link } from 'react-router-dom';
import VenetianBackground from './VenetianBackground';

export default function SignupPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      <VenetianBackground />
      
      <div className="max-w-md w-full space-y-8 relative z-10">
        <div className="text-center">
          <div className="text-6xl mb-6">🔐</div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-foreground">
            Registro por Invitación
          </h2>
          <p className="mt-4 text-center text-sm text-muted-foreground">
            AQV4 es una plataforma de acceso restringido. Para crear una cuenta necesitas una invitación de un administrador.
          </p>
        </div>

        <div className="bg-card/90 backdrop-blur-sm py-8 px-6 shadow-xl rounded-lg border border-border/20">
          <div className="text-center space-y-4">
            <h3 className="text-lg font-medium text-card-foreground">
              ¿Ya tienes una invitación?
            </h3>
            <p className="text-sm text-muted-foreground">
              Si recibiste un enlace de invitación por email, úsalo para crear tu cuenta.
            </p>
            
            <div className="border-t border-border pt-4">
              <h4 className="text-sm font-medium text-card-foreground mb-2">
                ¿Necesitas acceso?
              </h4>
              <p className="text-xs text-muted-foreground mb-4">
                Contacta a tu administrador para solicitar una invitación.
              </p>
            </div>
          </div>
        </div>

        <div className="text-center">
          <Link 
            to="/login" 
            className="font-medium text-primary hover:text-primary/80 transition-colors"
          >
            ← Volver al inicio de sesión
          </Link>
        </div>
      </div>
    </div>
  );
}
