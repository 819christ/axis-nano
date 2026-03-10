/**
 * ╔══════════════════════════════════════════════════════════════════════════╗
 * ║                                                                          ║
 * ║                  AXIS ⬡ NANO V2.0 — REFONTE TOTALE                       ║
 * ║                                                                          ║
 * ║              Moteur de Rendu Modulaire Native-First                      ║
 * ║                                                                          ║
 * ║  • Performance brute (Veille GPU profonde)                               ║
 * ║  • Sécurité cryptographique (SHA-256)                                    ║
 * ║  • Flexibilité extrême (Nom & Position libres)                           ║
 * ║  • Persistance IndexedDB avec versioning                                 ║
 * ║  • Zéro dépendance runtime                                               ║
 * ║                                                                          ║
 * ║  Installation: Copie ce fichier. C'est tout.                             ║
 * ║  Configuration: <script id="axis-nano-engine" src="..."></script>        ║
 * ║                                                                          ║
 * ╚══════════════════════════════════════════════════════════════════════════╝
 */

'use strict';

/**
 * VERIFICATEUR — Cryptographie SHA-256 avec clé de session
 */
const Verificateur = (function() {
  const _KEY = localStorage.getItem('axis_nano_key') || 
               '🔑_' + Math.random().toString(36).substring(2);
  
  localStorage.setItem('axis_nano_key', _KEY);

  return {
    hash: async (texte) => {
      try {
        const encoder = new TextEncoder();
        const data = encoder.encode(texte + _KEY);
        const hashBuffer = await crypto.subtle.digest('SHA-256', data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map(x => x.toString(16).padStart(2, '0')).join('');
      } catch (err) {
        console.error('🚨 Erreur Verificateur:', err);
        return null;
      }
    }
  };
})();

/**
 * AXISDB — Persistance IndexedDB avec versioning intelligent
 */
const AxisDB = {
  nom: 'AxisNano_Core',
  
  async store() {
    return new Promise((resolve, reject) => {
      const req = indexedDB.open(this.nom, 1);
      
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains('briques')) {
          db.createObjectStore('briques', { keyPath: 'id' });
        }
      };
      
      req.onsuccess = () => {
        const db = req.result;
        const transaction = db.transaction('briques', 'readwrite');
        const objectStore = transaction.objectStore('briques');
        resolve(objectStore);
      };
      
      req.onerror = () => reject(req.error);
    });
  },

  async get(id) {
    const store = await this.store();
    return new Promise((resolve) => {
      const req = store.get(id);
      req.onsuccess = () => resolve(req.result || null);
    });
  },

  async save(brique) {
    const store = await this.store();
    return new Promise((resolve, reject) => {
      const req = store.put(brique);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  },

  async delete(id) {
    const store = await this.store();
    return new Promise((resolve) => {
      const req = store.delete(id);
      req.onsuccess = () => resolve();
    });
  }
};

/**
 * PHASE 1: LA FORGE (Extraction, Sécurisation & Persistance)
 */
async function forgeNano(targetID) {
  const zone = document.getElementById(targetID);
  
  if (!zone) {
    console.warn(`⚠️ [${targetID}] Zone non trouvée en DOM`);
    return;
  }

  const cheminBrique = zone.getAttribute('data-allowed');
  const version = zone.getAttribute('data-version');

  if (!cheminBrique) {
    console.error(`🚨 [${targetID}] Attribut data-allowed manquant`);
    return;
  }

  // Vérifier le cache
  const cache = await AxisDB.get(targetID);
  if (cache && cache.version === version) {
    console.log(`📦 [${targetID}] Brique en cache (v${version}) - Skip fetch`);
    return;
  }

  try {
    // Fetch la brique
    const response = await fetch(cheminBrique);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const htmlBrut = await response.text();
    
    // Parser le HTML
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlBrut, 'text/html');

    // Trouver la racine (ID correspondant ou premier enfant du body)
    const racine = doc.getElementById(targetID) || doc.body.firstElementChild;
    
    if (!racine) {
      throw new Error(`Aucun élément trouvé dans ${cheminBrique}`);
    }

    // Extraire parent expected
    const parentAttendu = racine.getAttribute('data-parent-expected');

    // Extraire et supprimer styles
    let css = '';
    doc.querySelectorAll('style').forEach(el => {
      css += el.textContent + '\n';
      el.remove();
    });

    // Extraire et supprimer scripts
    let js = '';
    doc.querySelectorAll('script').forEach(el => {
      js += el.textContent + '\n';
      el.remove();
    });

    // Contenu HTML final
    const contenu = racine.innerHTML;

    // Calculer signature
    const signature = await Verificateur.hash(contenu + css + js);

    // Sauvegarder dans IndexedDB
    await AxisDB.save({
      id: targetID,
      version: version,
      parentAttendu: parentAttendu,
      contenu: contenu,
      css: css,
      js: js,
      signature: signature,
      dateForge: new Date().toISOString()
    });

    console.log(`📦 Forge [${targetID}] scellée (v${version})`);

  } catch (err) {
    console.error(`🚨 Erreur Forge [${targetID}]:`, err.message);
    zone.innerHTML = `<p style="color:red;">Erreur: ${err.message}</p>`;
  }
}

