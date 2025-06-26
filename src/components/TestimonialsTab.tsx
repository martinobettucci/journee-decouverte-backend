import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { resolveImageUrl } from '../lib/image';
import TestimonialForm from './forms/TestimonialForm';
import type { Testimonial } from '../types/database';

const bucket = 'testimonials';

const TestimonialsTab: React.FC = () => {
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingTestimonial, setEditingTestimonial] = useState<Testimonial | null>(null);

  useEffect(() => {
    fetchTestimonials();
  }, []);

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
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (t: Testimonial) => {
    setEditingTestimonial(t);
    setShowForm(true);
  };

  const handleDelete = async (t: Testimonial) => {
    if (!confirm('Supprimer ce témoignage ?')) return;
    try {
      await supabase.storage.from('testimonials').remove([t.logo_url]);
      const { error } = await supabase.from('testimonials').delete().eq('id', t.id);
      if (error) throw error;
      fetchTestimonials();
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
    }
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

      <div className="bg-white shadow-sm rounded-lg overflow-hidden">
        <div className="grid gap-6 p-6">
          {testimonials.length === 0 ? (
            <div className="text-center py-12 text-gray-500">Aucun témoignage trouvé</div>
          ) : (
            testimonials.map((t) => {
              const logoUrl = resolveImageUrl(t.logo_url, bucket, supabase);
              return (
                <div
                  key={t.id}
                  className="border border-gray-200 rounded-lg p-6 flex justify-between items-start hover:shadow-md transition-shadow"
                >
                  <div className="flex space-x-4">
                    <img src={logoUrl} alt={t.partner_name} className="h-16 w-16 object-contain" />
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{t.partner_name}</h3>
                      <p className="text-gray-700 mb-1">{t.quote}</p>
                      <p className="text-sm text-gray-500">Note: {t.rating}/5</p>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleEdit(t)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    >
                      <Edit2 size={18} />
                    </button>
                    <button
                      onClick={() => handleDelete(t)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {showForm && (
        <TestimonialForm
          testimonial={editingTestimonial}
          onClose={handleCloseForm}
          onSave={fetchTestimonials}
        />
      )}
    </div>
  );
};

export default TestimonialsTab;
