import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { supabase } from '../lib/supabase';
import { resolveImageUrl } from '../lib/image';
import MediaHighlightForm from './forms/MediaHighlightForm';
import ConfirmationModal from './common/ConfirmationModal';
import NotificationModal from './common/NotificationModal';
import type { MediaHighlight } from '../types/database';

const bucket = 'media-highlights';

const MediaHighlightsTab: React.FC = () => {
  const [highlights, setHighlights] = useState<MediaHighlight[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [editingHighlight, setEditingHighlight] = useState<MediaHighlight | null>(null);
  const [deleteTargetHighlight, setDeleteTargetHighlight] = useState<MediaHighlight | null>(null);
  const [notification, setNotification] = useState<{
    title: string;
    message: string;
    type: 'success' | 'error' | 'warning' | 'info';
  }>({ title: '', message: '', type: 'info' });
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    fetchHighlights();
  }, []);

  const showNotification = (title: string, message: string, type: 'success' | 'error' | 'warning' | 'info' = 'info') => {
    setNotification({ title, message, type });
    setShowNotificationModal(true);
  };

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
      showNotification(
        'Erreur de chargement',
        'Une erreur est survenue lors du chargement des médias.',
        'error'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (h: MediaHighlight) => {
    setEditingHighlight(h);
    setShowForm(true);
  };

  const handleDeleteClick = (h: MediaHighlight) => {
    setDeleteTargetHighlight(h);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTargetHighlight) return;

    try {
      setIsDeleting(true);
      const { error } = await supabase.from('media_highlights').delete().eq('id', deleteTargetHighlight.id);
      if (error) throw error;
      
      setShowDeleteModal(false);
      setDeleteTargetHighlight(null);
      showNotification(
        'Média supprimé',
        'Le média a été supprimé avec succès.',
        'success'
      );
      fetchHighlights();
    } catch (err) {
      console.error('Erreur lors de la suppression:', err);
      showNotification(
        'Erreur de suppression',
        'Une erreur est survenue lors de la suppression du média.',
        'error'
      );
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDeleteCancel = () => {
    setShowDeleteModal(false);
    setDeleteTargetHighlight(null);
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

      <div className="bg-white shadow-sm rounded-lg overflow-hidden">
        <div className="grid gap-6 p-6">
          {highlights.length === 0 ? (
            <div className="text-center py-12 text-gray-500">Aucun média trouvé</div>
          ) : (
            highlights.map((h) => (
              <div key={h.id} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <img
                        src={resolveImageUrl(h.media_logo, bucket, supabase)}
                        alt={h.media_name}
                        className="h-8 w-8 object-contain"
                      />
                      <h3 className="text-lg font-semibold text-gray-900">{h.title}</h3>
                    </div>
                    <p className="text-sm text-gray-600">
                      {h.media_name} - {format(new Date(h.date), 'dd/MM/yyyy', { locale: fr })}
                    </p>
                    <div className="mt-2">
                      <img
                        src={resolveImageUrl(h.image_url, bucket, supabase)}
                        alt={h.title}
                        className="h-32 w-full object-cover rounded"
                      />
                    </div>
                  </div>
                  <div className="flex space-x-2 ml-4">
                    <button onClick={() => handleEdit(h)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                      <Edit2 size={18} />
                    </button>
                    <button onClick={() => handleDeleteClick(h)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {showForm && (
        <MediaHighlightForm
          highlight={editingHighlight}
          onClose={handleCloseForm}
          onSave={fetchHighlights}
        />
      )}

      <ConfirmationModal
        isOpen={showDeleteModal}
        onClose={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
        title="Supprimer le média"
        message={deleteTargetHighlight ? 
          `Êtes-vous sûr de vouloir supprimer cette mise en avant média ?\n\nTitre: "${deleteTargetHighlight.title}"\nMédia: ${deleteTargetHighlight.media_name}\n\nCette action ne peut pas être annulée.` : 
          ''
        }
        confirmText="Supprimer définitivement"
        cancelText="Annuler"
        type="danger"
        loading={isDeleting}
      />

      <NotificationModal
        isOpen={showNotificationModal}
        onClose={() => setShowNotificationModal(false)}
        title={notification.title}
        message={notification.message}
        type={notification.type}
        autoClose={notification.type === 'success'}
        autoCloseDelay={3000}
      />
    </div>
  );
};

export default MediaHighlightsTab;