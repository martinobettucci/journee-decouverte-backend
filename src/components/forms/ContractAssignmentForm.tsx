import React, { useState, useEffect } from 'react';
import { X, Save, User, FileText } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import type { WorkshopTrainer, ContractTemplate } from '../../types/database';

interface ContractAssignmentFormProps {
  contractId: string;
  onClose: () => void;
  onSave: () => void;
}

const ContractAssignmentForm: React.FC<ContractAssignmentFormProps> = ({ contractId, onClose, onSave }) => {
  const [selectedTrainerId, setSelectedTrainerId] = useState('');
  const [availableTrainers, setAvailableTrainers] = useState<WorkshopTrainer[]>([]);
  const [contractInfo, setContractInfo] = useState<ContractTemplate | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchContractInfo();
  }, [contractId]);

  const fetchContractInfo = async () => {
    try {
      const { data, error } = await supabase
        .from('contract_templates')
        .select('*')
        .eq('id', contractId)
        .eq('type', 'trainer') // Only trainer contracts can be assigned
        .single();

      if (error) throw error;
      setContractInfo(data);
    } catch (error) {
      console.error('Erreur lors du chargement du contrat:', error);
      setError('Ce contrat n\'est pas disponible pour assignation aux formateurs');
    }
  };

  const fetchAvailableTrainers = async () => {
    try {
      if (!contractInfo) return;

      // Get trainers for this workshop date that don't have a contract assigned
      const { data: allTrainers, error: trainersError } = await supabase
        .from('workshop_trainers')
        .select('*')
        .eq('workshop_date', contractInfo.workshop_date);

      if (trainersError) throw trainersError;

      // Get already assigned trainers
      const { data: assignments, error: assignmentsError } = await supabase
        .from('contract_assignments')
        .select('trainer_id');

      if (assignmentsError) throw assignmentsError;

      const assignedTrainerIds = assignments?.map(a => a.trainer_id) || [];
      const available = allTrainers?.filter(t => !assignedTrainerIds.includes(t.id)) || [];

      setAvailableTrainers(available);
    } catch (error) {
      console.error('Erreur lors du chargement des formateurs disponibles:', error);
    }
  };

  useEffect(() => {
    if (contractInfo) {
      fetchAvailableTrainers();
    }
  }, [contractInfo]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const { error } = await supabase
        .from('contract_assignments')
        .insert([{
          trainer_id: selectedTrainerId,
          contract_template_id: contractId
        }]);

      if (error) throw error;

      onSave();
      onClose();
    } catch (error: any) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  if (!contractInfo) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-lg max-w-lg w-full p-6">
          <div className="text-center">
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Contrat non disponible
            </h3>
            <p className="text-gray-600 mb-4">
              Seuls les contrats de type "Formateur" peuvent être assignés aux formateurs.
            </p>
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
            >
              Fermer
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-lg w-full">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">
            Assigner un Contrat Formateur
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

          <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
            <div className="flex items-center space-x-2 mb-2">
              <FileText className="text-blue-600" size={16} />
              <span className="font-medium text-blue-900">Contrat sélectionné</span>
            </div>
            <p className="text-blue-800 text-sm">{contractInfo.name}</p>
            <p className="text-blue-600 text-xs">
              Type: Formateur • Atelier du {new Date(contractInfo.workshop_date).toLocaleDateString('fr-FR', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </p>
          </div>

          <div>
            <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 mb-2">
              <User size={16} />
              <span>Formateur *</span>
            </label>
            <select
              required
              value={selectedTrainerId}
              onChange={(e) => setSelectedTrainerId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Sélectionner un formateur</option>
              {availableTrainers.map(trainer => (
                <option key={trainer.id} value={trainer.id}>
                  {trainer.trainer_code} {trainer.is_claimed ? '(utilisé)' : '(en attente)'}
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-500 mt-1">
              Seuls les formateurs sans contrat assigné sont affichés
            </p>
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
              disabled={loading || !selectedTrainerId}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors flex items-center space-x-2 disabled:opacity-50"
            >
              <Save size={16} />
              <span>{loading ? 'Attribution...' : 'Assigner'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ContractAssignmentForm;