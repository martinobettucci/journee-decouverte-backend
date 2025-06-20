import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { supabase } from '../lib/supabase';
import MediaHighlightForm from './forms/MediaHighlightForm';
import type { MediaHighlight } from '../types/database';

const MediaHighlightsTab: React.FC = () => {
  const [highlights, setHighlights] = useState<MediaHighlight[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingHighlight, setEditingHighlight] = useState<MediaHighlight | null>(null);

  useEffect(() => {
    fetchHighlights();
  }, []);

  const fetchHighlights = async () => {
    try {
      const { data, error } = await supabase
        .from('media_highlights')
        .select('*')
        .order('date', { ascending: false });
      if (error) throw error;
      setHighlights(data || []);
    } catch (err) {
      console.error('Erreur lors du chargement des médias:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (h: MediaHighlight) => {
    setEditingHighlight(h);
    setShowForm(true);
  };

  const handleDelete = async (h: MediaHighlight) => {
    if (!confirm('Supprimer cette mise en avant média ?')) return;
    try {
      const { error } = await supabase.from('media_highlights').delete().eq('id', h.id);
      if (error) throw error;
      fetchHighlights();
    } catch (err) {
      console.error('Erreur lors de la suppression:', err);
    }
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingHighlight(null);
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
        <h2 className="text-2xl font-bold text-gray-900">Gestion des Médias</h2>
        <button
          onClick={() => { setEditingHighlight(null); setShowForm(true); }}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
        >
          <Plus size={20} />
          <span>Nouveau Média</span>
        </button>
      </div>

      <div className="bg-white shadow-sm rounded-lg overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Média</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Titre</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Image</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {highlights.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-4 text-center text-gray-500">Aucun média trouvé</td>
              </tr>
            ) : (
              highlights.map((h) => (
                <tr key={h.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap flex items-center space-x-2">
                    <img src={h.media_logo} alt={h.media_name} className="h-8 w-8 object-contain" />
                    <span className="text-sm font-medium text-gray-900">{h.media_name}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{h.title}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {format(new Date(h.date), 'dd/MM/yyyy', { locale: fr })}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <img src={h.image_url} alt={h.title} className="h-12 w-12 object-cover rounded" />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                    <button onClick={() => handleEdit(h)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                      <Edit2 size={18} />
                    </button>
                    <button onClick={() => handleDelete(h)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showForm && (
        <MediaHighlightForm
          highlight={editingHighlight}
          onClose={handleCloseForm}
          onSave={fetchHighlights}
        />
      )}
    </div>
  );
};

export default MediaHighlightsTab;
