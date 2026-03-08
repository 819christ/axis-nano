#!/usr/bin/env node

/**
 * ╔══════════════════════════════════════════════════════════════════════════╗
 * ║              AXIS NANO v1.0.2 — Postinstall Handler                     ║
 * ║                                                                          ║
 * ║  Exécuté automatiquement lors de: npm install axis.nano                 ║
 * ║  Lance la création de la structure et du schema                         ║
 * ║  Version robuste pour structure encapsulée node_modules                 ║
 * ╚══════════════════════════════════════════════════════════════════════════╝
 */

const fs = require('fs');
const path = require('path');

const log = {
  success: (msg) => console.log(`✓ ${msg}`),
  error: (msg) => console.error(`✗ ${msg}`),
  info: (msg) => console.log(`ℹ ${msg}`),
  warn: (msg) => console.warn(`⚠ ${msg}`)
};

function initAxis() {
  const projectDir = process.cwd();

  console.log('\n╔════════════════════════════════════════════════════════════════╗');
  console.log('║        ⬡ AXIS NANO v1.0.2 — ONE-SHOT INSTALLATION                ║');
  console.log('╚════════════════════════════════════════════════════════════════╝\n');

  // Vérifier qu'on est à la racine du projet (pas dans node_modules)
  const isRootInstall = !projectDir.includes('node_modules');

  if (!isRootInstall) {
    log.warn('Installation détectée dans node_modules. Ignoré.');
    return;
  }

  // 1. Créer les dossiers
  const dirs = ['vue', 'documentation'];
  dirs.forEach(dir => {
    const dirPath = path.join(projectDir, dir);
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
      log.success(`Dossier créé: ${dir}/`);
    } else {
      log.info(`Dossier existant: ${dir}/`);
    }
  });

  // 2. Copier axis-nano.js à la racine (ROBUSTE)
  try {
    const targetAxis = path.join(projectDir, 'axis-nano.js');
    
    // Si le fichier existe déjà, ne pas le re-copier
    if (fs.existsSync(targetAxis)) {
      log.info('axis-nano.js existe déjà à la racine');
    } else {
      // Essayer plusieurs chemins possibles
      let sourceAxis = null;
      const possiblePaths = [
        path.join(projectDir, 'node_modules', 'axis.nano', 'axis-nano.js'),
        path.join(projectDir, 'node_modules', 'axis-nano', 'axis-nano.js'),
        path.join(__dirname, '..', 'axis-nano.js')
      ];

      for (const possiblePath of possiblePaths) {
        if (fs.existsSync(possiblePath)) {
          sourceAxis = possiblePath;
          break;
        }
      }

      if (sourceAxis) {
        fs.copyFileSync(sourceAxis, targetAxis);
        log.success('axis-nano.js déployé à la racine');
      } else {
        log.warn('axis-nano.js non trouvé. Copie manuelle requise: cp node_modules/axis.nano/axis-nano.js .');
      }
    }
  } catch (err) {
    log.warn(`Copie de axis-nano.js échouée: ${err.message}`);
  }

  // 3. Créer les fichiers de base (idempotent: safe si fichiers existent)
  const files = {
    'index.html': `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>AXIS NANO App</title>
  <link rel="stylesheet" href="style.css">
</head>
<body>
  <div data-axis-root>
    <main data-axis-view-target data-axis-view="accueil"></main>
  </div>

  <script src="axis-nano.js" data-axis-auto data-axis-debug></script>
  <script src="script.js"></script>
</body>
</html>`,

    'style.css': `* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
}

[data-axis-root] {
  max-width: 800px;
  width: 100%;
  padding: 20px;
}

main {
  background: white;
  border-radius: 12px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  overflow: hidden;
}

button {
  padding: 12px 24px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
}

button:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 20px rgba(102, 126, 234, 0.3);
}

input, textarea {
  width: 100%;
  padding: 10px;
  margin-bottom: 1rem;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 1rem;
}

input:focus, textarea:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}`,

    'script.js': `// Global app script
console.log('[APP] AXIS NANO v1.0.2 — Application started');

// Listen to view changes
AxisNano.on('vue:loaded', (viewName) => {
  console.log('[APP] View loaded:', viewName);
});

// Listen to errors
AxisNano.on('api:error', (error) => {
  console.error('[APP] API error:', error);
});`,

    'vue/accueil.html': `<div class="welcome-container">
  <h1>Bienvenue dans AXIS NANO v1.0</h1>
  <p class="subtitle">Framework décentralisé ultra-léger & sécurisé</p>

  <div class="features">
    <div class="feature">
      <h3>🚀 Zero-Config</h3>
      <p>Tout marche out-of-the-box. Zéro configuration nécessaire.</p>
    </div>
    <div class="feature">
      <h3>🔒 Sécurité Native</h3>
      <p>Web Crypto intégré. HMAC-SHA256 sans dépendances.</p>
    </div>
    <div class="feature">
      <h3>⚡ Ultra-Léger</h3>
      <p>Un seul fichier. 27 KB non minifiée, 7 KB gzippée.</p>
    </div>
  </div>

  <div class="form-demo">
    <h3>Essayez les Signaux Axis</h3>
    <input 
      type="text" 
      data-axis-bind="userName" 
      placeholder="Votre nom"
    >
    <button data-axis-on="click:greet">Dire Bonjour</button>
    
    <div id="greeting" data-axis-if="greeting" style="margin-top: 1rem; padding: 1rem; background: #f0f7ff; border-radius: 6px; border-left: 4px solid #667eea;">
      <p id="greeting-text"></p>
    </div>
  </div>

  <div class="next-steps">
    <h3>Prochaines Étapes</h3>
    <ul>
      <li>Créez des vues dans <code>/vue</code></li>
      <li>Utilisez les signaux Axis : <code>data-axis-bind</code>, <code>data-axis-on</code></li>
      <li>Générez le schema IA : <code>npm run schema</code></li>
      <li>Lisez la doc : <code>/documentation/README.md</code></li>
    </ul>
  </div>
</div>

<style>
  .welcome-container {
    padding: 40px;
    text-align: center;
  }

  h1 {
    font-size: 2.5rem;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    margin-bottom: 0.5rem;
  }

  .subtitle {
    font-size: 1.1rem;
    color: #666;
    margin-bottom: 2rem;
  }

  .features {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 20px;
    margin: 2rem 0;
  }

  .feature {
    background: #f8f9fa;
    padding: 20px;
    border-radius: 8px;
    border-left: 4px solid #667eea;
  }

  .feature h3 {
    margin-bottom: 0.5rem;
    color: #667eea;
  }

  .feature p {
    font-size: 0.9rem;
    color: #666;
  }

  .form-demo {
    background: #f8f9fa;
    padding: 20px;
    border-radius: 8px;
    margin: 2rem 0;
    text-align: left;
  }

  .form-demo h3 {
    margin-bottom: 1rem;
  }

  .form-demo input {
    margin-bottom: 1rem;
  }

  #greeting {
    display: none;
  }

  .next-steps {
    margin-top: 2rem;
    text-align: left;
    background: #fffbeb;
    padding: 20px;
    border-radius: 8px;
  }

  .next-steps ul {
    list-style: none;
    padding-left: 0;
  }

  .next-steps li {
    margin: 0.5rem 0;
    padding-left: 1.5rem;
    position: relative;
  }

  .next-steps li:before {
    content: '✓';
    position: absolute;
    left: 0;
    color: #667eea;
    font-weight: bold;
  }

  code {
    background: #f0f0f0;
    padding: 2px 6px;
    border-radius: 3px;
    font-family: 'Courier New', monospace;
  }
</style>

<script>
  function greet(event) {
    const userName = axis.state.userName || 'Vous';
    const greeting = \`Bonjour, \${userName}! 👋\`;
    
    axis.greeting = true;
    document.querySelector('#greeting-text').textContent = greeting;
    
    if (axis._evaluateConditions) {
      axis._evaluateConditions.forEach(fn => fn());
    }
    
    axis.emit('welcome:greeted', { name: userName });
  }
</script>`,

    'documentation/README.md': `# AXIS NANO v1.0 — Documentation

> Framework décentralisé ultra-léger | Zéro Dépendance | Sécurité Native

## Installation

\`\`\`bash
npm install axis.nano
npx axis init
npm run dev
\`\`\`

## Signaux Axis (data-axis-*)

### data-axis-bind
Lier un champ formulaire à l'état de la vue.

\`\`\`html
<input data-axis-bind="email" type="email" />
<script>
  console.log(axis.state.email);
</script>
\`\`\`

### data-axis-on
Lier un événement DOM à une fonction.

\`\`\`html
<button data-axis-on="click:handleClick">Click</button>
<script>
  function handleClick(event) {
    console.log('Clicked!');
  }
</script>
\`\`\`

### data-axis-if
Rendu conditionnel.

\`\`\`html
<div data-axis-if="isVisible">Contenu</div>
<script>
  axis.isVisible = true;
</script>
\`\`\`

### data-axis-for
Boucle de rendu.

\`\`\`html
<li data-axis-for="item in items">{{item.name}}</li>
<script>
  axis.items = [{ name: 'Item 1' }, { name: 'Item 2' }];
</script>
\`\`\`

## API

### Express API

\`\`\`javascript
await $AX.$_I({ debug: true });
await $AX.$_N('profile');
$AX.$_S('user:login', (user) => { ... });
$AX.$_E('user:logout', {});
const data = await $AX.$_D('/api/users');
const hash = await $AX.$_C.sha256('data');
\`\`\`

### Standard API

\`\`\`javascript
AxisNano.init({ debug: true });
AxisNano.navigate('profile');
AxisNano.on('user:login', callback);
AxisNano.emit('user:logout', data);
await AxisNano.data('/api/users');
await AxisNano.crypto.sha256('data');
\`\`\`

## Web Crypto

\`\`\`javascript
const hash = await axis.crypto.sha256('data');
const sig = await axis.crypto.hmacSha256('message', 'secret');
const token = axis.crypto.generateToken();
\`\`\`

## Génération Schema (IA)

\`\`\`bash
npm run schema
\`\`\`

---

**AXIS NANO v1.0 — Conçu pour durer, construit pour résister.**
`
  };

  Object.entries(files).forEach(([filePath, content]) => {
    const fullPath = path.join(projectDir, filePath);
    const fileDir = path.dirname(fullPath);

    if (!fs.existsSync(fileDir)) {
      fs.mkdirSync(fileDir, { recursive: true });
    }

    if (!fs.existsSync(fullPath)) {
      fs.writeFileSync(fullPath, content, 'utf-8');
      log.success(`Fichier créé: ${filePath}`);
    } else {
      log.info(`Fichier existant: ${filePath}`);
    }
  });

  console.log('\n✅ AXIS NANO v1.0.2 installé avec succès!\n');
  console.log('Structure créée:');
  console.log('├── index.html');
  console.log('├── style.css');
  console.log('├── script.js');
  console.log('├── axis-nano.js');
  console.log('├── /vue');
  console.log('│   └── accueil.html');
  console.log('└── /documentation');
  console.log('    └── README.md');
  console.log('\n🚀 Prêt à démarrer!');
  console.log('   Lancez: npm run dev');
  console.log('   Ouvrez: http://localhost:8000');
}

try {
  initAxis();
} catch (err) {
  log.error(`Installation échouée: ${err.message}`);
  process.exit(1);
}