'use strict';
'require view';
'require poll';
'require ui';
'require uci';
'require rpc';
'require form';

const callGetUnixtime = rpc.declare({
	object: 'luci',
	method: 'getUnixtime',
	expect: { result: 0 }
});

const callSetLocaltime = rpc.declare({
	object: 'luci',
	method: 'setLocaltime',
	params: [ 'localtime' ],
	expect: { result: 0 }
});

const callTimezone = rpc.declare({
	object: 'luci',
	method: 'getTimezones',
	expect: { '': {} }
});

function formatTime(epoch) {
	const date = new Date(epoch * 1000);
	const zn = uci.get('system', '@system[0]', 'zonename')?.replaceAll(' ', '_') || 'UTC';
	const ts = uci.get('system', '@system[0]', 'clock_timestyle') || 0;
	const hc = uci.get('system', '@system[0]', 'clock_hourcycle') || 0;

	return new Intl.DateTimeFormat(undefined, {
		dateStyle: 'medium',
		timeStyle: (ts == 0) ? 'long' : 'full',
		hourCycle: (hc == 0) ? undefined : hc,
		timeZone: zn
	}).format(date);
}

const CBILocalTime = form.DummyValue.extend({
	renderWidget(section_id, option_id, cfgvalue) {
		return E([], [
			E('input', {
				'id': 'localtime',
				'type': 'text',
				'readonly': true,
				'value': formatTime(cfgvalue)
			}),
			E('br'),
			E('span', { 'class': 'control-group' }, [
				E('button', {
					'class': 'cbi-button cbi-button-apply',
					'click': ui.createHandlerFn(this, function() {
						return callSetLocaltime(Math.floor(Date.now() / 1000));
					}),
					'disabled': (this.readonly != null) ? this.readonly : this.map.readonly
				}, _('Sync with browser'))
			])
		]);
	},
});

return view.extend({
	load() {
		return Promise.all([
			callTimezone(),
			callGetUnixtime(),
			uci.load('luci'),
			uci.load('system')
		]);
	},

	render([timezones, unixtime]) {
		let m, s, o;

		m = new form.Map('system',
			_('System'),
			_('Here you can configure the basic aspects of your device like its hostname or the timezone.'));

		m.chain('luci');

		s = m.section(form.TypedSection, 'system', _('System Properties'));
		s.anonymous = true;
		s.addremove = false;

		s.tab('general', _('General Settings'));
		s.tab('language', _('Language and Style'));

		/*
		 * System Properties
		 */

		o = s.taboption('general', CBILocalTime, '_systime', _('Local Time'));
		o.cfgvalue = function() { return unixtime };

		o = s.taboption('general', form.Value, 'hostname', _('Hostname'));
		o.datatype = 'hostname';

		/* could be used also as a default for LLDP, SNMP "system description" in the future */
		o = s.taboption('general', form.Value, 'description', _('Description'), _('An optional, short description for this device'));
		o.optional = true;

		o = s.taboption('general', form.TextValue, 'notes', _('Notes'), _('Optional, free-form notes about this device'));
		o.optional = true;

		o = s.taboption('general', form.ListValue, 'zonename', _('Timezone'));
		o.value('UTC');

		const zones = Object.keys(timezones || {}).sort();
		for (let zone of zones)
			o.value(zone);

		o.write = function(section_id, formvalue) {
			const tz = timezones[formvalue] ? timezones[formvalue].tzstring : null;
			uci.set('system', section_id, 'zonename', formvalue);
			uci.set('system', section_id, 'timezone', tz);
		};

		o = s.taboption('general', form.Flag, 'clock_timestyle', _('Full TimeZone Name'), _('Unchecked means the timezone offset (E.g. GMT+1) is displayed'));

		o = s.taboption('general', form.ListValue, 'clock_hourcycle', _('Time Format'));
		o.value('', _('Default'));
		o.value('h12', _('12-Hour Clock'));
		o.value('h23', _('24-Hour Clock'));

		/*
		 * Language & Style
		 */

		o = s.taboption('language', form.ListValue, '_lang', _('Language'))
		o.uciconfig = 'luci';
		o.ucisection = 'main';
		o.ucioption = 'lang';
		o.value('auto', _('auto'));

		const l = Object.assign({ en: 'English' }, uci.get('luci', 'languages'));
		const keys = Object.keys(l).sort();
		for (let k of keys)
			if (k.charAt(0) != '.')
				o.value(k, l[k]);

		o = s.taboption('language', form.ListValue, '_mediaurlbase', _('Design'))
		o.uciconfig = 'luci';
		o.ucisection = 'main';
		o.ucioption = 'mediaurlbase';

		const th = Object.keys(uci.get('luci', 'themes') || {}).sort();
		for (let t of th)
			if (t.charAt(0) != '.')
				o.value(uci.get('luci', 'themes', t), t);

		o = s.taboption('language', form.Flag, '_tablefilters', _('Table Filters'));
		o.default = o.disabled;
		o.uciconfig = 'luci';
		o.ucisection = 'main';
		o.ucioption = 'tablefilters';

		return m.render().then(function(mapEl) {
			poll.add(function() {
				return callGetUnixtime().then(function(t) {
					mapEl.querySelector('#localtime').value = formatTime(t);
				});
			});

			return mapEl;
		});
	}
});
