import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { supabase } from '../lib/supabase';
import PressArticleForm from './forms/PressArticleForm';
import type { PressArticle } from '../types/database';

const bucket = 'press-articles';

const PressArticlesTab: React.FC = () => {
  const [articles, setArticles] = useState<PressArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingArticle, setEditingArticle] = useState<PressArticle | null>(null);

  useEffect(() => { fetchArticles(); }, []);

  const fetchArticles = async () => {
    try {
      const { data, error } = await supabase
        .from('press_articles')
        .select('*')
        .order('featured', { ascending: false })
        .order('date', { ascending: false });
      if (error) throw error;
      setArticles(data || []);
    } catch (err) {
      console.error('Erreur lors du chargement des articles:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (article: PressArticle) => {
    setEditingArticle(article);
    setShowForm(true);
  };

  const handleDelete = async (article: PressArticle) => {
    if (!confirm('Supprimer cet article ?')) return;
    try {
      if (article.logo_url) {
        await supabase.storage.from(bucket).remove([article.logo_url]);
      }
      const { error } = await supabase.from('press_articles').delete().eq('id', article.id);
      if (error) throw error;
      fetchArticles();
    } catch (err) {
      console.error('Erreur lors de la suppression:', err);
    }
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingArticle(null);
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
        <h2 className="text-2xl font-bold text-gray-900">Gestion des Articles Presse</h2>
        <button
          onClick={() => { setEditingArticle(null); setShowForm(true); }}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
        >
          <Plus size={20} />
          <span>Nouvel Article</span>
        </button>
      </div>

      <div className="bg-white shadow-sm rounded-lg overflow-hidden">
        <div className="grid gap-6 p-6">
          {articles.length === 0 ? (
            <div className="text-center py-12 text-gray-500">Aucun article trouvé</div>
          ) : (
            articles.map((a) => (
              <div key={a.id} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      {a.logo_url && (
                        <img src={getPublicUrl(a.logo_url)} alt={a.publication} className="h-8 w-8 object-contain" />
                      )}
                      <h3 className="text-lg font-semibold text-gray-900">{a.title}</h3>
                    </div>
                    <p className="text-sm text-gray-600">
                      {a.publication} - {format(new Date(a.date), 'dd/MM/yyyy', { locale: fr })}
                    </p>
                    <p className="mt-2 text-sm">
                      <a href={a.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                        {a.url}
                      </a>
                    </p>
                    <div className="mt-2">
                      {a.featured ? (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">Mis en avant</span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">Standard</span>
                      )}
                    </div>
                  </div>
                  <div className="flex space-x-2 ml-4">
                    <button onClick={() => handleEdit(a)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                      <Edit2 size={18} />
                    </button>
                    <button onClick={() => handleDelete(a)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors">
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
        <PressArticleForm
          article={editingArticle}
          onClose={handleCloseForm}
          onSave={fetchArticles}
        />
      )}
    </div>
  );
};

export default PressArticlesTab;