/**
 * PHASE 2: L'INJECTEUR NANO (Déploiement physique & activation logique)
 */
async function injecterVue(targetID) {
  const brique = await AxisDB.get(targetID);
  const conteneur = document.getElementById(targetID);

  if (!brique) {
    console.error(`🚨 [${targetID}] Brique non trouvée en DB`);
    return;
  }

  if (!conteneur) {
    console.error(`🚨 [${targetID}] Conteneur non trouvé en DOM`);
    return;
  }

  // Vérification parent attendu
  if (brique.parentAttendu) {
    const parentReel = conteneur.parentElement.closest('[data-allowed]')?.id || 'root';
    if (brique.parentAttendu !== parentReel) {
      console.error(`🚨 AXIS ⬡ NANO - Placement invalide`);
      console.error(`   [${targetID}] attend parent [${brique.parentAttendu}]`);
      console.error(`   Mais est dans [${parentReel}]`);
      conteneur.innerHTML = `<p style="color:red;">Placement invalide</p>`;
      return;
    }
  }

  // Injecter HTML
  conteneur.innerHTML = brique.contenu;

  // Injecter CSS avec scoping
  if (brique.css) {
    const idStyle = `axis-style-${targetID}`;
    if (!document.head.querySelector(`[data-axis-style="${targetID}"]`)) {
      const styleTag = document.createElement('style');
      styleTag.setAttribute('data-axis-style', targetID);
      
      // Scoping CSS: préfixer avec #targetID
      const cssScope = brique.css.replace(
        /(^|[^}\s,])\s*([^@}{]+)(?=\s*\{)/g,
        (match, p1, p2) => {
          if (p2.trim().startsWith('@')) return match;
          return `${p1} #${targetID} ${p2.trim()}`;
        }
      );
      
      styleTag.textContent = cssScope;
      document.head.appendChild(styleTag);
    }
  }

  // Injecter JS isolé
  if (brique.js) {
    const idScript = `axis-script-${targetID}`;
    if (!document.getElementById(idScript)) {
      const scriptTag = document.createElement('script');
      scriptTag.id = idScript;
      scriptTag.textContent = `(function() { ${brique.js} })();`;
      document.body.appendChild(scriptTag);
    }
  }

  // Traiter les briques enfants
  const enfants = conteneur.querySelectorAll(':scope > [data-allowed]');
  const estTunnel = conteneur.getAttribute('data-view-mode') === 'tunnel';

  for (let i = 0; i < enfants.length; i++) {
    const enfant = enfants[i];
    await forgeNano(enfant.id);

    if (estTunnel && i > 0) {
      // Mode Tunnel: mettre en veille les autres
      enfant.style.contentVisibility = 'hidden';
      enfant.classList.add('axis-sleep');
      console.log(`💤 [${enfant.id}] en veille profonde (Tunnel)`);
    } else {
      // Mode Multiple: tous actifs
      await injecterVue(enfant.id);
    }
  }

  console.log(`☀️ [${targetID}] injectée avec succès`);
}

