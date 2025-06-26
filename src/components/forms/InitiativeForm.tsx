import React, { useState, useEffect } from 'react';
import { X, Save, Plus, Trash2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { resolveImageUrl } from '../../lib/image';
import type { Initiative, InitiativeSocialLink } from '../../types/database';

interface InitiativeFormProps {
  initiative?: Initiative | null;
  onClose: () => void;
  onSave: () => void;
}

const bucket = 'initiatives';

const InitiativeForm: React.FC<InitiativeFormProps> = ({ initiative, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    website_url: '',
    start_date: '',
    locations: [] as string[],
    specializations: [] as string[],
    social_links: [] as InitiativeSocialLink[],
    image_url: '',
    logo_url: ''
  });

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (initiative) {
      setFormData({
        title: initiative.title,
        description: initiative.description,
        website_url: initiative.website_url,
        start_date: initiative.start_date,
        locations: initiative.locations || [],
        specializations: initiative.specializations || [],
        social_links: initiative.social_links || [],
        image_url: initiative.image_url,
        logo_url: initiative.logo_url
      });
      if (initiative.image_url) {
        setImagePreview(resolveImageUrl(initiative.image_url, bucket, supabase));
      }
      if (initiative.logo_url) {
        setLogoPreview(resolveImageUrl(initiative.logo_url, bucket, supabase));
      }
    }
  }, [initiative]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setImageFile(file);
    if (file) setImagePreview(URL.createObjectURL(file));
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setLogoFile(file);
    if (file) setLogoPreview(URL.createObjectURL(file));
  };

  const addLocation = () => {
    setFormData(prev => ({ ...prev, locations: [...prev.locations, ''] }));
  };

  const updateLocation = (index: number, value: string) => {
    const updated = formData.locations.map((loc, i) => (i === index ? value : loc));
    setFormData(prev => ({ ...prev, locations: updated }));
  };

  const removeLocation = (index: number) => {
    const updated = formData.locations.filter((_, i) => i !== index);
    setFormData(prev => ({ ...prev, locations: updated }));
  };

  const addSpecialization = () => {
    setFormData(prev => ({ ...prev, specializations: [...prev.specializations, ''] }));
  };

  const updateSpecialization = (index: number, value: string) => {
    const updated = formData.specializations.map((sp, i) => (i === index ? value : sp));
    setFormData(prev => ({ ...prev, specializations: updated }));
  };

  const removeSpecialization = (index: number) => {
    const updated = formData.specializations.filter((_, i) => i !== index);
    setFormData(prev => ({ ...prev, specializations: updated }));
  };

  const addSocialLink = () => {
    setFormData(prev => ({
      ...prev,
      social_links: [...prev.social_links, { url: '', type: '', label: '' }]
    }));
  };

  const updateSocialLink = (index: number, field: keyof InitiativeSocialLink, value: string) => {
    const updated = formData.social_links.map((link, i) =>
      i === index ? { ...link, [field]: value } : link
    );
    setFormData(prev => ({ ...prev, social_links: updated }));
  };

  const removeSocialLink = (index: number) => {
    const updated = formData.social_links.filter((_, i) => i !== index);
    setFormData(prev => ({ ...prev, social_links: updated }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      let imagePath = formData.image_url;
      let logoPath = formData.logo_url;

      if (imageFile) {
        const ext = imageFile.name.split('.').pop();
        const fileName = `image-${Date.now()}.${ext}`;
        const { error: uploadError } = await supabase.storage.from(bucket).upload(fileName, imageFile, { upsert: true });
        if (uploadError) throw uploadError;
        imagePath = fileName;
      }

      if (logoFile) {
        const ext = logoFile.name.split('.').pop();
        const fileName = `logo-${Date.now()}.${ext}`;
        const { error: uploadError } = await supabase.storage.from(bucket).upload(fileName, logoFile, { upsert: true });
        if (uploadError) throw uploadError;
        logoPath = fileName;
      }

      const data = {
        title: formData.title,
        description: formData.description,
        website_url: formData.website_url,
        start_date: formData.start_date,
        locations: formData.locations.filter(l => l.trim()),
        specializations: formData.specializations.filter(s => s.trim()),
        social_links: formData.social_links,
        image_url: imagePath,
        logo_url: logoPath
      };

      if (initiative) {
        const { error } = await supabase.from('initiatives').update(data).eq('id', initiative.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('initiatives').insert([data]);
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
            {initiative ? 'Modifier l\'initiative' : 'Nouvelle initiative'}
          </h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X size={20} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && <div className="text-red-500 text-sm">{error}</div>}

          <div>
            <label className="block text-sm font-medium text-gray-700">Titre *</label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={e => setFormData(prev => ({ ...prev, title: e.target.value }))}
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Description *</label>
            <textarea
              required
              rows={4}
              value={formData.description}
              onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Site web</label>
            <input
              type="url"
              value={formData.website_url}
              onChange={e => setFormData(prev => ({ ...prev, website_url: e.target.value }))}
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700">Image</label>
              <input type="file" accept="image/*" onChange={handleImageChange} className="mt-1" />
              {imagePreview && <img src={imagePreview} alt="Preview" className="mt-2 h-24" />}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Logo</label>
              <input type="file" accept="image/*" onChange={handleLogoChange} className="mt-1" />
              {logoPreview && <img src={logoPreview} alt="Preview" className="mt-2 h-24" />}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Date de début</label>
            <input
              type="date"
              value={formData.start_date}
              onChange={e => setFormData(prev => ({ ...prev, start_date: e.target.value }))}
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
            />
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
              <label className="text-sm font-medium text-gray-700">Liens sociaux</label>
              <button type="button" onClick={addSocialLink} className="flex items-center space-x-1 text-sm text-green-600">
                <Plus size={14} /> <span>Ajouter</span>
              </button>
            </div>
            {formData.social_links.length === 0 && <p className="text-sm text-gray-500">Aucun lien ajouté</p>}
            {formData.social_links.map((link, idx) => (
              <div key={idx} className="grid grid-cols-1 md:grid-cols-3 gap-2 mb-2 items-center">
                <input
                  type="url"
                  placeholder="URL"
                  value={link.url}
                  onChange={e => updateSocialLink(idx, 'url', e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <input
                  type="text"
                  placeholder="Type"
                  value={link.type}
                  onChange={e => updateSocialLink(idx, 'type', e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    placeholder="Label"
                    value={link.label}
                    onChange={e => updateSocialLink(idx, 'label', e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button type="button" onClick={() => removeSocialLink(idx)} className="text-red-600 hover:text-red-800">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>

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

export default InitiativeForm;
