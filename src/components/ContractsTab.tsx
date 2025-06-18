import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, FileText, User, Users, Building, X, Copy, Heart, Filter } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { supabase } from '../lib/supabase';
import ContractForm from './forms/ContractForm';
import ContractAssignmentForm from './forms/ContractAssignmentForm';
import ContractCloneForm from './forms/ContractCloneForm';
import ConfirmationModal from './common/ConfirmationModal';
import NotificationModal from './common/NotificationModal';
import type { ContractTemplate, ContractAssignment, WorkshopTrainer } from '../types/database';

interface ContractWithAssignments extends ContractTemplate {
  assignments?: ContractAssignment[];
  assigned_trainers?: WorkshopTrainer[];
}

interface ContractsTabProps {
  initialFilterDate: string | null;
  allWorkshopDates: string[];
  onFilterChange: (date: string | null) => void;
}

const ContractsTab: React.FC<ContractsTabProps> = ({ initialFilterDate, allWorkshopDates, onFilterChange }) => {
  const [contracts, setContracts] = useState<ContractWithAssignments[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showAssignmentForm, setShowAssignmentForm] = useState(false);
  const [showCloneForm, setShowCloneForm] = useState(false);
  const [showUnassignModal, setShowUnassignModal] = useState(false);
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [editingContract, setEditingContract] = useState<ContractTemplate | null>(null);
  const [cloneSourceContract, setCloneSourceContract] = useState<ContractTemplate | null>(null);
  const [selectedContractId, setSelectedContractId] = useState<string | null>(null);
  const [selectedAssignment, setSelectedAssignment] = useState<{
    assignmentId: string;
    trainerCode: string;
    contractName: string;
    isContractAccepted: boolean;
  } | null>(null);
  const [notification, setNotification] = useState<{
    title: string;
    message: string;
    type: 'success' | 'error' | 'warning' | 'info';
  }>({ title: '', message: '', type: 'info' });
  const [filterType, setFilterType] = useState<'all' | 'trainer' | 'client'>('all');
  const [filterDate, setFilterDate] = useState<string | null>(initialFilterDate);
  const [isUnassigning, setIsUnassigning] = useState(false);

  useEffect(() => {
    setFilterDate(initialFilterDate);
  }, [initialFilterDate]);

  useEffect(() => {
    fetchContracts();
  }, [filterDate]);

  const showNotification = (title: string, message: string, type: 'success' | 'error' | 'warning' | 'info' = 'info') => {
    setNotification({ title, message, type });
    setShowNotificationModal(true);
  };

  const fetchContracts = async () => {
    try {
      // Build query with optional filter
      let query = supabase
        .from('contract_templates')
        .select('*')
        .order('type', { ascending: true })
        .order('workshop_date', { ascending: false });

      if (filterDate) {
        query = query.eq('workshop_date', filterDate);
      }

      const { data: contractsData, error: contractsError } = await query;

      if (contractsError) throw contractsError;

      // Fetch assignments for trainer contracts only
      const contractsWithAssignments = await Promise.all(
        (contractsData || []).map(async (contract) => {
          if (contract.type === 'trainer') {
            const { data: assignments, error: assignmentsError } = await supabase
              .from('contract_assignments')
              .select(`
                *,
                workshop_trainers!contract_assignments_trainer_id_fkey (
                  id,
                  trainer_code,
                  workshop_date,
                  trainer_registrations!trainer_registrations_trainer_code_fkey (
                    contract_accepted
                  )
                )
              `)
              .eq('contract_template_id', contract.id);

            if (assignmentsError) {
              console.error('Error fetching assignments:', assignmentsError);
              return { ...contract, assignments: [] };
            }

            return {
              ...contract,
              assignments: assignments || [],
              assigned_trainers: assignments?.map(a => a.workshop_trainers).flat() || []
            };
          } else {
            // Client contracts don't have trainer assignments
            return {
              ...contract,
              assignments: [],
              assigned_trainers: []
            };
          }
        })
      );

      setContracts(contractsWithAssignments);
    } catch (error) {
      console.error('Erreur lors du chargement des contrats:', error);
      showNotification(
        'Erreur de chargement',
        'Une erreur est survenue lors du chargement des contrats.',
        'error'
      );
    } finally {
      setLoading(false);
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

  const handleEdit = (contract: ContractTemplate) => {
    setEditingContract(contract);
    setShowForm(true);
  };

  const handleClone = (contract: ContractTemplate) => {
    setCloneSourceContract(contract);
    setShowCloneForm(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer ce contrat ? Les affectations seront également supprimées.')) {
      try {
        const { error } = await supabase
          .from('contract_templates')
          .delete()
          .eq('id', id);

        if (error) throw error;
        
        showNotification(
          'Contrat supprimé',
          'Le contrat a été supprimé avec succès.',
          'success'
        );
        fetchContracts();
      } catch (error) {
        console.error('Erreur lors de la suppression:', error);
        showNotification(
          'Erreur de suppression',
          'Une erreur est survenue lors de la suppression du contrat.',
          'error'
        );
      }
    }
  };

  const handleAssignContract = (contractId: string) => {
    setSelectedContractId(contractId);
    setShowAssignmentForm(true);
  };

  const handleUnassignContract = (assignmentId: string, trainerCode: string, contractName: string, isContractAccepted: boolean) => {
    setSelectedAssignment({ assignmentId, trainerCode, contractName, isContractAccepted });
    setShowUnassignModal(true);
  };

  const handleUnassignConfirm = async () => {
    if (!selectedAssignment) return;

    // Check if contract has been accepted
    if (selectedAssignment.isContractAccepted) {
      setShowUnassignModal(false);
      setSelectedAssignment(null);
      showNotification(
        'Modification impossible',
        'Le formateur s\'est déjà inscrit et a accepté ce contrat. L\'affectation ne peut plus être modifiée.',
        'warning'
      );
      return;
    }

    try {
      setIsUnassigning(true);

      const { error } = await supabase
        .from('contract_assignments')
        .delete()
        .eq('id', selectedAssignment.assignmentId);

      if (error) throw error;

      setShowUnassignModal(false);
      setSelectedAssignment(null);
      
      showNotification(
        'Affectation supprimée',
        `Le formateur ${selectedAssignment.trainerCode} a été retiré du contrat "${selectedAssignment.contractName}" avec succès.`,
        'success'
      );
      
      fetchContracts();
    } catch (error) {
      console.error('Erreur lors de la suppression de l\'affectation:', error);
      showNotification(
        'Erreur de suppression',
        'Une erreur est survenue lors de la suppression de l\'affectation.',
        'error'
      );
    } finally {
      setIsUnassigning(false);
    }
  };

  const handleUnassignCancel = () => {
    setShowUnassignModal(false);
    setSelectedAssignment(null);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingContract(null);
  };

  const handleCloseAssignmentForm = () => {
    setShowAssignmentForm(false);
    setSelectedContractId(null);
  };

  const handleCloseCloneForm = () => {
    setShowCloneForm(false);
    setCloneSourceContract(null);
  };

  const isContractAccepted = (assignment: ContractAssignment): boolean => {
    const trainerRegistrations = assignment.workshop_trainers?.trainer_registrations;
    if (!trainerRegistrations) return false;
    
    // Ensure trainerRegistrations is an array
    const registrationsArray = Array.isArray(trainerRegistrations) 
      ? trainerRegistrations 
      : [trainerRegistrations];
      
    return registrationsArray.some(reg => reg.contract_accepted);
  };

  const filteredContracts = contracts.filter(contract => {
    if (filterType === 'all') return true;
    return contract.type === filterType;
  });

  const getContractTypeIcon = (type: 'trainer' | 'client') => {
    return type === 'trainer' ? (
      <Users className="text-blue-600" size={20} />
    ) : (
      <Building className="text-purple-600" size={20} />
    );
  };

  const getContractTypeColor = (type: 'trainer' | 'client') => {
    return type === 'trainer' 
      ? 'bg-blue-100 text-blue-800 border-blue-200' 
      : 'bg-purple-100 text-purple-800 border-purple-200';
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
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Prototypes de Contrats</h2>
          <p className="text-sm text-gray-600 mt-1">
            Gestion des modèles de contrats pour formateurs et clients
          </p>
        </div>
        <button
          onClick={() => {
            setEditingContract(null);
            setShowForm(true);
          }}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
        >
          <Plus size={20} />
          <span>Nouveau Contrat</span>
        </button>
      </div>

      {/* Filter Section */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
          <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
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
              <span className="font-medium">{filteredContracts.length}</span> contrat(s) pour l'atelier du {format(new Date(filterDate), 'dd MMMM yyyy', { locale: fr })}
            </div>
          )}
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg w-fit">
        <button
          onClick={() => setFilterType('all')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            filterType === 'all'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Tous ({contracts.length})
        </button>
        <button
          onClick={() => setFilterType('trainer')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            filterType === 'trainer'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Formateurs ({contracts.filter(c => c.type === 'trainer').length})
        </button>
        <button
          onClick={() => setFilterType('client')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            filterType === 'client'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Clients ({contracts.filter(c => c.type === 'client').length})
        </button>
      </div>

      <div className="bg-white shadow-sm rounded-lg overflow-hidden">
        <div className="grid gap-6 p-6">
          {filteredContracts.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              {filterDate ? (
                filterType === 'all' 
                  ? 'Aucun contrat trouvé pour cet atelier'
                  : `Aucun contrat ${filterType === 'trainer' ? 'formateur' : 'client'} trouvé pour cet atelier`
              ) : (
                filterType === 'all' 
                  ? 'Aucun contrat trouvé'
                  : `Aucun contrat ${filterType === 'trainer' ? 'formateur' : 'client'} trouvé`
              )}
            </div>
          ) : (
            filteredContracts.map((contract) => (
              <div
                key={contract.id}
                className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      {getContractTypeIcon(contract.type)}
                      <h3 className="text-lg font-semibold text-gray-900">
                        {contract.name}
                      </h3>
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getContractTypeColor(contract.type)}`}>
                        {contract.type === 'trainer' ? 'Formateur' : 'Client'}
                      </span>
                      {contract.is_volunteer && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-pink-100 text-pink-800 border-pink-200">
                          <Heart size={12} className="mr-1" />
                          Bénévole
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 mb-3">
                      Atelier du {format(new Date(contract.workshop_date), 'dd MMMM yyyy', { locale: fr })}
                    </p>
                    
                    {contract.type === 'trainer' && contract.assignments && contract.assignments.length > 0 && (
                      <div className="mb-3">
                        <h4 className="text-sm font-medium text-gray-900 mb-2">Formateurs assignés:</h4>
                        <div className="flex flex-wrap gap-2">
                          {contract.assignments.map((assignment) => {
                            const contractAccepted = isContractAccepted(assignment);
                            return (
                              <div
                                key={assignment.id}
                                className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                  contractAccepted 
                                    ? 'bg-green-100 text-green-800 border border-green-200' 
                                    : 'bg-blue-100 text-blue-800 border border-blue-200'
                                }`}
                              >
                                <User size={12} className="mr-1" />
                                <span>{assignment.workshop_trainers?.trainer_code}</span>
                                {contractAccepted && (
                                  <span className="ml-1 text-xs">✓</span>
                                )}
                                <button
                                  onClick={() => handleUnassignContract(
                                    assignment.id,
                                    assignment.workshop_trainers?.trainer_code || '',
                                    contract.name,
                                    contractAccepted
                                  )}
                                  disabled={contractAccepted}
                                  className={`ml-2 transition-colors ${
                                    contractAccepted
                                      ? 'text-gray-400 cursor-not-allowed'
                                      : 'text-blue-600 hover:text-red-600'
                                  }`}
                                  title={
                                    contractAccepted
                                      ? 'Le formateur s\'est déjà inscrit et a accepté ce contrat.'
                                      : 'Retirer cette affectation'
                                  }
                                >
                                  <X size={12} />
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="flex space-x-2 ml-4">
                    {contract.type === 'trainer' && (
                      <button
                        onClick={() => handleAssignContract(contract.id)}
                        className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                        title="Assigner à un formateur"
                      >
                        <User size={18} />
                      </button>
                    )}
                    <button
                      onClick={() => handleClone(contract)}
                      className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                      title="Cloner ce contrat"
                    >
                      <Copy size={18} />
                    </button>
                    <button
                      onClick={() => handleEdit(contract)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Modifier le contrat"
                    >
                      <Edit2 size={18} />
                    </button>
                    <button
                      onClick={() => handleDelete(contract.id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Supprimer le contrat"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-md p-4">
                  <h4 className="text-sm font-medium text-gray-900 mb-2">Contenu Markdown:</h4>
                  <div className="max-h-48 overflow-y-auto">
                    <pre className="text-xs text-gray-700 whitespace-pre-wrap break-words">
                      {contract.content_markdown.substring(0, 500)}
                      {contract.content_markdown.length > 500 && '...'}
                    </pre>
                  </div>
                </div>

                {contract.created_at && (
                  <div className="mt-3 text-xs text-gray-500">
                    Créé le {format(new Date(contract.created_at), 'dd MMMM yyyy à HH:mm', { locale: fr })}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {showForm && (
        <ContractForm
          contract={editingContract}
          onClose={handleCloseForm}
          onSave={fetchContracts}
        />
      )}

      {showAssignmentForm && selectedContractId && (
        <ContractAssignmentForm
          contractId={selectedContractId}
          onClose={handleCloseAssignmentForm}
          onSave={fetchContracts}
        />
      )}

      {showCloneForm && cloneSourceContract && (
        <ContractCloneForm
          sourceContract={cloneSourceContract}
          onClose={handleCloseCloneForm}
          onSave={fetchContracts}
        />
      )}

      <ConfirmationModal
        isOpen={showUnassignModal}
        onClose={handleUnassignCancel}
        onConfirm={handleUnassignConfirm}
        title="Retirer l'affectation de contrat"
        message={selectedAssignment ? 
          `Êtes-vous sûr de vouloir retirer le formateur "${selectedAssignment.trainerCode}" du contrat "${selectedAssignment.contractName}" ?\n\nCette action supprimera l'affectation mais n'affectera pas le formateur lui-même.` : 
          ''
        }
        confirmText="Retirer l'affectation"
        cancelText="Annuler"
        type="warning"
        loading={isUnassigning}
      />

      <NotificationModal
        isOpen={showNotificationModal}
        onClose={() => setShowNotificationModal(false)}
        title={notification.title}
        message={notification.message}
        type={notification.type}
        autoClose={notification.type === 'success'}
        autoCloseDelay={3000}
      />
    </div>
  );
};

export default ContractsTab;