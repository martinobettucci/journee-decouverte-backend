import React, { useState, useEffect } from 'react';
import { X, Save, Plus, Trash2, ExternalLink } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import type { Partner } from '../../types/database';

interface PartnerFormProps {
  partner?: Partner | null;
  onClose: () => void;
  onSave: () => void;
}

interface ResourceItem { url: string; description: string; }

const bucket = 'partners';

const PartnerForm: React.FC<PartnerFormProps> = ({ partner, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    name: '',
    logo_url: '',
    website_url: '',
    collaboration_date: '',
    specializations: [] as string[],
    locations: [] as string[],
    resources: [] as ResourceItem[],
    collaboration_status: ''
  });
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [nameError, setNameError] = useState<string | null>(null);

  useEffect(() => {
    if (partner) {
      setFormData({
        name: partner.name,
        logo_url: partner.logo_url,
        website_url: partner.website_url,
        collaboration_date: partner.collaboration_date || '',
        specializations: partner.specializations || [],
        locations: partner.locations || [],
        resources: (partner.resources as ResourceItem[]) || [],
        collaboration_status: partner.collaboration_status || ''
      });
      if (partner.logo_url) {
        const { data } = supabase.storage.from(bucket).getPublicUrl(partner.logo_url);
        setLogoPreview(data.publicUrl);
      }
    }
  }, [partner]);

  const checkNameUnique = async () => {
    if (!formData.name.trim()) return;
    const { data, error } = await supabase
      .from('partners')
      .select('id')
      .eq('name', formData.name)
      .maybeSingle();
    if (error) return;
    if (data && (!partner || data.id !== partner.id)) {
      setNameError('Nom déjà utilisé');
    } else {
      setNameError(null);
    }
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setLogoFile(file);
    if (file) setLogoPreview(URL.createObjectURL(file));
  };

  const addSpecialization = () =>
    setFormData(prev => ({ ...prev, specializations: [...prev.specializations, ''] }));
  const updateSpecialization = (i: number, val: string) => {
    const updated = formData.specializations.map((sp, idx) => (idx === i ? val : sp));
    setFormData(prev => ({ ...prev, specializations: updated }));
  };
  const removeSpecialization = (i: number) => {
    const updated = formData.specializations.filter((_, idx) => idx !== i);
    setFormData(prev => ({ ...prev, specializations: updated }));
  };

  const addLocation = () =>
    setFormData(prev => ({ ...prev, locations: [...prev.locations, ''] }));
  const updateLocation = (i: number, val: string) => {
    const updated = formData.locations.map((loc, idx) => (idx === i ? val : loc));
    setFormData(prev => ({ ...prev, locations: updated }));
  };
  const removeLocation = (i: number) => {
    const updated = formData.locations.filter((_, idx) => idx !== i);
    setFormData(prev => ({ ...prev, locations: updated }));
  };

  const addResource = () =>
    setFormData(prev => ({ ...prev, resources: [...prev.resources, { url: '', description: '' }] }));
  const updateResource = (i: number, field: keyof ResourceItem, val: string) => {
    const updated = formData.resources.map((r, idx) => (idx === i ? { ...r, [field]: val } : r));
    setFormData(prev => ({ ...prev, resources: updated }));
  };
  const removeResource = (i: number) => {
    const updated = formData.resources.filter((_, idx) => idx !== i);
    setFormData(prev => ({ ...prev, resources: updated }));
  };

  const openWebsite = () => {
    if (formData.website_url) window.open(formData.website_url, '_blank');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    await checkNameUnique();
    if (nameError) {
      setLoading(false);
      return;
    }

    try {
      let logoPath = formData.logo_url;

      if (logoFile) {
        const ext = logoFile.name.split('.').pop();
        const fileName = `logo-${Date.now()}.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from(bucket)
          .upload(fileName, logoFile, { upsert: true });
        if (uploadError) throw uploadError;
        logoPath = fileName;
      }

      const data = {
        name: formData.name,
        logo_url: logoPath,
        website_url: formData.website_url,
        collaboration_date: formData.collaboration_date || null,
        specializations: formData.specializations.filter(s => s.trim()),
        locations: formData.locations.filter(l => l.trim()),
        resources: formData.resources.length > 0 ? formData.resources : null,
        collaboration_status: formData.collaboration_status.trim() || null
      };

      if (partner) {
        const { error } = await supabase.from('partners').update(data).eq('id', partner.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('partners').insert([data]);
        if (error) throw error;
      }

      onSave();
      onClose();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erreur inconnue';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-lg font-semibold text-gray-900">
            {partner ? 'Modifier le partenaire' : 'Nouveau partenaire'}
          </h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X size={20} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && <div className="text-red-500 text-sm">{error}</div>}
          {partner && (
            <div>
              <label className="block text-sm font-medium text-gray-700">ID</label>
              <input
                type="text"
                readOnly
                value={partner.id}
                className="mt-1 block w-full border-gray-300 rounded-md text-sm"
              />
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700">Nom *</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
              onBlur={checkNameUnique}
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
            />
            {nameError && <p className="text-sm text-red-500 mt-1">{nameError}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Logo *</label>
            <input type="file" accept="image/*" onChange={handleLogoChange} className="mt-1" />
            {logoPreview && <img src={logoPreview} alt="Preview" className="mt-2 h-24" />}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Site web *</label>
            <div className="flex space-x-2">
              <input
                type="url"
                required
                value={formData.website_url}
                onChange={e => setFormData(prev => ({ ...prev, website_url: e.target.value }))}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
              />
              <button
                type="button"
                onClick={openWebsite}
                className="px-3 py-2 bg-gray-100 rounded-md text-gray-700 hover:bg-gray-200"
              >
                <ExternalLink size={16} />
              </button>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Date de collaboration</label>
            <input
              type="date"
              value={formData.collaboration_date}
              onChange={e => setFormData(prev => ({ ...prev, collaboration_date: e.target.value }))}
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
            />
          </div>
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-gray-700">Spécialisations</label>
              <button type="button" onClick={addSpecialization} className="flex items-center space-x-1 text-sm text-green-600">
                <Plus size={14} /> <span>Ajouter</span>
              </button>
            </div>
            {formData.specializations.length === 0 && <p className="text-sm text-gray-500">Aucune spécialisation ajoutée</p>}
            {formData.specializations.map((sp, idx) => (
              <div key={idx} className="flex items-center space-x-2 mb-2">
                <input
                  type="text"
                  value={sp}
                  onChange={e => updateSpecialization(idx, e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button type="button" onClick={() => removeSpecialization(idx)} className="text-red-600 hover:text-red-800">
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-gray-700">Lieux</label>
              <button type="button" onClick={addLocation} className="flex items-center space-x-1 text-sm text-green-600">
                <Plus size={14} /> <span>Ajouter</span>
              </button>
            </div>
            {formData.locations.length === 0 && <p className="text-sm text-gray-500">Aucun lieu ajouté</p>}
            {formData.locations.map((loc, idx) => (
              <div key={idx} className="flex items-center space-x-2 mb-2">
                <input
                  type="text"
                  value={loc}
                  onChange={e => updateLocation(idx, e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button type="button" onClick={() => removeLocation(idx)} className="text-red-600 hover:text-red-800">
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-gray-700">Ressources</label>
              <button type="button" onClick={addResource} className="flex items-center space-x-1 text-sm text-green-600">
                <Plus size={14} /> <span>Ajouter</span>
              </button>
            </div>
            {formData.resources.length === 0 && <p className="text-sm text-gray-500">Aucune ressource ajoutée</p>}
            {formData.resources.map((res, idx) => (
              <div key={idx} className="grid grid-cols-1 md:grid-cols-3 gap-2 mb-2 items-center">
                <input
                  type="url"
                  placeholder="URL"
                  value={res.url}
                  onChange={e => updateResource(idx, 'url', e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <div className="flex items-center md:col-span-2 space-x-2">
                  <input
                    type="text"
                    placeholder="Description"
                    value={res.description}
                    onChange={e => updateResource(idx, 'description', e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button type="button" onClick={() => removeResource(idx)} className="text-red-600 hover:text-red-800">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Statut de collaboration</label>
            <input
              type="text"
              value={formData.collaboration_status}
              onChange={e => setFormData(prev => ({ ...prev, collaboration_status: e.target.value }))}
              placeholder="Mois Année"
              pattern="^[A-Za-zÀ-ÿ]+ [0-9]{4}$"
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
            />
            <p className="text-xs text-gray-500 mt-1">Exemple : Juin 2024</p>
          </div>
          {partner && (
            <div>
              <label className="block text-sm font-medium text-gray-700">Créé le</label>
              <input
                type="text"
                readOnly
                value={new Date(partner.created_at ?? '').toLocaleString()}
                className="mt-1 block w-full border-gray-300 rounded-md text-sm"
              />
            </div>
          )}
          <div className="flex justify-end space-x-3 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors flex items-center space-x-2 disabled:opacity-50"
            >
              <Save size={16} />
              <span>{loading ? 'Enregistrement...' : 'Enregistrer'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PartnerForm;
