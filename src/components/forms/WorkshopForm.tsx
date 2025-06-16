import React, { useState, useEffect } from 'react';
import { X, Save, Calendar, Key, Settings } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import type { WorkshopPassword } from '../../types/database';

interface WorkshopFormProps {
  workshop?: WorkshopPassword | null;
  onClose: () => void;
  onSave: () => void;
}

const WorkshopForm: React.FC<WorkshopFormProps> = ({ workshop, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    date: '',
    password: '',
    available_tools: {
      chatbot: true,
      resources: false,
      automation: true,
      audio_music: true,
      experiments: false,
      image_generation: true,
      video_generation: true
    }
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (workshop) {
      setFormData({
        date: workshop.date,
        password: workshop.password,
        available_tools: workshop.available_tools
      });
    }
  }, [workshop]);

  const generatePassword = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let password = '';
    for (let i = 0; i < 8; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setFormData(prev => ({ ...prev, password }));
  };

  const handleToolChange = (tool: string, enabled: boolean) => {
    setFormData(prev => ({
      ...prev,
      available_tools: {
        ...prev.available_tools,
        [tool]: enabled
      }
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const workshopData = {
        date: formData.date,
        password: formData.password,
        available_tools: formData.available_tools
      };

      if (workshop) {
        const { error } = await supabase
          .from('workshop_passwords')
          .update(workshopData)
          .eq('id', workshop.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('workshop_passwords')
          .insert([workshopData]);
        if (error) throw error;
      }

      onSave();
      onClose();
    } catch (error: any) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const toolLabels = {
    chatbot: 'Chatbot',
    resources: 'Ressources',
    automation: 'Automatisation',
    audio_music: 'Audio/Musique',
    experiments: 'Expérimentations',
    image_generation: 'Génération d\'images',
    video_generation: 'Génération de vidéos'
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">
            {workshop ? 'Modifier l\'atelier' : 'Nouvel atelier'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
              {error}
            </div>
          )}

          <div>
            <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 mb-2">
              <Calendar size={16} />
              <span>Date de l'atelier *</span>
            </label>
            <input
              type="date"
              required
              value={formData.date}
              onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 mb-2">
              <Key size={16} />
              <span>Mot de passe *</span>
            </label>
            <div className="flex space-x-2">
              <input
                type="text"
                required
                value={formData.password}
                onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono"
                placeholder="Mot de passe d'accès"
              />
              <button
                type="button"
                onClick={generatePassword}
                className="px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-md transition-colors"
              >
                Générer
              </button>
            </div>
          </div>

          <div>
            <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 mb-4">
              <Settings size={16} />
              <span>Outils disponibles</span>
            </label>
            <div className="grid grid-cols-2 gap-3">
              {Object.entries(toolLabels).map(([tool, label]) => (
                <label key={tool} className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.available_tools[tool as keyof typeof formData.available_tools]}
                    onChange={(e) => handleToolChange(tool, e.target.checked)}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">{label}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors flex items-center space-x-2 disabled:opacity-50"
            >
              <Save size={16} />
              <span>{loading ? 'Enregistrement...' : 'Enregistrer'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default WorkshopForm;