import React, { useState, useEffect } from 'react';
import { X, Save, ExternalLink } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { resolveImageUrl } from '../../lib/image';
import type { PressArticle } from '../../types/database';

interface PressArticleFormProps {
  article?: PressArticle | null;
  onClose: () => void;
  onSave: () => void;
}

const bucket = 'press-articles';

const PressArticleForm: React.FC<PressArticleFormProps> = ({ article, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    publication: '',
    logo_url: '',
    title: '',
    url: '',
    date: '',
    featured: false,
  });
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (article) {
      setFormData({
        publication: article.publication,
        logo_url: article.logo_url,
        title: article.title,
        url: article.url,
        date: article.date,
        featured: article.featured,
      });
      if (article.logo_url) {
        setLogoPreview(resolveImageUrl(article.logo_url, bucket, supabase));
      }
    }
  }, [article]);

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setLogoFile(file);
    if (file) setLogoPreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      let logoPath = formData.logo_url;

      if (logoFile) {
        const ext = logoFile.name.split('.').pop();
        const fileName = `logo-${Date.now()}.${ext}`;
        const { error: uploadError } = await supabase.storage.from(bucket).upload(fileName, logoFile, { upsert: true });
        if (uploadError) throw uploadError;
        logoPath = fileName;
      }

      const dataToSave = {
        publication: formData.publication,
        logo_url: logoPath,
        title: formData.title,
        url: formData.url,
        date: formData.date,
        featured: formData.featured,
      };

      if (article) {
        const { error } = await supabase.from('press_articles').update(dataToSave).eq('id', article.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('press_articles').insert([dataToSave]);
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
            {article ? 'Modifier l\'article' : 'Nouvel article'}
          </h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X size={20} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && <div className="text-red-500 text-sm">{error}</div>}

          {article && (
            <div>
              <label className="block text-sm font-medium text-gray-700">ID</label>
              <input
                type="text"
                value={article.id}
                readOnly
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm text-sm bg-gray-100 cursor-not-allowed"
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700">Publication *</label>
            <input
              type="text"
              required
              value={formData.publication}
              onChange={(e) => setFormData(prev => ({ ...prev, publication: e.target.value }))}
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Logo *</label>
            <input type="file" accept="image/*" onChange={handleLogoChange} className="mt-1" />
            {logoPreview && <img src={logoPreview} alt="Preview" className="mt-2 h-24" />}
          </div>

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
            <label className="block text-sm font-medium text-gray-700">URL *</label>
            <div className="flex items-center space-x-2">
              <input
                type="url"
                required
                value={formData.url}
                onChange={(e) => setFormData(prev => ({ ...prev, url: e.target.value }))}
                className="mt-1 flex-1 border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
              />
              {formData.url && (
                <a href={formData.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                  <ExternalLink size={16} />
                </a>
              )}
            </div>
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

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={formData.featured}
              onChange={(e) => setFormData(prev => ({ ...prev, featured: e.target.checked }))}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded"
            />
            <label className="text-sm font-medium text-gray-700">Mis en avant</label>
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

export default PressArticleForm;
