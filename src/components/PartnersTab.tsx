import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { supabase } from '../lib/supabase';
import PartnerForm from './forms/PartnerForm';
import type { Partner } from '../types/database';

const bucket = 'partners';

const PartnersTab: React.FC = () => {
  const [partners, setPartners] = useState<Partner[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingPartner, setEditingPartner] = useState<Partner | null>(null);

  useEffect(() => {
    fetchPartners();
  }, []);

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
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (p: Partner) => {
    setEditingPartner(p);
    setShowForm(true);
  };

  const handleDelete = async (p: Partner) => {
    if (!confirm('Supprimer ce partenaire ?')) return;
    try {
      if (p.logo_url) {
        await supabase.storage.from(bucket).remove([p.logo_url]);
      }
      const { error } = await supabase.from('partners').delete().eq('id', p.id);
      if (error) throw error;
      fetchPartners();
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
    }
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingPartner(null);
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
                        <img src={getPublicUrl(p.logo_url)} alt={p.name} className="h-8 w-8 object-contain" />
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
                    <button onClick={() => handleDelete(p)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors">
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
    </div>
  );
};

export default PartnersTab;