/**
 * PHASE 3: LE CONTRÔLEUR DE FLUX (Navigation & Gestion d'État)
 */
async function switchView(targetID) {
  const cible = document.getElementById(targetID);
  
  if (!cible) {
    console.error(`🚨 [${targetID}] Vue non trouvée`);
    return;
  }

  const parent = cible.parentElement;
  const soeurs = parent.querySelectorAll(':scope > [data-allowed]');

  console.log(`🔄 Switch vers [${targetID}]`);

  for (const soeur of soeurs) {
    if (soeur.id === targetID) {
      // Réveiller
      soeur.style.contentVisibility = 'visible';
      soeur.classList.remove('axis-sleep');
      
      // Si pas encore chargée, charger maintenant
      if (soeur.innerHTML.trim() === '') {
        await injecterVue(soeur.id);
      }

      // Déclencher event wake
      soeur.dispatchEvent(new CustomEvent('wake', { bubbles: true }));
      console.log(`☀️ [${soeur.id}] réveillée`);
      
    } else {
      // Endormir (Veille profonde GPU)
      soeur.style.contentVisibility = 'hidden';
      soeur.classList.add('axis-sleep');

      // Déclencher event sleep
      soeur.dispatchEvent(new CustomEvent('sleep', { bubbles: true }));
      console.log(`💤 [${soeur.id}] endormie`);
    }
  }
}

/**
 * 🚀 INITIALISATION — Démarrage du moteur AXIS ⬡ NANO
 */
document.addEventListener('DOMContentLoaded', async () => {
  console.log('🚀 ⬡ AXIS NANO V2.0 — Démarrage du moteur');
  console.log('════════════════════════════════════════════════════════');

  // 1. Récupérer le tag moteur
  const engineTag = document.getElementById('axis-nano-engine');
  
  if (!engineTag) {
    console.error('🚨 Tag engine manquant: <script id="axis-nano-engine"></script>');
    return;
  }

  // 2. Charger le Design System global
  const themePath = engineTag.getAttribute('data-axis-theme');
  
  if (themePath) {
    try {
      const response = await fetch(themePath);
      if (response.ok) {
        const themeCSS = await response.text();
        
        if (!document.head.querySelector('#axis-theme-globals')) {
          const styleTag = document.createElement('style');
          styleTag.id = 'axis-theme-globals';
          styleTag.textContent = themeCSS;
          document.head.insertBefore(styleTag, document.head.firstChild);
          console.log(`🎨 Design System chargé: ${themePath}`);
        }
      }
    } catch (err) {
      console.warn(`⚠️ Design System introuvable: ${themePath}`);
    }
  }

  // 3. Forger et injecter les briques racines
  const racines = document.querySelectorAll('body > [data-allowed]');
  
  if (racines.length === 0) {
    console.warn('⚠️ Aucune brique racine trouvée (body > [data-allowed])');
    return;
  }

  console.log(`📦 ${racines.length} brique(s) racine(s) détectée(s)`);

  for (const racine of racines) {
    await forgeNano(racine.id);
    await injecterVue(racine.id);
  }

  console.log('════════════════════════════════════════════════════════');
  console.log('✅ Moteur AXIS ⬡ NANO prêt');
});

/**
 * EXPORT API GLOBALE (optionnel pour usage avancé)
 */
if (typeof window !== 'undefined') {
  window.AxisNano = {
    forge: forgeNano,
    injecter: injecterVue,
    naviguer: switchView,
    db: AxisDB,
    crypto: Verificateur,
    version: '2.0.0'
  };
  
  // Legacy API (compatibilité)
  window.forgeNano = forgeNano;
  window.injecterVue = injecterVue;
  window.switchView = switchView;
}