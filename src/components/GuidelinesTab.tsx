import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, FileText, Filter, X } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { supabase } from '../lib/supabase';
import GuidelinesForm from './forms/GuidelinesForm';
import ConfirmationModal from './common/ConfirmationModal';
import NotificationModal from './common/NotificationModal';
import type { WorkshopGuidelines } from '../types/database';

interface GuidelinesTabProps {
  initialFilterDate: string | null;
  allWorkshopDates: string[];
  onFilterChange: (date: string | null) => void;
}

const GuidelinesTab: React.FC<GuidelinesTabProps> = ({ initialFilterDate, allWorkshopDates, onFilterChange }) => {
  const [guidelines, setGuidelines] = useState<WorkshopGuidelines[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [editingGuidelines, setEditingGuidelines] = useState<WorkshopGuidelines | null>(null);
  const [deleteTargetDate, setDeleteTargetDate] = useState<string | null>(null);
  const [filterDate, setFilterDate] = useState<string | null>(initialFilterDate);
  const [notification, setNotification] = useState<{
    title: string;
    message: string;
    type: 'success' | 'error' | 'warning' | 'info';
  }>({ title: '', message: '', type: 'info' });
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    setFilterDate(initialFilterDate);
  }, [initialFilterDate]);

  useEffect(() => {
    fetchGuidelines();
  }, [filterDate]);

  const showNotification = (title: string, message: string, type: 'success' | 'error' | 'warning' | 'info' = 'info') => {
    setNotification({ title, message, type });
    setShowNotificationModal(true);
  };

  const handleFilterChange = (newDate: string) => {
    const dateValue = newDate === '' ? null : newDate;
    setFilterDate(dateValue);
    onFilterChange(dateValue);
  };

  const clearFilter = () => {
    setFilterDate(null);
    onFilterChange(null);
  };

  const fetchGuidelines = async () => {
    try {
      // Build query with optional filter
      let query = supabase
        .from('workshop_guidelines')
        .select('*')
        .order('workshop_date', { ascending: false });

      if (filterDate) {
        query = query.eq('workshop_date', filterDate);
      }

      const { data, error } = await query;

      if (error) throw error;
      setGuidelines(data || []);
    } catch (error) {
      console.error('Erreur lors du chargement des directives:', error);
      showNotification(
        'Erreur de chargement',
        'Une erreur est survenue lors du chargement des directives.',
        'error'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (guidelines: WorkshopGuidelines) => {
    setEditingGuidelines(guidelines);
    setShowForm(true);
  };

  const handleDeleteClick = (workshop_date: string) => {
    setDeleteTargetDate(workshop_date);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTargetDate) return;

    try {
      setIsDeleting(true);
      const { error } = await supabase
        .from('workshop_guidelines')
        .delete()
        .eq('workshop_date', deleteTargetDate);

      if (error) throw error;
      
      setShowDeleteModal(false);
      setDeleteTargetDate(null);
      showNotification(
        'Directives supprimées',
        'Les directives ont été supprimées avec succès.',
        'success'
      );
      fetchGuidelines();
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
      showNotification(
        'Erreur de suppression',
        'Une erreur est survenue lors de la suppression des directives.',
        'error'
      );
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDeleteCancel = () => {
    setShowDeleteModal(false);
    setDeleteTargetDate(null);
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
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Directives des Ateliers</h2>
          <p className="text-sm text-gray-600 mt-1">
            Gestion des directives et instructions pour chaque atelier
          </p>
        </div>
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

      {/* Filter Section */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
          <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
            <div className="flex items-center space-x-2">
              <Filter className="text-gray-600" size={20} />
              <span className="text-sm font-medium text-gray-700">Filtrer par atelier:</span>
            </div>
            <select
              value={filterDate || ''}
              onChange={(e) => handleFilterChange(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Tous les ateliers</option>
              {allWorkshopDates.map(date => (
                <option key={date} value={date}>
                  {format(new Date(date), 'dd MMMM yyyy', { locale: fr })}
                </option>
              ))}
            </select>
            {filterDate && (
              <button
                onClick={clearFilter}
                className="flex items-center space-x-1 px-3 py-2 text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
              >
                <X size={16} />
                <span>Effacer</span>
              </button>
            )}
          </div>
          {filterDate && (
            <div className="text-sm text-gray-600">
              <span className="font-medium">{guidelines.length}</span> directive(s) pour l'atelier du {format(new Date(filterDate), 'dd MMMM yyyy', { locale: fr })}
            </div>
          )}
        </div>
      </div>

      <div className="bg-white shadow-sm rounded-lg overflow-hidden">
        <div className="grid gap-6 p-6">
          {guidelines.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              {filterDate ? 'Aucune directive trouvée pour cet atelier' : 'Aucune directive trouvée'}
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
                      onClick={() => handleDeleteClick(guideline.workshop_date)}
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

      <ConfirmationModal
        isOpen={showDeleteModal}
        onClose={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
        title="Supprimer les directives"
        message={deleteTargetDate ? 
          `Êtes-vous sûr de vouloir supprimer ces directives ?\n\nAtelier du ${format(new Date(deleteTargetDate), 'dd MMMM yyyy', { locale: fr })}\n\nCette action ne peut pas être annulée.` : 
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

export default GuidelinesTab;