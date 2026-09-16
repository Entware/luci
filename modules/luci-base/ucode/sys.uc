// Copyright 2022 Jo-Philipp Wich <jo@mein.io>
// Licensed to the public under the Apache License 2.0.

import { basename, readlink, readfile, open, popen, stat, glob } from 'fs';

export function process_list() {
	const top = popen('/opt/bin/busybox top -bn1');
	let line, list = [];

	for (let line = top.read('line'); length(line); line = top.read('line')) {
		// Optional 7th group: Entware's busybox is built with FEATURE_TOP_SMP_PROCESS, which always adds a per-process CPU-core column.
		let m = match(trim(line), /^([0-9]+) +([0-9]+) +(\S+) +([RSDZTWI<NW]{1,3}) +([0-9]+m?) *([0-9.]+)%? +([0-9]+ +)?([0-9.]+)%? +(.+)$/);

		if (m && m[9] != '/opt/bin/busybox top -bn1') {
			push(list, {
				PID: m[1],
				PPID: m[2],
				USER: trim(m[3]),
				STAT: m[4],
				VSZ: m[5],
				'%MEM': m[6],
				'%CPU': m[8],
				COMMAND: m[9]
			});
		}
	}

	top.close();

	return list;
};

export function conntrack_list(callback) {
	const etcpr = open('/opt/etc/protocols');
	const protos = {};

	if (etcpr) {
		for (let line = etcpr.read('line'); length(line); line = etcpr.read('line')) {
			const m = match(line, /^([^# \t\n]+)\s+([0-9]+)\s+/);

			if (m)
				protos[m[2]] = m[1];
		}

		etcpr.close();
	}

	let nfct = open('/proc/net/nf_conntrack', 'r');
	if (! nfct) {
		nfct = popen('/opt/sbin/conntrack -L -o extended', 'r');
	}
	let connt;

	if (nfct) {
		for (let line = nfct.read('line'); length(line); line = nfct.read('line')) {
			let m = match(line, /^(ipv[46]) +([0-9]+) +\S+ +([0-9]+)( +.+)\n$/);

			if (!m)
				continue;

			let fam = m[1];
			let l3 = m[2];
			let l4 = m[3];
			let tuples = m[4];
			let timeout = null;

			m = match(tuples, /^ +([0-9]+)( .+)$/);

			if (m) {
				timeout = m[1];
				tuples = m[2];
			}

			if (index(tuples, 'TIME_WAIT') !== -1)
				continue;

			let e = {
				bytes: 0,
				packets: 0,
				layer3: fam,
				layer4: protos[l4] ?? 'unknown',
				timeout: +timeout
			};

			for (let kv in match(tuples, / (\w+)=(\S+)/g)) {
				switch (kv[1]) {
				case 'bytes':
				case 'packets':
					e[kv[1]] += +kv[2];
					break;

				case 'src':
				case 'dst':
					e[kv[1]] ??= arrtoip(iptoarr(kv[2]));
					break;

				case 'sport':
				case 'dport':
					e[kv[1]] ??= +kv[2];
					break;

				default:
					e[kv[1]] = kv[2];
				}
			}

			if (callback)
				callback(e);
			else
				push(connt ??= [], e);
		}

		nfct.close();
	}

	return callback ? true : (connt ?? []);
};

export function init_list() {
	return map(filter(glob('/opt/etc/init.d/*'), path => {
		const s = stat(path);

		return s?.type == 'file' && s?.perm?.user_exec;
	}), basename);
};

export function init_index(name) {
	const src = readfile(`/opt/etc/init.d/${basename(name)}`, 2048);
	const idx = [];

	for (let m in match(src, /^[[:space:]]*(START|STOP)=('[0-9][0-9]'|"[0-9][0-9]"|[0-9][0-9])[[:space:]]*$/gs)) {
		switch (m[1]) {
		case 'START': idx[0] = +trim(m[2], '"\''); break;
		case 'STOP':  idx[1] = +trim(m[2], '"\''); break;
		}
	}

	return length(idx) ? idx : null;
};

export function init_enabled(name) {
	for (let path in glob(`/opt/etc/init.d/[SK][0-9][0-9]${basename(name)}`)) {
		const ln = readlink(path);
		const s1 = stat(index(ln, '/') == 0 ? ln : `/opt/etc/init.d/${ln}`);
		const s2 = stat(`/opt/etc/init.d/${basename(name)}`);

		if (s1?.inode == s2?.inode && s1?.type == 'file' && s1?.perm?.user_exec)
			return true;
	}

	return false;
};
