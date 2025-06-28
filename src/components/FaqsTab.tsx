import React, { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { Plus, Edit2, Trash2, FileText } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { supabase } from '../lib/supabase';
import FaqForm from './forms/FaqForm';
import ConfirmationModal from './common/ConfirmationModal';
import NotificationModal from './common/NotificationModal';
import type { Faq } from '../types/database';

const FaqsTab: React.FC = () => {
  const [faqs, setFaqs] = useState<Faq[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [editingFaq, setEditingFaq] = useState<Faq | null>(null);
  const [deleteTargetFaq, setDeleteTargetFaq] = useState<Faq | null>(null);
  const [notification, setNotification] = useState<{
    title: string;
    message: string;
    type: 'success' | 'error' | 'warning' | 'info';
  }>({ title: '', message: '', type: 'info' });
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    fetchFaqs();
  }, []);

  const showNotification = (title: string, message: string, type: 'success' | 'error' | 'warning' | 'info' = 'info') => {
    setNotification({ title, message, type });
    setShowNotificationModal(true);
  };

  const fetchFaqs = async () => {
    try {
      const { data, error } = await supabase
        .from('faqs')
        .select('*')
        .order('order', { ascending: true });
      if (error) throw error;
      setFaqs(data || []);
    } catch (error) {
      console.error('Erreur lors du chargement des FAQs:', error);
      showNotification(
        'Erreur de chargement',
        'Une erreur est survenue lors du chargement des FAQs.',
        'error'
      );
    } finally {
      setLoading(false);
    }
  };

  const reorder = <T,>(list: T[], startIndex: number, endIndex: number): T[] => {
    const result = Array.from(list);
    const [removed] = result.splice(startIndex, 1);
    result.splice(endIndex, 0, removed);
    return result;
  };

  const handleDragEnd = async (result: DropResult) => {
    if (!result.destination) return;
    const newFaqs = reorder(faqs, result.source.index, result.destination.index);
    setFaqs(newFaqs);
    try {
      await Promise.all(
        newFaqs.map((f, idx) =>
          supabase.from('faqs').update({ order: idx }).eq('id', f.id)
        )
      );
    } catch (error) {
      console.error('Erreur lors de la mise à jour de l\'ordre:', error);
      showNotification(
        'Erreur de sauvegarde',
        'Une erreur est survenue lors de la mise à jour de l\'ordre.',
        'error'
      );
    }
  };

  const handleEdit = (faq: Faq) => {
    setEditingFaq(faq);
    setShowForm(true);
  };

  const handleDeleteClick = (faq: Faq) => {
    setDeleteTargetFaq(faq);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTargetFaq) return;

    try {
      setIsDeleting(true);
      const { error } = await supabase.from('faqs').delete().eq('id', deleteTargetFaq.id);
      if (error) throw error;
      
      setShowDeleteModal(false);
      setDeleteTargetFaq(null);
      showNotification(
        'FAQ supprimée',
        'La FAQ a été supprimée avec succès.',
        'success'
      );
      fetchFaqs();
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
      showNotification(
        'Erreur de suppression',
        'Une erreur est survenue lors de la suppression de la FAQ.',
        'error'
      );
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDeleteCancel = () => {
    setShowDeleteModal(false);
    setDeleteTargetFaq(null);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingFaq(null);
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
        <h2 className="text-2xl font-bold text-gray-900">Gestion des FAQs</h2>
        <button
          onClick={() => {
            setEditingFaq(null);
            setShowForm(true);
          }}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
        >
          <Plus size={20} />
          <span>Nouvelle FAQ</span>
        </button>
      </div>

      <DragDropContext onDragEnd={handleDragEnd}>
        <Droppable droppableId="faqs">
          {(provided) => (
            <div
              className="bg-white shadow-sm rounded-lg overflow-hidden"
              ref={provided.innerRef}
              {...provided.droppableProps}
            >
              <div className="grid gap-6 p-6">
                {faqs.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">Aucune FAQ trouvée</div>
                ) : (
                  faqs.map((faq, index) => (
                    <Draggable key={faq.id} draggableId={faq.id} index={index}>
                      {(dragProvided) => (
                        <div
                          ref={dragProvided.innerRef}
                          {...dragProvided.draggableProps}
                          {...dragProvided.dragHandleProps}
                          className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow"
                        >
                          <div className="flex justify-between items-start mb-4">
                            <div className="flex items-center space-x-2">
                              <FileText className="text-blue-600" size={20} />
                              <h3 className="text-lg font-semibold text-gray-900">{faq.question}</h3>
                            </div>
                            <div className="flex space-x-2">
                              <button
                                onClick={() => handleEdit(faq)}
                                className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              >
                                <Edit2 size={18} />
                              </button>
                              <button
                                onClick={() => handleDeleteClick(faq)}
                                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              >
                                <Trash2 size={18} />
                              </button>
                            </div>
                          </div>

                          <div className="bg-gray-50 rounded-md p-4">
                            <h4 className="text-sm font-medium text-gray-900 mb-2">Réponse Markdown:</h4>
                            <div className="max-h-96 overflow-y-auto">
                              <pre className="text-sm text-gray-700 whitespace-pre-wrap break-words">
                                {faq.answer}
                              </pre>
                            </div>
                          </div>

                          {faq.created_at && (
                            <div className="mt-3 text-xs text-gray-500">
                              Créé le {format(new Date(faq.created_at), 'dd MMMM yyyy à HH:mm', { locale: fr })}
                            </div>
                          )}
                        </div>
                      )}
                    </Draggable>
                  ))
                )}
                {provided.placeholder}
              </div>
            </div>
          )}
        </Droppable>
      </DragDropContext>

      {showForm && (
        <FaqForm faq={editingFaq} onClose={handleCloseForm} onSave={fetchFaqs} />
      )}

      <ConfirmationModal
        isOpen={showDeleteModal}
        onClose={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
        title="Supprimer la FAQ"
        message={deleteTargetFaq ? 
          `Êtes-vous sûr de vouloir supprimer cette FAQ ?\n\nQuestion: "${deleteTargetFaq.question}"\n\nCette action ne peut pas être annulée.` : 
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

export default FaqsTab;