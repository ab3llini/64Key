#!/bin/bash
git clone https://github.com/openwrt/openwrt.git
cd openwrt
ln -s ../.config .config
ln -s ../files files
./scripts/feeds update -a
./scripts/feeds install -a
make defconfig
