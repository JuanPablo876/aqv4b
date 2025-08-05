import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { InvitationService } from '../services/invitationService';
import { ValidatedForm } from './forms/ValidatedForm';
import { acceptInvitationSchema } from '../schemas/validationSchemas';
import VenetianBackground from './VenetianBackground';
import VenetianTile from './VenetianTile';

const AcceptInvitationPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [invitation, setInvitation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [accepting, setAccepting] = useState(false);

  const invitationId = searchParams.get('id');

  useEffect(() => {
    if (invitationId) {
      validateInvitation();
    } else {
      setError('ID de invitación no válido');
      setLoading(false);
    }
  }, [invitationId]);

  const validateInvitation = async () => {
    try {
      setLoading(true);
      const invitationData = await InvitationService.validateInvitation(invitationId);
      setInvitation(invitationData);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptInvitation = async (formData) => {
    try {
      setAccepting(true);
      
      const userData = {
        password: formData.password,
        fullName: formData.fullName
      };

      await InvitationService.acceptInvitation(invitationId, userData);
      
      // Redirect to login with success message
      navigate('/login?message=account_created&email=' + encodeURIComponent(invitation.email));
      
    } catch (err) {
      setError(err.message);
    } finally {
      setAccepting(false);
    }
  };

  if (loading) {
    return (
      <VenetianBackground>
        <div className="min-h-screen flex items-center justify-center">
          <VenetianTile className="p-8">
            <div className="text-center">
              <div className="animate-spin rounded-full h-16 w-16 border-4 border-primary border-t-transparent mx-auto mb-4"></div>
              <p className="text-foreground">Validando invitación...</p>
            </div>
          </VenetianTile>
        </div>
      </VenetianBackground>
    );
  }

  if (error) {
    return (
      <VenetianBackground>
        <div className="min-h-screen flex items-center justify-center">
          <VenetianTile className="p-8 max-w-md mx-auto">
            <div className="text-center">
              <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-destructive" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.664-.833-2.464 0L4.35 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-destructive mb-2">Invitación No Válida</h2>
              <p className="text-muted-foreground mb-4">{error}</p>
              <button
                onClick={() => navigate('/login')}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
              >
                Ir al Login
              </button>
            </div>
          </VenetianTile>
        </div>
      </VenetianBackground>
    );
  }

  return (
    <VenetianBackground>
      <div className="min-h-screen flex items-center justify-center py-12">
        <VenetianTile className="p-8 max-w-md mx-auto">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-primary mb-2">¡Bienvenido/a a AquaLiquim!</h1>
            <p className="text-foreground">Has sido invitado/a a unirte como <strong>{invitation.role}</strong></p>
          </div>

          <div className="bg-accent border border-border rounded-lg p-4 mb-6">
            <h3 className="font-semibold text-foreground mb-2">Detalles de la Invitación:</h3>
            <p className="text-muted-foreground"><strong className="text-foreground">Email:</strong> {invitation.email}</p>
            <p className="text-muted-foreground"><strong className="text-foreground">Rol:</strong> {invitation.role}</p>
            <p className="text-muted-foreground"><strong className="text-foreground">Expira:</strong> {new Date(invitation.expires_at).toLocaleDateString('es-ES')}</p>
          </div>

          <ValidatedForm
            schema={acceptInvitationSchema}
            onSubmit={handleAcceptInvitation}
            submitButtonText={accepting ? "Creando cuenta..." : "Crear Mi Cuenta"}
            disabled={accepting}
          >
            {({ FormField, SubmitButton }) => (
              <>
                <FormField
                  name="fullName"
                  label="Nombre Completo"
                  type="text"
                  placeholder="Tu nombre completo"
                  required
                />
                
                <FormField
                  name="password"
                  label="Contraseña"
                  type="password"
                  placeholder="Mínimo 8 caracteres"
                  required
                />
                
                <FormField
                  name="confirmPassword"
                  label="Confirmar Contraseña"
                  type="password"
                  placeholder="Confirma tu contraseña"
                  required
                />
                
                <SubmitButton />
              </>
            )}
          </ValidatedForm>

          <p className="text-xs text-muted-foreground text-center mt-4">
            Al crear tu cuenta, aceptas los términos y condiciones de AquaLiquim.
          </p>
        </VenetianTile>
      </div>
    </VenetianBackground>
  );
};

export default AcceptInvitationPage;
