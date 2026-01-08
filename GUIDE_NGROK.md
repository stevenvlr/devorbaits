# 🌐 Guide : Utiliser ngrok pour tester votre site

## 🎯 Objectif

ngrok permet d'exposer votre serveur local (localhost:3000) sur Internet pour faire des tests avec des services externes (Boxtal, Monetico, etc.).

## 📋 Prérequis

1. **ngrok installé** : Téléchargez depuis [ngrok.com/download](https://ngrok.com/download)
2. **Compte ngrok** (gratuit) : Créez un compte sur [ngrok.com](https://ngrok.com) pour obtenir un token
3. **Token ngrok configuré** : 
   ```bash
   ngrok config add-authtoken VOTRE_TOKEN
   ```

## 🚀 Méthode 1 : Script automatique (Recommandé)

### Windows (PowerShell)
```powershell
.\start-ngrok.ps1
```

### Windows (CMD)
```cmd
start-ngrok.bat
```

Le script va :
1. ✅ Démarrer le serveur Next.js (si pas déjà démarré)
2. ✅ Démarrer ngrok
3. ✅ Afficher l'URL publique ngrok

## 🚀 Méthode 2 : Manuel

### Étape 1 : Démarrer Next.js
```bash
npm run dev
```

Le serveur démarre sur `http://localhost:3000`

### Étape 2 : Démarrer ngrok (dans un autre terminal)
```bash
ngrok http 3000
```

### Étape 3 : Récupérer l'URL publique

1. **Interface web** : Ouvrez [http://localhost:4040](http://localhost:4040)
2. **Dans le terminal** : L'URL est affichée (ex: `https://abc123.ngrok.io`)

## 🔗 Utiliser l'URL ngrok

Une fois ngrok démarré, vous obtiendrez une URL comme :
```
https://abc123-def456.ngrok-free.app
```

Cette URL pointe vers votre serveur local et est accessible depuis Internet !

## ⚙️ Configuration pour les services externes

### Boxtal
Si vous devez configurer une URL de callback pour Boxtal, utilisez l'URL ngrok :
```
https://abc123-def456.ngrok-free.app/api/boxtal/callback
```

### Monetico
Pour les tests de paiement, configurez l'URL de retour :
```
https://abc123-def456.ngrok-free.app/payment/success
```

## 🔒 Sécurité

⚠️ **Important** :
- L'URL ngrok est **publique** et accessible à tous
- Ne partagez l'URL qu'avec les personnes de confiance
- Pour la production, utilisez un domaine réel avec HTTPS

## 🛠️ Commandes utiles

### Voir les tunnels actifs
```bash
ngrok http 3000
```

### Voir l'interface web
Ouvrez : [http://localhost:4040](http://localhost:4040)

### Arrêter ngrok
Appuyez sur `Ctrl+C` dans le terminal ngrok

### Vérifier les tunnels
```bash
curl http://localhost:4040/api/tunnels
```

## 📝 Notes

- **URL gratuite** : Change à chaque redémarrage de ngrok
- **URL payante** : Peut avoir une URL fixe (nécessite un compte payant)
- **Limite gratuite** : 40 connexions/minute
- **HTTPS** : Inclus automatiquement (gratuit)

## 🐛 Dépannage

### ngrok ne démarre pas
1. Vérifiez que ngrok est installé : `ngrok version`
2. Vérifiez votre token : `ngrok config check`
3. Vérifiez que le port 3000 est libre

### L'URL ne fonctionne pas
1. Vérifiez que Next.js est bien démarré sur le port 3000
2. Vérifiez l'interface ngrok : http://localhost:4040
3. Vérifiez les logs dans le terminal ngrok

### Erreur "tunnel session failed"
- Vérifiez votre connexion Internet
- Vérifiez que votre token ngrok est valide
- Réessayez après quelques secondes

## ✅ Checklist

- [ ] ngrok installé
- [ ] Compte ngrok créé
- [ ] Token configuré (`ngrok config add-authtoken`)
- [ ] Next.js démarré (`npm run dev`)
- [ ] ngrok démarré (`ngrok http 3000`)
- [ ] URL publique récupérée
- [ ] URL testée dans le navigateur



