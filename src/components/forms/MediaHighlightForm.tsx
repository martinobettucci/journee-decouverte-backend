import React, { useState, useEffect } from 'react';
import { X, Save, ExternalLink } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import type { MediaHighlight } from '../../types/database';

interface MediaHighlightFormProps {
  highlight?: MediaHighlight | null;
  onClose: () => void;
  onSave: () => void;
}

const bucket = 'media-highlights';

const MediaHighlightForm: React.FC<MediaHighlightFormProps> = ({ highlight, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    title: '',
    media_name: '',
    date: '',
    video_id: '',
    url: '',
    media_logo: '',
    image_url: ''
  });
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (highlight) {
      setFormData({
        title: highlight.title,
        media_name: highlight.media_name,
        date: highlight.date,
        video_id: highlight.video_id || '',
        url: highlight.url || '',
        media_logo: highlight.media_logo,
        image_url: highlight.image_url
      });
      if (highlight.media_logo) setLogoPreview(highlight.media_logo);
      if (highlight.image_url) setImagePreview(highlight.image_url);
    }
  }, [highlight]);

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setLogoFile(file);
    if (file) setLogoPreview(URL.createObjectURL(file));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setImageFile(file);
    if (file) setImagePreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      let logoUrl = formData.media_logo;
      let imageUrl = formData.image_url;

      if (logoFile) {
        const ext = logoFile.name.split('.').pop();
        const fileName = `logo-${Date.now()}.${ext}`;
        const { error: uploadError } = await supabase.storage.from(bucket).upload(fileName, logoFile, { upsert: true });
        if (uploadError) throw uploadError;
        const { data } = supabase.storage.from(bucket).getPublicUrl(fileName);
        logoUrl = data.publicUrl;
      }

      if (imageFile) {
        const ext = imageFile.name.split('.').pop();
        const fileName = `image-${Date.now()}.${ext}`;
        const { error: uploadError } = await supabase.storage.from(bucket).upload(fileName, imageFile, { upsert: true });
        if (uploadError) throw uploadError;
        const { data } = supabase.storage.from(bucket).getPublicUrl(fileName);
        imageUrl = data.publicUrl;
      }

      const dataToSave = {
        title: formData.title,
        media_name: formData.media_name,
        date: formData.date,
        video_id: formData.video_id || null,
        url: formData.url || null,
        media_logo: logoUrl,
        image_url: imageUrl
      };

      if (highlight) {
        const { error } = await supabase
          .from('media_highlights')
          .update(dataToSave)
          .eq('id', highlight.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('media_highlights').insert([dataToSave]);
        if (error) throw error;
      }

      onSave();
      onClose();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erreur inconnue';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-lg font-semibold text-gray-900">
            {highlight ? 'Modifier le média' : 'Nouveau média'}
          </h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X size={20} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && <div className="text-red-500 text-sm">{error}</div>}
          <div>
            <label className="block text-sm font-medium text-gray-700">Titre *</label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Nom du média *</label>
            <input
              type="text"
              required
              value={formData.media_name}
              onChange={(e) => setFormData(prev => ({ ...prev, media_name: e.target.value }))}
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Date *</label>
            <input
              type="date"
              required
              value={formData.date}
              onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">ID vidéo (YouTube)</label>
            <input
              type="text"
              value={formData.video_id}
              onChange={(e) => setFormData(prev => ({ ...prev, video_id: e.target.value }))}
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">URL</label>
            <div className="flex items-center space-x-2">
              <input
                type="url"
                value={formData.url}
                onChange={(e) => setFormData(prev => ({ ...prev, url: e.target.value }))}
                className="mt-1 flex-1 border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
              />
              {formData.url && (
                <a
                  href={formData.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline flex items-center"
                >
                  <ExternalLink size={16} />
                </a>
              )}
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700">Logo</label>
              <input type="file" accept="image/*" onChange={handleLogoChange} className="mt-1" />
              {logoPreview && <img src={logoPreview} alt="Preview" className="mt-2 h-24" />}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Image</label>
              <input type="file" accept="image/*" onChange={handleImageChange} className="mt-1" />
              {imagePreview && <img src={imagePreview} alt="Preview" className="mt-2 h-24" />}
            </div>
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

export default MediaHighlightForm;
