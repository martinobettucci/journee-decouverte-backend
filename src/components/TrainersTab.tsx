import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Users, CheckCircle, XCircle, Contact as FileContract, AlertCircle, RefreshCw, Mail, MailCheck, Filter, X } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { supabase, testConnection } from '../lib/supabase';
import TrainerForm from './forms/TrainerForm';
import type { WorkshopTrainer, ContractTemplate } from '../types/database';

interface TrainerWithContract extends WorkshopTrainer {
  assigned_contract?: {
    id: string;
    name: string;
    type: 'trainer' | 'client';
  };
}

interface TrainersTabProps {
  initialFilterDate: string | null;
  allWorkshopDates: string[];
  onFilterChange: (date: string | null) => void;
}

const TrainersTab: React.FC<TrainersTabProps> = ({ initialFilterDate, allWorkshopDates, onFilterChange }) => {
  const [trainers, setTrainers] = useState<TrainerWithContract[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingTrainer, setEditingTrainer] = useState<WorkshopTrainer | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [filterDate, setFilterDate] = useState<string | null>(initialFilterDate);

  useEffect(() => {
    setFilterDate(initialFilterDate);
  }, [initialFilterDate]);

  useEffect(() => {
    fetchTrainers();
  }, [filterDate]);

  const fetchTrainers = async () => {
    try {
      setError(null);
      setLoading(true);

      // Test connection first
      const connectionTest = await testConnection();
      if (!connectionTest.success) {
        throw new Error(`Connection failed: ${connectionTest.message}`);
      }

      // Build query with optional filter
      let query = supabase
        .from('workshop_trainers')
        .select('*')
        .order('workshop_date', { ascending: false });

      if (filterDate) {
        query = query.eq('workshop_date', filterDate);
      }

      const { data: trainersData, error: trainersError } = await query;

      if (trainersError) {
        console.error('Supabase error details:', trainersError);
        throw new Error(`Database error: ${trainersError.message} (Code: ${trainersError.code})`);
      }

      if (!trainersData) {
        setTrainers([]);
        return;
      }

      // Then get contract assignments with contract details for each trainer
      const trainersWithContracts = await Promise.all(
        trainersData.map(async (trainer) => {
          try {
            const { data: assignmentData, error: assignmentError } = await supabase
              .from('contract_assignments')
              .select(`
                contract_templates!contract_assignments_contract_template_id_fkey (
                  id,
                  name,
                  type
                )
              `)
              .eq('trainer_id', trainer.id);

            if (assignmentError) {
              console.warn('Error fetching assignment for trainer', trainer.trainer_code, ':', assignmentError);
            }

            // Handle the case where assignmentData is an array (could be empty or have elements)
            const assignedContract = assignmentData && assignmentData.length > 0 && assignmentData[0].contract_templates ? {
              id: assignmentData[0].contract_templates.id,
              name: assignmentData[0].contract_templates.name,
              type: assignmentData[0].contract_templates.type
            } : undefined;

            return {
              ...trainer,
              assigned_contract: assignedContract
            };
          } catch (contractError) {
            console.warn('Failed to fetch contract for trainer', trainer.trainer_code, ':', contractError);
            return trainer; // Return trainer without contract info if contract fetch fails
          }
        })
      );

      setTrainers(trainersWithContracts);
    } catch (error) {
      console.error('Erreur lors du chargement des formateurs:', error);
      
      let errorMessage = 'Erreur inconnue';
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === 'string') {
        errorMessage = error;
      }

      // Provide more specific error messages
      if (errorMessage.includes('Failed to fetch')) {
        errorMessage = 'Impossible de se connecter à la base de données. Vérifiez votre connexion internet et la configuration Supabase.';
      } else if (errorMessage.includes('Invalid API key')) {
        errorMessage = 'Clé API Supabase invalide. Vérifiez votre configuration.';
      } else if (errorMessage.includes('Not found')) {
        errorMessage = 'Projet Supabase introuvable. Vérifiez l\'URL de votre projet.';
      }

      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleRetry = () => {
    setRetryCount(prev => prev + 1);
    fetchTrainers();
  };

  const handleEdit = (trainer: WorkshopTrainer) => {
    setEditingTrainer(trainer);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer ce formateur ?')) {
      try {
        const { error } = await supabase
          .from('workshop_trainers')
          .delete()
          .eq('id', id);

        if (error) throw error;
        fetchTrainers();
      } catch (error) {
        console.error('Erreur lors de la suppression:', error);
        setError('Erreur lors de la suppression du formateur');
      }
    }
  };

  const handleToggleTrainerCodeSent = async (trainerId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('workshop_trainers')
        .update({ code_sent: !currentStatus })
        .eq('id', trainerId);

      if (error) throw error;
      
      // Refresh the trainers list
      fetchTrainers();
    } catch (error) {
      console.error('Erreur lors de la mise à jour du statut d\'envoi:', error);
      setError('Erreur lors de la mise à jour du statut d\'envoi du code');
    }
  };

  const handleFilterChange = (newDate: string) => {
    const dateValue = newDate === '' ? null : newDate;
    setFilterDate(dateValue);
    onFilterChange(dateValue);
  };

  const clearFilter = () => {
    setFilterDate(null);
    onFilterChange(null);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingTrainer(null);
  };

  const getContractBadge = (contract?: TrainerWithContract['assigned_contract']) => {
    if (!contract) {
      return (
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
          <FileContract size={12} className="mr-1" />
          Aucun contrat
        </span>
      );
    }

    const badgeColor = contract.type === 'trainer' 
      ? 'bg-blue-100 text-blue-800' 
      : 'bg-purple-100 text-purple-800';

    return (
      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${badgeColor}`}>
        <FileContract size={12} className="mr-1" />
        {contract.name}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Gestion des Formateurs</h2>
            <p className="text-sm text-gray-600 mt-1">
              Gestion des codes formateurs et de leurs affectations de contrats
            </p>
          </div>
        </div>

        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <div className="flex items-start space-x-3">
            <AlertCircle className="text-red-500 mt-0.5" size={20} />
            <div className="flex-1">
              <h3 className="text-lg font-medium text-red-800 mb-2">
                Erreur de connexion
              </h3>
              <p className="text-red-700 mb-4">
                {error}
              </p>
              <div className="space-y-2 text-sm text-red-600">
                <p><strong>Vérifications suggérées :</strong></p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>Vérifiez que votre projet Supabase est actif</li>
                  <li>Contrôlez l'URL Supabase dans le fichier .env</li>
                  <li>Vérifiez la clé API anonyme dans le fichier .env</li>
                  <li>Assurez-vous d'avoir une connexion internet stable</li>
                </ul>
              </div>
              <button
                onClick={handleRetry}
                className="mt-4 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
              >
                <RefreshCw size={16} />
                <span>Réessayer ({retryCount})</span>
              </button>
            </div>
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="font-medium text-blue-800 mb-2">Configuration actuelle :</h4>
          <div className="text-sm text-blue-700 space-y-1">
            <p><strong>URL Supabase :</strong> {import.meta.env.VITE_SUPABASE_URL || 'Non définie'}</p>
            <p><strong>Clé API :</strong> {import.meta.env.VITE_SUPABASE_ANON_KEY ? 'Définie (masquée)' : 'Non définie'}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Gestion des Formateurs</h2>
          <p className="text-sm text-gray-600 mt-1">
            Gestion des codes formateurs et de leurs affectations de contrats
          </p>
        </div>
        <button
          onClick={() => {
            setEditingTrainer(null);
            setShowForm(true);
          }}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
        >
          <Plus size={20} />
          <span>Nouveau Formateur</span>
        </button>
      </div>

      {/* Filter Section */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Filter className="text-gray-600" size={20} />
              <span className="text-sm font-medium text-gray-700">Filtrer par atelier:</span>
            </div>
            <select
              value={filterDate || ''}
              onChange={(e) => handleFilterChange(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Tous les ateliers</option>
              {allWorkshopDates.map(date => (
                <option key={date} value={date}>
                  {format(new Date(date), 'dd MMMM yyyy', { locale: fr })}
                </option>
              ))}
            </select>
            {filterDate && (
              <button
                onClick={clearFilter}
                className="flex items-center space-x-1 px-3 py-2 text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
              >
                <X size={16} />
                <span>Effacer</span>
              </button>
            )}
          </div>
          {filterDate && (
            <div className="text-sm text-gray-600">
              <span className="font-medium">{trainers.length}</span> formateur(s) pour l'atelier du {format(new Date(filterDate), 'dd MMMM yyyy', { locale: fr })}
            </div>
          )}
        </div>
      </div>

      <div className="bg-white shadow-sm rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date Atelier
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Code Formateur
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Statut
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Contrat Affecté
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Code Envoyé
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date de Création
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {trainers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                    {filterDate ? 'Aucun formateur trouvé pour cet atelier' : 'Aucun formateur trouvé'}
                  </td>
                </tr>
              ) : (
                trainers.map((trainer) => (
                  <tr key={trainer.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <Users className="text-blue-600 mr-2" size={16} />
                        <span className="text-sm font-medium text-gray-900">
                          {format(new Date(trainer.workshop_date), 'dd MMMM yyyy', { locale: fr })}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <code className="bg-gray-100 px-2 py-1 rounded text-sm font-mono">
                        {trainer.trainer_code}
                      </code>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {trainer.is_claimed ? (
                          <>
                            <CheckCircle className="text-green-500 mr-1" size={16} />
                            <span className="text-sm text-green-800 bg-green-100 px-2 py-1 rounded-full">
                              Utilisé
                            </span>
                          </>
                        ) : (
                          <>
                            <XCircle className="text-orange-500 mr-1" size={16} />
                            <span className="text-sm text-orange-800 bg-orange-100 px-2 py-1 rounded-full">
                              En attente
                            </span>
                          </>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getContractBadge(trainer.assigned_contract)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => handleToggleTrainerCodeSent(trainer.id, trainer.code_sent)}
                        className={`flex items-center space-x-2 px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                          trainer.code_sent
                            ? 'bg-green-100 text-green-800 hover:bg-green-200'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                        title={trainer.code_sent ? 'Marquer comme non envoyé' : 'Marquer comme envoyé'}
                      >
                        {trainer.code_sent ? (
                          <MailCheck size={16} />
                        ) : (
                          <Mail size={16} />
                        )}
                        <span>{trainer.code_sent ? 'Envoyé' : 'Non envoyé'}</span>
                      </button>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {trainer.created_at && format(new Date(trainer.created_at), 'dd/MM/yyyy HH:mm', { locale: fr })}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex space-x-2 justify-end">
                        <button
                          onClick={() => handleEdit(trainer)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Modifier le formateur"
                        >
                          <Edit2 size={18} />
                        </button>
                        <button
                          onClick={() => handleDelete(trainer.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Supprimer le formateur"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Statistics Summary */}
      {trainers.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="flex items-center space-x-2">
              <Users className="text-blue-600" size={20} />
              <span className="text-sm font-medium text-gray-700">Total Formateurs</span>
            </div>
            <p className="text-2xl font-bold text-gray-900 mt-1">{trainers.length}</p>
          </div>
          
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="flex items-center space-x-2">
              <CheckCircle className="text-green-600" size={20} />
              <span className="text-sm font-medium text-gray-700">Codes Utilisés</span>
            </div>
            <p className="text-2xl font-bold text-gray-900 mt-1">
              {trainers.filter(t => t.is_claimed).length}
            </p>
          </div>
          
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="flex items-center space-x-2">
              <FileContract className="text-purple-600" size={20} />
              <span className="text-sm font-medium text-gray-700">Contrats Affectés</span>
            </div>
            <p className="text-2xl font-bold text-gray-900 mt-1">
              {trainers.filter(t => t.assigned_contract).length}
            </p>
          </div>

          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="flex items-center space-x-2">
              <MailCheck className="text-green-600" size={20} />
              <span className="text-sm font-medium text-gray-700">Codes Envoyés</span>
            </div>
            <p className="text-2xl font-bold text-gray-900 mt-1">
              {trainers.filter(t => t.code_sent).length}
            </p>
          </div>
          
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="flex items-center space-x-2">
              <XCircle className="text-orange-600" size={20} />
              <span className="text-sm font-medium text-gray-700">En Attente</span>
            </div>
            <p className="text-2xl font-bold text-gray-900 mt-1">
              {trainers.filter(t => !t.is_claimed).length}
            </p>
          </div>
        </div>
      )}

      {showForm && (
        <TrainerForm
          trainer={editingTrainer}
          onClose={handleCloseForm}
          onSave={fetchTrainers}
        />
      )}
    </div>
  );
};

export default TrainersTab;