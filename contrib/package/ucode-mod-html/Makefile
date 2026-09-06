include $(TOPDIR)/rules.mk

PKG_NAME:=ucode-mod-html
PKG_RELEASE:=1
PKG_LICENSE:=ISC
PKG_MAINTAINER:=Entware team, https://entware.net

include $(INCLUDE_DIR)/package.mk

define Package/ucode-mod-html
  SECTION:=utils
  CATEGORY:=Utilities
  TITLE:=ucode HTML utility library
  DEPENDS:=+libucode
endef

define Package/ucode-mod-html/install
	$(INSTALL_DIR) $(1)/opt/lib/ucode
	$(CP) $(PKG_BUILD_DIR)/html.so $(1)/opt/lib/ucode/
endef

define Build/Configure
endef

define Build/Compile
	$(TARGET_CC) $(TARGET_CFLAGS) -I$(STAGING_DIR)/opt/include $(TARGET_LDFLAGS) $(FPIC) \
		-Wall -ffunction-sections -Wl,--gc-sections -shared \
		-o $(PKG_BUILD_DIR)/html.so $(PKG_BUILD_DIR)/html.c
endef

$(eval $(call BuildPackage,ucode-mod-html))
