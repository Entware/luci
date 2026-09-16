'use strict';
'require view';
'require fs';
'require ui';

var isReadonlyView = !L.hasViewPermission() || null;
var INITD = '/opt/etc/init.d';

return view.extend({
	load: async function() {
		var entries = fs.list(INITD).catch(function() { return [] });

		var initList = {};

		(await entries).forEach(function(e) {
			var m = e.type === 'file' && e.name.match(/^S([0-9]+)/);
			if (m)
				initList[e.name] = { start: +m[1], enabled: !!(e.mode & 0o100) };
		});

		return initList;
	},

	handleAction: function(name, action, ev) {
		return fs.exec_direct('%s/%s'.format(INITD, name), [ action ]).then(function(res) {
			if (res)
				ui.addNotification(null, E('p', [ E('strong', name + ' ' + action + ':'), E('pre', res) ]), 'info');

			return true;
		}).catch(function(e) {
			ui.addNotification(null, E('p', _('Failed to execute "%s %s" action: %s').format(name, action, e)));
		});
	},

	handleEnableDisable: function(name, isEnabled, ev) {
		return fs.exec_direct('/opt/bin/chmod', [ isEnabled ? 'u-x' : 'u+x', '%s/%s'.format(INITD, name) ]).then(L.bind(function(name, isEnabled, btn) {
			btn.parentNode.replaceChild(this.renderEnableDisable({
				name: name,
				enabled: isEnabled
			}), btn);
		}, this, name, !isEnabled, ev.currentTarget));
	},

	renderEnableDisable: function(init) {
		return E('button', {
			class: 'btn cbi-button-%s'.format(init.enabled ? 'positive' : 'negative'),
			click: ui.createHandlerFn(this, 'handleEnableDisable', init.name, init.enabled),
			disabled: isReadonlyView
		}, init.enabled ? _('Enabled') : _('Disabled'));
	},

	render: function(initList) {
		var rows = [], list = [];

		var table = E('table', { 'class': 'table' }, [
			E('tr', { 'class': 'tr table-titles' }, [
				E('th', { 'class': 'th' }, _('Start priority')),
				E('th', { 'class': 'th' }, _('Initscript')),
				E('th', { 'class': 'th nowrap cbi-section-actions' })
			])
		]);

		for (var init in initList)
			if (initList[init].start < 100)
				list.push(Object.assign({ name: init }, initList[init]));

		list.sort(function(a, b) {
			if (a.start != b.start)
				return a.start - b.start

			return a.name > b.name;
		});

		for (var i = 0; i < list.length; i++) {
			rows.push([
				'%02d'.format(list[i].start),
				list[i].name.replace(/^S[0-9]+/, ''),
				E('div', [
					this.renderEnableDisable(list[i]),
					E('button', { 'class': 'btn cbi-button-action', 'click': ui.createHandlerFn(this, 'handleAction', list[i].name, 'start'), 'disabled': isReadonlyView }, _('Start', 'daemon start action')),
					E('button', { 'class': 'btn cbi-button-action', 'click': ui.createHandlerFn(this, 'handleAction', list[i].name, 'restart'), 'disabled': isReadonlyView }, _('Restart', 'daemon restart action')),
					E('button', { 'class': 'btn cbi-button-action', 'click': ui.createHandlerFn(this, 'handleAction', list[i].name, 'reconfigure'), 'disabled': isReadonlyView }, _('Reload', 'daemon reload action')),
					E('button', { 'class': 'btn cbi-button-action', 'click': ui.createHandlerFn(this, 'handleAction', list[i].name, 'stop'), 'disabled': isReadonlyView }, _('Stop', 'daemon stop action'))
				])
			]);
		}

		cbi_update_table(table, rows);

		var view = E('div', {}, [
			E('h2', _('Startup')),
			E('div', {}, [
				E('div', { 'data-tab': 'init', 'data-tab-title': _('Initscripts') }, [
					E('p', {}, _('You can enable or disable installed init scripts here. Changes will be applied after a device reboot.<br /><strong>Warning: If you disable essential init scripts like "network", your device might become inaccessible!</strong>')),
					table
				])
			])
		]);

		ui.tabs.initTabGroup(view.lastElementChild.childNodes);

		return view;
	},

	handleSaveApply: null,
	handleSave: null,
	handleReset: null
});
