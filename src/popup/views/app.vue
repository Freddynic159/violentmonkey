<template>
  <div
    class="page-popup"
    :data-failure-reason="failureReason">
    <div class="flex menu-buttons">
      <div class="logo" :class="{disabled:!options.isApplied}">
        <img src="/public/images/icon128.png">
      </div>
      <div
        class="flex-1 ext-name"
        :class="{disabled:!options.isApplied}"
        v-text="i18n('extName')"
      />
      <tooltip
        class="menu-area"
        :class="{disabled:!options.isApplied}"
        :content="options.isApplied ? i18n('menuScriptEnabled') : i18n('menuScriptDisabled')"
        placement="bottom"
        align="end"
        @click.native="onToggle">
        <icon :name="getSymbolCheck(options.isApplied)"></icon>
      </tooltip>
      <tooltip
        class="menu-area"
        :content="i18n('menuDashboard')"
        placement="bottom"
        align="end"
        @click.native="onManage">
        <icon name="cog"></icon>
      </tooltip>
      <tooltip
        class="menu-area"
        :content="i18n('menuNewScript')"
        placement="bottom"
        align="end"
        @click.native="onCreateScript">
        <icon name="plus"></icon>
      </tooltip>
    </div>
    <div class="menu" v-if="store.injectable" v-show="store.domain">
      <div class="menu-item menu-area menu-find" @click="onFindSameDomainScripts">
        <icon name="search"></icon>
        <div class="flex-1" v-text="i18n('menuFindScripts')"></div>
      </div>
    </div>
    <div
      class="failure-reason"
      v-if="failureReasonText"
      v-text="failureReasonText" />
    <div
      v-for="scope in store.injectable && injectionScopes"
      class="menu menu-scripts"
      :class="{ expand: activeMenu === scope.name }"
      :data-type="scope.name"
      :key="scope.name">
      <div class="menu-item menu-area menu-group" @click="toggleMenu(scope.name)">
        <div class="flex-auto" v-text="scope.title" :data-totals="scope.totals" />
        <icon name="arrow" class="icon-collapse"></icon>
      </div>
      <div class="submenu">
        <div
          v-for="(item, index) in scope.list"
          :key="index"
          :class="{ disabled: !item.data.config.enabled }"
          @mouseenter="message = item.name"
          @mouseleave="message = ''">
          <div
            class="menu-item menu-area"
            @click="onToggleScript(item)">
            <img class="script-icon" :src="scriptIconUrl(item)" @error="scriptIconError">
            <icon :name="getSymbolCheck(item.data.config.enabled)"></icon>
            <div class="flex-auto ellipsis" v-text="item.name"
                 @click.ctrl.exact.stop="onEditScript(item)"
                 @contextmenu.exact.stop="onEditScript(item)"
                 @mousedown.middle.exact.stop="onEditScript(item)" />
          </div>
          <div class="submenu-buttons">
            <div class="submenu-button" @click="onEditScript(item)">
              <icon name="code"></icon>
            </div>
          </div>
          <div class="submenu-commands">
            <div
              class="menu-item menu-area"
              v-for="(cap, i) in store.commands[item.data.props.id]"
              :key="i"
              @click="onCommand(item.data.props.id, cap)"
              @mouseenter="message = cap"
              @mouseleave="message = item.name">
              <icon name="command" />
              <div class="flex-auto ellipsis" v-text="cap" />
            </div>
          </div>
        </div>
      </div>
    </div>
    <footer>
      <span @click="onVisitWebsite" v-text="i18n('visitWebsite')" />
    </footer>
    <div class="message" v-if="message">
      <div v-text="message"></div>
    </div>
  </div>
</template>

<script>
import Tooltip from 'vueleton/lib/tooltip/bundle';
import options from '#/common/options';
import { getLocaleString, i18n, sendCmd } from '#/common';
import Icon from '#/common/ui/icon';
import { store } from '../utils';

const optionsData = {
  isApplied: options.get('isApplied'),
  filtersPopup: options.get('filtersPopup') || {},
};
options.hook((changes) => {
  if ('isApplied' in changes) {
    optionsData.isApplied = changes.isApplied;
  }
  if ('filtersPopup' in changes) {
    optionsData.filtersPopup = {
      ...optionsData.filtersPopup,
      ...changes.filtersPopup,
    };
  }
});

