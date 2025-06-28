import React, { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { Plus, Edit2, Trash2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { resolveImageUrl } from '../lib/image';
import TestimonialForm from './forms/TestimonialForm';
import MarkdownRenderer from './common/MarkdownRenderer';
import ConfirmationModal from './common/ConfirmationModal';
import NotificationModal from './common/NotificationModal';
import type { Testimonial } from '../types/database';

const bucket = 'testimonials';

const TestimonialsTab: React.FC = () => {
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [editingTestimonial, setEditingTestimonial] = useState<Testimonial | null>(null);
  const [deleteTargetTestimonial, setDeleteTargetTestimonial] = useState<Testimonial | null>(null);
  const [notification, setNotification] = useState<{
    title: string;
    message: string;
    type: 'success' | 'error' | 'warning' | 'info';
  }>({ title: '', message: '', type: 'info' });
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    fetchTestimonials();
  }, []);

  const showNotification = (title: string, message: string, type: 'success' | 'error' | 'warning' | 'info' = 'info') => {
    setNotification({ title, message, type });
    setShowNotificationModal(true);
  };

  const fetchTestimonials = async () => {
    try {
      const { data, error } = await supabase
        .from('testimonials')
        .select('*')
        .order('order', { ascending: true });
      if (error) throw error;
      setTestimonials(data || []);
    } catch (error) {
      console.error('Erreur lors du chargement des témoignages:', error);
      showNotification(
        'Erreur de chargement',
        'Une erreur est survenue lors du chargement des témoignages.',
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
    const newItems = reorder(testimonials, result.source.index, result.destination.index);
    setTestimonials(newItems);
    try {
      await Promise.all(
        newItems.map((t, idx) =>
          supabase.from('testimonials').update({ order: idx }).eq('id', t.id)
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

  const handleEdit = (t: Testimonial) => {
    setEditingTestimonial(t);
    setShowForm(true);
  };

  const handleDeleteClick = (t: Testimonial) => {
    setDeleteTargetTestimonial(t);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTargetTestimonial) return;

    try {
      setIsDeleting(true);
      await supabase.storage.from('testimonials').remove([deleteTargetTestimonial.logo_url]);
      const { error } = await supabase.from('testimonials').delete().eq('id', deleteTargetTestimonial.id);
      if (error) throw error;
      
      setShowDeleteModal(false);
      setDeleteTargetTestimonial(null);
      showNotification(
        'Témoignage supprimé',
        'Le témoignage a été supprimé avec succès.',
        'success'
      );
      fetchTestimonials();
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
      showNotification(
        'Erreur de suppression',
        'Une erreur est survenue lors de la suppression du témoignage.',
        'error'
      );
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDeleteCancel = () => {
    setShowDeleteModal(false);
    setDeleteTargetTestimonial(null);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingTestimonial(null);
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
        <h2 className="text-2xl font-bold text-gray-900">Gestion des Témoignages</h2>
        <button
          onClick={() => {
            setEditingTestimonial(null);
            setShowForm(true);
          }}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
        >
          <Plus size={20} />
          <span>Nouveau Témoignage</span>
        </button>
      </div>

      <DragDropContext onDragEnd={handleDragEnd}>
        <Droppable droppableId="testimonials">
          {(provided) => (
            <div
              className="bg-white shadow-sm rounded-lg overflow-hidden"
              ref={provided.innerRef}
              {...provided.droppableProps}
            >
              <div className="grid gap-6 p-6">
                {testimonials.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">Aucun témoignage trouvé</div>
                ) : (
                  testimonials.map((t, index) => {
                    const logoUrl = resolveImageUrl(t.logo_url, bucket, supabase);
                    return (
                      <Draggable key={t.id} draggableId={t.id} index={index}>
                        {(dragProvided) => (
                          <div
                            ref={dragProvided.innerRef}
                            {...dragProvided.draggableProps}
                            {...dragProvided.dragHandleProps}
                            className="border border-gray-200 rounded-lg p-6 flex justify-between items-start hover:shadow-md transition-shadow"
                          >
                            <div className="flex space-x-4">
                              <img src={logoUrl} alt={t.partner_name} className="h-16 w-16 object-contain" />
                              <div>
                                <h3 className="text-lg font-semibold text-gray-900">{t.partner_name}</h3>
                                <MarkdownRenderer content={t.quote} className="mb-1" style={{ fontSize: '14px' }} />
                                <p className="text-sm text-gray-500">Note: {t.rating}/5</p>
                              </div>
                            </div>
                            <div className="flex space-x-2">
                              <button onClick={() => handleEdit(t)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                                <Edit2 size={18} />
                              </button>
                              <button onClick={() => handleDeleteClick(t)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                                <Trash2 size={18} />
                              </button>
                            </div>
                          </div>
                        )}
                      </Draggable>
                    );
                  })
                )}
                {provided.placeholder}
              </div>
            </div>
          )}
        </Droppable>
      </DragDropContext>

      {showForm && (
        <TestimonialForm
          testimonial={editingTestimonial}
          onClose={handleCloseForm}
          onSave={fetchTestimonials}
        />
      )}

      <ConfirmationModal
        isOpen={showDeleteModal}
        onClose={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
        title="Supprimer le témoignage"
        message={deleteTargetTestimonial ? 
          `Êtes-vous sûr de vouloir supprimer ce témoignage ?\n\nPartenaire: "${deleteTargetTestimonial.partner_name}"\nNote: ${deleteTargetTestimonial.rating}/5\n\nCette action ne peut pas être annulée.` : 
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

export default TestimonialsTab;