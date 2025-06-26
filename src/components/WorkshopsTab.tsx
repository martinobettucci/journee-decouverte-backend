import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Key, Settings, FileSignature, FileText, CheckCircle, XCircle, AlertTriangle, Users, UserCheck, Mail, MailCheck, ExternalLink, BadgeEuro } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { supabase } from '../lib/supabase';
import WorkshopForm from './forms/WorkshopForm';
import ClientContractForm from './forms/ClientContractForm';
import ClientContractViewerModal from './common/ClientContractViewerModal';
import type { WorkshopWithStatus, ClientContract, TrainerRegistration } from '../types/database';

interface WorkshopsTabProps {
  onNavigateWithFilter: (tab: string, workshopDate?: string) => void;
}

const WorkshopsTab: React.FC<WorkshopsTabProps> = ({ onNavigateWithFilter }) => {
  const [workshops, setWorkshops] = useState<WorkshopWithStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showClientContractForm, setShowClientContractForm] = useState(false);
  const [showClientContractViewer, setShowClientContractViewer] = useState(false);
  const [editingWorkshop, setEditingWorkshop] = useState<WorkshopWithStatus | null>(null);
  const [selectedClientContract, setSelectedClientContract] = useState<ClientContract | null>(null);

  useEffect(() => {
    fetchWorkshops();
  }, []);

  const fetchWorkshops = async () => {
    try {
      // Fetch workshops
      const { data: workshopsData, error: workshopsError } = await supabase
        .from('workshop_passwords')
        .select('*')
        .order('date', { ascending: false });

      if (workshopsError) throw workshopsError;

      // Fetch client contracts
      const { data: clientContractsData, error: clientContractsError } = await supabase
        .from('client_contracts')
        .select('*');

      if (clientContractsError) throw clientContractsError;

      // Fetch trainers and registrations for each workshop
      const workshopsWithStatus = await Promise.all(
        (workshopsData || []).map(async (workshop) => {
          // Get trainers for this workshop
          const { data: trainersData, error: trainersError } = await supabase
            .from('workshop_trainers')
            .select('*')
            .eq('workshop_date', workshop.date);

          if (trainersError) {
            console.error('Error fetching trainers:', trainersError);
          }

          // Get registrations for this workshop
          const { data: registrationsData, error: registrationsError } = await supabase
            .from('trainer_registrations')
            .select('id, trainer_code, is_paid')
            .eq('workshop_date', workshop.date);

          if (registrationsError) {
            console.error('Error fetching registrations:', registrationsError);
          }

          // Exclude trainers who have abandoned the workshop
          const allTrainers = trainersData || [];
          const trainers = allTrainers.filter(t => !t.is_abandoned);

          // Only keep registrations for trainers that are still active
          const registrations = (registrationsData || []).filter(reg =>
            trainers.some(t => t.trainer_code === reg.trainer_code)
          );

          // Determine unpaid non-volunteer contracts
          let unpaidCount = 0;
          for (const reg of registrations) {
            try {
              const trainer = trainers.find(t => t.trainer_code === reg.trainer_code);
              if (!trainer) continue;

              const { data: assignmentData } = await supabase
                .from('contract_assignments')
                .select(`contract_templates!contract_assignments_contract_template_id_fkey(is_volunteer)`)
                .eq('trainer_id', trainer.id)
                .single();

              const isVolunteer = assignmentData?.contract_templates?.is_volunteer;
              if (!isVolunteer && !reg.is_paid) {
                unpaidCount++;
              }
            } catch (err) {
              console.warn('Failed to compute payment status for registration', reg.id);
            }
          }

          // Calculate trainer status
          const total_trainers = trainers.length;
          const registered_trainers = registrations.length;
          const all_claimed = trainers.every(trainer => trainer.is_claimed);

          // Find client contract for this workshop
          const clientContract = clientContractsData?.find(contract =>
            contract.workshop_date === workshop.date
          );

          const allPaid =
            unpaidCount === 0 && (clientContract ? clientContract.payment_received : true);

          return {
            ...workshop,
            client_contract: clientContract,
            trainer_status: {
              total_trainers,
              registered_trainers,
              all_claimed
            },
            unpaid_count: unpaidCount,
            all_paid: allPaid
          };
        })
      );

      setWorkshops(workshopsWithStatus);
    } catch (error) {
      console.error('Erreur lors du chargement des ateliers:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (workshop: WorkshopWithStatus) => {
    setEditingWorkshop(workshop);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer cet atelier ? Cette action supprimera également tous les formateurs, inscriptions, contrats et documents associés à cet atelier.')) {
      try {
        // First, get the workshop to access its date
        const { data: workshop, error: fetchError } = await supabase
          .from('workshop_passwords')
          .select('date')
          .eq('id', id)
          .single();

        if (fetchError) throw fetchError;

        const workshopDate = workshop.date;

        // Delete in the correct order to respect foreign key constraints

        // 1. Delete contract assignments (references workshop_trainers and contract_templates)
        const { data: trainersForWorkshop } = await supabase
          .from('workshop_trainers')
          .select('id')
          .eq('workshop_date', workshopDate);

        if (trainersForWorkshop && trainersForWorkshop.length > 0) {
          const trainerIds = trainersForWorkshop.map(t => t.id);
          await supabase
            .from('contract_assignments')
            .delete()
            .in('trainer_id', trainerIds);
        }

        // 2. Delete trainer registrations (references workshop_trainers and workshop_passwords)
        await supabase
          .from('trainer_registrations')
          .delete()
          .eq('workshop_date', workshopDate);

        // 3. Delete workshop trainers (references workshop_passwords)
        await supabase
          .from('workshop_trainers')
          .delete()
          .eq('workshop_date', workshopDate);

        // 4. Delete client contracts (references workshop_passwords)
        await supabase
          .from('client_contracts')
          .delete()
          .eq('workshop_date', workshopDate);

        // 5. Delete workshop guidelines (references workshop_passwords)
        await supabase
          .from('workshop_guidelines')
          .delete()
          .eq('workshop_date', workshopDate);

        // 6. Delete contract templates (references workshop_passwords)
        await supabase
          .from('contract_templates')
          .delete()
          .eq('workshop_date', workshopDate);

        // 7. Finally, delete the workshop itself
        const { error } = await supabase
          .from('workshop_passwords')
          .delete()
          .eq('id', id);

        if (error) throw error;

        fetchWorkshops();
      } catch (error) {
        console.error('Erreur lors de la suppression:', error);
        alert('Erreur lors de la suppression de l\'atelier. Veuillez réessayer.');
      }
    }
  };

  const handleManageClientContract = (workshop: WorkshopWithStatus) => {
    setSelectedClientContract(workshop.client_contract || null);
    setEditingWorkshop(workshop);
    setShowClientContractForm(true);
  };

  const handleViewClientContract = (clientContract: ClientContract) => {
    setSelectedClientContract(clientContract);
    setShowClientContractViewer(true);
  };

  const handleToggleClientCodeSent = async (clientContract: ClientContract) => {
    try {
      const { error } = await supabase
        .from('client_contracts')
        .update({ code_sent: !clientContract.code_sent })
        .eq('id', clientContract.id);

      if (error) throw error;
      
      // Refresh the workshops list
      fetchWorkshops();
    } catch (error) {
      console.error('Erreur lors de la mise à jour du statut d\'envoi:', error);
      alert('Erreur lors de la mise à jour du statut d\'envoi du code signature');
    }
  };

  const handleToggleClientPaymentReceived = async (clientContract: ClientContract) => {
    try {
      const { error } = await supabase
        .from('client_contracts')
        .update({ payment_received: !clientContract.payment_received })
        .eq('id', clientContract.id);

      if (error) throw error;

      fetchWorkshops();
    } catch (error) {
      console.error('Erreur lors de la mise à jour du paiement client:', error);
      alert("Erreur lors de la mise à jour du statut d'encaissement client");
    }
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingWorkshop(null);
  };

  const handleCloseClientContractForm = () => {
    setShowClientContractForm(false);
    setSelectedClientContract(null);
    setEditingWorkshop(null);
  };

  const handleCloseClientContractViewer = () => {
    setShowClientContractViewer(false);
    setSelectedClientContract(null);
  };

  const getClientContractStatus = (workshop: WorkshopWithStatus) => {
    if (!workshop.client_contract) {
      return {
        icon: <AlertTriangle className="text-amber-500" size={20} />,
        text: 'Aucun contrat',
        color: 'text-amber-600'
      };
    }
    
    if (workshop.client_contract.is_signed) {
      return {
        icon: <CheckCircle className="text-green-500" size={20} />,
        text: 'Contrat signé',
        color: 'text-green-600'
      };
    }
    
    return {
      icon: <XCircle className="text-red-500" size={20} />,
      text: 'En attente signature',
      color: 'text-red-600'
    };
  };

  const getTrainerStatus = (workshop: WorkshopWithStatus) => {
    const { trainer_status } = workshop;
    
    if (!trainer_status || trainer_status.total_trainers === 0) {
      return {
        icon: <AlertTriangle className="text-amber-500" size={20} />,
        text: 'Aucun formateur',
        color: 'text-amber-600'
      };
    }

    if (trainer_status.registered_trainers === trainer_status.total_trainers && trainer_status.all_claimed) {
      return {
        icon: <UserCheck className="text-green-500" size={20} />,
        text: 'Tous inscrits',
        color: 'text-green-600'
      };
    }

    return {
      icon: <Users className="text-red-500" size={20} />,
      text: `${trainer_status.registered_trainers}/${trainer_status.total_trainers} inscrits`,
      color: 'text-red-600'
    };
  };

  const getPaymentStatus = (workshop: WorkshopWithStatus) => {
    if (workshop.unpaid_count && workshop.unpaid_count > 0) {
      return {
        icon: <BadgeEuro className="text-red-500" size={20} />,
        text: `${workshop.unpaid_count} paiement(s) en attente`,
        color: 'text-red-600'
      };
    }

    if (workshop.client_contract && !workshop.client_contract.payment_received) {
      return {
        icon: <BadgeEuro className="text-orange-500" size={20} />,
        text: 'Attente encaissement',
        color: 'text-orange-600'
      };
    }

    return {
      icon: <BadgeEuro className="text-green-500" size={20} />,
      text: 'Tous payés',
      color: 'text-green-600'
    };
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
        <h2 className="text-2xl font-bold text-gray-900">Gestion des Ateliers</h2>
        <button
          onClick={() => {
            setEditingWorkshop(null);
            setShowForm(true);
          }}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
        >
          <Plus size={20} />
          <span>Nouvel Atelier</span>
        </button>
      </div>

      <div className="bg-white shadow-sm rounded-lg overflow-hidden">
        <div className="grid gap-4 p-6">
          {workshops.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              Aucun atelier trouvé
            </div>
          ) : (
            workshops.map((workshop) => {
              const clientStatus = getClientContractStatus(workshop);
              const trainerStatus = getTrainerStatus(workshop);

              return (
                <div
                  key={workshop.id}
                  className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-3">
                        <Settings className="text-blue-600" size={20} />
                        <h3 className="text-lg font-semibold text-gray-900">
                          Atelier du {format(new Date(workshop.date), 'dd MMMM yyyy', { locale: fr })}
                        </h3>
                      </div>

                      {/* Status indicators */}
                      <div className="flex items-center space-x-6 mb-4">
                        <div className="flex items-center space-x-2">
                          {clientStatus.icon}
                          <span className={`text-sm font-medium ${clientStatus.color}`}>
                            {clientStatus.text}
                          </span>
                        </div>
                        <div className="flex items-center space-x-2">
                          {trainerStatus.icon}
                          <span className={`text-sm font-medium ${trainerStatus.color}`}>
                            {trainerStatus.text}
                          </span>
                        </div>
                        <div className="flex items-center space-x-2">
                          {getPaymentStatus(workshop).icon}
                          <span className={`text-sm font-medium ${getPaymentStatus(workshop).color}`}>
                            {getPaymentStatus(workshop).text}
                          </span>
                        </div>
                      </div>

                      {/* Quick navigation buttons */}
                      <div className="flex flex-wrap gap-2 mb-4">
                        <button
                          onClick={() => onNavigateWithFilter('trainers', workshop.date)}
                          className="flex items-center space-x-2 px-3 py-1 text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-md transition-colors"
                        >
                          <Users size={14} />
                          <span>Voir Formateurs</span>
                          <ExternalLink size={12} />
                        </button>
                        <button
                          onClick={() => onNavigateWithFilter('contracts', workshop.date)}
                          className="flex items-center space-x-2 px-3 py-1 text-sm font-medium text-purple-600 bg-purple-50 hover:bg-purple-100 rounded-md transition-colors"
                        >
                          <FileText size={14} />
                          <span>Voir Contrats</span>
                          <ExternalLink size={12} />
                        </button>
                        <button
                          onClick={() => onNavigateWithFilter('registrations', workshop.date)}
                          className="flex items-center space-x-2 px-3 py-1 text-sm font-medium text-green-600 bg-green-50 hover:bg-green-100 rounded-md transition-colors"
                        >
                          <UserCheck size={14} />
                          <span>Voir Inscriptions</span>
                          <ExternalLink size={12} />
                        </button>
                        <button
                          onClick={() => onNavigateWithFilter('guidelines', workshop.date)}
                          className="flex items-center space-x-2 px-3 py-1 text-sm font-medium text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-md transition-colors"
                        >
                          <FileText size={14} />
                          <span>Voir Directives</span>
                          <ExternalLink size={12} />
                        </button>
                      </div>
                      
                      <div className="flex items-center space-x-2 mb-4 p-3 bg-gray-50 rounded-md">
                        <Key className="text-gray-600" size={16} />
                        <span className="text-sm text-gray-600">Mot de passe:</span>
                        <code className="bg-white px-2 py-1 rounded text-sm font-mono border">
                          {workshop.password}
                        </code>
                      </div>

                      <div className="space-y-2">
                        <h4 className="text-sm font-medium text-gray-900">Outils disponibles:</h4>
                        <div className="flex flex-wrap gap-2">
                          {Object.entries(workshop.available_tools).map(([tool, enabled]) => (
                            <span
                              key={tool}
                              className={`px-3 py-1 rounded-full text-xs font-medium ${
                                enabled
                                  ? 'bg-green-100 text-green-800'
                                  : 'bg-gray-100 text-gray-600'
                              }`}
                            >
                              {tool.replace('_', ' ')}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex flex-col space-y-2 ml-4">
                      {/* Client contract actions */}
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleManageClientContract(workshop)}
                          className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                          title="Gérer le contrat client"
                        >
                          <FileSignature size={18} />
                        </button>
                        {workshop.client_contract && (
                          <>
                            <button
                              onClick={() => handleViewClientContract(workshop.client_contract!)}
                              className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                              title="Visualiser/Imprimer le contrat client"
                            >
                              <FileText size={18} />
                            </button>
                            <button
                              onClick={() => handleToggleClientCodeSent(workshop.client_contract!)}
                              className={`p-2 rounded-lg transition-colors ${
                                workshop.client_contract.code_sent
                                  ? 'text-green-600 bg-green-50 hover:bg-green-100'
                                  : 'text-gray-600 bg-gray-50 hover:bg-gray-100'
                              }`}
                              title={workshop.client_contract.code_sent ? 'Marquer code comme non envoyé' : 'Marquer code comme envoyé'}
                            >
                              {workshop.client_contract.code_sent ? <MailCheck size={18} /> : <Mail size={18} />}
                            </button>
                            <button
                              onClick={() => handleToggleClientPaymentReceived(workshop.client_contract!)}
                              className={`p-2 rounded-lg transition-colors ${
                                workshop.client_contract.payment_received
                                  ? 'text-green-600 bg-green-50 hover:bg-green-100'
                                  : 'text-gray-600 bg-gray-50 hover:bg-gray-100'
                              }`}
                              title={workshop.client_contract.payment_received ? 'Marquer encaissement non reçu' : 'Marquer encaissement reçu'}
                            >
                              <BadgeEuro size={18} />
                            </button>
                          </>
                        )}
                      </div>

                      {/* Workshop actions */}
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleEdit(workshop)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Modifier l'atelier"
                        >
                          <Edit2 size={18} />
                        </button>
                        <button
                          onClick={() => handleDelete(workshop.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Supprimer l'atelier"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Client contract code sent status */}
                  {workshop.client_contract && (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <div className="flex items-center justify-between">
                        <div className="text-sm text-gray-600">
                          Code signature: <code className="bg-gray-100 px-2 py-1 rounded font-mono">{workshop.client_contract.signature_code}</code>
                        </div>
                        <div className={`flex items-center space-x-2 text-sm ${
                          workshop.client_contract.code_sent ? 'text-green-600' : 'text-gray-500'
                        }`}>
                          {workshop.client_contract.code_sent ? <MailCheck size={16} /> : <Mail size={16} />}
                          <span>{workshop.client_contract.code_sent ? 'Code envoyé' : 'Code non envoyé'}</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between mt-2">
                        <div className="text-sm text-gray-600">Paiement client:</div>
                        <div className={`flex items-center space-x-2 text-sm ${
                          workshop.client_contract.payment_received ? 'text-green-600' : 'text-gray-500'
                        }`}>
                          <BadgeEuro size={16} />
                          <span>{workshop.client_contract.payment_received ? 'Reçu' : 'En attente'}</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {showForm && (
        <WorkshopForm
          workshop={editingWorkshop}
          onClose={handleCloseForm}
          onSave={fetchWorkshops}
        />
      )}

      {showClientContractForm && (
        <ClientContractForm
          clientContract={selectedClientContract}
          onClose={handleCloseClientContractForm}
          onSave={fetchWorkshops}
        />
      )}

      {showClientContractViewer && selectedClientContract && (
        <ClientContractViewerModal
          clientContract={selectedClientContract}
          onClose={handleCloseClientContractViewer}
        />
      )}
    </div>
  );
};

export default WorkshopsTab;