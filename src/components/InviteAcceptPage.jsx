import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ValidatedForm } from './forms/ValidatedForm';
import { acceptInvitationSchema } from '../schemas/validationSchemas';
import InvitationService from '../services/invitationService';
import useToast from '../hooks/useToast';
import VenetianBackground from './VenetianBackground';

export default function InviteAcceptPage() {
  const { token } = useParams();
  const navigate = useNavigate();
  const { addToast } = useToast();
  
  const [invitation, setInvitation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    validateInvitation();
  }, [token]);

  const validateInvitation = async () => {
    try {
      setLoading(true);
      const invitationData = await InvitationService.validateInvitation(token);
      setInvitation(invitationData);
    } catch (error) {
      setError(error.message);
      addToast(error.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptInvitation = async (data) => {
    try {
      await InvitationService.acceptInvitation(token, data);
      
      addToast('¡Cuenta creada exitosamente! Te hemos enviado un email de confirmación.', 'success');
      
      // Redirect to login after successful signup
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (error) {
      addToast(error.message || 'Error al crear la cuenta', 'error');
      throw error; // Re-throw so form can handle it
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Validando invitación...</p>
        </div>
      </div>
    );
  }

  if (error || !invitation) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <div className="text-6xl mb-4">⚠️</div>
            <h2 className="text-3xl font-extrabold text-gray-900 mb-4">
              Invitación No Válida
            </h2>
            <p className="text-gray-600 mb-6">
              {error || 'Esta invitación no existe o ha expirado.'}
            </p>
            <button
              onClick={() => navigate('/login')}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Ir al Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      <VenetianBackground />
      
      <div className="max-w-md w-full space-y-8 relative z-10">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Completar Registro
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Has sido invitado a unirte a AQV4
          </p>
        </div>

        {/* Invitation Details */}
        <div className="bg-blue-50 border border-blue-200 rounded-md p-4 mb-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-blue-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-blue-800">
                Detalles de la Invitación
              </h3>
              <div className="mt-2 text-sm text-blue-700">
                <p><strong>Email:</strong> {invitation.email}</p>
                <p><strong>Rol:</strong> {getRoleDisplayName(invitation.role)}</p>
                {invitation.message && (
                  <p><strong>Mensaje:</strong> {invitation.message}</p>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white/90 backdrop-blur-sm py-8 px-6 shadow-xl rounded-lg border border-white/20">
          <ValidatedForm
            schema={acceptInvitationSchema}
            onSubmit={handleAcceptInvitation}
            defaultValues={{
              fullName: '',
              password: '',
              confirmPassword: ''
            }}
          >
            {({ FormField, SubmitButton }) => (
              <>
                <FormField
                  name="fullName"
                  label="Nombre Completo"
                  placeholder="Ingresa tu nombre completo"
                  required
                />

                <FormField
                  name="password"
                  label="Contraseña"
                  type="password"
                  placeholder="Crea una contraseña segura"
                  required
                />

                <FormField
                  name="confirmPassword"
                  label="Confirmar Contraseña"
                  type="password"
                  placeholder="Confirma tu contraseña"
                  required
                />

                <SubmitButton className="w-full">
                  Crear Cuenta
                </SubmitButton>
              </>
            )}
          </ValidatedForm>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">
                  Al crear tu cuenta, aceptas nuestros Términos de Servicio
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function getRoleDisplayName(role) {
  const roleNames = {
    admin: 'Administrador',
    manager: 'Gerente', 
    user: 'Usuario'
  };
  return roleNames[role] || role;
}
