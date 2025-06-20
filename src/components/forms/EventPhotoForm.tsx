import React, { useState, useEffect } from 'react';
import { X, Save, Image as ImageIcon, FileText, Hash } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import type { EventPhoto, Event } from '../../types/database';

interface EventPhotoFormProps {
  photo?: EventPhoto | null;
  events: Event[];
  onClose: () => void;
  onSave: () => void;
}

const bucket = 'event-photos';

const EventPhotoForm: React.FC<EventPhotoFormProps> = ({ photo, events, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    event_id: '',
    alt: '',
    order: 0
  });
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (photo) {
      setFormData({
        event_id: photo.event_id,
        alt: photo.alt,
        order: photo.order
      });
    }
  }, [photo]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      let src = photo?.src || '';

      if (!photo || file) {
        if (!file) throw new Error('Image requise');
        const extension = file.name.split('.').pop();
        const filePath = `${formData.event_id}/${Date.now()}.${extension}`;
        const { error: uploadError } = await supabase.storage.from(bucket).upload(filePath, file, { upsert: true });
        if (uploadError) throw uploadError;
        src = filePath;
        if (photo && photo.src) {
          await supabase.storage.from(bucket).remove([photo.src]);
        }
      }

      const photoData = {
        event_id: formData.event_id,
        alt: formData.alt,
        order: formData.order,
        src
      };

      if (photo) {
        const { error } = await supabase
          .from('event_photos')
          .update(photoData)
          .eq('id', photo.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('event_photos')
          .insert([photoData]);
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
      <div className="bg-white rounded-lg max-w-lg w-full">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">
            {photo ? 'Modifier la photo' : 'Nouvelle photo'}
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
              <ImageIcon size={16} />
              <span>Image {photo ? '(laisser vide pour conserver)' : '*'} </span>
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setFile(e.target.files ? e.target.files[0] : null)}
              className="w-full"
            />
          </div>

          <div>
            <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 mb-2">
              <FileText size={16} />
              <span>Texte alternatif *</span>
            </label>
            <input
              type="text"
              required
              value={formData.alt}
              onChange={(e) => setFormData(prev => ({ ...prev, alt: e.target.value }))}
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

          <div>
            <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 mb-2">
              <FileText size={16} />
              <span>Événement *</span>
            </label>
            <select
              required
              value={formData.event_id}
              onChange={(e) => setFormData(prev => ({ ...prev, event_id: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Sélectionner un événement</option>
              {events.map(ev => (
                <option key={ev.id} value={ev.id}>{ev.occasion}</option>
              ))}
            </select>
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

export default EventPhotoForm;
