import React, { useState, useEffect } from 'react';
import { ValidatedForm } from './forms/ValidatedForm';
import { createInvitationSchema } from '../schemas/validationSchemas';
import InvitationService from '../services/invitationService';
import useToast from '../hooks/useToast';
import { useAuth } from '../AuthContext';

export default function InvitationManagement() {
  const { session } = useAuth();
  const user = session?.user;
  const { toast } = useToast();
  
  const [invitations, setInvitations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [canInvite, setCanInvite] = useState(false);

  useEffect(() => {
    checkPermissions();
    loadInvitations();
  }, []);

  const checkPermissions = async () => {
    try {
      // Check if user has admin or manager role
      const hasAdminRole = user?.user_metadata?.role === 'admin';
      const hasManagerRole = user?.user_metadata?.role === 'manager';
      
      setCanInvite(hasAdminRole || hasManagerRole);
    } catch (error) {
      console.error('Error checking permissions:', error);
      setCanInvite(false);
    }
  };

  const loadInvitations = async () => {
    try {
      setLoading(true);
      const data = await InvitationService.getInvitations();
      setInvitations(data || []);
    } catch (error) {
      console.error('Error loading invitations:', error);
      toast.error('Error al cargar invitaciones');
      setInvitations([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateInvitation = async (data) => {
    try {
      await InvitationService.createInvitation(
        data.email,
        data.role,
        user?.id,
        data.message
      );
      
      toast.success('Invitación creada exitosamente');
      setShowCreateForm(false);
      loadInvitations(); // Refresh list
    } catch (error) {
      toast.error(error.message || 'Error al crear invitación');
      throw error;
    }
  };

  const handleResendInvitation = async (invitationId) => {
    try {
      await InvitationService.resendInvitation(invitationId);
      toast.success('Invitación reenviada exitosamente');
      loadInvitations();
    } catch (error) {
      toast.error(error.message || 'Error al reenviar invitación');
    }
  };

  const handleCancelInvitation = async (invitationId) => {
    if (!window.confirm('¿Estás seguro de cancelar esta invitación?')) {
      return;
    }

    try {
      await InvitationService.cancelInvitation(invitationId);
      toast.success('Invitación cancelada');
      loadInvitations();
    } catch (error) {
      toast.error(error.message || 'Error al cancelar invitación');
    }
  };

  if (!canInvite) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">🔒</div>
        <h2 className="text-2xl font-bold text-primary mb-2">Acceso Restringido</h2>
        <p className="text-muted-foreground">No tienes permisos para gestionar invitaciones.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-primary">Gestión de Invitaciones</h1>
          <p className="text-muted-foreground">Invita nuevos usuarios a la plataforma</p>
        </div>
        <button
          onClick={() => setShowCreateForm(true)}
          className="bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary"
        >
          + Nueva Invitación
        </button>
      </div>

      {/* Create Invitation Modal */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-background rounded-lg p-6 w-full max-w-md border">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-primary">Nueva Invitación</h2>
              <button
                onClick={() => setShowCreateForm(false)}
                className="text-muted-foreground hover:text-primary"
              >
                ✕
              </button>
            </div>

            <ValidatedForm
              schema={createInvitationSchema}
              onSubmit={handleCreateInvitation}
              defaultValues={{
                email: '',
                role: 'user',
                message: ''
              }}
            >
              {({ FormField, SubmitButton }) => (
                <>
                  <FormField
                    name="email"
                    label="Email del Usuario"
                    type="email"
                    placeholder="usuario@ejemplo.com"
                    required
                  />

                  <FormField
                    name="role"
                    label="Rol"
                    type="select"
                    options={[
                      { value: 'user', label: 'Usuario' },
                      { value: 'manager', label: 'Gerente' },
                      { value: 'admin', label: 'Administrador' }
                    ]}
                    required
                  />

                  <FormField
                    name="message"
                    label="Mensaje Personalizado (Opcional)"
                    type="textarea"
                    placeholder="Mensaje de bienvenida..."
                    rows={3}
                  />

                  <div className="flex space-x-3">
                    <SubmitButton className="flex-1">
                      Enviar Invitación
                    </SubmitButton>
                    <button
                      type="button"
                      onClick={() => setShowCreateForm(false)}
                      className="flex-1 px-4 py-2 border border-border rounded-md text-muted-foreground hover:bg-secondary"
                    >
                      Cancelar
                    </button>
                  </div>
                </>
              )}
            </ValidatedForm>
          </div>
        </div>
      )}

      {/* Invitations List */}
      <div className="bg-background shadow rounded-lg border">
        <div className="px-6 py-4 border-b border-border">
          <h2 className="text-lg font-medium text-primary">Invitaciones Enviadas</h2>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Cargando invitaciones...</p>
          </div>
        ) : invitations.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-4xl mb-4">📧</div>
            <p className="text-muted-foreground">No hay invitaciones enviadas</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Usuario
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Rol
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Estado
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Fecha
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {invitations.map((invitation) => (
                  <tr key={invitation.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {invitation.email}
                        </div>
                        {invitation.message && (
                          <div className="text-sm text-gray-500 truncate max-w-xs">
                            {invitation.message}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                        {getRoleDisplayName(invitation.role)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <InvitationStatus status={invitation.status} />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(invitation.created_at).toLocaleDateString('es-ES')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        {invitation.status === 'pending' && (
                          <>
                            <button
                              onClick={() => handleResendInvitation(invitation.id)}
                              className="text-blue-600 hover:text-blue-900"
                            >
                              Reenviar
                            </button>
                            <button
                              onClick={() => handleCancelInvitation(invitation.id)}
                              className="text-red-600 hover:text-red-900"
                            >
                              Cancelar
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function InvitationStatus({ status }) {
  const statusConfig = {
    pending: { color: 'bg-yellow-100 text-yellow-800', label: 'Pendiente' },
    accepted: { color: 'bg-green-100 text-green-800', label: 'Aceptada' },
    expired: { color: 'bg-red-100 text-red-800', label: 'Expirada' },
    cancelled: { color: 'bg-gray-100 text-gray-800', label: 'Cancelada' }
  };

  const config = statusConfig[status] || statusConfig.pending;

  return (
    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${config.color}`}>
      {config.label}
    </span>
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
