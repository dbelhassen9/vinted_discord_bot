# 🤖 Bot Discord de Surveillance Vinted

Bot Discord qui surveille les annonces Vinted en temps réel et envoie des notifications automatiques sur votre serveur Discord.

## 🎯 Fonctionnalités

- ✅ Surveillance automatique toutes les 5 secondes
- 🔍 Filtrage par mot-clé, prix min/max
- 📱 Notifications Discord avec embeds formatés
- 🎨 Affichage des photos, prix, taille, marque
- 📊 Gestion de multiples recherches simultanées
- 🔗 Lien direct vers les annonces Vinted

## 🚀 Configuration

### Prérequis
1. Créer une application Discord sur https://discord.com/developers/applications
2. Créer un bot et récupérer le token
3. Activer les intents suivants dans le Bot settings:
   - Message Content Intent
   - Server Members Intent
   - Presence Intent

### Installation
1. Ajoutez votre `DISCORD_BOT_TOKEN` dans les Secrets de Replit
2. Invitez le bot sur votre serveur avec les permissions nécessaires
3. Lancez le bot avec le bouton "Run"

## 📝 Commandes

### Ajouter une recherche
```
!vinted add <mot-clé> [priceMin] [priceMax]
```
Exemples:
- `!vinted add nike` - Surveiller toutes les annonces contenant "nike"
- `!vinted add jordan 50 150` - Surveiller les annonces "jordan" entre 50€ et 150€

### Lister les recherches actives
```
!vinted list
```

### Supprimer une recherche
```
!vinted remove <searchId>
```

### Mettre en pause une recherche
```
!vinted pause <searchId>
```

### Relancer une recherche
```
!vinted resume <searchId>
```

### Aide
```
!vinted help
```

## 🛠️ Technologies

- Node.js 20
- Discord.js v14
- Axios
- Vinted API

## 📦 Structure du Projet

```
.
├── index.js                 # Point d'entrée
├── src/
│   ├── bot.js              # Configuration du bot Discord
│   ├── vinted.js           # Service de surveillance Vinted
│   ├── commands/           # Commandes Discord
│   │   ├── add.js
│   │   ├── remove.js
│   │   ├── list.js
│   │   ├── help.js
│   │   └── loader.js
│   └── utils/
│       └── notifications.js # Gestion des notifications
└── package.json
```

## ⚠️ Notes Importantes

- Le bot vérifie les annonces toutes les 5 secondes (modifiable via `CHECK_INTERVAL_MS`)
- Les annonces déjà vues ne sont pas notifiées à nouveau
- Chaque recherche est liée à un canal Discord spécifique
- L'API Vinted peut avoir des limites de taux

## ⚙️ Configuration avancée

- `CHECK_INTERVAL_MS` (optionnel): intervalle entre chaque vérification (par défaut 5000)
- Les recherches sont maintenant persistées sur disque dans le dossier `.local/` et rechargées au redémarrage

## 🤝 Support

Pour toute question ou problème, consultez la documentation de Discord.js et Vinted.
