# Installation de Miku Bot dans le panel

1. Arrête le bot sur l’hébergeur.
2. Sauvegarde le dossier `data` actuel s’il contient déjà des avertissements.
3. Envoie tout le contenu de cette archive dans le dossier principal du bot.
4. Dans les variables d’environnement du panel, ajoute :

   ```text
   DISCORD_TOKEN=nouveau_token_du_bot
   ```

5. Tu peux aussi ajouter l’identifiant du serveur pour accélérer
   l’installation des commandes :

   ```text
   DISCORD_GUILD_ID=identifiant_du_serveur
   ```

6. Lance **Réinstaller les dépendances** ou exécute `npm install`.
7. Redémarre le bot.
8. Dans Discord, utilise `/configuration` avec un compte possédant
   la permission **Gérer le serveur**.

Les salons, rôles, modules, le nom et la couleur sont ensuite enregistrés
dans `data/guild-config.json`. Ne supprime pas ce fichier pendant une mise à
jour si tu souhaites conserver les réglages.

## Sécurité importante

Un ancien token apparaissait dans le code public du dépôt. Il faut le
réinitialiser dans le portail Discord Developer, puis utiliser uniquement le
nouveau token dans la variable `DISCORD_TOKEN`. Ne place jamais le token dans
un fichier envoyé sur GitHub.
