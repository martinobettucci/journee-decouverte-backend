/*
  # Ajouter le champ pour l'attestation de volontariat

  1. Schema Changes
    - Ajouter le champ `volunteer_attestation_file_url` à la table `trainer_registrations`
    - Ce champ stockera l'URL du fichier d'attestation de volontariat pour les contrats bénévoles
  
  2. Documentation
    - Ajouter un commentaire pour expliquer l'usage du champ
*/

-- Ajouter le champ pour l'URL du fichier d'attestation de volontariat
ALTER TABLE trainer_registrations 
ADD COLUMN IF NOT EXISTS volunteer_attestation_file_url text;

-- Ajouter un commentaire pour documentation
COMMENT ON COLUMN trainer_registrations.volunteer_attestation_file_url IS 'URL du fichier d''attestation de volontariat pour les formateurs bénévoles';