export default {
  components: {
    Icon,
    Tooltip,
  },
  data() {
    return {
      store,
      options: optionsData,
      activeMenu: 'scripts',
      message: null,
    };
  },
  computed: {
    injectionScopes() {
      const { sort, enabledFirst, hideDisabled } = this.options.filtersPopup;
      const isSorted = sort === 'alpha' || enabledFirst;
      return [
        ['scripts', i18n('menuMatchedScripts')],
        ['frameScripts', i18n('menuMatchedFrameScripts')],
      ].map(([name, title]) => {
        let list = this.store[name];
        const numTotal = list.length;
        const numEnabled = list.reduce((num, script) => num + script.config.enabled, 0);
        if (hideDisabled) list = list.filter(script => script.config.enabled);
        list = list.map((script, i) => {
          const scriptName = script.custom.name || getLocaleString(script.meta, 'name');
          return {
            name: scriptName,
            data: script,
            key: isSorted && `${
              enabledFirst && +!script.config.enabled
            }${
              sort === 'alpha' ? scriptName.toLowerCase() : `${1e6 + i}`.slice(1)
            }`,
          };
        });
        if (isSorted) {
          list.sort((a, b) => (a.key < b.key ? -1 : a.key > b.key));
        }
        return numTotal && {
          name,
          title,
          list,
          totals: numEnabled < numTotal
            ? `${numEnabled} / ${numTotal}`
            : `${numTotal}`,
        };
      }).filter(Boolean);
    },
    failureReason() {
      return [
        !store.injectable && 'noninjectable',
        store.blacklisted && 'blacklisted',
        // undefined means the data isn't ready yet
        optionsData.isApplied === false && 'scripts-disabled',
      ].filter(Boolean).join(' ');
    },
    failureReasonText() {
      return (
        !store.injectable && i18n('failureReasonNoninjectable')
        || store.blacklisted && i18n('failureReasonBlacklisted')
        || optionsData.isApplied === false && i18n('menuScriptDisabled')
        || ''
      );
    },
  },
  methods: {
    toggleMenu(name) {
      this.activeMenu = this.activeMenu === name ? null : name;
    },
    getSymbolCheck(bool) {
      return `toggle-${bool ? 'on' : 'off'}`;
    },
    scriptIconUrl(item) {
      const { icon } = item.data.meta;
      return (item.data.custom.pathMap || {})[icon] || icon || null;
    },
    scriptIconError(event) {
      event.target.removeAttribute('src');
    },
    onToggle() {
      options.set('isApplied', !this.options.isApplied);
      this.checkReload();
    },
    onManage() {
      browser.runtime.openOptionsPage();
      window.close();
    },
    onVisitWebsite() {
      browser.tabs.create({
        url: 'https://violentmonkey.github.io/',
      });
      window.close();
    },
    onEditScript(item) {
      browser.tabs.create({
        url: browser.runtime.getURL(`/options/index.html#scripts/${item.data.props.id}`),
      });
      window.close();
    },
    onFindSameDomainScripts() {
      browser.tabs.create({
        url: `https://greasyfork.org/scripts/by-site/${encodeURIComponent(this.store.domain)}`,
      });
    },
    onCommand(id, cap) {
      browser.tabs.sendMessage(this.store.currentTab.id, {
        cmd: 'Command',
        data: `${id}:${cap}`,
      });
    },
    onToggleScript(item) {
      const { data } = item;
      const enabled = !data.config.enabled;
      sendCmd('UpdateScriptInfo', {
        id: data.props.id,
        config: { enabled },
      })
      .then(() => {
        data.config.enabled = enabled;
        this.checkReload();
      });
    },
    checkReload() {
      if (options.get('autoReload')) browser.tabs.reload(this.store.currentTab.id);
    },
    onCreateScript() {
      const { currentTab, domain } = this.store;
      (domain ? (
        sendCmd('CacheNewScript', {
          url: currentTab.url.split('#')[0].split('?')[0],
          name: `- ${domain}`,
        })
      ) : Promise.resolve())
      .then((id) => {
        const path = ['scripts', '_new', id].filter(Boolean).join('/');
        browser.tabs.create({
          url: browser.runtime.getURL(`/options/index.html#${path}`),
        });
        window.close();
      });
    },
  },
};
</script>

<style src="../style.css"></style>
