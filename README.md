# AXIS ⬡ NANO v1.0 — OFFICIEL

> **Décentralisé • Ultra-Léger • Sécurisé**
>
> Un seul fichier. Zéro dépendance. Tout fonctionne.

---

## 🚀 Installation (One-Shot)
```bash
npm install axis.nano && npx axis init
```

**C'est tout.** Vous avez une app complète, prête à l'emploi.

---

## 📦 Ce Que Vous Obtenez
```
votre-app/
├── index.html              ← Point d'entrée
├── style.css               ← Styles globaux
├── script.js               ← JS global
├── axis-nano.js            ← Framework (27 KB, un seul fichier)
├── /vue/
│   └── accueil.html        ← Vue de bienvenue (avec signaux exemple)
├── /documentation/
│   └── README.md           ← Docs
└── axis.schema.json        ← (Auto-généré pour l'IA)
```

---

## ⚡ Démarrage Rapide

### 1. Lancer l'app
```bash
npm run dev
```

Ouvrez **http://localhost:8000**

### 2. Créer une vue
```html
<!-- /vue/profile.html -->
<div class="profile">
  <h1>Mon Profil</h1>
  <input 
    type="email" 
    data-axis-bind="email" 
    placeholder="Email"
  />
  <button data-axis-on="click:saveProfile">Sauvegarder</button>
</div>

<style>
  .profile { padding: 20px; }
</style>

<script>
  function saveProfile(event) {
    const email = axis.state.email;
    axis.emit('profile:saved', { email });
    console.log('Profil sauvegardé:', email);
  }
</script>
```

### 3. Naviguer
```html
<!-- Dans index.html ou une autre vue -->
<button onclick="axis.navigate('profile')">Mon Profil</button>
```

**Voilà!** Les vues se chargent automatiquement, l'isolation CSS/JS fonctionne, tout est sécurisé.

---

## 🔗 Signaux Axis (Langage Commun Framework ↔ GrapesJS ↔ Dev)

| Signal | Usage | Exemple |
|--------|-------|---------|
| **data-axis-bind** | Lier un input à l'état | `<input data-axis-bind="email" />` |
| **data-axis-on** | Lier un événement à une fonction | `<button data-axis-on="click:save">Save</button>` |
| **data-axis-if** | Rendu conditionnel | `<div data-axis-if="isAdmin">Admin</div>` |
| **data-axis-for** | Boucle | `<li data-axis-for="item in items">{{item}}</li>` |
| **data-axis-view-target** | Injecter une vue enfant | `<div data-axis-view-target data-axis-view="child"></div>` |

### Exemple Complet
```html
<div class="user-list">
  <input data-axis-bind="search" placeholder="Chercher..." />
  
  <ul>
    <li data-axis-for="user in filteredUsers">
      <span>{{user.name}}</span>
      <button data-axis-on="click:viewUser">Voir</button>
    </li>
  </ul>
  
  <div data-axis-if="isAdmin" class="admin-panel">
    <button data-axis-on="click:deleteAllUsers">Supprimer tout</button>
  </div>
</div>

<script>
  axis.isAdmin = false;
  axis.users = [
    { name: 'Alice' },
    { name: 'Bob' }
  ];

  axis.filteredUsers = axis.users;

  function viewUser(event) {
    axis.emit('user:view', { user: this });
  }

  function deleteAllUsers(event) {
    if (confirm('Vraiment?')) {
      axis.users = [];
      axis.emit('users:deleted');
    }
  }
</script>
```

---

## 📡 API Complète

### Express API (Courte)
```javascript
// Initialiser
await $AX.$_I({ debug: true });

// Naviguer
await $AX.$_N('profile');

// Charger dans un élément
await $AX.$_L('dashboard', '#main');

// Événements
$AX.$_S('user:login', (user) => { ... });
$AX.$_E('user:logout', {});

// Données (auto-signées si activé)
const users = await $AX.$_D('/api/users');

// Crypto
const hash = await $AX.$_C.sha256('data');
```

### Standard API (Complète)
```javascript
// Initialiser
AxisNano.init({ debug: true });

// Naviguer
AxisNano.navigate('profile');

// Événements
AxisNano.on('user:login', callback);
AxisNano.emit('user:logout', data);
AxisNano.off('user:login', callback);

// Données
AxisNano.data('/api/users', {
  method: 'POST',
  body: { name: 'John' }
});

// Crypto
AxisNano.crypto.sha256('data');
AxisNano.crypto.hmacSha256('message', 'key');
AxisNano.crypto.generateToken();
```

---

## 🔒 Sécurité Native

### Web Crypto Intégré
```javascript
// SHA-256 (hachage)
const hash = await axis.crypto.sha256('sensitive-data');

// HMAC-SHA256 (signature)
const sig = await axis.crypto.hmacSha256('message', 'secret-key');

// Token aléatoire (16 bytes)
const token = axis.crypto.generateToken();
```

### Signatures API (Optionnel)

Activer les signatures HMAC-SHA256 sur toutes les requêtes API :
```html
<script src="axis-nano.js" data-axis-signature></script>
```

