# 🚀 Guide d'Utilisation - Bot Discord Vinted

## ✅ Le Bot est Opérationnel !

Votre bot Discord surveille maintenant les annonces Vinted en temps réel. Il est déjà connecté à votre serveur Discord.

## 📝 Commandes Disponibles

### 1️⃣ Ajouter une Recherche
```
!vinted add <mot-clé> [prix-min] [prix-max]
```

**Exemples:**
- `!vinted add nike` → Surveiller toutes les annonces "nike"
- `!vinted add jordan 50 150` → Annonces "jordan" entre 50€ et 150€
- `!vinted add adidas 20` → Annonces "adidas" à partir de 20€

### 2️⃣ Voir Vos Recherches Actives
```
!vinted list
```
Affiche toutes vos recherches en cours avec leurs détails.

### 3️⃣ Supprimer une Recherche
```
!vinted remove <id-de-recherche>
```
Utilisez l'ID affiché dans `!vinted list`

### 4️⃣ Aide
```
!vinted help
```
Affiche la liste complète des commandes

## 🎯 Comment Ça Marche ?

1. **Surveillance Automatique**: Le bot vérifie les nouvelles annonces Vinted toutes les 5 secondes
2. **Notifications Instantanées**: Dès qu'une nouvelle annonce correspond à vos critères, vous recevez une notification dans le canal Discord
3. **Informations Complètes**: Chaque notification affiche:
   - 📸 Photo de l'article
   - 💰 Prix
   - 🏷️ Marque
   - 📏 Taille
   - 👤 Vendeur
   - 📍 Localisation
   - 🔗 Lien direct vers l'annonce

## 💡 Conseils d'Utilisation

- **Soyez Spécifique**: Plus votre mot-clé est précis, plus les résultats seront pertinents
- **Utilisez les Filtres de Prix**: Évitez de recevoir trop de notifications en définissant une fourchette de prix
- **Plusieurs Recherches**: Vous pouvez avoir autant de recherches actives que vous voulez
- **Un Canal par Usage**: Créez des canaux Discord différents pour différents types de recherches

## ⚙️ Fonctionnalités Avancées

### Protection Contre le Rate Limiting
Le bot gère automatiquement les limites de Discord et Vinted:
- Espacement intelligent des notifications (1,2 seconde minimum)
- Système de queue pour gérer les bursts d'annonces
- Retry automatique en cas de dépassement de limite

### Gestion des Doublons
Les annonces déjà vues ne sont jamais notifiées deux fois, même si elles correspondent à plusieurs de vos recherches.

## 🔧 Dépannage

**Le bot ne répond pas ?**
→ Vérifiez qu'il est bien en ligne (présence verte sur Discord)

**Pas de notifications ?**
→ Vérifiez vos critères de recherche avec `!vinted list` et ajustez si nécessaire

**Trop de notifications ?**
→ Affinez vos critères en ajoutant des fourchettes de prix ou des mots-clés plus spécifiques

## 📊 Exemple de Workflow

```
# 1. Ajoutez une recherche pour des sneakers Nike
!vinted add nike 30 100

# 2. Ajoutez une autre recherche pour des vestes Adidas
!vinted add "veste adidas" 20 80

# 3. Consultez vos recherches
!vinted list

# 4. Attendez les notifications ! 🎉
# Le bot vous alertera automatiquement pour chaque nouvelle annonce
```

## 🎉 Profitez de Votre Bot !

Votre bot est maintenant prêt à vous aider à trouver les meilleures offres Vinted en temps réel. Bonnes trouvailles ! 🛍️
