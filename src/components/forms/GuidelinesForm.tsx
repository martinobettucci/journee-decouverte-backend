import React, { useState, useEffect } from 'react';
import { X, Save, Calendar, FileText, Eye, EyeOff } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import MarkdownRenderer from '../common/MarkdownRenderer';
import type { WorkshopGuidelines } from '../../types/database';

interface GuidelinesFormProps {
  guidelines?: WorkshopGuidelines | null;
  onClose: () => void;
  onSave: () => void;
}

const GuidelinesForm: React.FC<GuidelinesFormProps> = ({ guidelines, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    workshop_date: '',
    guidelines_markdown: ''
  });
  const [workshopDates, setWorkshopDates] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    fetchWorkshopDates();
    if (guidelines) {
      setFormData({
        workshop_date: guidelines.workshop_date,
        guidelines_markdown: guidelines.guidelines_markdown
      });
    }
  }, [guidelines]);

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
      const guidelinesData = {
        workshop_date: formData.workshop_date,
        guidelines_markdown: formData.guidelines_markdown
      };

      if (guidelines) {
        const { error } = await supabase
          .from('workshop_guidelines')
          .update(guidelinesData)
          .eq('workshop_date', guidelines.workshop_date);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('workshop_guidelines')
          .insert([guidelinesData]);
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

  const insertTemplate = () => {
    const template = `# Directives de l'Atelier

## Objectifs
- Objectif 1
- Objectif 2
- Objectif 3

## Règles de conduite
1. **Respect mutuel** : Tous les participants doivent faire preuve de respect envers les autres.
2. **Ponctualité** : Arrivée à l'heure pour toutes les sessions.
3. **Participation active** : Engagement dans les activités proposées.

## Programme de la journée
- **9h00 - 9h30** : Accueil et présentation
- **9h30 - 11h00** : Session 1
- **11h00 - 11h15** : Pause
- **11h15 - 12h30** : Session 2

## Matériel requis
- Ordinateur portable
- Cahier de notes
- Stylo

## Contact
Pour toute question, contactez l'équipe d'organisation.`;

    setFormData(prev => ({ ...prev, guidelines_markdown: template }));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-7xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">
            {guidelines ? 'Modifier les directives' : 'Nouvelles directives'}
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
              disabled={!!guidelines}
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

          {/* Mode Toggle */}
          <div className="flex items-center justify-between">
            <label className="flex items-center space-x-2 text-sm font-medium text-gray-700">
              <FileText size={16} />
              <span>Contenu des directives (Markdown) *</span>
            </label>
            <div className="flex items-center space-x-2">
              {/* Template Button */}
              <button
                type="button"
                onClick={insertTemplate}
                className="px-3 py-1 text-xs font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded transition-colors"
              >
                Insérer un modèle
              </button>
              
              {/* Preview Toggle */}
              <button
                type="button"
                onClick={() => setShowPreview(!showPreview)}
                className={`flex items-center space-x-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                  showPreview 
                    ? 'text-white bg-green-600 hover:bg-green-700' 
                    : 'text-gray-700 bg-gray-100 hover:bg-gray-200'
                }`}
              >
                {showPreview ? <EyeOff size={16} /> : <Eye size={16} />}
                <span>{showPreview ? 'Retour à l\'édition' : 'Prévisualiser'}</span>
              </button>
            </div>
          </div>

          {/* Editor or Preview */}
          {showPreview ? (
            /* Preview Mode */
            <div className="space-y-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <Eye className="text-green-600" size={16} />
                  <span className="font-medium text-green-900">Mode Prévisualisation</span>
                </div>
                <p className="text-sm text-green-700">
                  Aperçu du rendu final des directives de l'atelier.
                </p>
              </div>
              
              <div className="bg-white border border-gray-200 rounded-lg p-6 max-h-96 overflow-y-auto">
                {formData.guidelines_markdown ? (
                  <MarkdownRenderer 
                    content={formData.guidelines_markdown}
                    style={{ fontSize: '14px' }}
                  />
                ) : (
                  <div className="text-center py-12 text-gray-500">
                    <FileText className="mx-auto mb-4" size={48} />
                    <p className="text-lg font-medium mb-2">Aucun contenu à prévisualiser</p>
                    <p className="text-sm">Retournez en mode édition pour saisir du contenu Markdown</p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* Editor Mode */
            <div className="space-y-4">
              <textarea
                required
                rows={24}
                value={formData.guidelines_markdown}
                onChange={(e) => setFormData(prev => ({ ...prev, guidelines_markdown: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm resize-none"
                placeholder="Rédigez les directives en Markdown..."
              />
              <p className="text-xs text-gray-500">
                Utilisez la syntaxe Markdown pour formater le contenu (titres, listes, liens, etc.)
              </p>
            </div>
          )}

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

export default GuidelinesForm;