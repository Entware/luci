#
# Copyright (C) 2018 Jo-Philipp Wich <jo@mein.io>
#
# This is free software, licensed under the Apache License, Version 2.0 .
#

include $(TOPDIR)/rules.mk

PKG_LICENSE:=Apache-2.0

LUCI_TITLE:=Package management application
# +jshn: on real OpenWrt jshn.sh ships bundled with libubox; on this Entware
# buildroot it's its own separate package, so the backend script's
LUCI_DEPENDS:=+luci-base +jshn

PKG_MAINTAINER:=Entware team, https://entware.net

PKG_PROVIDES:=luci-app-opkg

include ../../luci.mk

# call BuildPackage - OpenWrt buildroot signature
