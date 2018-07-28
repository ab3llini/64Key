#
# Copyright (C) 2016-2018 64K
#
# This is free software, licensed under the GNU General Public License v2.
# See /LICENSE for more information.
#

include $(TOPDIR)/rules.mk

PKG_NAME:=64key
PKG_VERSION:=0.1
PKG_RELEASE:=1

PKG_BUILD_DIR:=$(BUILD_DIR)/bridge-utils-$(PKG_VERSION)
PKG_SOURCE:=bridge-utils-$(PKG_VERSION).tar.gz
PKG_SOURCE_URL:=@SF/bridge
PKG_MD5SUM:=9b7dc52656f5cbec846a7ba3299f73bd
PKG_CAT:=zcat

include $(INCLUDE_DIR)/package.mk

define Package/bridge
  SECTION:=base
    CATEGORY:=Network
	  TITLE:=Ethernet bridging configuration utility
	    #DESCRIPTION:=This variable is obsolete. use the Package/name/description define instead!
		  URL:=http://bridge.sourceforge.net/
		  endef

define Package/bridge/description
 Ethernet bridging configuration utility
  Manage ethernet bridging; a way to connect networks together to
   form a larger network.
   endef

define Build/Configure
  $(call Build/Configure/Default,--with-linux-headers=$(LINUX_DIR))
  endef

define Package/bridge/install
        $(INSTALL_DIR) $(1)/usr/sbin
		        $(INSTALL_BIN) $(PKG_BUILD_DIR)/brctl/brctl $(1)/usr/sbin/
				endef

$(eval $(call BuildPackage,bridge))
