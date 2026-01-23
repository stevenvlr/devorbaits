# 🔧 Correction finale : Erreur technique Monetico

## 🔴 Problème

Vous arrivez sur la page Monetico mais obtenez :
```
Un problème technique est survenu. Veuillez essayer ultérieurement.
Technical problem. Please try again later.
```

## 🔍 Cause identifiée

Le problème vient du **format de la chaîne à signer** pour le calcul du MAC.

Selon la documentation Monetico v3.0, pour un paiement **simple** (non fractionné), la chaîne doit inclure les champs de fractionnement **même s'ils sont vides**.

### Format correct de la chaîne

```
TPE*date*montant*reference*texte-libre*version*lgue*societe*mail*nbrech*dateech1*montantech1*dateech2*montantech2*dateech3*montantech3*dateech4*montantech4
```

Pour un paiement simple, les 9 derniers champs sont vides, donc on ajoute 9 astérisques supplémentaires après `mail`.

### Exemple concret

Si vous avez :
- TPE = `0917217`
- date = `15/01/2025:14:30:45`
- montant = `25.50EUR`
- reference = `CMD-1234567890-ABC`
- texte-libre = `{"retraitMode":"livraison"}`
- version = `3.0`
- lgue = `FR`
- societe = `` (vide)
- mail = `user@example.com`

La chaîne à signer doit être :
```
0917217*15/01/2025:14:30:45*25.50EUR*CMD-1234567890-ABC*{"retraitMode":"livraison"}*3.0*FR**user@example.com*********
```

Note : Les 9 astérisques à la fin représentent les 9 champs de fractionnement vides.

## ✅ Correction appliquée

J'ai modifié `app/api/monetico/signature/route.ts` pour ajouter les 9 astérisques supplémentaires après le champ `mail`.

## 📝 Étapes suivantes

### 1. Redéployer le site

```bash
git add app/api/monetico/signature/route.ts
git commit -m "Fix: Ajout astérisques fractionnement dans calcul MAC Monetico"
git push
```

Ou redéployez manuellement depuis Cloudflare Dashboard.

### 2. Tester le paiement

1. Allez sur votre site déployé
2. Ajoutez des produits au panier
3. Allez au checkout
4. Sélectionnez "Carte bleue" (Monetico)
5. Cliquez sur "Payer"
6. Vous devriez voir la page de paiement Monetico **sans erreur technique**

## 🔍 Vérification

Pour vérifier que le calcul est correct :

1. Ouvrez la console du navigateur (F12)
2. Allez dans l'onglet **Console**
3. Essayez de faire un paiement
4. Vous devriez voir dans les logs : `Monetico - Chaîne à signer: ...`
5. Vérifiez que la chaîne se termine par 9 astérisques : `...*********`

## ⚠️ Important

- **Ne pas oublier** : Les astérisques de fractionnement sont **obligatoires** même pour un paiement simple
- **Format exact** : La chaîne doit se terminer par exactement 9 astérisques après le champ `mail`
- **Ordre strict** : L'ordre des paramètres doit être exactement celui indiqué

## 🆘 Si le problème persiste

1. **Vérifiez les logs** : Regardez la console du navigateur (F12) pour voir la chaîne à signer
2. **Vérifiez la clé secrète** : Assurez-vous qu'elle correspond au TPE de test
3. **Vérifiez le format** : Vérifiez que tous les paramètres sont correctement formatés
4. **Contactez Monetico** : Si le problème persiste, contactez le support avec votre TPE de test
