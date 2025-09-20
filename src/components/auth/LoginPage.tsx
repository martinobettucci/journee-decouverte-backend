import React, { useState, useEffect } from 'react';
import { LogIn, UserPlus, Lock, Mail, User, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';

const LoginPage: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [canRegister, setCanRegister] = useState(false);
  const [checkingBackoffice, setCheckingBackoffice] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { signIn, signUp } = useAuth();

  useEffect(() => {
    checkBackofficeExists();
  }, []);

  const checkBackofficeExists = async () => {
    try {
      setCheckingBackoffice(true);
      const { data, error } = await supabase
        .from('user_profiles')
        .select('id')
        .eq('role', 'backoffice')
        .limit(1);

      if (error) {
        console.error('Error checking backoffice role:', error);
        setCanRegister(false);
      } else {
        // If no backoffice user exists, allow registration
        setCanRegister(!data || data.length === 0);
      }
    } catch (error) {
      console.error('Error in checkBackofficeExists:', error);
      setCanRegister(false);
    } finally {
      setCheckingBackoffice(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (isLogin) {
        const { error } = await signIn(formData.email, formData.password);
        if (error) {
          if (error.message.includes('Invalid login credentials')) {
            setError('Email ou mot de passe incorrect');
          } else {
            setError(error.message);
          }
        }
      } else {
        const { error } = await signUp(
          formData.email, 
          formData.password, 
          formData.firstName, 
          formData.lastName
        );
        if (error) {
          if (error.message.includes('User already registered')) {
            setError('Un compte existe déjà avec cette adresse email');
          } else {
            setError(error.message);
          }
        }
      }
    } catch (error: any) {
      setError(error.message || 'Une erreur est survenue');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      email: '',
      password: '',
      firstName: '',
      lastName: ''
    });
    setError('');
  };

  const handleModeSwitch = (loginMode: boolean) => {
    setIsLogin(loginMode);
    resetForm();
  };

  if (checkingBackoffice) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-lg">
          <div className="flex items-center space-x-3">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            <span className="text-gray-700">Vérification du système...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
        <div className="p-8">
          <div className="text-center mb-8">
            <div className="mx-auto w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mb-4">
              <Lock className="text-white" size={24} />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">
              Administration
            </h1>
            <p className="text-gray-600 mt-2">
              {isLogin ? 'Connectez-vous à votre compte' : 'Créez votre compte administrateur'}
            </p>
          </div>

          {/* Mode Toggle */}
          <div className="flex mb-6 bg-gray-100 p-1 rounded-lg">
            <button
              type="button"
              onClick={() => handleModeSwitch(true)}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                isLogin
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <LogIn size={16} className="inline mr-2" />
              Connexion
            </button>
            <button
              type="button"
              onClick={() => handleModeSwitch(false)}
              disabled={!canRegister}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                !isLogin
                  ? 'bg-white text-gray-900 shadow-sm'
                  : canRegister
                    ? 'text-gray-600 hover:text-gray-900'
                    : 'text-gray-400 cursor-not-allowed'
              }`}
              title={!canRegister ? 'Un administrateur existe déjà' : ''}
            >
              <UserPlus size={16} className="inline mr-2" />
              Inscription
            </button>
          </div>

          {!canRegister && !isLogin && (
            <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
              <div className="flex items-start space-x-2">
                <Lock className="text-amber-600 mt-0.5" size={16} />
                <div>
                  <p className="text-sm font-medium text-amber-800">
                    Inscription fermée
                  </p>
                  <p className="text-sm text-amber-700 mt-1">
                    Un administrateur existe déjà. Seule la connexion est autorisée.
                  </p>
                </div>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
                {error}
              </div>
            )}

            {!isLogin && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 mb-2">
                    <User size={16} />
                    <span>Prénom *</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.firstName}
                    onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Votre prénom"
                  />
                </div>
                <div>
                  <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 mb-2">
                    <User size={16} />
                    <span>Nom *</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.lastName}
                    onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Votre nom"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 mb-2">
                <Mail size={16} />
                <span>Email *</span>
              </label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="votre@email.com"
              />
            </div>

            <div>
              <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 mb-2">
                <Lock size={16} />
                <span>Mot de passe *</span>
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={formData.password}
                  onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                  className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Votre mot de passe"
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {!isLogin && (
                <p className="text-xs text-gray-500 mt-1">
                  Minimum 6 caractères
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading || (!isLogin && !canRegister)}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md font-medium transition-colors flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>{isLogin ? 'Connexion...' : 'Inscription...'}</span>
                </>
              ) : (
                <>
                  {isLogin ? <LogIn size={16} /> : <UserPlus size={16} />}
                  <span>{isLogin ? 'Se connecter' : 'S\'inscrire'}</span>
                </>
              )}
            </button>
          </form>

          {canRegister && (
            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-start space-x-2">
                <UserPlus className="text-blue-600 mt-0.5" size={16} />
                <div>
                  <p className="text-sm font-medium text-blue-800">
                    Premier administrateur
                  </p>
                  <p className="text-sm text-blue-700 mt-1">
                    Aucun administrateur n'existe encore. Vous pouvez créer le premier compte administrateur.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LoginPage;