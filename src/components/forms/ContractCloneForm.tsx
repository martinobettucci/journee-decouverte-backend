import React, { useState, useEffect } from 'react';
import { X, Save, Calendar, Type, Copy, Users, Building, Heart } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import type { ContractTemplate } from '../../types/database';

interface ContractCloneFormProps {
  sourceContract: ContractTemplate;
  onClose: () => void;
  onSave: () => void;
}

const ContractCloneForm: React.FC<ContractCloneFormProps> = ({ sourceContract, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    workshop_date: '',
    name: '',
    type: sourceContract.type,
    is_volunteer: sourceContract.is_volunteer || false,
    content_markdown: sourceContract.content_markdown
  });
  const [workshopDates, setWorkshopDates] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchWorkshopDates();
    // Pre-fill the name with a cloned version
    setFormData(prev => ({
      ...prev,
      name: `${sourceContract.name} (Copie)`
    }));
  }, [sourceContract]);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const contractData = {
        workshop_date: formData.workshop_date,
        name: formData.name,
        type: formData.type,
        is_volunteer: formData.is_volunteer,
        content_markdown: formData.content_markdown
      };

      const { error } = await supabase
        .from('contract_templates')
        .insert([contractData]);
        
      if (error) throw error;

      onSave();
      onClose();
    } catch (error: any) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const getTypeIcon = (type: 'trainer' | 'client') => {
    return type === 'trainer' ? (
      <Users className="text-blue-600" size={16} />
    ) : (
      <Building className="text-purple-600" size={16} />
    );
  };

  const getTypeColor = (type: 'trainer' | 'client') => {
    return type === 'trainer' 
      ? 'text-blue-600 bg-blue-50 border-blue-200' 
      : 'text-purple-600 bg-purple-50 border-purple-200';
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center space-x-3">
            <Copy className="text-purple-600" size={24} />
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                Cloner le contrat
              </h2>
              <p className="text-sm text-gray-600">
                Créer une copie de "{sourceContract.name}"
              </p>
            </div>
          </div>
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

          {/* Source contract info */}
          <div className={`p-4 rounded-lg border ${getTypeColor(sourceContract.type)}`}>
            <div className="flex items-center space-x-2 mb-2">
              {getTypeIcon(sourceContract.type)}
              <span className="font-medium">Contrat source</span>
              {sourceContract.is_volunteer && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-pink-100 text-pink-800">
                  <Heart size={12} className="mr-1" />
                  Bénévole
                </span>
              )}
            </div>
            <p className="text-sm">
              <strong>{sourceContract.name}</strong> ({sourceContract.type === 'trainer' ? 'Formateur' : 'Client'})
            </p>
            <p className="text-xs text-gray-600">
              Atelier du {new Date(sourceContract.workshop_date).toLocaleDateString('fr-FR', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 mb-2">
                <Calendar size={16} />
                <span>Nouvel atelier *</span>
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
                <Type size={16} />
                <span>Nom du nouveau contrat *</span>
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Nom du contrat cloné"
              />
            </div>
          </div>

          {/* Volunteer flag - only for trainer contracts */}
          {formData.type === 'trainer' && (
            <div>
              <label className="flex items-center space-x-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.is_volunteer}
                  onChange={(e) => setFormData(prev => ({ ...prev, is_volunteer: e.target.checked }))}
                  className="w-4 h-4 text-pink-600 border-gray-300 rounded focus:ring-pink-500"
                />
                <div className="flex items-center space-x-2">
                  <Heart size={16} className="text-pink-600" />
                  <span className="text-sm text-gray-700">Contrat bénévole</span>
                </div>
              </label>
              <p className="text-xs text-gray-500 mt-2 ml-7">
                Si activé, une attestation de volontariat sera demandée au lieu d'une facture et d'un RIB lors de l'inscription.
              </p>
            </div>
          )}

          <div>
            <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 mb-2">
              <Copy size={16} />
              <span>Contenu cloné (Markdown)</span>
            </label>
            <div className="bg-gray-50 rounded-md p-4 mb-3">
              <p className="text-sm text-gray-600 mb-2">
                Le contenu suivant sera copié dans le nouveau contrat. Vous pourrez le modifier après création.
              </p>
              <div className="max-h-48 overflow-y-auto bg-white border rounded p-3">
                <pre className="text-xs text-gray-700 whitespace-pre-wrap break-words">
                  {formData.content_markdown.substring(0, 1000)}
                  {formData.content_markdown.length > 1000 && '\n\n... (contenu tronqué pour l\'aperçu)'}
                </pre>
              </div>
            </div>
            <p className="text-xs text-gray-500">
              Le contenu complet sera copié. Vous pourrez le modifier dans l'onglet "Modifier" après création.
            </p>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
            <h4 className="text-sm font-medium text-blue-900 mb-2">Information</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Le contenu Markdown sera copié intégralement</li>
              <li>• Le type de contrat sera conservé ({sourceContract.type === 'trainer' ? 'Formateur' : 'Client'})</li>
              <li>• Le statut bénévole sera {sourceContract.is_volunteer ? 'conservé' : 'désactivé par défaut'}</li>
              <li>• Seuls la date d'atelier et le nom seront différents</li>
              <li>• Vous pourrez modifier le contenu après création</li>
            </ul>
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
              className="px-4 py-2 text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 rounded-md transition-colors flex items-center space-x-2 disabled:opacity-50"
            >
              <Copy size={16} />
              <span>{loading ? 'Clonage...' : 'Cloner le contrat'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ContractCloneForm;