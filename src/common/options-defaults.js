export default {
  isApplied: true,
  autoUpdate: true,
  // ignoreGrant: false,
  lastUpdate: 0,
  lastModified: 0,
  /** @type 'unique' | 'total' | '' */
  showBadge: 'unique',
  exportValues: true,
  closeAfterInstall: false,
  trackLocalFile: false,
  autoReload: false,
  features: null,
  blacklist: null,
  syncScriptStatus: true,
  sync: null,
  customCSS: null,
  importSettings: true,
  notifyUpdates: false,
  version: null,
  defaultInjectInto: 'page', // 'page' | 'auto',
  filters: {
    /** @type 'exec' | 'alpha' | 'update' */
    sort: 'exec',
  },
  filtersPopup: {
    /** @type 'exec' | 'alpha' */
    sort: 'exec',
    enabledFirst: false,
    hideDisabled: false,
  },
  editor: {
    lineWrapping: false,
    indentWithTabs: false,
    indentUnit: 2,
    undoDepth: 200,
  },
  scriptTemplate: `\
// ==UserScript==
// @name        New script {{name}}
// @namespace   Violentmonkey Scripts
// @match       {{url}}
// @grant       none
// @version     1.0
// @author      -
// @description {{date}}
// ==/UserScript==
`,
  // Enables automatic updates to the default template with new versions of VM
  /** @type {?Boolean} this must be |null| for template-hook.js upgrade routine */
  scriptTemplateEdited: null,
};
