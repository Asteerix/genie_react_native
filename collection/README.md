# Collection Postman pour tester les API d'authentification et de comptes gérés

Cette collection Postman permet de tester facilement toutes les routes d'API liées à l'authentification des utilisateurs et à la gestion des comptes gérés. Elle correspond exactement aux routes utilisées par le backend et contient des scripts automatiques pour faciliter l'enchaînement des requêtes.

## Contenu

- `auth_managed_accounts.postman_collection.json` : Collection Postman contenant tous les endpoints
- `local_environment.postman_environment.json` : Environnement Postman pour une utilisation locale

## Comment importer dans Postman

1. Ouvrez Postman
2. Cliquez sur le bouton "Import" en haut à gauche
3. Importez les deux fichiers :
   - `auth_managed_accounts.postman_collection.json`
   - `local_environment.postman_environment.json`
4. Sélectionnez l'environnement "Environnement Local" dans le sélecteur d'environnement en haut à droite

## Configuration

Par défaut, l'API est configurée pour utiliser `https://https://6de4-92-184-145-214.ngrok-free.app` comme URL de base. Vous pouvez modifier cette valeur dans les variables d'environnement si nécessaire.

## Fonctionnalités automatisées

Cette collection est entièrement automatisée pour garantir que toutes les requêtes fonctionnent ensemble :

- **Partage automatique des données** : Toutes les informations (email, mot de passe, tokens, IDs) sont automatiquement stockées dans les variables d'environnement et réutilisées
- **Enchaînement cohérent** : Les requêtes peuvent être exécutées dans l'ordre sans avoir à modifier les paramètres
- **Scripts pre-request** : Génèrent automatiquement des données ou complètent les champs avec les valeurs des requêtes précédentes
- **Scripts de test** : Capturent les informations importantes des réponses et les stockent pour les requêtes suivantes
- **Variables aléatoires** : Génèrent des valeurs uniques pour éviter les conflits (emails, noms, etc.)

## Structure de la collection

La collection est organisée en deux dossiers principaux :

### 1. Authentication

Ce dossier contient toutes les routes liées à l'authentification des utilisateurs :

- Vérifier si un utilisateur existe (`/api/auth/check`)
- Inscription (`/api/auth/signup`)
- Connexion (`/api/auth/signin`)
- Connexion sociale (`/api/auth/social`)
- Rafraîchir le token (`/api/auth/refresh`)
- Demander une réinitialisation de mot de passe (`/api/auth/reset`)
- Vérifier un code de réinitialisation (`/api/auth/verify-code`)
- Réinitialiser un mot de passe (`/api/auth/reset-password`)

### 2. Comptes Gérés

Ce dossier contient toutes les routes liées à la gestion des comptes gérés (par exemple, des comptes enfants gérés par un parent) :

- Créer un compte géré (`/api/managed-accounts`)
- Obtenir tous les comptes gérés (`/api/managed-accounts`)
- Obtenir un compte géré spécifique (`/api/managed-accounts/:accountId`)
- Mettre à jour un compte géré (`/api/managed-accounts/:accountId`)
- Mettre à jour l'avatar d'un compte géré (`/api/managed-accounts/:accountId/avatar`)
- Supprimer un compte géré (`/api/managed-accounts/:accountId`)

## Comment utiliser la collection

### Méthode simplifiée (recommandée)

1. Exécutez "Inscription" pour créer un nouvel utilisateur (un email unique est généré automatiquement)
   - Les tokens JWT sont automatiquement stockés dans les variables d'environnement
   - L'email et le mot de passe sont stockés pour une utilisation ultérieure

2. Exécutez "Créer un compte géré" pour créer un compte géré associé à l'utilisateur
   - L'ID du compte géré est automatiquement stocké dans les variables d'environnement
   - Les informations du compte sont stockées pour une utilisation ultérieure

3. Exécutez n'importe quelle autre requête dans n'importe quel ordre
   - Les tokens, IDs et autres informations nécessaires sont automatiquement utilisés

### Flux d'authentification complet

1. **Vérifier utilisateur** : Vérifiez si un utilisateur existe avec l'email ou le téléphone donné
2. **Inscription** : Créez un nouveau compte utilisateur 
3. **Connexion** : Connectez-vous avec le compte créé
4. **Rafraîchir token** : Utilisez le refresh token pour obtenir un nouveau access token
5. **Demander réinitialisation** : Initiez une demande de réinitialisation de mot de passe
   - Pour les requêtes suivantes, vous devrez entrer manuellement le code reçu par email/SMS
6. **Vérifier code** : Vérifiez la validité du code reçu
7. **Réinitialiser mot de passe** : Définissez un nouveau mot de passe

### Flux de gestion des comptes

1. **Créer un compte géré** : Créez un nouveau compte géré
2. **Obtenir tous les comptes gérés** : Listez tous vos comptes gérés
3. **Obtenir un compte spécifique** : Récupérez les détails d'un compte géré
4. **Mettre à jour un compte géré** : Modifiez les informations du compte géré
5. **Mettre à jour l'avatar** : Changez l'avatar du compte géré
6. **Supprimer un compte géré** : Supprimez le compte géré

## Variables d'environnement

La collection utilise et met à jour automatiquement ces variables :

- `access_token` : Token d'accès JWT pour les requêtes authentifiées
- `refresh_token` : Token de rafraîchissement pour obtenir un nouveau token d'accès
- `user_email` : Email de l'utilisateur
- `user_password` : Mot de passe de l'utilisateur
- `user_id` : ID de l'utilisateur
- `managed_account_id` : ID du dernier compte géré créé/sélectionné
- `reset_code` : Code de réinitialisation du mot de passe (si applicable)

## Dépannage

Si vous rencontrez des erreurs d'authentification :

1. Vérifiez si le backend est en cours d'exécution
2. Assurez-vous que les routes sont correctes (voir la structure du backend)
3. Exécutez "Connexion" pour obtenir de nouveaux tokens
4. Si nécessaire, exécutez "Inscription" avec `generate_new_user` défini sur `true` pour créer un nouveau compte
5. Vérifiez les logs de la console Postman pour voir les messages d'erreur détaillés

## Personnalisation

Pour utiliser un compte utilisateur différent, définissez ces variables d'environnement avant d'exécuter les requêtes :

1. Définissez `user_email` et `user_password` avec les identifiants souhaités
2. Définissez `generate_new_user` sur `true` pour forcer la création d'un nouveau compte
3. Exécutez la requête "Inscription" puis continuez avec les autres requêtes