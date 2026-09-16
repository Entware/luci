# Application structure

```
.
├── htdocs
│   └── luci-static
│       └── resources
│           └── view
│               └── example
│                   ├── form.js
│                   ├── htmlview.js
│                   ├── rpc-jsonmap-tablesection.js
│                   ├── rpc-jsonmap-typedsection.js
│                   └── rpc.js
├── Makefile
├── po
│   ├── templates
│   │   └── example.pot
├── README.md
└── root
    ├── etc
    │   └── uci-defaults
    │       └── 80_example
    └── share
        ├── luci
        │   └── menu.d
        │       └── luci-app-example.json
        └── rpcd
            ├── acl.d
            │   └── luci-app-example.json
            └── ucode
                └── example.uc

```

Note for Entware: `root/*` is installed straight under `/opt/`, with no intervening `usr/` segment
— hence `root/share/...` here, not upstream OpenWrt's `root/usr/share/...`. This app is one of the
few in this repository actually ported to Entware paths; most other `applications/*`/`modules/*`
packages here are still unconverted OpenWrt originals and should not be used as a layout reference.

Your starting point for this layout is the `applications` directory in the LuCI git repository.

A folder must be created with a name like `luci-app-appname`.

For the rest of this documentation, `appname` is `example`.

## Root files

At least one file must exist in `applications/luci-app-example` - a Makefile. This defines what license is to be applied to the code, and what packages are required for the package to be installed.

A `README.md` file is also recommended. It should provide context on what the app does, and perhaps instructions on how to test things like RPC calls.

## Javascript code

All JS code is placed under `htdocs/luci-static/resources/view/appname/`, where *appname* is the name without *luci-app-* prepended (in this case, `htdocs/luci-static-resources/view/example`).

## Menu mapping

The JSON file that maps `view/example/*` to menu items is defined in `root/share/luci/menu.d`. The file is named the same as the containing folder for the app, with a **.json** extension - `luci-app-example.json`.

## ACL mapping

The JSON file that defines what APIs may be called is defined in `root/share/rpcd/acl.d/`. The file is named the same as the containing folder for the app, with a **.json** extension - `luci-app-example.json`.

If ACL rights are not granted correctly, the web UI will show an error indicating "Access denied". Fix the ACL file, deploy it to the device/virtual machine, and restart `rpcd`.

## Additional files

LuCI apps do not have to have any additional files or UCI default setup. However, here's how you deal with those if needed.

### Installing additional files

Any additional files needed by this application should be placed in `root/` using the directory tree that applies. This example application needs a ucode RPCd script to be installed, so it places a file in `root/share/rpcd/ucode` and called `example.uc`.

The packaging system will install these files automatically.

### UCI defaults

UCI defaults are documented in the [OpenWrt wiki](https://openwrt.org/docs/guide-developer/uci-defaults); Entware ports the same mechanism (see `uci_apply_defaults()` in `/opt/lib/config/uci.sh`, run from this package's postinst). They create default files in the running system's `/opt/etc/uci-config/` directory — Entware's `uci` is patched to use that path instead of upstream's `/etc/config/`.

Place any defaults in the file `root/etc/uci-defaults/appname`, possibly with a number prepended to control sequencing - this example package uses `80_example` as the filename.
