import React, { useState, useEffect } from 'react';
import { FileText, Phone, Mail, Download, CheckCircle, XCircle, Trash2, Contact as FileContract, Heart, FileType } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { supabase } from '../lib/supabase';
import ConfirmationModal from './common/ConfirmationModal';
import NotificationModal from './common/NotificationModal';
import ContractGeneratorModal from './common/ContractGeneratorModal';
import type { TrainerRegistration, ContractTemplate } from '../types/database';

interface SignedUrls {
  [registrationId: string]: {
    invoice_url?: string; // For paid contracts: invoice PDF, for volunteer contracts: motivation letter PDF
    rib_url?: string;
  };
}

interface RegistrationWithContract extends TrainerRegistration {
  contract_info?: {
    is_volunteer: boolean;
    name: string;
  };
}

const RegistrationsTab: React.FC = () => {
  const [registrations, setRegistrations] = useState<RegistrationWithContract[]>([]);
  const [signedUrls, setSignedUrls] = useState<SignedUrls>({});
  const [loading, setLoading] = useState(true);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [notificationModalOpen, setNotificationModalOpen] = useState(false);
  const [contractModalOpen, setContractModalOpen] = useState(false);
  const [selectedRegistration, setSelectedRegistration] = useState<RegistrationWithContract | null>(null);
  const [notification, setNotification] = useState<{
    title: string;
    message: string;
    type: 'success' | 'error' | 'warning' | 'info';
  }>({ title: '', message: '', type: 'info' });
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    fetchRegistrations();
  }, []);

  const showNotification = (title: string, message: string, type: 'success' | 'error' | 'warning' | 'info' = 'info') => {
    setNotification({ title, message, type });
    setNotificationModalOpen(true);
  };

  const generateSignedUrl = async (filePath: string): Promise<string | null> => {
    try {
      // Check if this is a volunteer placeholder
      if (filePath === 'volunteer_no_motivation_provided' || filePath.includes('volunteer_no_motivation_provided')) {
        return null;
      }

      let pathInBucket: string;
      
      // Check if filePath is a full Supabase storage URL
      if (filePath.includes('supabase.co/storage/v1/object/')) {
        // Extract the path after the bucket name from the full URL
        const bucketName = 'trainer-documents';
        const bucketIndex = filePath.indexOf(`/${bucketName}/`);
        if (bucketIndex !== -1) {
          pathInBucket = filePath.substring(bucketIndex + `/${bucketName}/`.length);
        } else {
          // Fallback to just the filename
          pathInBucket = filePath.split('/').pop() || '';
        }
      } else {
        // Assume it's already the correct path within the bucket
        pathInBucket = filePath;
      }

      if (!pathInBucket) return null;

      const { data, error } = await supabase.storage
        .from('trainer-documents')
        .createSignedUrl(pathInBucket, 3600); // 1 hour expiration

      if (error) {
        console.error('Error generating signed URL for', pathInBucket, ':', error);
        return null;
      }

      return data.signedUrl;
    } catch (error) {
      console.error('Error generating signed URL:', error);
      return null;
    }
  };

  const extractFilePathFromUrl = (fileUrl: string): string | null => {
    try {
      // Don't process volunteer placeholders
      if (fileUrl === 'volunteer_no_motivation_provided' || fileUrl.includes('volunteer_no_motivation_provided')) {
        return fileUrl;
      }

      if (fileUrl.includes('supabase.co/storage/v1/object/')) {
        const bucketName = 'trainer-documents';
        const bucketIndex = fileUrl.indexOf(`/${bucketName}/`);
        if (bucketIndex !== -1) {
          return fileUrl.substring(bucketIndex + `/${bucketName}/`.length);
        }
      }
      // If not a full URL, assume it's already the correct path
      return fileUrl.split('/').pop() || null;
    } catch (error) {
      console.error('Error extracting file path:', error);
      return null;
    }
  };

  const deleteFileFromStorage = async (fileUrl: string): Promise<boolean> => {
    try {
      // Don't try to delete volunteer placeholders
      if (fileUrl === 'volunteer_no_motivation_provided' || fileUrl.includes('volunteer_no_motivation_provided')) {
        return true; // Consider this successful as there's nothing to delete
      }

      const filePath = extractFilePathFromUrl(fileUrl);
      if (!filePath) {
        console.warn('Could not extract file path from URL:', fileUrl);
        return false;
      }

      const { error } = await supabase.storage
        .from('trainer-documents')
        .remove([filePath]);

      if (error) {
        console.error('Error deleting file from storage:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in deleteFileFromStorage:', error);
      return false;
    }
  };

  const handleDeleteClick = (registration: RegistrationWithContract) => {
    setSelectedRegistration(registration);
    setDeleteModalOpen(true);
  };

  const handleGenerateContractClick = (registration: RegistrationWithContract) => {
    setSelectedRegistration(registration);
    setContractModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!selectedRegistration) return;

    try {
      setIsDeleting(true);

      // Delete files from storage first
      const deletePromises = [];
      
      if (selectedRegistration.invoice_file_url) {
        deletePromises.push(deleteFileFromStorage(selectedRegistration.invoice_file_url));
      }
      
      if (selectedRegistration.rib_file_url) {
        deletePromises.push(deleteFileFromStorage(selectedRegistration.rib_file_url));
      }

      // Wait for file deletions (but don't fail if they don't work)
      if (deletePromises.length > 0) {
        const deletionResults = await Promise.all(deletePromises);
        const failedDeletions = deletionResults.filter(result => !result);
        
        if (failedDeletions.length > 0) {
          console.warn(`${failedDeletions.length} file(s) could not be deleted from storage`);
        }
      }

      // Delete the registration record from database
      const { error: dbError } = await supabase
        .from('trainer_registrations')
        .delete()
        .eq('id', selectedRegistration.id);

      if (dbError) {
        throw dbError;
      }

      // Refresh the registrations list
      await fetchRegistrations();

      setDeleteModalOpen(false);
      setSelectedRegistration(null);
      showNotification(
        'Inscription supprimée',
        'L\'inscription a été supprimée avec succès ainsi que tous les fichiers associés.',
        'success'
      );
    } catch (error) {
      console.error('Erreur lors de la suppression de l\'inscription:', error);
      showNotification(
        'Erreur de suppression',
        'Une erreur est survenue lors de la suppression de l\'inscription. Veuillez réessayer.',
        'error'
      );
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteModalOpen(false);
    setSelectedRegistration(null);
  };

  const handleContractModalClose = () => {
    setContractModalOpen(false);
    setSelectedRegistration(null);
  };

  const isMotivationLetterAvailable = (registration: RegistrationWithContract): boolean => {
    if (!registration.contract_info?.is_volunteer) return false;
    if (!registration.invoice_file_url) return false;
    if (registration.invoice_file_url === 'volunteer_no_motivation_provided') return false;
    return true;
  };

  const fetchRegistrations = async () => {
    try {
      const { data, error } = await supabase
        .from('trainer_registrations')
        .select('*')
        .order('registered_at', { ascending: false });

      if (error) throw error;

      // Enhance registrations with contract info
      const enhancedRegistrations = await Promise.all(
        (data || []).map(async (registration) => {
          try {
            // Get the trainer for this registration
            const { data: trainerData, error: trainerError } = await supabase
              .from('workshop_trainers')
              .select('id')
              .eq('trainer_code', registration.trainer_code)
              .single();

            if (trainerError || !trainerData) {
              return { ...registration, contract_info: undefined };
            }

            // Get the contract assignment for this trainer
            const { data: assignmentData, error: assignmentError } = await supabase
              .from('contract_assignments')
              .select(`
                contract_templates!contract_assignments_contract_template_id_fkey (
                  is_volunteer,
                  name
                )
              `)
              .eq('trainer_id', trainerData.id)
              .single();

            if (assignmentError || !assignmentData?.contract_templates) {
              return { ...registration, contract_info: undefined };
            }

            return {
              ...registration,
              contract_info: {
                is_volunteer: assignmentData.contract_templates.is_volunteer,
                name: assignmentData.contract_templates.name
              }
            };
          } catch (error) {
            console.warn('Failed to fetch contract info for registration', registration.id, ':', error);
            return { ...registration, contract_info: undefined };
          }
        })
      );

      setRegistrations(enhancedRegistrations);

      // Generate signed URLs for each registration's files
      if (enhancedRegistrations && enhancedRegistrations.length > 0) {
        const urlPromises = enhancedRegistrations.map(async (registration) => {
          const isVolunteer = registration.contract_info?.is_volunteer;
          
          let invoiceUrl, ribUrl;
          
          if (isVolunteer) {
            // For volunteer contracts, invoice_file_url contains motivation letter or placeholder
            if (isMotivationLetterAvailable(registration)) {
              invoiceUrl = await generateSignedUrl(registration.invoice_file_url);
            }
          } else {
            // For paid contracts, get both invoice and RIB
            const [invoice, rib] = await Promise.all([
              generateSignedUrl(registration.invoice_file_url),
              generateSignedUrl(registration.rib_file_url)
            ]);
            invoiceUrl = invoice;
            ribUrl = rib;
          }

          return {
            id: registration.id,
            invoice_url: invoiceUrl,
            rib_url: ribUrl
          };
        });

        const urlResults = await Promise.all(urlPromises);
        const urlMap: SignedUrls = {};
        
        urlResults.forEach(result => {
          if (result.invoice_url || result.rib_url) {
            urlMap[result.id] = {
              invoice_url: result.invoice_url || undefined,
              rib_url: result.rib_url || undefined
            };
          }
        });

        setSignedUrls(urlMap);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des inscriptions:', error);
      showNotification(
        'Erreur de chargement',
        'Une erreur est survenue lors du chargement des inscriptions.',
        'error'
      );
    } finally {
      setLoading(false);
    }
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
        <h2 className="text-2xl font-bold text-gray-900">Inscriptions des Formateurs</h2>
      </div>

      <div className="bg-white shadow-sm rounded-lg overflow-hidden">
        <div className="grid gap-6 p-6">
          {registrations.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              Aucune inscription trouvée
            </div>
          ) : (
            registrations.map((registration) => (
              <div
                key={registration.id}
                className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {registration.first_name} {registration.last_name}
                      </h3>
                      {registration.contract_info?.is_volunteer && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-pink-100 text-pink-800">
                          <Heart size={12} className="mr-1" />
                          Bénévole
                        </span>
                      )}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div className="flex items-center space-x-2 text-sm text-gray-600">
                        <Mail size={16} />
                        <span>{registration.email}</span>
                      </div>
                      <div className="flex items-center space-x-2 text-sm text-gray-600">
                        <Phone size={16} />
                        <span>{registration.phone}</span>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div className="text-sm">
                        <span className="text-gray-600">Code formateur: </span>
                        <code className="bg-gray-100 px-2 py-1 rounded font-mono">
                          {registration.trainer_code}
                        </code>
                      </div>
                      <div className="text-sm">
                        <span className="text-gray-600">Atelier: </span>
                        <span className="font-medium">
                          {format(new Date(registration.workshop_date), 'dd MMMM yyyy', { locale: fr })}
                        </span>
                      </div>
                    </div>
                    {registration.contract_info && (
                      <div className="text-sm mb-4">
                        <span className="text-gray-600">Contrat assigné: </span>
                        <span className="font-medium">{registration.contract_info.name}</span>
                      </div>
                    )}
                  </div>
                  <div className="flex space-x-2 ml-4">
                    <button
                      onClick={() => handleGenerateContractClick(registration)}
                      className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                      title="Générer le contrat"
                    >
                      <FileContract size={18} />
                    </button>
                    <button
                      onClick={() => handleDeleteClick(registration)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Supprimer l'inscription"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <h4 className="text-sm font-medium text-gray-900 mb-3">Consentements:</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                    {[
                      { key: 'privacy_policy_accepted', label: 'Confidentialité' },
                      { key: 'image_consent_accepted', label: 'Image' },
                      { key: 'professional_compliance_accepted', label: 'Conformité' },
                      { key: 'event_guidelines_accepted', label: 'Directives' },
                    ].map(({ key, label }) => (
                      <div key={key} className="flex items-center space-x-2">
                        {registration[key as keyof TrainerRegistration] ? (
                          <CheckCircle className="text-green-500" size={16} />
                        ) : (
                          <XCircle className="text-red-500" size={16} />
                        )}
                        <span className="text-sm text-gray-700">{label}</span>
                      </div>
                    ))}
                    
                    {/* Show volunteer attestation for volunteer contracts */}
                    {registration.contract_info?.is_volunteer && (
                      <div className="flex items-center space-x-2">
                        {registration.volunteer_attestation_accepted ? (
                          <CheckCircle className="text-green-500" size={16} />
                        ) : (
                          <XCircle className="text-red-500" size={16} />
                        )}
                        <span className="text-sm text-gray-700 flex items-center">
                          <Heart size={12} className="mr-1 text-pink-600" />
                          Attestation volontariat
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Show file downloads for non-volunteer contracts */}
                  {!registration.contract_info?.is_volunteer && (
                    <div className="flex space-x-4">
                      {signedUrls[registration.id]?.invoice_url ? (
                        <a
                          href={signedUrls[registration.id].invoice_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center space-x-2 text-blue-600 hover:text-blue-800 text-sm"
                        >
                          <Download size={16} />
                          <span>Facture</span>
                        </a>
                      ) : (
                        <span className="flex items-center space-x-2 text-gray-400 text-sm">
                          <Download size={16} />
                          <span>Facture (indisponible)</span>
                        </span>
                      )}
                      
                      {signedUrls[registration.id]?.rib_url ? (
                        <a
                          href={signedUrls[registration.id].rib_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center space-x-2 text-blue-600 hover:text-blue-800 text-sm"
                        >
                          <Download size={16} />
                          <span>RIB</span>
                        </a>
                      ) : (
                        <span className="flex items-center space-x-2 text-gray-400 text-sm">
                          <Download size={16} />
                          <span>RIB (indisponible)</span>
                        </span>
                      )}
                    </div>
                  )}

                  {/* Show motivation letter download for volunteer contracts */}
                  {registration.contract_info?.is_volunteer && (
                    <div className="bg-pink-50 border border-pink-200 rounded-lg p-3">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2 text-pink-800">
                          <Heart size={16} />
                          <span className="font-medium">Intervention bénévole</span>
                        </div>
                        {isMotivationLetterAvailable(registration) && signedUrls[registration.id]?.invoice_url ? (
                          <a
                            href={signedUrls[registration.id].invoice_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center space-x-2 text-pink-600 hover:text-pink-800 text-sm font-medium"
                          >
                            <FileType size={16} />
                            <span>Télécharger lettre de motivation</span>
                          </a>
                        ) : (
                          <span className="flex items-center space-x-2 text-gray-400 text-sm">
                            <FileType size={16} />
                            <span>
                              {registration.invoice_file_url === 'volunteer_no_motivation_provided' 
                                ? 'Aucune lettre de motivation fournie' 
                                : 'Lettre de motivation (indisponible)'
                              }
                            </span>
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-pink-700">
                        Aucun document financier requis - Attestation de volontariat {
                          registration.volunteer_attestation_accepted ? 'acceptée' : 'en attente'
                        }
                      </p>
                      <div className="mt-2 text-xs text-pink-600">
                        <strong>Chemin de stockage attendu:</strong> {registration.workshop_date}/{registration.trainer_code}/motivation_[horodatage].pdf
                      </div>
                    </div>
                  )}

                  {registration.registered_at && (
                    <div className="mt-3 text-xs text-gray-500">
                      Inscrit le {format(new Date(registration.registered_at), 'dd MMMM yyyy à HH:mm', { locale: fr })}
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <ConfirmationModal
        isOpen={deleteModalOpen}
        onClose={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
        title="Supprimer l'inscription"
        message={selectedRegistration ? 
          `Êtes-vous sûr de vouloir supprimer l'inscription de ${selectedRegistration.first_name} ${selectedRegistration.last_name} ?\n\nCette action supprimera également les fichiers associés (facture/RIB ou lettre de motivation) et ne peut pas être annulée.` : 
          ''
        }
        confirmText="Supprimer définitivement"
        cancelText="Annuler"
        type="danger"
        loading={isDeleting}
      />

      <NotificationModal
        isOpen={notificationModalOpen}
        onClose={() => setNotificationModalOpen(false)}
        title={notification.title}
        message={notification.message}
        type={notification.type}
        autoClose={notification.type === 'success'}
        autoCloseDelay={3000}
      />

      {contractModalOpen && selectedRegistration && (
        <ContractGeneratorModal
          registration={selectedRegistration}
          onClose={handleContractModalClose}
        />
      )}
    </div>
  );
};

export default RegistrationsTab;