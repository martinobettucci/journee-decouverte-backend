import React, { useState, useEffect } from 'react';
import { X, Save, Calendar, Key, User } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import type { WorkshopTrainer } from '../../types/database';

interface TrainerFormProps {
  trainer?: WorkshopTrainer | null;
  onClose: () => void;
  onSave: () => void;
}

const TrainerForm: React.FC<TrainerFormProps> = ({ trainer, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    workshop_date: '',
    trainer_code: '',
    is_claimed: false
  });
  const [workshopDates, setWorkshopDates] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchWorkshopDates();
    if (trainer) {
      setFormData({
        workshop_date: trainer.workshop_date,
        trainer_code: trainer.trainer_code,
        is_claimed: trainer.is_claimed
      });
    }
  }, [trainer]);

  const fetchWorkshopDates = async () => {
    try {
      const { data, error } = await supabase
        .from('workshop_passwords')
        .select('date')
        .order('date', { ascending: false });

      if (error) throw error;
      setWorkshopDates(data?.map(w => w.date) || []);
    } catch (error) {
      console.error('Erreur lors du chargement des dates d\'ateliers:', error);
    }
  };

  const generateTrainerCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = 'T-';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setFormData(prev => ({ ...prev, trainer_code: code }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const trainerData = {
        workshop_date: formData.workshop_date,
        trainer_code: formData.trainer_code,
        is_claimed: formData.is_claimed
      };

      if (trainer) {
        const { error } = await supabase
          .from('workshop_trainers')
          .update(trainerData)
          .eq('id', trainer.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('workshop_trainers')
          .insert([trainerData]);
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

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-lg w-full">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">
            {trainer ? 'Modifier le formateur' : 'Nouveau formateur'}
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
              <span>Atelier *</span>
            </label>
            <select
              required
              value={formData.workshop_date}
              onChange={(e) => setFormData(prev => ({ ...prev, workshop_date: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Sélectionner un atelier</option>
              {workshopDates.map(date => (
                <option key={date} value={date}>
                  {new Date(date).toLocaleDateString('fr-FR', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 mb-2">
              <Key size={16} />
              <span>Code formateur *</span>
            </label>
            <div className="flex space-x-2">
              <input
                type="text"
                required
                value={formData.trainer_code}
                onChange={(e) => setFormData(prev => ({ ...prev, trainer_code: e.target.value }))}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono"
                placeholder="Code unique du formateur"
              />
              <button
                type="button"
                onClick={generateTrainerCode}
                className="px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-md transition-colors"
              >
                Générer
              </button>
            </div>
          </div>

          <div>
            <label className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.is_claimed}
                onChange={(e) => setFormData(prev => ({ ...prev, is_claimed: e.target.checked }))}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <div className="flex items-center space-x-2">
                <User size={16} className="text-gray-600" />
                <span className="text-sm text-gray-700">Code déjà utilisé</span>
              </div>
            </label>
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

export default TrainerForm;