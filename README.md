## Goals of the project
This project aims to make a device useful to chat and transfer files between computers in a context where there aren't other easy ways to do so.
Such a context could be a university lab, since you can't install software on the lab's computer, nor you want to do a login in a website.

## Implementation
Since we can't install software or drivers on the computer, the device acts as a USB-to-Ethernet adapter and makes a web interface available to the computer. It does also host a WebSocket server to communicate in real-time with the client.
Each device can talk with each other through a mesh network.

# Table of Contents
1. [Hardware](#hardware)
2. [Operating system](#operating-system)
3. [Gadget mode script](#gadget-mode-script)
4. [Python application](#python-application)
5. [Building a 64Key image](#building)

## Hardware
### System on a Chip
There aren't many options to choose from for the hardware, since it must have the following features:
* USB peripheral configurable in slave mode
* Integrated Wi-Fi to establish a network with other devices
* Ethernet and serial ports, just to be able to flash a new firmware during development
* All the features above must actually work under Linux
* Small form factor
* Not too expensive

The only platform with all those features is the [AR9331 SoC](https://www.openhacks.com/uploadsproductos/ar9331_datasheet.pdf), and there are some boards on the market based on this chip. They usually ship with 16 MB of [SPI flash memory](https://www.winbond.com/resource-files/w25q128bv_revh_100313_wo_automotive.pdf) (the maximum supported) and 64 MB of DDR2 RAM, some of them are:
* Carambola2 (http://www.8devices.com/products/carambola-2)
* Arduino Industrial 101 (http://www.arduino.org/products/boards/arduino-industrial-101)

It must be noted that to be able to configure the USB peripheral in device mode, the pin GPIO13 must be tied low at device boot, but some boards
do not make it available in the headers and they need a bit of soldering.

Example: Industrial 101
![Wire soldered from GPIO13 to the nearest ground](../img/board-101-mod.jpg)

![Wire soldered from GPIO13 to the nearest ground](../img/board-101-mod-zoom.jpg)

### Bootloader and flash memory

The flash memory is divided in 64 KB blocks, for a total of 256 individually addressable blocks. It is accessible at addresses between 0x9f000000 and 0x9fffffff (inclusive), and it's usually divided into partitions as summarized by the following table:

Start address |   Size (hex)  | Blocks | Description
--------------|---------------|--------|------------
  0x9F000000  |   0x040000    |     4  | Bootloader (U-Boot)
  0x9F040000  |   0x010000    |     1  | Bootloader enviroinment variables
  0x9F050000  |   0x150000    |    21  | Linux kernel in uImage format
  0x9F1A0000  |   0xE50000    |   229  | Linux root in squashfs format
  0x9FFF0000  |   0x010000    |     1  | ART partition

**The first two partitions and the ART partition must NEVER be erased / overwritten.** The ART partition contains Wi-Fi calibration data specific for the single SoC.

When the board is powered up, the bootloader starts and it's output is available on the serial interface (8N1, 115200 baud).
If a specific string is sent over the serial line (usually `\n`, but `lin` on this board), you can access the bootloader's shell:
```
U-Boot 1.1.5-linino-g2996c856-dirty (Oct  2 2015 - 17:52:14)

Linino Board (ar9331) U-boot
DRAM:  64 MB
Top of RAM usable for U-Boot at: 84000000
Reserving 218k for U-Boot at: 83fc8000
Reserving 192k for malloc() at: 83f98000
Reserving 44 Bytes for Board Info at: 83f97fd4
Reserving 36 Bytes for Global Data at: 83f97fb0
Reserving 128k for boot params() at: 83f77fb0
Stack Pointer at: 83f77f98
Now running in RAM - U-Boot at: 83fc8000
Flash Manuf Id 0xef, DeviceId0 0x40, DeviceId1 0x18
flash size 16777216, sector count = 256
Flash: 16 MB
In:    serial
Out:   serial
Err:   serial
Net:   eth0: b4:21:8a:00:00:00
eth1: b4:21:8a:00:00:01
eth0, eth1
autoboot in 4 seconds (stop with 'lin')...
linino>
```
This shell has to be used to download a new firmware on the board withouth a working OS (through the Ethernet connection).
It's also useful to set the memory boot address of the kernel (wich must be the start of the kernel partition).

* To load a new firmware from a TFTP server at 192.168.1.2:
```
linino> setenv ipaddr '192.168.1.245'
linino> setenv serverip '192.168.1.2'
linino> tftp 0x80060000 openwrt-trunk-ar71xx-generic-carambola2-squashfs-sysupgrade.bin;
linino> erase 0x9f050000 +0xf90000;
linino> cp.b $fileaddr 0x9f050000 $filesize;
```
* To set the boot address:
```
linino> setenv bootcmd 'bootm 0x9F050000;'
linino> saveenv
Saving Environment to Flash...
Protect off 9F040000 ... 9F04FFFF
Un-Protecting sectors 4..4 in bank 1
Un-Protected 1 sectors
Erasing Flash...Erase Flash from 0x9f040000 to 0x9f04ffff in Bank # 1
First 0x4 last 0x4 sector size 0x10000                                                                                                                                                                            4
Erased 1 sectors
Writing to Flash... write addr: 9f040000
done
Protecting sectors 4..4 in bank 1
Protected 1 sectors
linino>
```


The manual for each shell command is available here: http://www.denx.de/wiki/view/DULG/Manual

List of all available commands on the Arduino 101:
```
linino> help
?       - alias for 'help'
autoscr - run script from memory
base    - print or set address offset
bdinfo  - print Board Info structure
boot    - boot default, i.e., run 'bootcmd'
bootd   - boot default, i.e., run 'bootcmd'
bootelf - Boot from an ELF image in memory
bootm   - boot application image from memory
bootp   - boot image via network using BootP/TFTP protocol
bootvx  - Boot vxWorks from an ELF image
cmp     - memory compare
coninfo - print console devices and information
cp      - memory copy
crc32   - checksum calculation
dhcp    - invoke DHCP client to obtain IP/boot params
echo    - echo args to console
erase   - erase FLASH memory
ethreg    - S26 PHY Reg rd/wr  utility
exit    - exit script
flinfo  - print FLASH memory information
go      - start application at address 'addr'
help    - print online help
iminfo  - print header information for application image
imls    - list all images found in flash
itest   - return true/false on integer compare
loadb   - load binary file over serial line (kermit mode)
loads   - load S-Record file over serial line
loady   - load binary file over serial line (ymodem mode)
loop    - infinite loop on address range
md      - memory display
mii     - MII utility commands
mm      - memory modify (auto-incrementing)
mtest   - simple RAM test
mw      - memory write (fill)
nfs     - boot image via network using NFS protocol
nm      - memory modify (constant address)
ping    - send ICMP ECHO_REQUEST to network host
printenv- print environment variables
progmac - Set ethernet MAC addresses
protect - enable or disable FLASH write protection
rarpboot- boot image via network using RARP/TFTP protocol
reset   - Perform RESET of the CPU
run     - run commands in an environment variable
saveenv - save environment variables to persistent storage
setenv  - set environment variables
sleep   - delay execution for some time
test    - minimal test like /bin/sh
tftpboot- boot image via network using TFTP protocol
version - print monitor version
linino>
```

## Operating system
The SOM9331 module now runs mainline OpenWRT

See __Building__ section for details on how to compile an image.

#### Initial software version

The device runs a patched version of OpenWRT with support for USB gadget mode
 on the AR9331, wich is available at this repository: https://github.com/neykov/chipidea-openwrt/tree/chipidea-device

To obtain the firmware image, the OS must be compiled from sources. A detailed howto is available at this link: https://wiki.openwrt.org/doc/howto/build

Brief list of steps to build the firmware:

* Clone the repository and update the list of available packages.
  All the following steps must be executed while being inside the build root.
```
git clone https://github.com/neykov/chipidea-openwrt --branch chipidea-device
cd chipidea-device
./scripts/feeds update -a
./scripts/feeds install -a
```
* Write the current timestamp in a version.date file, otherwise `make` will fail
```
date +%s > version.date
```
* Move all the files in the `openwrt_buildroot` directory of this project in the `files` directory. In this way, those files will be included in the firmware image.
```
mkdir files
cp -r -T /path/to/this/repo/openwrt_buildroot ./files
```
* Copy the build configuration. It can be edited with `make menuconfig`.
```
cp /path/to/this/repo/.config ./
```
* Start the compilation with make. It will take many hours.
```
make
```

Now, you can write the file located at `<buildroot dir>/bin/ar71xx/openwrt-ar71xx-generic-carambola2-squashfs-sysupgrade.bin` on the memory of the device at the address `0x9F050000`.

## Gadget mode script
The USB peripheral of the AR9331 is set as a USB slave by the `/etc/init.d/usb_configfs` script.
It does configure the device as a composite device, that acts at the same time as:

* RNDIS Ethernet adapter, to create a network connection on Windows devices. Windows just checks the first configuration of the device, so this has to be the first to be set by the script.
* CDC Ethernet adapter, same as above but needed on Mac OS hosts.
* mass storage device: to make available an HTML redirect page to the user, redirecting him to the web GUI.

On Linux computers, both the RNDIS and the CDC driver works.

## Network v1
This is the initial network architecture, that will be kept for the first demo, and replaced in the future with a more flexible one.

It is composed of the following networks:

* connection from host to 64Key via USB-ethernet gadget, IPv4 addressing
* connection between 64keys via WiFi mesh (batman protocol), IPv4 addressing
* no direct forwarding between the two networks

The host-64key interface is used only for accessing the web interface, and the communication between web applications running on each key is handled by a python application.
### Python application

The Python application running on the device acts as a bridge between the mesh network and the web GUI.

It uses Avahi to discover other devices on the network, and it does open a WebSocket connection with every device found (it doesn't use raw TCP sockets since a WebSocket library has been already included in the project and they provide message delimitation).

Every device has an unique identifier (UID), an username and a list of available services. The main goal of the application is to receive data (JSON objects) from the GUI, check the `to` field (wich is the UID of the recipient), and forward the object in the `data` field to the right device.
Vice versa, it can also receive data from the other peers, and forward it to the GUI. The application does not change in any way the objects received, so the GUI is free to implement any kind of feature without having to change the Python code.
By default, the UID is the IP address of the device. It has to be hardcoded for each device before flashing the firmware by editing the /etc/config/network file.

#### Start the application
Just `cd` to the folder containing `__main__.py` and run:
```
python3 .
```
## Network v2
The new network architecture has the purpose of giving access to the mesh network between 64keys directly from the network-over-usb interface.
Moreover it will cover the issues of addressing and network discovery

It is composed of the following networks:

* connection from host to 64Key via USB-ethernet gadget
* connection between 64keys via WiFi mesh (batman protocol), IPv6 link-local addressing (address derived from unique MAC address)
* bridge on each 64key between the two networks; the IPv6 link-local address should be visible on the USB-network interface.

The adoption of IPv6 addressing solves the problem of giving an __unique network address__ to each 64key in a non trivial network, in fact a link-local IPv6 address can be derived from a unique MAC address and be therefore unique on the network.

Having an IPv6 address belonging to the mesh network accessible on the host USB interface should also make less necessary the (inefficient) message passing by the python application.

So the tasks left for an application running on the 64key will be:

* neighbour discovery (possibly getting the information from the lower network layers)
* others...

## Building

#### Note: the diffconfig contains just the lines to be changed w.r.t the default configuration, this makes it more readable and portable across versions.

To build a 64Key image we need to clone this repo and then launch `bootstrap.sh`
that will take care of:
- cloning the openwrt repository
- copy the diffconfig into openwrt/.config
- create symlinks of this repo into it.
- launch the openwrt `feeds` scripts to prepare the build system

```
git clone git@bitbucket.org:neslabpolimi/64key.git
cd 64key
./bootstrap.sh
```

If you have setup this build system a while ago you need to update the openwrt source and packages

```
cd openwrt
git pull
./scripts/feeds update -a
./scripts/feeds install -a
```

Now we need to expand the `diffconfig` file into a full `.config`

```
make defconfig
```

Then we need to launch the `menuconfig`,
Leaving the default options will create a working image.

```
make menuconfig
<select SAVE>
```

An then start the building process in the background:

```
ionice -c 3 nice -n19 make -j5
```

You can find the resulting image in `openwrt/bin/targets/ar71xx/generic/openwrt-ar71xx-generic-som9331-squashfs-sysupgrade.bin`

### Adding new options to the upstream 64Key openwrt configuration
To add new options to the openwrt build, after doing the configuration with `make menuconfig`, we can generate the new `diffconfig` file with the new options added:
```
cd openwrt
./scripts/diffconfig.sh > ../newdiffconfig
cd ..
mv newdiffconfig diffconfig
```

## Flashing the image on the 64key
To flash an image on the 64Key you need first to copy it from your computer
to the 64Key.
It is recommended to copy the image in `/tmp` that is mounted in RAM (64MB), to 
avoid filling up the flash (8MB)

On the coputer:
```
scp openwrt-64key-sysupgrade.bin root@192.168.64.1:/tmp`
```

On the 64Key:
```
cd /tmp
sysupgrade -n openwrt-64key-sysupgrade.bin
```
__Don't plug off the 64key while is updating the firmware__

### Notes

The `-n` option is to avoid backup and restore of current configuration

If you are using a SOM9331 module running the factory image (openwrt Attitude Adjustment),
you need to use the `-F` flag because the BOARD ID from factory needs to be updated
```
sysupgrade -n -F openwrt-64key-sysupgrade.bin
```
