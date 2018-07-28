#!/bin/bash
git clone https://github.com/openwrt/openwrt.git
cd openwrt
cp ../diffconfig .config
ln -s ../files files
ln -s ../../../../64key package/network/services
./scripts/feeds update -a
./scripts/feeds install -a
make defconfig
