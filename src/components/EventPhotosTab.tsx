import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Image as ImageIcon, Filter, X } from 'lucide-react';
import { supabase } from '../lib/supabase';
import EventPhotoForm from './forms/EventPhotoForm';
import type { EventPhoto, Event } from '../types/database';

const bucket = 'event-photos';

interface EventPhotosTabProps {
  initialFilterEventId: string | null;
  onFilterChange: (eventId: string | null) => void;
}

const EventPhotosTab: React.FC<EventPhotosTabProps> = ({ initialFilterEventId, onFilterChange }) => {
  const [photos, setPhotos] = useState<EventPhoto[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingPhoto, setEditingPhoto] = useState<EventPhoto | null>(null);
  const [filterEventId, setFilterEventId] = useState<string | null>(initialFilterEventId);

  useEffect(() => {
    fetchEvents();
  }, []);

  useEffect(() => {
    fetchPhotos();
  }, [filterEventId]);

  useEffect(() => {
    setFilterEventId(initialFilterEventId);
  }, [initialFilterEventId]);

  const fetchPhotos = async () => {
    try {
      setLoading(true);
      let query = supabase
        .from('event_photos')
        .select('*')
        .order('order', { ascending: true });

      if (filterEventId) {
        query = query.eq('event_id', filterEventId);
      }

      const { data, error } = await query;
      if (error) throw error;
      setPhotos(data || []);
    } catch (error) {
      console.error('Erreur lors du chargement des photos:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchEvents = async () => {
    try {
      const { data, error } = await supabase
        .from('events')
        .select('*');
      if (error) throw error;
      setEvents(data || []);
    } catch (error) {
      console.error('Erreur lors du chargement des événements:', error);
    }
  };

  const getEventLabel = (eventId: string) => {
    const event = events.find(e => e.id === eventId);
    return event ? event.occasion : 'Événement inconnu';
  };

  const getPublicUrl = (path: string) => {
    const { data } = supabase.storage.from(bucket).getPublicUrl(path);
    return data.publicUrl;
  };

  const handleFilterChange = (newId: string) => {
    const value = newId === '' ? null : newId;
    setFilterEventId(value);
    onFilterChange(value);
  };

  const clearFilter = () => {
    setFilterEventId(null);
    onFilterChange(null);
  };

  const handleEdit = (photo: EventPhoto) => {
    setEditingPhoto(photo);
    setShowForm(true);
  };

  const handleDelete = async (photo: EventPhoto) => {
    if (!confirm('Supprimer cette photo ?')) return;
    try {
      await supabase.storage.from(bucket).remove([photo.src]);
      const { error } = await supabase
        .from('event_photos')
        .delete()
        .eq('id', photo.id);
      if (error) throw error;
      fetchPhotos();
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
    }
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingPhoto(null);
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
        <h2 className="text-2xl font-bold text-gray-900">Gestion des Photos</h2>
        <button
          onClick={() => { setEditingPhoto(null); setShowForm(true); }}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
        >
          <Plus size={20} />
          <span>Nouvelle Photo</span>
        </button>
      </div>

      {/* Filter Section */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
          <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
            <div className="flex items-center space-x-2">
              <Filter className="text-gray-600" size={20} />
              <span className="text-sm font-medium text-gray-700">Filtrer par événement:</span>
            </div>
            <select
              value={filterEventId || ''}
              onChange={(e) => handleFilterChange(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Tous les événements</option>
              {events.map(ev => (
                <option key={ev.id} value={ev.id}>{ev.occasion}</option>
              ))}
            </select>
            {filterEventId && (
              <button
                onClick={clearFilter}
                className="flex items-center space-x-1 px-3 py-2 text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
              >
                <X size={16} />
                <span>Effacer</span>
              </button>
            )}
          </div>
          {filterEventId && (
            <div className="text-sm text-gray-600">
              <span className="font-medium">{photos.length}</span> photo(s) pour {getEventLabel(filterEventId)}
            </div>
          )}
        </div>
      </div>

      <div className="bg-white shadow-sm rounded-lg overflow-hidden">
        <div className="grid gap-6 p-6">
          {photos.length === 0 ? (
            <div className="text-center py-12 text-gray-500">Aucune photo trouvée</div>
          ) : (
            photos.map(photo => (
              <div key={photo.id} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow flex items-center space-x-4">
                <img src={getPublicUrl(photo.src)} alt={photo.alt} className="w-24 h-24 object-cover rounded" />
                <div className="flex-1">
                  <h3 className="text-lg font-medium text-gray-900">{getEventLabel(photo.event_id)}</h3>
                  <p className="text-sm text-gray-600">{photo.alt}</p>
                </div>
                <div className="flex space-x-2">
                  <button onClick={() => handleEdit(photo)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                    <Edit2 size={18} />
                  </button>
                  <button onClick={() => handleDelete(photo)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {showForm && (
        <EventPhotoForm
          photo={editingPhoto}
          onClose={handleCloseForm}
          onSave={fetchPhotos}
          events={events}
        />
      )}
    </div>
  );
};

export default EventPhotosTab;
