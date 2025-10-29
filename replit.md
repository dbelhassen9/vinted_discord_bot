# Bot Discord de Surveillance Vinted

## Aperçu
Bot Discord qui surveille les annonces Vinted en temps réel et envoie des notifications sur un serveur Discord. Le bot vérifie les nouvelles annonces toutes les 5 secondes selon des filtres configurables.

## Fonctionnalités
- Surveillance automatique des annonces Vinted toutes les 5 secondes
- Commandes Discord pour configurer les filtres de recherche
- Notifications formatées avec embeds Discord
- Gestion de multiples recherches simultanées
- Filtrage par mots-clés, prix, catégorie, taille, marque

## Architecture du Projet
- `index.js` - Point d'entrée principal du bot
- `src/bot.js` - Configuration et gestion du bot Discord
- `src/vinted.js` - Service de surveillance Vinted
- `src/commands/` - Commandes Discord
- `src/utils/` - Fonctions utilitaires

## Technologies
- Node.js 20
- Discord.js - Interaction avec Discord
- Axios - Requêtes HTTP vers Vinted
- Dotenv - Gestion des variables d'environnement

## Configuration
Le bot utilise l'intégration Discord de Replit pour gérer automatiquement l'authentification.

## Changements Récents
- 2025-10-29: Création initiale du projet
- Installation de Node.js 20 et dépendances (discord.js, axios, dotenv)
- Implémentation du bot Discord avec système de commandes
- Création du système de surveillance Vinted avec API HTTP
- Implémentation du filtrage par mot-clé et fourchette de prix
- Ajout des notifications Discord avec embeds formatés
- Création d'un système de queue pour gérer le rate limiting Discord (5 msg/5s)
- Correction du parsing des prix pour gérer différents formats (string, number, object)
- Optimisation de la gestion des erreurs 429 avec retry automatique
- Validation complète par l'architecte - bot production-ready