Les requêtes auront automatiquement :
- `X-Axis-Timestamp`
- `X-Axis-Nonce`
- `X-Axis-Signature`

**Côté serveur** : Valider la signature.

### Isolation du Shadow DOM

Chaque vue est isolée :
- **CSS** préfixé automatiquement
- **JS** dans un scope limité (pas d'accès à `window` global)
- **DOM** privé (pas d'accès au DOM parent)

---

## 🤖 IA-Ready (Co-Pilot IA)

### Générer le Schema
```bash
npm run schema
```

Crée **axis.schema.json** que vous pouvez partager avec une IA.

### Exemple d'Usage
```
Utilisateur → IA (via axis.schema.json) → Code compatible généré

"Crée une vue de login avec:
 - Email + Password inputs
 - Submit button
 - Validation simple"

L'IA lit axis.schema.json et génère du code qui marche d'emblée!
```

### Contenu du Schema

- Signaux Axis disponibles
- API complète
- Vues détectées et leurs exports
- Contraintes de sécurité
- Structure du projet

---

## 🎨 GrapesJS Compatible (Design ↔ Code)

Les **signaux Axis** sont le pont entre le design visuel et la logique :

1. **Designer** crée une interface dans GrapesJS
2. **Ajoute manuellement** les signaux : `data-axis-bind`, `data-axis-on`
3. **Exporte le HTML** + CSS
4. **Developer** écrit le JS avec les handlers
5. **Framework relie tout** automatiquement

**Aucun conflit**, pas de code injecté dans le JS, sécurité garantie.

---

## 📊 Caractéristiques

| Aspect | Détail |
|--------|--------|
| **Taille** | 27 KB (non minifiée), ~7 KB (gzippée) |
| **Dépendances** | Zéro |
| **Installation** | One-shot (`npm install && npx axis init`) |
| **Configuration** | Zéro config (tout auto-détecté) |
| **Sécurité** | Web Crypto natif, HMAC-SHA256 |
| **Isolation** | Shadow DOM par vue |
| **Performance** | Auto-cache des vues |
| **API** | Dual (Express courte + Standard complète) |
| **IA-Ready** | `npm run schema` pour le co-pilot |
| **GrapesJS** | Signaux comme pont design ↔ code |

---

## 📂 Structure de Vues (Totalement Libre)
```
/vue/
├── accueil.html
├── profile.html
├── profile.css (optionnel)
├── profile.js (optionnel)
├── admin/
│   ├── users.html
│   ├── settings.html
│   └── logs/
│       └── activity.html
└── components/
    ├── header.html
    ├── footer.html
    └── navbar.html
```

**Aucune limite d'arborescence.**

---

## 🚀 Déploiement

### Option 1 : Serveur Statique (Recommandé)
```bash
# Nginx/Apache
scp -r votre-app/ user@server:/var/www/html/

# Ou CDN statique
# GitHub Pages, Netlify, Vercel, etc.
```

### Option 2 : Docker
```dockerfile
FROM nginx:alpine
COPY votre-app/ /usr/share/nginx/html/
EXPOSE 80
```
```bash
docker build -t my-app .
docker run -p 8000:80 my-app
```

### Option 3 : Node.js Simple
```bash
cd votre-app/
npx http-server -p 8000
```

---

## 🎯 Cas d'Usage

✅ Prototypes & MVPs
✅ Applications statiques
✅ SPAs décentralisées
✅ Dashboards internes
✅ Blogs interactifs
✅ Outils collaboratifs
✅ Widgets autonomes
✅ Tout avec des vues

---

## 📚 Ressources

- **Guide Complet** : `/documentation/README.md`
- **Exemple** : `/vue/accueil.html` (avec signaux)
- **Schema IA** : `axis.schema.json` (généré automatiquement)

---

## 🔧 Commandes Utiles
```bash
npm run dev              # Démarrer le serveur de dev
npm run schema          # Générer axis.schema.json (pour l'IA)
npm run minify          # Minifier axis-nano.js
npm run serve           # Serveur simple (sans live-reload)
```

---

## 💡 Philosophie

**AXIS NANO** respecte trois piliers inviolables :

1. **One-Shot Installation**
   - `npm install axis.nano && npx axis init`
   - Structure complète créée
   - Npm n'est plus nécessaire après

2. **Zéro Dépendance Runtime**
   - Un seul fichier JavaScript
   - Web Crypto natif
   - Aucun WASM externe

3. **Structure Libre**
   - Arborescence totalement libre
   - Signaux universels (design ↔ code)
   - Aucune configuration forcée

---

## 📞 Support

- **Questions ?** Lisez `/documentation/README.md`
- **Bugs ?** Ouvrez une issue sur GitHub
- **Feedback ?** Nous adorons les contributions

---

## 📜 Licence

MIT — Libre d'utiliser, modifier et redistribuer.

---

## 🎉 Démarrer Maintenant
```bash
npm install axis.nano
npx axis init
npm run dev
```

Ouvrez **http://localhost:8000**

**Vous êtes prêt!** 🚀

---

**AXIS⬡NANO v1.0 — Conçu pour durer, construit pour résister.**