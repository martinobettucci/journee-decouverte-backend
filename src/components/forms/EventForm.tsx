import React, { useState, useEffect } from 'react';
import { X, Save, Calendar, MapPin, FileText, Users, Plus, Trash2, ExternalLink, Eye, EyeOff } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import type { Event } from '../../types/database';

interface Person {
  name: string;
  role: string;
  linkedIn?: string;
}

interface EventFormProps {
  event?: Event | null;
  onClose: () => void;
  onSave: () => void;
}

const EventForm: React.FC<EventFormProps> = ({ event, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    occasion: '',
    date: '',
    location: '',
    description: '',
    people: [] as Person[]
  });
  const [showJsonEditor, setShowJsonEditor] = useState(false);
  const [jsonString, setJsonString] = useState('[]');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (event) {
      let peopleArray: Person[] = [];
      
      try {
        // Try to parse existing people data
        if (event.people && typeof event.people === 'object') {
          if (Array.isArray(event.people)) {
            peopleArray = event.people.map((person: any) => ({
              name: person.name || '',
              role: person.role || '',
              linkedIn: person.linkedIn || ''
            }));
          } else {
            // If it's an object, try to convert it to array format
            peopleArray = Object.values(event.people).filter(Boolean).map((person: any) => ({
              name: person.name || '',
              role: person.role || '',
              linkedIn: person.linkedIn || ''
            }));
          }
        }
      } catch (error) {
        console.warn('Could not parse people data:', error);
        peopleArray = [];
      }

      setFormData({
        occasion: event.occasion,
        date: event.date,
        location: event.location,
        description: event.description,
        people: peopleArray
      });

      setJsonString(JSON.stringify(peopleArray, null, 2));
    }
  }, [event]);

  const addPerson = () => {
    const newPerson: Person = {
      name: '',
      role: '',
      linkedIn: ''
    };
    const updatedPeople = [...formData.people, newPerson];
    setFormData(prev => ({ ...prev, people: updatedPeople }));
    setJsonString(JSON.stringify(updatedPeople, null, 2));
  };

  const removePerson = (index: number) => {
    const updatedPeople = formData.people.filter((_, i) => i !== index);
    setFormData(prev => ({ ...prev, people: updatedPeople }));
    setJsonString(JSON.stringify(updatedPeople, null, 2));
  };

  const updatePerson = (index: number, field: keyof Person, value: string) => {
    const updatedPeople = formData.people.map((person, i) => {
      if (i === index) {
        return { ...person, [field]: value };
      }
      return person;
    });
    setFormData(prev => ({ ...prev, people: updatedPeople }));
    setJsonString(JSON.stringify(updatedPeople, null, 2));
  };

  const handleJsonChange = (value: string) => {
    setJsonString(value);
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) {
        const peopleArray = parsed.map((person: any) => ({
          name: person.name || '',
          role: person.role || '',
          linkedIn: person.linkedIn || ''
        }));
        setFormData(prev => ({ ...prev, people: peopleArray }));
      }
    } catch (error) {
      // Invalid JSON, don't update the form data
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Filter out empty people entries
      const cleanedPeople = formData.people.filter(person => 
        person.name.trim() || person.role.trim() || person.linkedIn?.trim()
      );

      const eventData = {
        occasion: formData.occasion,
        date: formData.date,
        location: formData.location,
        description: formData.description,
        people: cleanedPeople
      };

      if (event) {
        const { error } = await supabase
          .from('events')
          .update(eventData)
          .eq('id', event.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('events')
          .insert([eventData]);
        if (error) throw error;
      }

      onSave();
      onClose();
    } catch (error: any) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">
            {event ? 'Modifier l\'événement' : 'Nouvel événement'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
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
              <span>Titre de l'événement *</span>
            </label>
            <input
              type="text"
              required
              value={formData.occasion}
              onChange={(e) => setFormData(prev => ({ ...prev, occasion: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Nom de l'événement"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 mb-2">
                <Calendar size={16} />
                <span>Date *</span>
              </label>
              <input
                type="date"
                required
                value={formData.date}
                onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 mb-2">
                <MapPin size={16} />
                <span>Lieu *</span>
              </label>
              <input
                type="text"
                required
                value={formData.location}
                onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Lieu de l'événement"
              />
            </div>
          </div>

          <div>
            <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 mb-2">
              <FileText size={16} />
              <span>Description *</span>
            </label>
            <textarea
              required
              rows={4}
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              placeholder="Description détaillée de l'événement"
            />
          </div>

          {/* Participants Section */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <label className="flex items-center space-x-2 text-sm font-medium text-gray-700">
                <Users size={16} />
                <span>Participants et intervenants</span>
              </label>
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => setShowJsonEditor(!showJsonEditor)}
                  className={`flex items-center space-x-2 px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                    showJsonEditor 
                      ? 'text-gray-700 bg-gray-100 hover:bg-gray-200' 
                      : 'text-blue-600 bg-blue-50 hover:bg-blue-100'
                  }`}
                >
                  {showJsonEditor ? <EyeOff size={14} /> : <Eye size={14} />}
                  <span>{showJsonEditor ? 'Mode formulaire' : 'Mode JSON'}</span>
                </button>
                <button
                  type="button"
                  onClick={addPerson}
                  className="flex items-center space-x-2 px-3 py-1 text-sm font-medium text-green-600 bg-green-50 hover:bg-green-100 rounded-md transition-colors"
                >
                  <Plus size={14} />
                  <span>Ajouter une personne</span>
                </button>
              </div>
            </div>

            {showJsonEditor ? (
              /* JSON Editor Mode */
              <div className="space-y-3">
                <div className="bg-amber-50 border border-amber-200 rounded-md p-3">
                  <p className="text-sm text-amber-800">
                    <strong>Mode JSON :</strong> Éditez directement le JSON. Format attendu : array d'objets avec les propriétés name, role, et linkedIn (optionnel).
                  </p>
                </div>
                <textarea
                  rows={8}
                  value={jsonString}
                  onChange={(e) => handleJsonChange(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm resize-none"
                  placeholder='[{"name": "Nom", "role": "Rôle", "linkedIn": "URL LinkedIn"}]'
                />
              </div>
            ) : (
              /* Form Editor Mode */
              <div className="space-y-4">
                {formData.people.length === 0 ? (
                  <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                    <Users size={48} className="mx-auto mb-3 text-gray-400" />
                    <p className="text-lg font-medium mb-2">Aucun participant ajouté</p>
                    <p className="text-sm mb-4">Cliquez sur "Ajouter une personne" pour commencer</p>
                    <button
                      type="button"
                      onClick={addPerson}
                      className="inline-flex items-center space-x-2 px-4 py-2 text-sm font-medium text-green-600 bg-green-50 hover:bg-green-100 rounded-md transition-colors"
                    >
                      <Plus size={16} />
                      <span>Ajouter une personne</span>
                    </button>
                  </div>
                ) : (
                  formData.people.map((person, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="text-sm font-medium text-gray-900">
                          Personne {index + 1}
                        </h4>
                        <button
                          type="button"
                          onClick={() => removePerson(index)}
                          className="text-red-600 hover:text-red-800 hover:bg-red-50 p-1 rounded transition-colors"
                          title="Supprimer cette personne"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            Nom complet *
                          </label>
                          <input
                            type="text"
                            value={person.name}
                            onChange={(e) => updatePerson(index, 'name', e.target.value)}
                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="Ex: Martino Bettucci"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            Rôle/Fonction *
                          </label>
                          <input
                            type="text"
                            value={person.role}
                            onChange={(e) => updatePerson(index, 'role', e.target.value)}
                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="Ex: Intervenant, Facilitateur, Participant"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            LinkedIn (optionnel)
                          </label>
                          <div className="relative">
                            <input
                              type="url"
                              value={person.linkedIn || ''}
                              onChange={(e) => updatePerson(index, 'linkedIn', e.target.value)}
                              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-8"
                              placeholder="https://linkedin.com/in/..."
                            />
                            {person.linkedIn && (
                              <a
                                href={person.linkedIn}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="absolute right-2 top-1/2 transform -translate-y-1/2 text-blue-600 hover:text-blue-800"
                                title="Ouvrir le profil LinkedIn"
                              >
                                <ExternalLink size={14} />
                              </a>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            <div className="text-xs text-gray-500">
              <p><strong>Format de stockage :</strong> Les données sont stockées en JSON avec les champs name, role, et linkedIn.</p>
              <p><strong>Exemple :</strong> [{"name": "Martino Bettucci", "role": "Intervenant", "linkedIn": "https://www.linkedin.com/in/martinobettucci/"}]</p>
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

export default EventForm;