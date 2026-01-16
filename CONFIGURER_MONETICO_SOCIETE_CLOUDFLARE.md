# Comment configurer MONETICO_SOCIETE dans Cloudflare Pages

## ⚠️ IMPORTANT

La variable `MONETICO_SOCIETE` est **OBLIGATOIRE** et ne peut **PAS être vide**. Si vous n'avez pas de code société, contactez Monetico pour l'obtenir.

---

## 📋 Étapes de configuration

### 1. Accéder aux variables d'environnement

1. Connectez-vous à **Cloudflare Dashboard**
2. Sélectionnez votre projet **Pages**
3. Allez dans **Settings** → **Environment Variables**

### 2. Ajouter `MONETICO_SOCIETE` pour Preview

1. Dans la section **Preview**, cliquez sur **Add variable**
2. **Variable name** : `MONETICO_SOCIETE`
3. **Type** : **Plain text** (pas Secret)
4. **Value** : Votre code société Monetico
5. Cliquez sur **Save**

### 3. Ajouter `MONETICO_SOCIETE` pour Production

1. Dans la section **Production**, cliquez sur **Add variable**
2. **Variable name** : `MONETICO_SOCIETE`
3. **Type** : **Plain text** (pas Secret)
4. **Value** : Votre code société Monetico (même valeur que Preview)
5. Cliquez sur **Save**

### 4. Redéployer

Après avoir ajouté/modifié la variable, vous devez **redéployer** votre site :

1. Allez dans **Deployments**
2. Cliquez sur le menu (3 points) du dernier déploiement
3. Sélectionnez **Retry deployment** ou faites un nouveau commit/push

---

## 🔍 Vérification

### Vérifier que la variable est bien injectée

1. Ouvrez la console du navigateur (F12)
2. Cliquez sur "Payer (TEST Monetico)"
3. Vérifiez les logs :
   ```javascript
   Monetico - FIELDS envoyés Monetico: {
     societe: "VOTRE_SOCIETE", // ⚠️ Doit être présent et non vide
     ...
   }
   ```

Si `societe` est vide ou absent, la variable n'est pas correctement configurée.

---

## ❌ Erreur si `societe` est vide

Si `MONETICO_SOCIETE` est vide ou non configuré, vous verrez cette erreur :

```
❌ Erreur de configuration Monetico:

MONETICO_SOCIETE est vide. Configurez MONETICO_SOCIETE dans Cloudflare Dashboard (Settings → Environment Variables) pour Preview et Production. La valeur ne peut pas être vide pour Monetico.
```

**Solution** : Suivez les étapes ci-dessus pour configurer `MONETICO_SOCIETE`.

---

## 📝 Où trouver votre code société Monetico

1. **Dans votre espace Monetico** : Connectez-vous à votre backoffice Monetico
2. **Dans vos emails Monetico** : Cherchez dans vos emails de configuration
3. **Contactez Monetico** : Si vous ne l'avez pas, contactez le support Monetico

---

## ✅ Checklist

- [ ] `MONETICO_SOCIETE` ajouté pour **Preview**
- [ ] `MONETICO_SOCIETE` ajouté pour **Production**
- [ ] Type : **Plain text** (pas Secret)
- [ ] Valeur : **Non vide** (votre code société)
- [ ] Redéployé après modification
- [ ] Vérifié dans les logs console que `societe` est présent et non vide
