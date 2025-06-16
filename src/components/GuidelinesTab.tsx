import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, FileText } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { supabase } from '../lib/supabase';
import GuidelinesForm from './forms/GuidelinesForm';
import type { WorkshopGuidelines } from '../types/database';

const GuidelinesTab: React.FC = () => {
  const [guidelines, setGuidelines] = useState<WorkshopGuidelines[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingGuidelines, setEditingGuidelines] = useState<WorkshopGuidelines | null>(null);

  useEffect(() => {
    fetchGuidelines();
  }, []);

  const fetchGuidelines = async () => {
    try {
      const { data, error } = await supabase
        .from('workshop_guidelines')
        .select('*')
        .order('workshop_date', { ascending: false });

      if (error) throw error;
      setGuidelines(data || []);
    } catch (error) {
      console.error('Erreur lors du chargement des directives:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (guidelines: WorkshopGuidelines) => {
    setEditingGuidelines(guidelines);
    setShowForm(true);
  };

  const handleDelete = async (workshop_date: string) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer ces directives ?')) {
      try {
        const { error } = await supabase
          .from('workshop_guidelines')
          .delete()
          .eq('workshop_date', workshop_date);

        if (error) throw error;
        fetchGuidelines();
      } catch (error) {
        console.error('Erreur lors de la suppression:', error);
      }
    }
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingGuidelines(null);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Directives des Ateliers</h2>
        <button
          onClick={() => {
            setEditingGuidelines(null);
            setShowForm(true);
          }}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
        >
          <Plus size={20} />
          <span>Nouvelles Directives</span>
        </button>
      </div>

      <div className="bg-white shadow-sm rounded-lg overflow-hidden">
        <div className="grid gap-6 p-6">
          {guidelines.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              Aucune directive trouvée
            </div>
          ) : (
            guidelines.map((guideline) => (
              <div
                key={guideline.workshop_date}
                className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center space-x-2">
                    <FileText className="text-blue-600" size={20} />
                    <h3 className="text-lg font-semibold text-gray-900">
                      Directives du {format(new Date(guideline.workshop_date), 'dd MMMM yyyy', { locale: fr })}
                    </h3>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleEdit(guideline)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    >
                      <Edit2 size={18} />
                    </button>
                    <button
                      onClick={() => handleDelete(guideline.workshop_date)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-md p-4">
                  <h4 className="text-sm font-medium text-gray-900 mb-2">Contenu Markdown:</h4>
                  <div className="max-h-96 overflow-y-auto">
                    <pre className="text-sm text-gray-700 whitespace-pre-wrap break-words">
                      {guideline.guidelines_markdown}
                    </pre>
                  </div>
                </div>

                {guideline.created_at && (
                  <div className="mt-3 text-xs text-gray-500">
                    Créé le {format(new Date(guideline.created_at), 'dd MMMM yyyy à HH:mm', { locale: fr })}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {showForm && (
        <GuidelinesForm
          guidelines={editingGuidelines}
          onClose={handleCloseForm}
          onSave={fetchGuidelines}
        />
      )}
    </div>
  );
};

export default GuidelinesTab;