import React, { useState, useEffect } from 'react';
import { HardDrive, Trash2, RefreshCw, AlertTriangle, CheckCircle, FolderOpen, File, Database } from 'lucide-react';
import { supabase } from '../lib/supabase';
import ConfirmationModal from './common/ConfirmationModal';
import NotificationModal from './common/NotificationModal';

interface StorageFile {
  name: string;
  id: string;
  updated_at: string;
  created_at: string;
  last_accessed_at: string;
  metadata: {
    size: number;
    mimetype: string;
  };
}

interface BucketAnalysis {
  bucket: string;
  totalFiles: number;
  totalSize: number;
  orphanedFiles: StorageFile[];
  referencedFiles: string[];
  loading: boolean;
  error?: string;
}

const StorageTab: React.FC = () => {
  const [buckets, setBuckets] = useState<BucketAnalysis[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [selectedOrphanedFiles, setSelectedOrphanedFiles] = useState<{bucket: string, files: StorageFile[]}>({bucket: '', files: []});
  const [notification, setNotification] = useState<{
    title: string;
    message: string;
    type: 'success' | 'error' | 'warning' | 'info';
  }>({ title: '', message: '', type: 'info' });
  const [isDeleting, setIsDeleting] = useState(false);

  // P2Enjoy storage buckets and their corresponding database tables/columns
  const p2enjoyBuckets = [
    { 
      name: 'event-photos', 
      table: 'event_photos', 
      column: 'src',
      description: 'Photos des événements'
    },
    { 
      name: 'initiatives', 
      table: 'initiatives', 
      columns: ['image_url', 'logo_url'],
      description: 'Images et logos des initiatives'
    },
    { 
      name: 'testimonials', 
      table: 'testimonials', 
      column: 'logo_url',
      description: 'Logos des témoignages'
    },
    { 
      name: 'press-articles', 
      table: 'press_articles', 
      column: 'logo_url',
      description: 'Logos des articles de presse'
    },
    { 
      name: 'partners', 
      table: 'partners', 
      column: 'logo_url',
      description: 'Logos des partenaires'
    },
    { 
      name: 'media-highlights', 
      table: 'media_highlights', 
      columns: ['media_logo', 'image_url'],
      description: 'Logos et images des médias'
    }
  ];

  useEffect(() => {
    analyzeBuckets();
  }, []);

  const showNotification = (title: string, message: string, type: 'success' | 'error' | 'warning' | 'info' = 'info') => {
    setNotification({ title, message, type });
    setShowNotificationModal(true);
  };

  const extractFilePathFromUrl = (url: string): string | null => {
    if (!url) return null;
    
    // If it's already a relative path, return as-is
    if (!url.startsWith('http')) {
      return url;
    }
    
    // Extract path from Supabase storage URL
    try {
      const urlObj = new URL(url);
      const pathParts = urlObj.pathname.split('/');
      const publicIndex = pathParts.findIndex(part => part === 'public');
      
      if (publicIndex !== -1 && publicIndex < pathParts.length - 2) {
        // Return bucket/path after 'public'
        return pathParts.slice(publicIndex + 2).join('/');
      }
      
      // Fallback: return the last part of the path
      return pathParts[pathParts.length - 1];
    } catch (error) {
      console.warn('Could not parse URL:', url);
      return null;
    }
  };

  const analyzeBucket = async (bucketConfig: typeof p2enjoyBuckets[0]): Promise<BucketAnalysis> => {
    const analysis: BucketAnalysis = {
      bucket: bucketConfig.name,
      totalFiles: 0,
      totalSize: 0,
      orphanedFiles: [],
      referencedFiles: [],
      loading: true
    };

    try {
      // Get all files in the bucket
      const { data: files, error: filesError } = await supabase.storage
        .from(bucketConfig.name)
        .list('', { limit: 1000, sortBy: { column: 'created_at', order: 'desc' } });

      if (filesError) {
        throw new Error(`Error listing files in ${bucketConfig.name}: ${filesError.message}`);
      }

      if (!files || files.length === 0) {
        analysis.loading = false;
        return analysis;
      }

      analysis.totalFiles = files.length;
      analysis.totalSize = files.reduce((sum, file) => sum + (file.metadata?.size || 0), 0);

      // Get referenced files from database
      const columns = bucketConfig.columns || [bucketConfig.column];
      const referencedFiles = new Set<string>();

      for (const column of columns) {
        if (!column) continue;

        const { data: dbData, error: dbError } = await supabase
          .from(bucketConfig.table)
          .select(column)
          .not(column, 'is', null);

        if (dbError) {
          console.warn(`Error fetching ${column} from ${bucketConfig.table}:`, dbError);
          continue;
        }

        if (dbData) {
          dbData.forEach((row: any) => {
            const fileUrl = row[column];
            if (fileUrl) {
              const filePath = extractFilePathFromUrl(fileUrl);
              if (filePath) {
                referencedFiles.add(filePath);
              }
            }
          });
        }
      }

      analysis.referencedFiles = Array.from(referencedFiles);

      // Find orphaned files
      const orphanedFiles = files.filter(file => {
        // Skip directories
        if (!file.name || file.name.endsWith('/')) return false;
        
        // Check if file is referenced in database
        return !referencedFiles.has(file.name);
      });

      analysis.orphanedFiles = orphanedFiles;
      analysis.loading = false;

      return analysis;
    } catch (error: any) {
      analysis.error = error.message;
      analysis.loading = false;
      return analysis;
    }
  };

  const analyzeBuckets = async () => {
    setLoading(true);
    
    try {
      const analyses = await Promise.all(
        p2enjoyBuckets.map(bucket => analyzeBucket(bucket))
      );
      
      setBuckets(analyses);
    } catch (error) {
      console.error('Error analyzing buckets:', error);
      showNotification(
        'Erreur d\'analyse',
        'Une erreur est survenue lors de l\'analyse des stockages.',
        'error'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteOrphanedFiles = (bucket: string, files: StorageFile[]) => {
    setSelectedOrphanedFiles({ bucket, files });
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (!selectedOrphanedFiles.files.length) return;

    try {
      setIsDeleting(true);
      
      const filePaths = selectedOrphanedFiles.files.map(file => file.name);
      
      const { error } = await supabase.storage
        .from(selectedOrphanedFiles.bucket)
        .remove(filePaths);

      if (error) throw error;

      setShowDeleteModal(false);
      setSelectedOrphanedFiles({ bucket: '', files: [] });
      
      showNotification(
        'Fichiers supprimés',
        `${filePaths.length} fichier(s) orphelin(s) supprimé(s) avec succès du bucket "${selectedOrphanedFiles.bucket}".`,
        'success'
      );
      
      // Refresh analysis
      analyzeBuckets();
    } catch (error: any) {
      console.error('Error deleting orphaned files:', error);
      showNotification(
        'Erreur de suppression',
        `Une erreur est survenue lors de la suppression des fichiers: ${error.message}`,
        'error'
      );
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDeleteCancel = () => {
    setShowDeleteModal(false);
    setSelectedOrphanedFiles({ bucket: '', files: [] });
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getTotalOrphanedFiles = () => {
    return buckets.reduce((sum, bucket) => sum + bucket.orphanedFiles.length, 0);
  };

  const getTotalOrphanedSize = () => {
    return buckets.reduce((sum, bucket) => 
      sum + bucket.orphanedFiles.reduce((bucketSum, file) => 
        bucketSum + (file.metadata?.size || 0), 0
      ), 0
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="flex items-center space-x-3">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="text-gray-700">Analyse des stockages en cours...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Gestion du Stockage</h2>
          <p className="text-sm text-gray-600 mt-1">
            Analyse et nettoyage des fichiers orphelins dans les buckets P2Enjoy
          </p>
        </div>
        <button
          onClick={analyzeBuckets}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
        >
          <RefreshCw size={20} />
          <span>Actualiser l'analyse</span>
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center space-x-2">
            <Database className="text-blue-600" size={20} />
            <span className="text-sm font-medium text-gray-700">Buckets analysés</span>
          </div>
          <p className="text-2xl font-bold text-gray-900 mt-1">{buckets.length}</p>
        </div>
        
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center space-x-2">
            <File className="text-gray-600" size={20} />
            <span className="text-sm font-medium text-gray-700">Total fichiers</span>
          </div>
          <p className="text-2xl font-bold text-gray-900 mt-1">
            {buckets.reduce((sum, bucket) => sum + bucket.totalFiles, 0)}
          </p>
        </div>
        
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="text-orange-600" size={20} />
            <span className="text-sm font-medium text-gray-700">Fichiers orphelins</span>
          </div>
          <p className="text-2xl font-bold text-gray-900 mt-1">{getTotalOrphanedFiles()}</p>
        </div>
        
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center space-x-2">
            <HardDrive className="text-purple-600" size={20} />
            <span className="text-sm font-medium text-gray-700">Espace orphelin</span>
          </div>
          <p className="text-2xl font-bold text-gray-900 mt-1">{formatFileSize(getTotalOrphanedSize())}</p>
        </div>
      </div>

      {/* Bucket Analysis */}
      <div className="space-y-4">
        {buckets.map((bucket) => (
          <div key={bucket.bucket} className="bg-white shadow-sm rounded-lg border border-gray-200">
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center space-x-3">
                  <FolderOpen className="text-blue-600" size={24} />
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{bucket.bucket}</h3>
                    <p className="text-sm text-gray-600">
                      {p2enjoyBuckets.find(b => b.name === bucket.bucket)?.description}
                    </p>
                  </div>
                </div>
                
                {bucket.orphanedFiles.length > 0 && (
                  <button
                    onClick={() => handleDeleteOrphanedFiles(bucket.bucket, bucket.orphanedFiles)}
                    className="flex items-center space-x-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                  >
                    <Trash2 size={16} />
                    <span>Supprimer les orphelins</span>
                  </button>
                )}
              </div>

              {bucket.loading ? (
                <div className="flex items-center space-x-2 text-gray-600">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                  <span className="text-sm">Analyse en cours...</span>
                </div>
              ) : bucket.error ? (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex items-center space-x-2">
                    <AlertTriangle className="text-red-500" size={20} />
                    <span className="font-medium text-red-800">Erreur d'analyse</span>
                  </div>
                  <p className="text-sm text-red-700 mt-1">{bucket.error}</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Statistics */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <div className="text-sm text-gray-600">Total fichiers</div>
                      <div className="text-lg font-semibold text-gray-900">{bucket.totalFiles}</div>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <div className="text-sm text-gray-600">Taille totale</div>
                      <div className="text-lg font-semibold text-gray-900">{formatFileSize(bucket.totalSize)}</div>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <div className="text-sm text-gray-600">Fichiers référencés</div>
                      <div className="text-lg font-semibold text-green-600">{bucket.referencedFiles.length}</div>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <div className="text-sm text-gray-600">Fichiers orphelins</div>
                      <div className={`text-lg font-semibold ${bucket.orphanedFiles.length > 0 ? 'text-orange-600' : 'text-green-600'}`}>
                        {bucket.orphanedFiles.length}
                      </div>
                    </div>
                  </div>

                  {/* Status */}
                  <div className={`p-4 rounded-lg border ${
                    bucket.orphanedFiles.length === 0 
                      ? 'bg-green-50 border-green-200' 
                      : 'bg-orange-50 border-orange-200'
                  }`}>
                    <div className="flex items-center space-x-2">
                      {bucket.orphanedFiles.length === 0 ? (
                        <>
                          <CheckCircle className="text-green-600" size={20} />
                          <span className="font-medium text-green-800">Bucket propre</span>
                        </>
                      ) : (
                        <>
                          <AlertTriangle className="text-orange-600" size={20} />
                          <span className="font-medium text-orange-800">
                            {bucket.orphanedFiles.length} fichier(s) orphelin(s) détecté(s)
                          </span>
                        </>
                      )}
                    </div>
                    {bucket.orphanedFiles.length > 0 && (
                      <p className="text-sm text-orange-700 mt-1">
                        Espace récupérable: {formatFileSize(
                          bucket.orphanedFiles.reduce((sum, file) => sum + (file.metadata?.size || 0), 0)
                        )}
                      </p>
                    )}
                  </div>

                  {/* Orphaned Files List */}
                  {bucket.orphanedFiles.length > 0 && (
                    <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                      <h4 className="font-medium text-orange-900 mb-3">Fichiers orphelins:</h4>
                      <div className="max-h-48 overflow-y-auto space-y-2">
                        {bucket.orphanedFiles.map((file, index) => (
                          <div key={index} className="flex items-center justify-between bg-white p-3 rounded border">
                            <div className="flex items-center space-x-3">
                              <File className="text-gray-400" size={16} />
                              <div>
                                <p className="text-sm font-medium text-gray-900">{file.name}</p>
                                <p className="text-xs text-gray-500">
                                  {formatFileSize(file.metadata?.size || 0)} • 
                                  Créé le {new Date(file.created_at).toLocaleDateString('fr-FR')}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Global Actions */}
      {getTotalOrphanedFiles() > 0 && (
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-medium text-orange-900">
                Nettoyage global recommandé
              </h3>
              <p className="text-sm text-orange-700 mt-1">
                {getTotalOrphanedFiles()} fichier(s) orphelin(s) détecté(s) au total, 
                représentant {formatFileSize(getTotalOrphanedSize())} d'espace récupérable.
              </p>
            </div>
            <div className="flex space-x-2">
              {buckets.filter(b => b.orphanedFiles.length > 0).map(bucket => (
                <button
                  key={bucket.bucket}
                  onClick={() => handleDeleteOrphanedFiles(bucket.bucket, bucket.orphanedFiles)}
                  className="flex items-center space-x-2 px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md transition-colors text-sm"
                >
                  <Trash2 size={14} />
                  <span>{bucket.bucket} ({bucket.orphanedFiles.length})</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      <ConfirmationModal
        isOpen={showDeleteModal}
        onClose={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
        title="Supprimer les fichiers orphelins"
        message={selectedOrphanedFiles.files.length > 0 ? 
          `Êtes-vous sûr de vouloir supprimer ${selectedOrphanedFiles.files.length} fichier(s) orphelin(s) du bucket "${selectedOrphanedFiles.bucket}" ?\n\nCes fichiers ne sont référencés dans aucune table de la base de données.\n\nEspace récupérable: ${formatFileSize(selectedOrphanedFiles.files.reduce((sum, file) => sum + (file.metadata?.size || 0), 0))}\n\nCette action ne peut pas être annulée.` : 
          ''
        }
        confirmText="Supprimer définitivement"
        cancelText="Annuler"
        type="danger"
        loading={isDeleting}
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

export default StorageTab;