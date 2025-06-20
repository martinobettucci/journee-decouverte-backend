import React, { useState, useEffect } from 'react';
import { X, Save, FileText, Hash, Eye, EyeOff } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import MarkdownRenderer from '../common/MarkdownRenderer';
import type { Faq } from '../../types/database';

interface FaqFormProps {
  faq?: Faq | null;
  onClose: () => void;
  onSave: () => void;
}

const FaqForm: React.FC<FaqFormProps> = ({ faq, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    question: '',
    answer: '',
    order: 0
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    if (faq) {
      setFormData({
        question: faq.question,
        answer: faq.answer,
        order: faq.order
      });
    }
  }, [faq]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const faqData = {
        question: formData.question,
        answer: formData.answer,
        order: formData.order
      };

      if (faq) {
        const { error } = await supabase
          .from('faqs')
          .update(faqData)
          .eq('id', faq.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('faqs').insert([faqData]);
        if (error) throw error;
      }

      onSave();
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">
            {faq ? 'Modifier la FAQ' : 'Nouvelle FAQ'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
              {error}
            </div>
          )}

          <div>
            <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 mb-2">
              <FileText size={16} />
              <span>Question *</span>
            </label>
            <input
              type="text"
              required
              value={formData.question}
              onChange={(e) => setFormData(prev => ({ ...prev, question: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 mb-2">
              <Hash size={16} />
              <span>Ordre *</span>
            </label>
            <input
              type="number"
              required
              value={formData.order}
              onChange={(e) => setFormData(prev => ({ ...prev, order: parseInt(e.target.value) }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div className="flex items-center justify-between">
            <label className="flex items-center space-x-2 text-sm font-medium text-gray-700">
              <FileText size={16} />
              <span>Réponse (Markdown) *</span>
            </label>
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
                <p className="text-sm text-green-700">Aperçu du rendu de la réponse.</p>
              </div>

              <div className="bg-white border border-gray-200 rounded-lg p-6 max-h-96 overflow-y-auto">
                {formData.answer ? (
                  <MarkdownRenderer content={formData.answer} style={{ fontSize: '14px' }} />
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
                required
                rows={16}
                value={formData.answer}
                onChange={(e) => setFormData(prev => ({ ...prev, answer: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm resize-none"
                placeholder="Rédigez la réponse en Markdown..."
              />
              <p className="text-xs text-gray-500">
                Utilisez la syntaxe Markdown pour formater le contenu (titres, listes, liens, etc.)
              </p>
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

export default FaqForm;
