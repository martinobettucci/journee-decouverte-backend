/*
  # Ajouter le champ lettre de motivation pour les inscriptions bénévoles

  1. Changements de schéma
    - Ajouter `motivation_letter_url` à la table `trainer_registrations`
    - Ce champ sera utilisé pour stocker l'URL de la lettre de motivation pour les contrats bénévoles
    
  2. Documentation
    - Ajouter un commentaire explicatif pour le nouveau champ
*/

-- Ajouter le champ pour la lettre de motivation
ALTER TABLE trainer_registrations 
ADD COLUMN IF NOT EXISTS motivation_letter_url text;

-- Ajouter un commentaire pour documentation
COMMENT ON COLUMN trainer_registrations.motivation_letter_url IS 'URL de la lettre de motivation pour les inscriptions bénévoles (remplace facture/RIB)';