import React, { useState } from 'react';
import VenetianTile from './VenetianTile';

const UserProfilePage = ({ session }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    department: '',
    position: ''
  });

  // Extract user data from session
  const user = session?.user;
  const userEmail = user?.email || 'usuario@example.com';
  const userName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Usuario';
  const userInitials = userName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  const userId = user?.id || 'N/A';

  const handleEdit = () => {
    setFormData({
      fullName: userName,
      email: userEmail,
      phone: user?.user_metadata?.phone || '',
      department: user?.user_metadata?.department || '',
      position: user?.user_metadata?.position || ''
    });
    setIsEditing(true);
  };

  const handleSave = (e) => {
    e.preventDefault();
    // Here you would typically update the user profile via API
    console.log('Saving profile data:', formData);
    setIsEditing(false);
    // TODO: Implement actual profile update with Supabase
  };

  const handleCancel = () => {
    setIsEditing(false);
    setFormData({
      fullName: '',
      email: '',
      phone: '',
      department: '',
      position: ''
    });
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <div className="space-y-6">
      {/* Profile Header */}
      <VenetianTile className="p-6">
        <div className="flex items-center space-x-6">
          <div className="w-24 h-24 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold text-3xl">
            {userInitials}
          </div>
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-primary mb-2">{userName}</h1>
            <p className="text-muted-foreground text-lg">{userEmail}</p>
            <p className="text-sm text-muted-foreground mt-1">ID: {userId.substring(0, 8)}...</p>
          </div>
          <div>
            {!isEditing ? (
              <button
                onClick={handleEdit}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                Editar Perfil
              </button>
            ) : (
              <div className="space-x-2">
                <button
                  type="button"
                  onClick={handleSave}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  Guardar
                </button>
                <button
                  type="button"
                  onClick={handleCancel}
                  className="px-4 py-2 border border-input rounded-lg text-muted-foreground hover:bg-accent"
                >
                  Cancelar
                </button>
              </div>
            )}
          </div>
        </div>
      </VenetianTile>

      {/* Profile Information */}
      <VenetianTile className="p-6">
        <h2 className="text-xl font-semibold text-primary mb-4">Información Personal</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-2">
              Nombre Completo
            </label>
            {isEditing ? (
              <input
                type="text"
                value={formData.fullName}
                onChange={(e) => handleInputChange('fullName', e.target.value)}
                className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
            ) : (
              <p className="text-primary font-medium py-2">{userName}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-2">
              Correo Electrónico
            </label>
            {isEditing ? (
              <input
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
            ) : (
              <p className="text-primary font-medium py-2">{userEmail}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-2">
              Teléfono
            </label>
            {isEditing ? (
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                placeholder="Ingrese su teléfono"
                className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
            ) : (
              <p className="text-primary font-medium py-2">
                {user?.user_metadata?.phone || 'No especificado'}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-2">
              Departamento
            </label>
            {isEditing ? (
              <input
                type="text"
                value={formData.department}
                onChange={(e) => handleInputChange('department', e.target.value)}
                placeholder="Ingrese su departamento"
                className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
            ) : (
              <p className="text-primary font-medium py-2">
                {user?.user_metadata?.department || 'No especificado'}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-2">
              Cargo
            </label>
            {isEditing ? (
              <input
                type="text"
                value={formData.position}
                onChange={(e) => handleInputChange('position', e.target.value)}
                placeholder="Ingrese su cargo"
                className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
            ) : (
              <p className="text-primary font-medium py-2">
                {user?.user_metadata?.position || 'No especificado'}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-2">
              Fecha de Registro
            </label>
            <p className="text-primary font-medium py-2">
              {user?.created_at ? new Date(user.created_at).toLocaleDateString('es-ES') : 'No disponible'}
            </p>
          </div>
        </div>
      </VenetianTile>

      {/* Security Section */}
      <VenetianTile className="p-6">
        <h2 className="text-xl font-semibold text-primary mb-4">Seguridad</h2>
        
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="font-medium text-primary">Contraseña</h3>
              <p className="text-sm text-muted-foreground">Cambiar su contraseña de acceso</p>
            </div>
            <button className="px-4 py-2 border border-input rounded-lg text-primary hover:bg-accent">
              Cambiar Contraseña
            </button>
          </div>

          <div className="border-t venetian-border pt-4">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="font-medium text-primary">Sesiones Activas</h3>
                <p className="text-sm text-muted-foreground">Administrar dispositivos conectados</p>
              </div>
              <button className="px-4 py-2 border border-input rounded-lg text-primary hover:bg-accent">
                Ver Sesiones
              </button>
            </div>
          </div>
        </div>
      </VenetianTile>
    </div>
  );
};

export default UserProfilePage;
