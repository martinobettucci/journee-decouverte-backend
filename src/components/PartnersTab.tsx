import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { supabase } from '../lib/supabase';
import { resolveImageUrl } from '../lib/image';
import PartnerForm from './forms/PartnerForm';
import ConfirmationModal from './common/ConfirmationModal';
import NotificationModal from './common/NotificationModal';
import type { Partner } from '../types/database';

const bucket = 'partners';

const PartnersTab: React.FC = () => {
  const [partners, setPartners] = useState<Partner[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [editingPartner, setEditingPartner] = useState<Partner | null>(null);
  const [deleteTargetPartner, setDeleteTargetPartner] = useState<Partner | null>(null);
  const [notification, setNotification] = useState<{
    title: string;
    message: string;
    type: 'success' | 'error' | 'warning' | 'info';
  }>({ title: '', message: '', type: 'info' });
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    fetchPartners();
  }, []);

  const showNotification = (title: string, message: string, type: 'success' | 'error' | 'warning' | 'info' = 'info') => {
    setNotification({ title, message, type });
    setShowNotificationModal(true);
  };

  const fetchPartners = async () => {
    try {
      const { data, error } = await supabase
        .from('partners')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      setPartners(data || []);
    } catch (error) {
      console.error('Erreur lors du chargement des partenaires:', error);
      showNotification(
        'Erreur de chargement',
        'Une erreur est survenue lors du chargement des partenaires.',
        'error'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (p: Partner) => {
    setEditingPartner(p);
    setShowForm(true);
  };

  const handleDeleteClick = (p: Partner) => {
    setDeleteTargetPartner(p);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTargetPartner) return;

    try {
      setIsDeleting(true);
      if (deleteTargetPartner.logo_url) {
        await supabase.storage.from(bucket).remove([deleteTargetPartner.logo_url]);
      }
      const { error } = await supabase.from('partners').delete().eq('id', deleteTargetPartner.id);
      if (error) throw error;
      
      setShowDeleteModal(false);
      setDeleteTargetPartner(null);
      showNotification(
        'Partenaire supprimé',
        'Le partenaire a été supprimé avec succès.',
        'success'
      );
      fetchPartners();
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
      showNotification(
        'Erreur de suppression',
        'Une erreur est survenue lors de la suppression du partenaire.',
        'error'
      );
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDeleteCancel = () => {
    setShowDeleteModal(false);
    setDeleteTargetPartner(null);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingPartner(null);
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
        <h2 className="text-2xl font-bold text-gray-900">Gestion des Partenaires</h2>
        <button
          onClick={() => {
            setEditingPartner(null);
            setShowForm(true);
          }}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
        >
          <Plus size={20} />
          <span>Nouveau Partenaire</span>
        </button>
      </div>

      <div className="bg-white shadow-sm rounded-lg overflow-hidden">
        <div className="grid gap-6 p-6">
          {partners.length === 0 ? (
            <div className="text-center py-12 text-gray-500">Aucun partenaire trouvé</div>
          ) : (
            partners.map((p) => (
              <div key={p.id} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      {p.logo_url && (
                        <img
                          src={resolveImageUrl(p.logo_url, bucket, supabase)}
                          alt={p.name}
                          className="h-8 w-8 object-contain"
                        />
                      )}
                      <h3 className="text-lg font-semibold text-gray-900">{p.name}</h3>
                    </div>
                    <p className="text-sm text-gray-600">
                      <a href={p.website_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                        {p.website_url}
                      </a>
                    </p>
                    {p.collaboration_date && (
                      <p className="text-sm text-gray-600">
                        Depuis le {format(new Date(p.collaboration_date), 'dd/MM/yyyy', { locale: fr })}
                      </p>
                    )}
                    {p.collaboration_status && (
                      <p className="text-sm text-gray-600">Statut: {p.collaboration_status}</p>
                    )}
                  </div>
                  <div className="flex space-x-2 ml-4">
                    <button onClick={() => handleEdit(p)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                      <Edit2 size={18} />
                    </button>
                    <button onClick={() => handleDeleteClick(p)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors">
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
        <PartnerForm partner={editingPartner} onClose={handleCloseForm} onSave={fetchPartners} />
      )}

      <ConfirmationModal
        isOpen={showDeleteModal}
        onClose={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
        title="Supprimer le partenaire"
        message={deleteTargetPartner ? 
          `Êtes-vous sûr de vouloir supprimer le partenaire "${deleteTargetPartner.name}" ?\n\nCette action supprimera également tous les fichiers associés et ne peut pas être annulée.` : 
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

export default PartnersTab;