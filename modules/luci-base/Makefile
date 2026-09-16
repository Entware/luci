#
# Copyright (C) 2022 Jo-Philipp Wich <jo@mein.io>
#
# This is free software, licensed under the Apache License, Version 2.0 .
#

include $(TOPDIR)/rules.mk

PKG_NAME:=luci-base
PKG_BUILD_FLAGS:=no-lto

LUCI_TYPE:=mod
LUCI_BASENAME:=base

LUCI_TITLE:=LuCI core runtime
LUCI_DEPENDS:=\
	+rpcd \
	+rpcd-mod-file \
	+rpcd-mod-ucode \
	+cgi-io \
	+ucode \
	+ucode-mod-fs \
	+ucode-mod-log \
	+ucode-mod-uci \
	+ucode-mod-ubus \
	+ucode-mod-html \
	+liblucihttp-ucode \
	+busybox

PKG_LICENSE:=Apache-2.0
PKG_LICENSE_FILES:=LICENSE NOTICE

HOST_BUILD_DIR:=$(BUILD_DIR_HOST)/$(PKG_NAME)

include $(INCLUDE_DIR)/host-build.mk

define Package/luci-base/conffiles
/opt/etc/luci-uploads
/opt/etc/uci-config/luci
/opt/etc/uci-config/system
endef

define Package/luci-base/postinst
#!/bin/sh

if [ -z "$${IPKG_INSTROOT}" ] && [ -f /opt/etc/uci-config/uhttpd ]; then
	if ! uci -q get uhttpd.main.ucode_prefix | grep -sq /cgi-bin/luci; then
		uci add_list uhttpd.main.ucode_prefix='/cgi-bin/luci=/opt/share/ucode/luci/uhttpd.uc'
		uci commit uhttpd
		pidof uhttpd >/dev/null && /opt/etc/init.d/S55uhttpd reconfigure
	fi
	pidof rpcd >/dev/null && /opt/etc/init.d/S50rpcd reconfigure
fi

exit 0
endef

define Build/Prepare/luci-base
	$(CP) ../../NOTICE $(PKG_BUILD_DIR)
	$(CP) ../../LICENSE $(PKG_BUILD_DIR)
endef

TARGET_CFLAGS += -I$(STAGING_DIR)/opt/include
TARGET_LDFLAGS += -L$(STAGING_DIR)/opt/lib -lucode -lcrypt

include ../../luci.mk

define Host/Configure
endef

define Host/Compile
	$(MAKE) -C src/ clean po2lmo jsmin
endef

define Host/Install
	$(INSTALL_DIR) $(1)/bin
	$(INSTALL_BIN) src/po2lmo $(1)/bin/po2lmo
	$(INSTALL_BIN) src/jsmin $(1)/bin/jsmin
endef

$(eval $(call HostBuild))

# call BuildPackage - OpenWrt buildroot signature
