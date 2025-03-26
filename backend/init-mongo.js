// Script d'initialisation MongoDB
// Ce script crée un utilisateur dédié pour l'application avec des autorisations sur la base de données auth

// Connexion à l'instance MongoDB en tant qu'administrateur
db = db.getSiblingDB('admin');

// Création de l'utilisateur dédié à l'application
db.createUser({
  user: "mongo_user",
  pwd: "mongo_password", // Changez ceci en production!
  roles: [
    {
      role: "readWrite",
      db: "auth"
    }
  ]
});

// Basculer vers la base de données auth
db = db.getSiblingDB('auth');

// Création des collections nécessaires
db.createCollection("users");
db.createCollection("managed_accounts");

// Création des index pour améliorer les performances et assurer l'unicité
db.users.createIndex({ email: 1 }, { unique: true, sparse: true });
db.users.createIndex({ phone: 1 }, { unique: true, sparse: true });
db.users.createIndex({ refreshToken: 1 }, { sparse: true });
db.users.createIndex({ "socialAuth.provider": 1, "socialAuth.providerId": 1 });
db.users.createIndex({ updatedAt: 1 });
db.users.createIndex({ createdAt: 1 });

// Index pour les comptes gérés
db.managed_accounts.createIndex({ ownerId: 1 });
db.managed_accounts.createIndex({ updatedAt: 1 });
db.managed_accounts.createIndex({ createdAt: 1 });

print("Initialisation MongoDB terminée");