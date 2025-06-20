import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import InitiativeForm from './forms/InitiativeForm';
import type { Initiative } from '../types/database';

const bucket = 'initiatives';

const InitiativesTab: React.FC = () => {
  const [initiatives, setInitiatives] = useState<Initiative[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingInitiative, setEditingInitiative] = useState<Initiative | null>(null);

  useEffect(() => {
    fetchInitiatives();
  }, []);

  const fetchInitiatives = async () => {
    try {
      const { data, error } = await supabase
        .from('initiatives')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      setInitiatives(data || []);
    } catch (error) {
      console.error('Erreur lors du chargement des initiatives:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (initiative: Initiative) => {
    setEditingInitiative(initiative);
    setShowForm(true);
  };

  const handleDelete = async (initiative: Initiative) => {
    if (!confirm('Supprimer cette initiative ?')) return;
    try {
      if (initiative.image_url) {
        await supabase.storage.from(bucket).remove([initiative.image_url]);
      }
      if (initiative.logo_url) {
        await supabase.storage.from(bucket).remove([initiative.logo_url]);
      }
      const { error } = await supabase.from('initiatives').delete().eq('id', initiative.id);
      if (error) throw error;
      fetchInitiatives();
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
    }
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingInitiative(null);
  };

  const getPublicUrl = (path: string) => {
    const { data } = supabase.storage.from(bucket).getPublicUrl(path);
    return data.publicUrl;
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
        <h2 className="text-2xl font-bold text-gray-900">Gestion des Initiatives</h2>
        <button
          onClick={() => {
            setEditingInitiative(null);
            setShowForm(true);
          }}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
        >
          <Plus size={20} />
          <span>Nouvelle Initiative</span>
        </button>
      </div>

      <div className="bg-white shadow-sm rounded-lg overflow-hidden">
        <div className="grid gap-6 p-6">
          {initiatives.length === 0 ? (
            <div className="text-center py-12 text-gray-500">Aucune initiative trouvée</div>
          ) : (
            initiatives.map((initiative) => (
              <div
                key={initiative.id}
                className="border border-gray-200 rounded-lg p-6 flex justify-between items-start hover:shadow-md transition-shadow"
              >
                <div className="flex space-x-4">
                  {initiative.logo_url && (
                    <img src={getPublicUrl(initiative.logo_url)} alt={initiative.title} className="h-16 w-16 object-contain" />
                  )}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{initiative.title}</h3>
                    <p className="text-gray-700 mb-1">{initiative.description}</p>
                    {initiative.locations.length > 0 && (
                      <p className="text-sm text-gray-500">Lieux: {initiative.locations.join(', ')}</p>
                    )}
                    {initiative.specializations.length > 0 && (
                      <p className="text-sm text-gray-500">Spécialisations: {initiative.specializations.join(', ')}</p>
                    )}
                  </div>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleEdit(initiative)}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  >
                    <Edit2 size={18} />
                  </button>
                  <button
                    onClick={() => handleDelete(initiative)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {showForm && (
        <InitiativeForm
          initiative={editingInitiative}
          onClose={handleCloseForm}
          onSave={fetchInitiatives}
        />
      )}
    </div>
  );
};

export default InitiativesTab;
