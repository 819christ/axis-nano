/**
 * ╔══════════════════════════════════════════════════════════════════════════╗
 * ║                                                                          ║
 * ║                    AXIS ⬡ NANO v1.0 — OFFICIEL                          ║
 * ║                                                                          ║
 * ║         Framework Décentralisé Ultra-Léger & Sécurisé                  ║
 * ║                                                                          ║
 * ║  • Fichier Unique (27 KB non minifiée, ~7 KB gzippée)                  ║
 * ║  • Zéro Dépendance Runtime                                            ║
 * ║  • Web Crypto Intégré (HMAC-SHA256, SHA-256)                          ║
 * ║  • Signaux Axis (data-axis-bind, data-axis-on, etc.)                 ║
 * ║  • IA-Ready (generateSchema(), auto-scan vues)                        ║
 * ║  • One-Shot Installation (npm run init)                               ║
 * ║  • GrapesJS Compatible via Signaux                                    ║
 * ║                                                                          ║
 * ║  Installation: npm install axis.nano && npm run init                  ║
 * ║  Déploiement: npm run schema (auto-génère pour l'IA)                 ║
 * ║                                                                          ║
 * ╚══════════════════════════════════════════════════════════════════════════╝
 */

;(function (global, factory) {
  'use strict';
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = factory();
  } else {
    global.AxisNano = factory();
    global.$AX = global.AxisNano.express;
  }
})(typeof globalThis !== 'undefined' ? globalThis : window, function () {
  'use strict';

  const DEFAULTS = {
    vueFolder: './vue',
    debug: false,
    cacheViews: true,
    signatureEnabled: false,
    editMode: false
  };

  let _config = { ...DEFAULTS };
  let _vueCache = new Map();
  let _eventBus = new Map();
  let _viewRegistry = new Map();
  let _rootToken = null;

  const WebCryptoAPI = (() => {
    const hmacSha256 = async (message, key) => {
      try {
        const encoder = new TextEncoder();
        const keyData = encoder.encode(key);
        const messageData = encoder.encode(message);

        const cryptoKey = await crypto.subtle.importKey(
          'raw',
          keyData,
          { name: 'HMAC', hash: 'SHA-256' },
          false,
          ['sign']
        );

        const signature = await crypto.subtle.sign('HMAC', cryptoKey, messageData);
        const hashArray = Array.from(new Uint8Array(signature));
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
      } catch (err) {
        if (_config.debug) console.error('[AXIS] HMAC error:', err);
        return null;
      }
    };

    const sha256 = async (data) => {
      try {
        const encoded = new TextEncoder().encode(data);
        const hashBuffer = await crypto.subtle.digest('SHA-256', encoded);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
      } catch (err) {
        if (_config.debug) console.error('[AXIS] SHA256 error:', err);
        return null;
      }
    };

    const generateToken = () => {
      const bytes = crypto.getRandomValues(new Uint8Array(16));
      return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
    };

    return { hmacSha256, sha256, generateToken };
  })();

  const _bindAxisSignals = (shadowRoot, jsContext) => {
    shadowRoot.querySelectorAll('[data-axis-on]').forEach(el => {
      const binding = el.getAttribute('data-axis-on');
      const [event, handler] = binding.split(':').map(s => s.trim());

      if (jsContext && jsContext[handler] && typeof jsContext[handler] === 'function') {
        el.addEventListener(event, (evt) => {
          try {
            jsContext[handler].call(jsContext, evt);
          } catch (err) {
            if (_config.debug) console.error(`[AXIS] Handler error "${handler}":`, err);
          }
        });
      }
    });

    shadowRoot.querySelectorAll('[data-axis-bind]').forEach(el => {
      const fieldName = el.getAttribute('data-axis-bind');

      if (jsContext && !jsContext.state) {
        jsContext.state = {};
      }

      if (jsContext && jsContext.state && jsContext.state[fieldName]) {
        if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
          el.value = jsContext.state[fieldName];
        }
      }

      el.addEventListener('change', () => {
        if (jsContext && jsContext.state) {
          jsContext.state[fieldName] = el.value;
          AxisNano.emit('form:change', jsContext.state);
        }
      });

      el.addEventListener('input', () => {
        if (jsContext && jsContext.state) {
          jsContext.state[fieldName] = el.value;
        }
      });
    });

    shadowRoot.querySelectorAll('[data-axis-if]').forEach(el => {
      const condition = el.getAttribute('data-axis-if');

      const evaluate = () => {
        let result = false;
        try {
          if (jsContext && jsContext[condition] !== undefined) {
            result = !!jsContext[condition];
          }
        } catch (err) {
          if (_config.debug) console.error(`[AXIS] Condition error "${condition}":`, err);
        }
        el.style.display = result ? '' : 'none';
      };

      evaluate();

      if (jsContext) {
        jsContext._evaluateConditions = jsContext._evaluateConditions || [];
        jsContext._evaluateConditions.push(evaluate);
      }
    });

    shadowRoot.querySelectorAll('[data-axis-for]').forEach(el => {
      const forExpression = el.getAttribute('data-axis-for');
      const match = forExpression.match(/(\w+)\s+in\s+(\w+)/);

      if (match && jsContext) {
        const [, itemVar, arrayVar] = match;
        const array = jsContext[arrayVar];

        if (Array.isArray(array)) {
          const parent = el.parentNode;
          const template = el.cloneNode(true);
          template.removeAttribute('data-axis-for');

          array.forEach(item => {
            const clone = template.cloneNode(true);
            const newContext = { ...jsContext, [itemVar]: item };

            clone.innerHTML = clone.innerHTML.replace(/\{\{(\w+)\}\}/g, (match, varName) => {
              return newContext[varName] || '';
            });

            parent.insertBefore(clone, el);
          });

          el.remove();
        }
      }
    });
  };

  const _resolveViewPath = (viewName) => {
    const clean = viewName.replace(/^\/+/, '').replace(/\/+$/, '');
    const basePath = _config.vueFolder || './vue';
    let fullPath = `${basePath}/${clean}`;

    if (!fullPath.endsWith('.html')) {
      fullPath += '.html';
    }

    return fullPath;
  };

  const _generateScopeId = () => {
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    let id = 'ax';
    for (let i = 0; i < 6; i++) {
      id += chars[Math.floor(Math.random() * chars.length)];
    }
    return id;
  };

  const _isolateCss = (css, scopeId) => {
    return css.replace(/^([^@\s][^{]*){/gm, match => {
      if (match.startsWith('@')) return match;
      return `[data-axis-scope="${scopeId}"] ${match}`;
    });
  };

  const _loadView = async (viewName, parentId = null, depth = 0) => {
    if (depth > 15) {
      console.warn(`[AXIS] Max view depth reached: ${viewName}`);
      return null;
    }

    try {
      const viewPath = _resolveViewPath(viewName);

      if (_config.cacheViews && _vueCache.has(viewPath)) {
        const cached = _vueCache.get(viewPath);
        return _injectViewDom(viewName, cached, parentId, depth);
      }

      const htmlResponse = await fetch(viewPath);
      if (!htmlResponse.ok) {
        throw new Error(`View not found: ${viewPath}`);
      }

      const htmlContent = await htmlResponse.text();

      const parser = new DOMParser();
      const doc = parser.parseFromString(htmlContent, 'text/html');

      const bodyContent = doc.body.innerHTML;
      const styleEl = doc.querySelector('style');
      const scriptEl = doc.querySelector('script');

      let css = styleEl ? styleEl.textContent : '';
      let js = scriptEl ? scriptEl.textContent : '';

      const cssPath = _resolveViewPath(viewName).replace('.html', '.css');
      try {
        const cssResponse = await fetch(cssPath);
        if (cssResponse.ok) {
          css += '\n' + await cssResponse.text();
        }
      } catch {}

      const jsPath = _resolveViewPath(viewName).replace('.html', '.js');
      try {
        const jsResponse = await fetch(jsPath);
        if (jsResponse.ok) {
          js += '\n' + await jsResponse.text();
        }
      } catch {}

      const viewData = { html: bodyContent, css: css, js: js, path: viewPath };

      if (_config.cacheViews) {
        _vueCache.set(viewPath, viewData);
      }

      return _injectViewDom(viewName, viewData, parentId, depth);
    } catch (err) {
      if (_config.debug) console.error(`[AXIS] View load error "${viewName}":`, err);
      AxisNano.emit('vue:error', { view: viewName, error: err.message });
      return null;
    }
  };

  const _injectViewDom = async (viewName, viewData, parentId, depth) => {
    const scopeId = _generateScopeId();
    const viewId = `${parentId || 'root'}_${scopeId}`;

    _viewRegistry.set(viewId, {
      name: viewName,
      parentId,
      children: [],
      depth,
      scopeId
    });

    const container = document.createElement('div');
    container.setAttribute('data-axis-scope', scopeId);
    container.id = `axis-view-${scopeId}`;

    const shadowRoot = container.attachShadow({
      mode: _config.editMode ? 'open' : 'closed'
    });

    if (viewData.css) {
      const styleTag = document.createElement('style');
      styleTag.textContent = _isolateCss(viewData.css, scopeId);
      shadowRoot.appendChild(styleTag);
    }

    const htmlWrapper = document.createElement('div');
    htmlWrapper.innerHTML = viewData.html;
    shadowRoot.appendChild(htmlWrapper);

    const jsContext = {
      navigate: (path) => AxisNano.navigate(path),
      emit: (event, data) => AxisNano.emit(event, data),
      on: (event, callback) => AxisNano.on(event, callback),
      off: (event, callback) => AxisNano.off(event, callback),
      data: (endpoint, opts) => AxisNano.data(endpoint, opts),
      crypto: {
        sha256: WebCryptoAPI.sha256,
        hmacSha256: WebCryptoAPI.hmacSha256,
        generateToken: WebCryptoAPI.generateToken
      },
      querySelector: (sel) => shadowRoot.querySelector(sel),
      querySelectorAll: (sel) => shadowRoot.querySelectorAll(sel),
      state: {},
      viewName: viewName,
      scopeId: scopeId
    };

    if (viewData.js) {
      try {
        const jsFunc = new Function('axis', viewData.js);
        jsFunc(jsContext);
      } catch (err) {
        if (_config.debug) console.error(`[AXIS] JS error in view "${viewName}":`, err);
      }
    }

    _bindAxisSignals(shadowRoot, jsContext);

    const childTargets = htmlWrapper.querySelectorAll('[data-axis-view-target]');
    for (const target of childTargets) {
      const childViewName = target.getAttribute('data-axis-view');
      if (childViewName) {
        const childHtml = await _loadView(childViewName, viewId, depth + 1);
        if (childHtml) {
          target.replaceWith(childHtml);
        }
      }
    }

    AxisNano.emit('vue:loaded', viewName);

    return container;
  };

  const _secureFetch = async (url, options = {}) => {
    const opts = { ...options };

    if (_config.signatureEnabled && _rootToken) {
      const timestamp = Date.now();
      const nonce = WebCryptoAPI.generateToken();
      const body = opts.body ? JSON.stringify(opts.body) : '';

      const message = `${opts.method || 'GET'}|${url}|${timestamp}|${nonce}|${body}`;
      const signature = await WebCryptoAPI.hmacSha256(message, _rootToken);

      opts.headers = {
        ...opts.headers,
        'X-Axis-Timestamp': timestamp,
        'X-Axis-Nonce': nonce,
        'X-Axis-Signature': signature
      };
    }

    return fetch(url, opts);
  };

  const _on = (event, callback) => {
    if (!_eventBus.has(event)) {
      _eventBus.set(event, []);
    }
    _eventBus.get(event).push(callback);
  };

  const _emit = (event, data) => {
    if (_eventBus.has(event)) {
      _eventBus.get(event).forEach(callback => {
        try {
          callback(data);
        } catch (err) {
          if (_config.debug) console.error(`[AXIS] Event error "${event}":`, err);
        }
      });
    }
  };

  const _off = (event, callback) => {
    if (_eventBus.has(event)) {
      const index = _eventBus.get(event).indexOf(callback);
      if (index > -1) {
        _eventBus.get(event).splice(index, 1);
      }
    }
  };

  const generateSchema = async () => {
    const schema = {
      meta: { generated: new Date().toISOString(), version: '1.0.0' },
      framework: {
        name: 'axis-nano',
        version: '1.0.0',
        description: 'Decentralized ultra-lightweight & secure framework',
        features: ['shadow-dom-isolation', 'web-crypto-hmac-sha256', 'auto-triplet-view-load', 'axis-signals-binding', 'event-driven-architecture', 'zero-runtime-dependencies']
      },
      signals: [
        { name: 'data-axis-bind', type: 'form-binding', description: 'Bind form input to view state', example: '<input data-axis-bind="email" type="email" />', access: 'axis.state.email' },
        { name: 'data-axis-on', type: 'event-binding', description: 'Bind DOM event to handler function', example: '<button data-axis-on="click:handleClick">Click</button>', format: 'event:functionName' },
        { name: 'data-axis-if', type: 'conditional-rendering', description: 'Conditionally render element', example: '<div data-axis-if="isVisible">Content</div>', requirement: 'Variable must be boolean' },
        { name: 'data-axis-for', type: 'loop-rendering', description: 'Render elements in loop', example: '<li data-axis-for="item in items">{{item.name}}</li>', format: 'variable in arrayName' }
      ],
      api: {
        express: {
          $_I: { name: 'Initialize', signature: 'await $AX.$_I(config)', returns: 'Promise<boolean>' },
          $_N: { name: 'Navigate', signature: 'await $AX.$_N(viewName)', returns: 'Promise<HTMLElement>' },
          $_S: { name: 'Subscribe', signature: '$AX.$_S(eventName, callback)', returns: 'void' },
          $_E: { name: 'Emit', signature: '$AX.$_E(eventName, data)', returns: 'void' },
          $_D: { name: 'Data', signature: 'await $AX.$_D(endpoint, options)', returns: 'Promise<any>' },
          $_C: { name: 'Crypto', methods: { sha256: 'Hash with SHA-256', hmacSha256: 'HMAC signature', generateToken: 'Generate secure token' } }
        }
      },
      views: [],
      constraints: {
        maxViewDepth: 15,
        allowedAPIs: ['fetch', 'crypto', 'localStorage', 'sessionStorage'],
        forbiddenAPIs: ['eval', 'Function', 'setTimeout', 'setInterval'],
        shadowDOMMode: _config.editMode ? 'open' : 'closed',
        signatureEnabled: _config.signatureEnabled
      },
      security: {
        cryptoEnabled: true,
        algorithms: ['HMAC-SHA256', 'SHA-256'],
        webCryptoNative: true
      },
      projectStructure: {
        rootFiles: ['index.html', 'style.css', 'script.js', 'axis-nano.js'],
        folders: { vue: 'Views directory (free structure)', documentation: 'Documentation' }
      }
    };

    if (typeof process !== 'undefined' && process.cwd) {
      try {
        const fs = require('fs');
        const path = require('path');
        const vueDir = path.join(process.cwd(), 'vue');
        if (fs.existsSync(vueDir)) {
          const files = fs.readdirSync(vueDir);
          const views = {};
          files.filter(f => f.endsWith('.html')).forEach(file => {
            const name = file.replace('.html', '');
            const cssFile = path.join(vueDir, `${name}.css`);
            const jsFile = path.join(vueDir, `${name}.js`);
            views[name] = {
              path: `/vue/${file}`,
              hasCSS: fs.existsSync(cssFile),
              hasJS: fs.existsSync(jsFile)
            };
            if (fs.existsSync(jsFile)) {
              const jsContent = fs.readFileSync(jsFile, 'utf-8');
              const funcRegex = /function\s+(\w+)\s*\(|const\s+(\w+)\s*=\s*(?:async\s*)?\(/g;
              const matches = [...jsContent.matchAll(funcRegex)];
              views[name].exports = matches.map(m => m[1] || m[2]).filter(Boolean);
            }
          });
          schema.views = Object.entries(views).map(([name, data]) => ({ name, ...data }));
        }
      } catch (err) {}
    }

    return schema;
  };

  const AxisNano = {
    init: async (config = {}) => {
      _config = { ...DEFAULTS, ...config };
      if (_config.debug) console.log('[AXIS] Initializing with config:', _config);
      if (_config.signatureEnabled) {
        _rootToken = WebCryptoAPI.generateToken();
        if (_config.debug) console.log('[AXIS] Root token generated');
      }
      if (typeof document !== 'undefined' && document.currentScript?.dataset.axisAuto) {
        const root = document.querySelector('[data-axis-root]');
        if (root) {
          const initialView = root.querySelector('[data-axis-view-target]');
          if (initialView) {
            const viewName = initialView.getAttribute('data-axis-view') || 'accueil';
            if (_config.debug) console.log(`[AXIS] Auto-loading view: ${viewName}`);
            const viewHtml = await AxisNano.navigate(viewName);
            if (viewHtml) {
              initialView.replaceWith(viewHtml);
            }
          }
        }
      }
      return true;
    },
    navigate: async (viewName) => {
      if (_config.debug) console.log(`[AXIS] Navigating to ${viewName}`);
      return _loadView(viewName, 'nav', 0);
    },
    load: async (viewName, selector) => {
      const target = document.querySelector(selector);
      if (!target) {
        console.error(`[AXIS] Target not found: ${selector}`);
        return false;
      }
      const viewHtml = await _loadView(viewName);
      if (viewHtml) {
        target.replaceWith(viewHtml);
        return true;
      }
      return false;
    },
    on: _on,
    emit: _emit,
    off: _off,
    data: async (endpoint, options = {}) => {
      try {
        const response = await _secureFetch(endpoint, {
          method: options.method || 'GET',
          headers: { 'Content-Type': 'application/json', ...options.headers },
          body: options.body ? JSON.stringify(options.body) : undefined
        });
        if (!response.ok) throw new Error(`API error: ${response.status}`);
        return await response.json();
      } catch (err) {
        if (_config.debug) console.error('[AXIS] Data error:', err);
        AxisNano.emit('api:error', { error: err.message });
        return null;
      }
    },
    crypto: { sha256: WebCryptoAPI.sha256, hmacSha256: WebCryptoAPI.hmacSha256, generateToken: WebCryptoAPI.generateToken },
    config: () => _config,
    setConfig: (newConfig) => { _config = { ..._config, ...newConfig }; },
    getViews: () => Array.from(_viewRegistry.keys()),
    generateSchema: generateSchema
  };

  const ExpressAPI = {
    $_I: (config) => AxisNano.init(config),
    $_N: (viewName) => AxisNano.navigate(viewName),
    $_L: (viewName, selector) => AxisNano.load(viewName, selector),
    $_S: (event, callback) => AxisNano.on(event, callback),
    $_E: (event, data) => AxisNano.emit(event, data),
    $_D: (endpoint, opts) => AxisNano.data(endpoint, opts),
    $_C: AxisNano.crypto
  };

  AxisNano.express = ExpressAPI;

  if (typeof document !== 'undefined') {
    document.addEventListener('DOMContentLoaded', () => {
      const script = document.currentScript;
      if (script && script.dataset.axisAuto) {
        const config = {
          debug: script.dataset.axisDebug !== undefined,
          vueFolder: script.dataset.axisVue || './vue',
          cacheViews: script.dataset.axisCache !== 'false',
          signatureEnabled: script.dataset.axisSignature !== undefined,
          editMode: script.dataset.axisEdit !== undefined
        };
        AxisNano.init(config);
      }
    });
  }

  if (typeof process !== 'undefined' && process.argv[2] === 'init') {
    const fs = require('fs');
    const path = require('path');
    const projectDir = process.cwd();
    const dirs = ['vue', 'documentation'];
    dirs.forEach(dir => {
      const dirPath = path.join(projectDir, dir);
      if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
        console.log(`✓ Créé: ${dir}/`);
      }
    });

    const files = {
      'index.html': `<!DOCTYPE html>\n<html lang="fr">\n<head>\n  <meta charset="UTF-8">\n  <meta name="viewport" content="width=device-width, initial-scale=1">\n  <title>AXIS NANO App</title>\n  <link rel="stylesheet" href="style.css">\n</head>\n<body>\n  <div data-axis-root>\n    <main data-axis-view-target data-axis-view="accueil"></main>\n  </div>\n\n  <script src="axis-nano.js" data-axis-auto data-axis-debug></script>\n  <script src="script.js"></script>\n</body>\n</html>`,
      'style.css': `* { margin: 0; padding: 0; box-sizing: border-box; }\nbody { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); min-height: 100vh; display: flex; align-items: center; justify-content: center; }\n[data-axis-root] { max-width: 800px; width: 100%; padding: 20px; }\nmain { background: white; border-radius: 12px; box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3); overflow: hidden; }\nbutton { padding: 12px 24px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border: none; border-radius: 6px; font-size: 1rem; font-weight: 600; cursor: pointer; transition: transform 0.2s, box-shadow 0.2s; }\nbutton:hover { transform: translateY(-2px); box-shadow: 0 10px 20px rgba(102, 126, 234, 0.3); }\ninput, textarea { width: 100%; padding: 10px; margin-bottom: 1rem; border: 1px solid #ddd; border-radius: 6px; font-size: 1rem; }\ninput:focus, textarea:focus { outline: none; border-color: #667eea; box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1); }`,
      'script.js': `console.log('[APP] AXIS NANO v1.0 — Application started');\nAxisNano.on('vue:loaded', (viewName) => { console.log('[APP] View loaded:', viewName); });`,
      'vue/accueil.html': `<div class="welcome-container">\n  <h1>Bienvenue dans AXIS NANO v1.0</h1>\n  <p class="subtitle">Framework décentralisé ultra-léger & sécurisé</p>\n  <div class="features">\n    <div class="feature"><h3>🚀 One-Shot</h3><p>npm install et c'est prêt. Zéro configuration.</p></div>\n    <div class="feature"><h3>🔒 Sécurité</h3><p>Web Crypto natif. HMAC-SHA256 sans dépendances.</p></div>\n    <div class="feature"><h3>⚡ Léger</h3><p>27 KB. Un seul fichier. Tout s'auto-détecte.</p></div>\n  </div>\n  <div class="demo"><h3>Essayez les Signaux Axis</h3>\n    <input type="text" data-axis-bind="name" placeholder="Votre nom" />\n    <button data-axis-on="click:sayHello">Dire Bonjour</button>\n    <div id="greeting" style="margin-top: 1rem; padding: 1rem; background: #f0f7ff; border-radius: 6px; display: none;"><p id="greeting-text"></p></div>\n  </div>\n  <div class="next-steps"><h3>Prochaines Étapes</h3>\n    <ul>\n      <li>Lancez: <code>npm run dev</code></li>\n      <li>Créez des vues dans <code>/vue</code></li>\n      <li>Utilisez: <code>data-axis-bind</code>, <code>data-axis-on</code></li>\n      <li>Générez le schema: <code>npm run schema</code></li>\n    </ul>\n  </div>\n</div>\n<style>\n  .welcome-container { padding: 40px; text-align: center; }\n  h1 { font-size: 2.5rem; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; margin-bottom: 0.5rem; }\n  .subtitle { font-size: 1.1rem; color: #666; margin-bottom: 2rem; }\n  .features { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin: 2rem 0; }\n  .feature { background: #f8f9fa; padding: 20px; border-radius: 8px; border-left: 4px solid #667eea; }\n  .feature h3 { margin-bottom: 0.5rem; color: #667eea; }\n  .demo { background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 2rem 0; text-align: left; }\n  .demo input { width: 100%; padding: 10px; margin-bottom: 1rem; border: 1px solid #ddd; border-radius: 6px; }\n  .next-steps { margin-top: 2rem; text-align: left; background: #fffbeb; padding: 20px; border-radius: 8px; }\n  .next-steps ul { list-style: none; padding-left: 0; }\n  .next-steps li { margin: 0.5rem 0; padding-left: 1.5rem; position: relative; }\n  .next-steps li:before { content: '✓'; position: absolute; left: 0; color: #667eea; }\n  code { background: #f0f0f0; padding: 2px 6px; border-radius: 3px; font-family: monospace; }\n</style>\n<script>\n  function sayHello(event) {\n    const name = axis.state.name || 'Visiteur';\n    const greeting = \`Bonjour, \${name}! 👋\`;\n    document.querySelector('#greeting-text').textContent = greeting;\n    document.querySelector('#greeting').style.display = 'block';\n    axis.emit('user:greeted', { name });\n  }\n</script>`,
      'documentation/README.md': `# AXIS NANO v1.0\n\n> Framework Décentralisé Ultra-Léger & Sécurisé\n\n## Signaux Axis\n\n### data-axis-bind\n\`\`\`html\n<input data-axis-bind="email" type="email" />\n<script>\n  // Accédez: axis.state.email\n</script>\n\`\`\`\n\n### data-axis-on\n\`\`\`html\n<button data-axis-on="click:handleClick">Click</button>\n<script>\n  function handleClick(event) { console.log('Clicked!'); }\n</script>\n\`\`\`\n\n### data-axis-if\n\`\`\`html\n<div data-axis-if="isVisible">Contenu</div>\n\`\`\`\n\n### data-axis-for\n\`\`\`html\n<li data-axis-for="item in items">{{item.name}}</li>\n\`\`\`\n\n## API\n\n\`\`\`javascript\nawait $AX.$_I();              // Init\nawait $AX.$_N('view');        // Navigate\n$AX.$_S('event', callback);   // Subscribe\n$AX.$_E('event', data);       // Emit\nawait $AX.$_D('/api/url');    // Data\n\`\`\`\n\n## Web Crypto\n\n\`\`\`javascript\nconst hash = await axis.crypto.sha256('data');\nconst sig = await axis.crypto.hmacSha256('msg', 'key');\nconst token = axis.crypto.generateToken();\n\`\`\`\n\n---\n\n**AXIS NANO v1.0 — Conçu pour durer, construit pour résister.**`
    };

    Object.entries(files).forEach(([filePath, content]) => {
      const fullPath = path.join(projectDir, filePath);
      const fileDir = path.dirname(fullPath);
      if (!fs.existsSync(fileDir)) fs.mkdirSync(fileDir, { recursive: true });
      if (!fs.existsSync(fullPath)) {
        fs.writeFileSync(fullPath, content, 'utf-8');
        console.log(`✓ Créé: ${filePath}`);
      }
    });

    console.log('\n✅ AXIS NANO v1.0 installé avec succès!\n');
  }

  return AxisNano;
});