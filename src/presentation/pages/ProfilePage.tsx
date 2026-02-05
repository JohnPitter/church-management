// Presentation Page - Profile
// User profile management and settings page

import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { format } from 'date-fns';
import { FirebaseUserRepository } from '@modules/user-management/users/infrastructure/repositories/FirebaseUserRepository';
import { UserRole, UserStatus } from '@/domain/entities/User';
import { PermissionService } from '@modules/user-management/permissions/application/services/PermissionService';
import { updateProfile, updatePassword, reauthenticateWithCredential, EmailAuthProvider } from 'firebase/auth';
import { auth, storage } from '@/config/firebase';
import { deleteField } from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';

interface UserProfile {
  id: string;
  email: string;
  displayName: string;
  role: UserRole | string; // Allow custom roles as strings
  status: UserStatus;
  createdAt: Date;
  updatedAt: Date;
  photoURL?: string;
  phoneNumber?: string;
  biography?: string;
  phone?: string;
  address?: string;
  birthDate?: Date;
  ministry?: string;
  emergencyContact?: {
    name: string;
    phone: string;
    relationship: string;
  };
  preferences: {
    notifications: boolean;
    emailUpdates: boolean;
    eventReminders: boolean;
  };
}


export const ProfilePage: React.FC = () => {
  const { currentUser, canCreateContent: _canCreateContent, refreshUser } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedProfile, setEditedProfile] = useState<UserProfile | null>(null);
  const [activeTab, setActiveTab] = useState('personal');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [isGoogleUser, setIsGoogleUser] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const userRepository = new FirebaseUserRepository();
  const permissionService = new PermissionService();

  useEffect(() => {
    loadUserProfile();
    checkAuthProvider();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser]);

  const checkAuthProvider = () => {
    if (auth.currentUser) {
      // Verificar se o usuário fez login via Google
      const providerData = auth.currentUser.providerData;
      const hasGoogleProvider = providerData.some(provider => 
        provider.providerId === 'google.com'
      );
      
      // Se só tem Google como provider, é usuário Google
      const isOnlyGoogleUser = hasGoogleProvider && providerData.length === 1;

      setIsGoogleUser(isOnlyGoogleUser);
    } else {
      setIsGoogleUser(false);
    }
  };

  const loadUserProfile = async () => {
    if (!currentUser) return;
    
    try {
      setLoading(true);
      const user = await userRepository.findById(currentUser.id);
      
      if (user) {
        // Enrich user data with additional profile fields
        const enrichedProfile: UserProfile = {
          ...user,
          phone: user.phoneNumber || '',
          address: '',
          birthDate: undefined,
          ministry: '',
          emergencyContact: undefined,
          preferences: {
            notifications: true,
            emailUpdates: true,
            eventReminders: true
          }
        };
        setProfile(enrichedProfile);
      }
    } catch (error) {
      console.error('Error loading user profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: 'personal', label: 'Informações Pessoais', icon: '👤' },
    { id: 'contact', label: 'Contato', icon: '📞' },
    { id: 'ministry', label: 'Ministério', icon: '⛪' },
    { id: 'security', label: 'Segurança', icon: '🔐' },
    { id: 'preferences', label: 'Preferências', icon: '⚙️' }
  ];

  const handleEdit = () => {
    if (!profile) return;
    setEditedProfile({ ...profile });
    setIsEditing(true);
  };

  const handleSave = async () => {
    if (!editedProfile || !currentUser) return;
    
    setSaving(true);
    try {
      // Update user in Firestore
      await userRepository.update(currentUser.id, {
        displayName: editedProfile.displayName,
        phoneNumber: editedProfile.phone,
        updatedAt: new Date()
      });
      
      // Update Firebase Auth profile if name changed
      if (auth.currentUser && editedProfile.displayName !== profile?.displayName) {
        await updateProfile(auth.currentUser, {
          displayName: editedProfile.displayName
        });
      }
      
      setProfile({ ...editedProfile });
      setIsEditing(false);
      alert('Perfil atualizado com sucesso!');
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('Erro ao atualizar perfil.');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (!profile) return;
    setEditedProfile({ ...profile });
    setIsEditing(false);
  };

  const handleInputChange = (field: keyof UserProfile, value: any) => {
    if (!editedProfile) return;
    setEditedProfile(prev => prev ? ({
      ...prev,
      [field]: value
    }) : null);
  };

  const handleNestedChange = (parent: string, field: string, value: any) => {
    if (!editedProfile) return;
    setEditedProfile(prev => prev ? ({
      ...prev,
      [parent]: {
        ...prev[parent as keyof UserProfile] as any,
        [field]: value
      }
    }) : null);
  };

  const handlePhotoClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handlePhotoChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Por favor, selecione apenas arquivos de imagem.');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('A imagem deve ter no máximo 5MB.');
      return;
    }

    if (!currentUser) return;

    setUploadingPhoto(true);
    try {
      // Create a unique filename
      const timestamp = Date.now();
      const fileExtension = file.name.split('.').pop() || 'jpg';
      const filename = `profile-photos/${currentUser.id}/profile-${timestamp}.${fileExtension}`;

      // Create storage reference
      const storageRef = ref(storage, filename);

      // Upload with resumable upload (better for handling errors and retries)
      const uploadTask = uploadBytesResumable(storageRef, file, {
        contentType: file.type,
        customMetadata: {
          uploadedBy: currentUser.id,
          uploadedAt: new Date().toISOString(),
          originalFileName: file.name
        }
      });

      // Wait for upload to complete
      await new Promise<void>((resolve, reject) => {
        uploadTask.on(
          'state_changed',
          (snapshot) => {
            // Optional: Track progress
            const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
            console.log('Upload is ' + progress + '% done');
          },
          (error) => {
            console.error('Upload error:', error);
            reject(error);
          },
          () => {
            console.log('Upload completed successfully');
            resolve();
          }
        );
      });

      // Get download URL
      const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);

      // Update photo URL
      if (isEditing) {
        setEditedProfile(prev => prev ? ({ ...prev, photoURL: downloadURL }) : null);
      } else {
        // Auto-save photo when not in editing mode
        await userRepository.update(currentUser.id, {
          photoURL: downloadURL,
          updatedAt: new Date()
        });

        // Update Firebase Auth profile
        if (auth.currentUser) {
          await updateProfile(auth.currentUser, {
            photoURL: downloadURL
          });
        }

        setProfile(prev => prev ? ({ ...prev, photoURL: downloadURL }) : null);

        // Refresh the user context to update the menu
        await refreshUser();

        alert('Foto atualizada com sucesso!');
      }
    } catch (error: any) {
      console.error('Error uploading photo:', error);

      let errorMessage = 'Erro ao fazer upload da foto. ';

      if (error.code === 'storage/unauthorized') {
        errorMessage += 'Você não tem permissão para fazer upload. Tente fazer logout e login novamente.';
      } else if (error.code === 'storage/quota-exceeded') {
        errorMessage += 'Limite de armazenamento excedido. Entre em contato com o administrador.';
      } else if (error.code === 'storage/unauthenticated') {
        errorMessage += 'Erro de autenticação. Faça login novamente.';
      } else if (error.code === 'storage/retry-limit-exceeded') {
        errorMessage += 'Muitas tentativas. Verifique sua conexão com a internet e tente novamente.';
      } else if (error.code === 'storage/canceled') {
        errorMessage = 'Upload cancelado.';
      } else if (error.code === 'storage/unknown' || error.code === 412) {
        errorMessage += 'Erro no servidor de armazenamento. Isso pode ser causado por problemas de CORS. Aguarde um momento e tente novamente.';
      } else if (error.message) {
        errorMessage += error.message;
      } else {
        errorMessage += 'Tente novamente.';
      }

      alert(errorMessage);
    } finally {
      setUploadingPhoto(false);
      // Clear input for next selection
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemovePhoto = async () => {
    if (!currentUser) return;
    
    if (isEditing) {
      setEditedProfile(prev => prev ? ({ ...prev, photoURL: undefined }) : null);
    } else {
      try {
        // Remove photo from database using deleteField to completely remove the field
        await userRepository.update(currentUser.id, {
          photoURL: deleteField() as any,
          updatedAt: new Date()
        });
        
        // Update Firebase Auth profile
        if (auth.currentUser) {
          await updateProfile(auth.currentUser, {
            photoURL: ''
          });
        }
        
        setProfile(prev => prev ? ({ ...prev, photoURL: undefined }) : null);
        
        // Refresh the user context to update the menu
        await refreshUser();
        
        alert('Foto removida com sucesso!');
      } catch (error) {
        console.error('Error removing photo:', error);
        alert('Erro ao remover foto.');
      }
    }
  };

  const handlePasswordChange = async () => {
    if (!auth.currentUser) {
      alert('Usuário não autenticado');
      return;
    }

    // Validações
    if (!passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword) {
      alert('Todos os campos são obrigatórios');
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      alert('A nova senha e a confirmação não coincidem');
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      alert('A nova senha deve ter pelo menos 6 caracteres');
      return;
    }

    if (passwordForm.currentPassword === passwordForm.newPassword) {
      alert('A nova senha deve ser diferente da senha atual');
      return;
    }

    setChangingPassword(true);

    try {
      // Primeiro, reautenticar o usuário com a senha atual
      const credential = EmailAuthProvider.credential(
        auth.currentUser.email!,
        passwordForm.currentPassword
      );
      
      await reauthenticateWithCredential(auth.currentUser, credential);
      
      // Se a reautenticação foi bem-sucedida, atualizar a senha
      await updatePassword(auth.currentUser, passwordForm.newPassword);
      
      // Limpar o formulário
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      
      alert('✅ Senha alterada com sucesso!');
    } catch (error: any) {
      console.error('Error changing password:', error);
      
      let errorMessage = 'Erro ao alterar senha. Tente novamente.';
      
      switch (error.code) {
        case 'auth/wrong-password':
          errorMessage = 'Senha atual incorreta';
          break;
        case 'auth/weak-password':
          errorMessage = 'A nova senha é muito fraca';
          break;
        case 'auth/too-many-requests':
          errorMessage = 'Muitas tentativas. Tente novamente mais tarde';
          break;
        case 'auth/network-request-failed':
          errorMessage = 'Erro de conexão. Verifique sua internet';
          break;
        default:
          errorMessage = error.message || errorMessage;
      }
      
      alert('❌ ' + errorMessage);
    } finally {
      setChangingPassword(false);
    }
  };

  const handlePasswordFormChange = (field: keyof typeof passwordForm, value: string) => {
    setPasswordForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const getRoleLabel = (role: UserRole | string) => {
    // First check default roles
    const defaultRoles: Record<string, string> = {
      [UserRole.Admin]: 'Administrador',
      [UserRole.Secretary]: 'Secretário',
      [UserRole.Member]: 'Membro',
      [UserRole.Professional]: 'Profissional'
    };

    // Return default role label if exists
    if (defaultRoles[role]) {
      return defaultRoles[role];
    }

    // Otherwise, use PermissionService to get custom role display name
    return permissionService.getRoleDisplayNameSync(role);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando perfil...</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Erro ao carregar perfil.</p>
        </div>
      </div>
    );
  }


  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Meu Perfil</h1>
              <p className="mt-1 text-sm text-gray-600">
                Gerencie suas informações pessoais e preferências
              </p>
            </div>
            <div className="flex space-x-3">
              {!isEditing ? (
                <button
                  onClick={handleEdit}
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  Editar Perfil
                </button>
              ) : (
                <div className="flex space-x-2">
                  <button
                    onClick={handleCancel}
                    className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="px-4 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-green-600 hover:bg-green-700 disabled:opacity-50"
                  >
                    {saving ? 'Salvando...' : 'Salvar'}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="lg:grid lg:grid-cols-12 lg:gap-x-5">
          {/* Profile Photo and Basic Info */}
          <div className="lg:col-span-4">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="text-center">
                <div className="relative mx-auto h-32 w-32 mb-4">
                  <div className="h-32 w-32 rounded-full bg-gradient-to-r from-indigo-400 to-purple-500 flex items-center justify-center overflow-hidden border-4 border-white shadow-lg">
                    {(isEditing ? editedProfile?.photoURL : profile.photoURL) ? (
                      <img
                        src={isEditing ? editedProfile?.photoURL : profile.photoURL}
                        alt={profile.displayName}
                        className="h-32 w-32 rounded-full object-cover"
                        onLoad={() => {
                          // Image loaded successfully
                        }}
                        onError={(e) => {
                          // Handle image loading error silently
                        }}
                      />
                    ) : (
                      <span className="text-4xl text-white font-bold">
                        {profile.displayName.split(' ').map(n => n[0]).join('').substring(0, 2)}
                      </span>
                    )}
                  </div>
                </div>
                
                <h2 className="text-2xl font-bold text-gray-900">{profile.displayName}</h2>
                <p className="text-sm text-gray-600 mb-2">{getRoleLabel(profile.role)}</p>
                <p className="text-sm text-gray-500">{profile.email}</p>
                
                {/* Photo management buttons */}
                <div className="mt-4 flex justify-center space-x-2">
                  <button 
                    onClick={handlePhotoClick}
                    disabled={uploadingPhoto}
                    className="text-indigo-600 hover:text-indigo-800 text-sm font-medium disabled:opacity-50"
                  >
                    {uploadingPhoto ? 'Enviando...' : (isEditing ? editedProfile?.photoURL : profile.photoURL) ? 'Alterar Foto' : 'Adicionar Foto'}
                  </button>
                  
                  {(isEditing ? editedProfile?.photoURL : profile.photoURL) && (
                    <button 
                      onClick={handleRemovePhoto}
                      className="text-red-600 hover:text-red-800 text-sm font-medium"
                    >
                      Remover
                    </button>
                  )}
                </div>
                
                {/* Hidden file input */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoChange}
                  className="hidden"
                />
              </div>

              <div className="mt-6 border-t border-gray-200 pt-6">
                <dl className="space-y-3">
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Membro desde</dt>
                    <dd className="text-sm text-gray-900">
                      {format(profile.createdAt, "dd/MM/yyyy")}
                    </dd>
                  </div>
                  {profile.ministry && (
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Ministério</dt>
                      <dd className="text-sm text-gray-900">{profile.ministry}</dd>
                    </div>
                  )}
                </dl>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="mt-5 lg:mt-0 lg:col-span-8">
            <div className="bg-white rounded-lg shadow">
              {/* Tabs */}
              <div className="border-b border-gray-200">
                <nav className="flex space-x-8 px-6" aria-label="Tabs">
                  {tabs.map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                        activeTab === tab.id
                          ? 'border-indigo-500 text-indigo-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      <span>{tab.icon}</span>
                      <span>{tab.label}</span>
                    </button>
                  ))}
                </nav>
              </div>

              {/* Tab Content */}
              <div className="p-6">
                {activeTab === 'personal' && (
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Nome Completo
                      </label>
                      {isEditing ? (
                        <input
                          type="text"
                          value={editedProfile?.displayName || ''}
                          onChange={(e) => handleInputChange('displayName', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                        />
                      ) : (
                        <p className="text-gray-900">{profile.displayName}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Data de Nascimento
                      </label>
                      {isEditing ? (
                        <input
                          type="date"
                          value={editedProfile?.birthDate ? format(editedProfile.birthDate, 'yyyy-MM-dd') : ''}
                          onChange={(e) => handleInputChange('birthDate', e.target.value ? new Date(e.target.value) : undefined)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                        />
                      ) : (
                        <p className="text-gray-900">
                          {profile.birthDate ? format(profile.birthDate, "dd/MM/yyyy") : 'Não informado'}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Endereço
                      </label>
                      {isEditing ? (
                        <textarea
                          value={editedProfile?.address || ''}
                          onChange={(e) => handleInputChange('address', e.target.value)}
                          rows={3}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                        />
                      ) : (
                        <p className="text-gray-900">{profile.address || 'Não informado'}</p>
                      )}
                    </div>
                  </div>
                )}

                {activeTab === 'contact' && (
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        E-mail
                      </label>
                      <p className="text-gray-900">{profile.email}</p>
                      <p className="text-sm text-gray-500 mt-1">
                        Para alterar o e-mail, entre em contato com a administração
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Telefone
                      </label>
                      {isEditing ? (
                        <input
                          type="tel"
                          value={editedProfile?.phone || ''}
                          onChange={(e) => handleInputChange('phone', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                        />
                      ) : (
                        <p className="text-gray-900">{profile.phone || 'Não informado'}</p>
                      )}
                    </div>

                    <div className="border-t border-gray-200 pt-6">
                      <h3 className="text-lg font-medium text-gray-900 mb-4">Contato de Emergência</h3>
                      
                      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Nome
                          </label>
                          {isEditing ? (
                            <input
                              type="text"
                              value={editedProfile?.emergencyContact?.name || ''}
                              onChange={(e) => handleNestedChange('emergencyContact', 'name', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                            />
                          ) : (
                            <p className="text-gray-900">{profile.emergencyContact?.name || 'Não informado'}</p>
                          )}
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Telefone
                          </label>
                          {isEditing ? (
                            <input
                              type="tel"
                              value={editedProfile?.emergencyContact?.phone || ''}
                              onChange={(e) => handleNestedChange('emergencyContact', 'phone', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                            />
                          ) : (
                            <p className="text-gray-900">{profile.emergencyContact?.phone || 'Não informado'}</p>
                          )}
                        </div>

                        <div className="sm:col-span-2">
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Parentesco
                          </label>
                          {isEditing ? (
                            <input
                              type="text"
                              value={editedProfile?.emergencyContact?.relationship || ''}
                              onChange={(e) => handleNestedChange('emergencyContact', 'relationship', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                            />
                          ) : (
                            <p className="text-gray-900">{profile.emergencyContact?.relationship || 'Não informado'}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'ministry' && (
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Ministério Atual
                      </label>
                      {isEditing ? (
                        <select
                          value={editedProfile?.ministry || ''}
                          onChange={(e) => handleInputChange('ministry', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                        >
                          <option value="">Selecione um ministério</option>
                          <option value="Louvor">Louvor</option>
                          <option value="Ensino">Ensino</option>
                          <option value="Evangelismo">Evangelismo</option>
                          <option value="Ação Social">Ação Social</option>
                          <option value="Intercessão">Intercessão</option>
                          <option value="Juventude">Juventude</option>
                          <option value="Infantil">Ministério Infantil</option>
                          <option value="Mídia">Mídia</option>
                          <option value="Recepção">Recepção</option>
                        </select>
                      ) : (
                        <p className="text-gray-900">{profile.ministry || 'Nenhum ministério selecionado'}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Função/Cargo
                      </label>
                      <p className="text-gray-900">{getRoleLabel(profile.role)}</p>
                    </div>

                    <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                      <div className="flex">
                        <svg className="h-5 w-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                        </svg>
                        <div className="ml-3">
                          <h3 className="text-sm font-medium text-blue-800">
                            Interesse em outros ministérios?
                          </h3>
                          <div className="mt-2 text-sm text-blue-700">
                            <p>
                              Entre em contato com a liderança para expressar interesse em participar de outros ministérios ou mudanças de função.
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'security' && (
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-medium text-gray-900 mb-4">Alterar Senha</h3>
                      
                      {isGoogleUser ? (
                        <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                          <div className="flex">
                            <svg className="h-5 w-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                            </svg>
                            <div className="ml-3">
                              <h3 className="text-sm font-medium text-blue-800">
                                Login via Google
                              </h3>
                              <div className="mt-2 text-sm text-blue-700">
                                <p>
                                  Você fez login usando sua conta Google. A alteração de senha deve ser feita 
                                  diretamente nas configurações da sua conta Google.
                                </p>
                                <div className="mt-3">
                                  <a 
                                    href="https://myaccount.google.com/security" 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                  >
                                    <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                    </svg>
                                    Gerenciar Conta Google
                                  </a>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="max-w-md space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Senha Atual
                          </label>
                          <input
                            type="password"
                            value={passwordForm.currentPassword}
                            onChange={(e) => handlePasswordFormChange('currentPassword', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                            placeholder="Digite sua senha atual"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Nova Senha
                          </label>
                          <input
                            type="password"
                            value={passwordForm.newPassword}
                            onChange={(e) => handlePasswordFormChange('newPassword', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                            placeholder="Digite sua nova senha (mín. 6 caracteres)"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Confirmar Nova Senha
                          </label>
                          <input
                            type="password"
                            value={passwordForm.confirmPassword}
                            onChange={(e) => handlePasswordFormChange('confirmPassword', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                            placeholder="Confirme sua nova senha"
                          />
                        </div>

                        <div className="flex space-x-3">
                          <button
                            onClick={handlePasswordChange}
                            disabled={changingPassword || !passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword}
                            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                          >
                            {changingPassword ? (
                              <>
                                <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Alterando...
                              </>
                            ) : (
                              'Alterar Senha'
                            )}
                          </button>
                          
                          <button
                            onClick={() => setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' })}
                            disabled={changingPassword}
                            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 disabled:opacity-50"
                          >
                            Limpar
                          </button>
                        </div>
                      </div>
                      )}
                    </div>

                    <div className="border-t border-gray-200 pt-6">
                      <h3 className="text-lg font-medium text-gray-900 mb-4">Informações de Segurança</h3>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">Última alteração de senha:</span>
                          <span className="text-sm font-medium text-gray-900">
                            {format(profile.updatedAt, "dd/MM/yyyy 'às' HH:mm")}
                          </span>
                        </div>
                        
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">Conta criada em:</span>
                          <span className="text-sm font-medium text-gray-900">
                            {format(profile.createdAt, "dd/MM/yyyy 'às' HH:mm")}
                          </span>
                        </div>
                        
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">E-mail de login:</span>
                          <span className="text-sm font-medium text-gray-900">{profile.email}</span>
                        </div>
                        
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">Tipo de login:</span>
                          <span className="text-sm font-medium text-gray-900">
                            {isGoogleUser ? (
                              <span className="inline-flex items-center">
                                <svg className="w-4 h-4 mr-1" viewBox="0 0 24 24">
                                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                                </svg>
                                Google
                              </span>
                            ) : (
                              "E-mail e senha"
                            )}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
                      <div className="flex">
                        <svg className="h-5 w-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                        <div className="ml-3">
                          <h3 className="text-sm font-medium text-yellow-800">
                            Dicas de Segurança
                          </h3>
                          <div className="mt-2 text-sm text-yellow-700">
                            {isGoogleUser ? (
                              <ul className="list-disc list-inside space-y-1">
                                <li>Mantenha sua conta Google segura com autenticação de dois fatores</li>
                                <li>Revise regularmente as atividades da sua conta Google</li>
                                <li>Use uma senha forte na sua conta Google</li>
                                <li>Não compartilhe suas credenciais Google com outras pessoas</li>
                                <li>Mantenha seu dispositivo seguro com bloqueio de tela</li>
                              </ul>
                            ) : (
                              <ul className="list-disc list-inside space-y-1">
                                <li>Use uma senha forte com pelo menos 8 caracteres</li>
                                <li>Inclua letras maiúsculas, minúsculas, números e símbolos</li>
                                <li>Não compartilhe sua senha com outras pessoas</li>
                                <li>Altere sua senha regularmente</li>
                                <li>Não use a mesma senha em outros sites</li>
                              </ul>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'preferences' && (
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-medium text-gray-900 mb-4">Notificações</h3>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="text-sm font-medium text-gray-900">Notificações Push</h4>
                            <p className="text-sm text-gray-500">Receber notificações no navegador</p>
                          </div>
                          <input
                            type="checkbox"
                            checked={isEditing ? editedProfile?.preferences.notifications || false : profile.preferences.notifications}
                            onChange={(e) => isEditing && handleNestedChange('preferences', 'notifications', e.target.checked)}
                            disabled={!isEditing}
                            className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 disabled:opacity-50"
                          />
                        </div>

                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="text-sm font-medium text-gray-900">E-mails Informativos</h4>
                            <p className="text-sm text-gray-500">Receber boletins e comunicados por e-mail</p>
                          </div>
                          <input
                            type="checkbox"
                            checked={isEditing ? editedProfile?.preferences.emailUpdates || false : profile.preferences.emailUpdates}
                            onChange={(e) => isEditing && handleNestedChange('preferences', 'emailUpdates', e.target.checked)}
                            disabled={!isEditing}
                            className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 disabled:opacity-50"
                          />
                        </div>

                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="text-sm font-medium text-gray-900">Lembretes de Eventos</h4>
                            <p className="text-sm text-gray-500">Receber lembretes de eventos confirmados</p>
                          </div>
                          <input
                            type="checkbox"
                            checked={isEditing ? editedProfile?.preferences.eventReminders || false : profile.preferences.eventReminders}
                            onChange={(e) => isEditing && handleNestedChange('preferences', 'eventReminders', e.target.checked)}
                            disabled={!isEditing}
                            className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 disabled:opacity-50"
                          />
                        </div>
                      </div>
                    </div>

                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};