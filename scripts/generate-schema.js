#!/usr/bin/env node

/**
 * ╔══════════════════════════════════════════════════════════════════════════╗
 * ║           AXIS NANO v1.0 — Schema Generator (IA-Ready)                  ║
 * ║                                                                          ║
 * ║  Génère automatiquement axis.schema.json en scannant:                   ║
 * ║    • La structure du projet                                             ║
 * ║    • Les vues disponibles                                               ║
 * ║    • Les fonctions exportées par chaque vue                             ║
 * ║                                                                          ║
 * ║  Lancement: npm run schema                                              ║
 * ║  Output: axis.schema.json (utilisable par l'IA)                        ║
 * ╚══════════════════════════════════════════════════════════════════════════╝
 */

const fs = require('fs');
const path = require('path');

const log = {
  success: (msg) => console.log(`✓ ${msg}`),
  error: (msg) => console.error(`✗ ${msg}`),
  info: (msg) => console.log(`ℹ ${msg}`)
};

/**
 * Extraire les fonctions définies dans un fichier JavaScript
 */
function extractFunctions(jsCode) {
  const functions = [];
  
  const patterns = [
    /function\s+(\w+)\s*\(/g,
    /const\s+(\w+)\s*=\s*(?:async\s*)?\(/g,
    /let\s+(\w+)\s*=\s*(?:async\s*)?\(/g
  ];

  patterns.forEach(regex => {
    let match;
    while ((match = regex.exec(jsCode)) !== null) {
      if (match[1] && !functions.includes(match[1])) {
        functions.push(match[1]);
      }
    }
  });

  return functions;
}

/**
 * Scanner les vues disponibles dans /vue
 */
function scanViews(projectDir) {
  const vueDir = path.join(projectDir, 'vue');
  const views = {};

  if (!fs.existsSync(vueDir)) {
    log.info('Dossier /vue non trouvé');
    return views;
  }

  const files = fs.readdirSync(vueDir);

  files
    .filter(f => f.endsWith('.html'))
    .forEach(htmlFile => {
      const viewName = htmlFile.replace('.html', '');
      const htmlPath = path.join(vueDir, htmlFile);
      const cssPath = path.join(vueDir, `${viewName}.css`);
      const jsPath = path.join(vueDir, `${viewName}.js`);

      const hasCSS = fs.existsSync(cssPath);
      const hasJS = fs.existsSync(jsPath);

      const viewData = {
        path: `/vue/${htmlFile}`,
        files: {
          html: htmlFile,
          css: hasCSS ? `${viewName}.css` : null,
          js: hasJS ? `${viewName}.js` : null
        }
      };

      // Extraire les fonctions exportées
      if (hasJS) {
        try {
          const jsContent = fs.readFileSync(jsPath, 'utf-8');
          viewData.exports = {
            functions: extractFunctions(jsContent)
          };
        } catch (err) {
          log.info(`Impossible de parser ${viewName}.js`);
        }
      }

      views[viewName] = viewData;
    });

  return views;
}

function generateSchema(projectDir) {
  console.log('\n╔════════════════════════════════════════════════════════════════╗');
  console.log('║        ⬡ AXIS NANO v1.0 — Schema Generation (IA-Ready)         ║');
  console.log('╚════════════════════════════════════════════════════════════════╝\n');

  // Scanner les vues
  const views = scanViews(projectDir);
  const viewCount = Object.keys(views).length;

  // Construire le schema
  const schema = {
    meta: {
      generated: new Date().toISOString(),
      version: '1.0.0'
    },

    framework: {
      name: 'axis-nano',
      version: '1.0.0',
      description: 'Decentralized ultra-lightweight & secure framework',
      features: [
        'shadow-dom-isolation',
        'web-crypto-hmac-sha256',
        'auto-triplet-view-load',
        'axis-signals-binding',
        'event-driven-architecture',
        'zero-runtime-dependencies'
      ]
    },

    signals: [
      {
        name: 'data-axis-bind',
        type: 'form-binding',
        description: 'Bind form input to view state',
        example: '<input data-axis-bind="email" type="email" />',
        access: 'axis.state.email',
        supportedElements: ['INPUT', 'TEXTAREA', 'SELECT']
      },
      {
        name: 'data-axis-on',
        type: 'event-binding',
        description: 'Bind DOM event to handler function',
        example: '<button data-axis-on="click:handleClick">Click</button>',
        format: 'event:functionName',
        supportedEvents: [
          'click', 'change', 'input', 'submit', 'focus', 'blur',
          'mouseenter', 'mouseleave', 'keydown', 'keyup'
        ]
      },
      {
        name: 'data-axis-if',
        type: 'conditional-rendering',
        description: 'Conditionally render element',
        example: '<div data-axis-if="isVisible">Content</div>',
        requirement: 'Variable must be boolean'
      },
      {
        name: 'data-axis-for',
        type: 'loop-rendering',
        description: 'Render elements in loop',
        example: '<li data-axis-for="item in items">{{item.name}}</li>',
        format: 'variable in arrayName',
        interpolation: '{{variable}} for value output'
      },
      {
        name: 'data-axis-view-target',
        type: 'view-injection',
        description: 'Target element for child view',
        example: '<div data-axis-view-target data-axis-view="profile"></div>',
        requirement: 'Must have data-axis-view attribute'
      }
    ],

    api: {
      express: {
        $_I: {
          name: 'Initialize',
          description: 'Initialize the framework',
          signature: 'await $AX.$_I(config)',
          params: [
            {
              name: 'config',
              type: 'object',
              required: false,
              properties: {
                debug: 'boolean (enable console logs)',
                vueFolder: 'string (default: "./vue")',
                cacheViews: 'boolean (default: true)',
                signatureEnabled: 'boolean (default: false)',
                editMode: 'boolean (default: false)'
              }
            }
          ],
          returns: 'Promise<boolean>'
        },
        $_N: {
          name: 'Navigate',
          description: 'Navigate to a view',
          signature: 'await $AX.$_N(viewName)',
          params: [
            { name: 'viewName', type: 'string', required: true }
          ],
          returns: 'Promise<HTMLElement>'
        },
        $_L: {
          name: 'Load',
          description: 'Load view into target element',
          signature: 'await $AX.$_L(viewName, selector)',
          params: [
            { name: 'viewName', type: 'string', required: true },
            { name: 'selector', type: 'string', required: true }
          ],
          returns: 'Promise<boolean>'
        },
        $_S: {
          name: 'Subscribe',
          description: 'Subscribe to event',
          signature: '$AX.$_S(eventName, callback)',
          params: [
            { name: 'eventName', type: 'string', required: true },
            { name: 'callback', type: 'function', required: true }
          ],
          returns: 'void'
        },
        $_E: {
          name: 'Emit',
          description: 'Emit event',
          signature: '$AX.$_E(eventName, data)',
          params: [
            { name: 'eventName', type: 'string', required: true },
            { name: 'data', type: 'object', required: false }
          ],
          returns: 'void'
        },
        $_D: {
          name: 'Data',
          description: 'Fetch API data (auto-signed if enabled)',
          signature: 'await $AX.$_D(endpoint, options)',
          params: [
            { name: 'endpoint', type: 'string', required: true },
            {
              name: 'options',
              type: 'object',
              required: false,
              properties: {
                method: 'string ("GET", "POST", etc.)',
                body: 'object (request body)',
                headers: 'object (additional headers)'
              }
            }
          ],
          returns: 'Promise<any>'
        },
        $_C: {
          name: 'Crypto',
          description: 'Web Crypto utilities',
          methods: {
            sha256: {
              signature: 'await $AX.$_C.sha256(data)',
              description: 'Hash with SHA-256',
              returns: 'Promise<string>'
            },
            hmacSha256: {
              signature: 'await $AX.$_C.hmacSha256(message, key)',
              description: 'HMAC-SHA256 signature',
              returns: 'Promise<string>'
            },
            generateToken: {
              signature: '$AX.$_C.generateToken()',
              description: 'Generate secure random token',
              returns: 'string'
            }
          }
        }
      }
    },

    context: {
      description: 'Available in view JavaScript context',
      properties: {
        axis: 'Object containing all API methods',
        state: 'Object for storing view state (data-axis-bind)',
        viewName: 'Current view name',
        scopeId: 'Unique scope identifier'
      }
    },

    views: views,

    viewStats: {
      total: viewCount,
      withCSS: Object.values(views).filter(v => v.files.css).length,
      withJS: Object.values(views).filter(v => v.files.js).length,
      withBoth: Object.values(views).filter(v => v.files.css && v.files.js).length
    },

    constraints: {
      security: {
        maxViewDepth: 15,
        allowedAPIs: ['fetch', 'crypto', 'localStorage', 'sessionStorage'],
        forbiddenAPIs: ['eval', 'Function', 'setTimeout', 'setInterval'],
        shadowDOM: 'closed (or open in edit mode)'
      },
      performance: {
        estimatedBundleSize: '27 KB (non-minified), 7 KB (gzipped)',
        viewCacheEnabled: true,
        autoScopeIsolation: true
      }
    },

    security: {
      cryptoEnabled: true,
      algorithms: [
        {
          name: 'SHA-256',
          use: 'Data hashing',
          availability: 'axis.crypto.sha256(data)'
        },
        {
          name: 'HMAC-SHA256',
          use: 'API signatures (optional)',
          availability: 'axis.crypto.hmacSha256(message, key)'
        }
      ],
      webCryptoNative: true,
      noDependencies: true
    },

    projectStructure: {
      rootFiles: {
        'index.html': 'Application entry point',
        'style.css': 'Global styles',
        'script.js': 'Global JavaScript',
        'axis-nano.js': 'Framework (auto-loaded)'
      },
      directories: {
        '/vue': {
          description: 'Views directory',
          structure: 'Free - any subdirectory depth allowed'
        },
        '/documentation': {
          description: 'Documentation',
          structure: 'README.md recommended'
        }
      }
    },

    deployment: {
      methods: [
        {
          name: 'Static Hosting',
          example: 'GitHub Pages, Netlify, Vercel',
          requirement: 'HTTP server for view loading'
        },
        {
          name: 'Docker',
          example: 'FROM nginx:alpine + COPY app',
          requirement: 'None (truly static)'
        },
        {
          name: 'Traditional Server',
          example: 'Apache, Nginx',
          requirement: 'None (static files only)'
        }
      ]
    },

    aidedByLLM: {
      purpose: 'This schema allows AI models to understand your Axis.Nano project structure',
      how: 'Share axis.schema.json with an AI for code generation',
      benefits: [
        'AI understands available views',
        'AI knows available signals and APIs',
        'AI respects security constraints',
        'AI generates compatible code'
      ]
    }
  };

  // Écrire le schema
  const schemaPath = path.join(projectDir, 'axis.schema.json');
  fs.writeFileSync(schemaPath, JSON.stringify(schema, null, 2), 'utf-8');

  log.success(`Schema généré: axis.schema.json`);

  // Stats
  console.log('\n📊 Statistiques:');
  console.log(`   • Vues trouvées: ${viewCount}`);
  console.log(`   • Avec CSS: ${schema.viewStats.withCSS}`);
  console.log(`   • Avec JS: ${schema.viewStats.withJS}`);

  if (viewCount > 0) {
    console.log('\n📝 Vues détectées:');
    Object.entries(views).forEach(([name, data]) => {
      const files = [];
      if (data.files.html) files.push('html');
      if (data.files.css) files.push('css');
      if (data.files.js) files.push('js');
      console.log(`   • ${name} (${files.join(', ')})`);

      if (data.exports?.functions?.length) {
        console.log(`     Fonctions: ${data.exports.functions.join(', ')}`);
      }
    });
  }

  console.log('\n✨ Prochaines étapes:');
  console.log('   1. Partagez axis.schema.json avec une IA');
  console.log('   2. L\'IA générera du code compatible avec votre projet');
  console.log('   3. Utilisez generate-schema régulièrement après ajout de vues\n');

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('✅ Schema generé! axis.schema.json est prêt pour l\'IA.\n');
}

try {
  const projectDir = process.cwd();
  generateSchema(projectDir);
} catch (err) {
  log.error(`Schema generation échouée: ${err.message}`);
  process.exit(1);
}