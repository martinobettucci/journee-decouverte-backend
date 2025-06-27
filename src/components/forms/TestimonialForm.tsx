import React, { useState, useEffect } from 'react';
import { X, Save, Eye, EyeOff, FileText } from 'lucide-react';
import MarkdownRenderer from '../common/MarkdownRenderer';
import { supabase } from '../../lib/supabase';
import { resolveImageUrl } from '../../lib/image';
import type { Testimonial } from '../../types/database';

const bucket = 'testimonials';

interface TestimonialFormProps {
  testimonial?: Testimonial | null;
  onClose: () => void;
  onSave: () => void;
}

const TestimonialForm: React.FC<TestimonialFormProps> = ({ testimonial, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    partner_name: '',
    quote: '',
    rating: 5,
    order: 0,
    logo_url: ''
  });
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    if (testimonial) {
      setFormData({
        partner_name: testimonial.partner_name,
        quote: testimonial.quote,
        rating: testimonial.rating,
        order: testimonial.order,
        logo_url: testimonial.logo_url
      });
      if (testimonial.logo_url) {
        setPreviewUrl(resolveImageUrl(testimonial.logo_url, bucket, supabase));
      }
    }
  }, [testimonial]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setLogoFile(file);
    if (file) {
      setPreviewUrl(URL.createObjectURL(file));
    } else {
      setPreviewUrl(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      let logoPath = formData.logo_url;

      if (logoFile) {
        const fileExt = logoFile.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${fileExt}`;
        const { error: uploadError } = await supabase.storage
          .from('testimonials')
          .upload(fileName, logoFile, { upsert: true });
        if (uploadError) throw uploadError;
        logoPath = fileName;
      }

      const data = {
        partner_name: formData.partner_name,
        quote: formData.quote,
        rating: formData.rating,
        order: formData.order,
        logo_url: logoPath
      };

      if (testimonial) {
        const { error } = await supabase
          .from('testimonials')
          .update(data)
          .eq('id', testimonial.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('testimonials').insert([data]);
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
            {testimonial ? 'Modifier le témoignage' : 'Nouveau témoignage'}
          </h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X size={20} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && <div className="text-red-500 text-sm">{error}</div>}
          <div>
            <label className="block text-sm font-medium text-gray-700">Partenaire</label>
            <input
              type="text"
              value={formData.partner_name}
              onChange={(e) => setFormData(prev => ({ ...prev, partner_name: e.target.value }))}
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
              required
            />
          </div>
          <div className="flex items-center justify-between">
            <label className="block text-sm font-medium text-gray-700">Citation (Markdown)</label>
            <button
              type="button"
              onClick={() => setShowPreview(!showPreview)}
              className={`flex items-center space-x-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                showPreview ? 'text-white bg-green-600 hover:bg-green-700' : 'text-gray-700 bg-gray-100 hover:bg-gray-200'
              }`}
            >
              {showPreview ? <EyeOff size={16} /> : <Eye size={16} />}
              <span>{showPreview ? 'Retour à l\'édition' : 'Prévisualiser'}</span>
            </button>
          </div>

          {showPreview ? (
            <div className="space-y-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <Eye className="text-green-600" size={16} />
                  <span className="font-medium text-green-900">Mode Prévisualisation</span>
                </div>
                <p className="text-sm text-green-700">Aperçu du rendu de la citation.</p>
              </div>

              <div className="bg-white border border-gray-200 rounded-lg p-6 max-h-96 overflow-y-auto">
                {formData.quote ? (
                  <MarkdownRenderer content={formData.quote} style={{ fontSize: '14px' }} />
                ) : (
                  <div className="text-center py-12 text-gray-500">
                    <FileText className="mx-auto mb-4" size={48} />
                    <p className="text-lg font-medium mb-2">Aucun contenu à prévisualiser</p>
                    <p className="text-sm">Retournez en mode édition pour saisir du contenu Markdown</p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <textarea
                value={formData.quote}
                onChange={(e) => setFormData(prev => ({ ...prev, quote: e.target.value }))}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
                required
              />
              <p className="text-xs text-gray-500">
                Utilisez la syntaxe Markdown pour formater le contenu (liens, emphases, etc.)
              </p>
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700">Note (1-5)</label>
            <input
              type="number"
              min="1"
              max="5"
              value={formData.rating}
              onChange={(e) => setFormData(prev => ({ ...prev, rating: Number(e.target.value) }))}
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Ordre</label>
            <input
              type="number"
              value={formData.order}
              onChange={(e) => setFormData(prev => ({ ...prev, order: Number(e.target.value) }))}
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Logo</label>
            <input type="file" accept="image/*" onChange={handleFileChange} className="mt-1" />
            {previewUrl && <img src={previewUrl} alt="Preview" className="mt-2 h-24" />}
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

export default TestimonialForm;
