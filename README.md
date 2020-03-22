# homecontrol
Raspbian Buster Lite: https://www.raspberrypi.org/downloads/raspbian/
https://www.balena.io/etcher/

add empty in boot:
shh

edit /etc/wpa_supplicant/wpa_supplicant.conf
country=DE
ctrl_interface=DIR=/var/run/wpa_supplicant GROUP=netdev
update_config=1

network={
    ssid="SSID"
    psk="PW"
}

login via ssh: pi/raspberry

sudo apt update
sudo apt full-upgrade
sudo reboot
sudo raspi-config
Localisation Options => Europe/Berlin
Advanced Options => Expand Filesystem
sudo halt

install node red:
bash <(curl -sL https://raw.githubusercontent.com/node-red/raspbian-deb-package/master/resources/update-nodejs-and-nodered)

node-red-start

https://<ip/host>:1880

sudo systemctl enable nodered.service (Created symlink /etc/systemd/system/multi-user.target.wants/nodered.service → /lib/systemd/system/nodered.service.)

sudo service nodered restart
sudo service nodered stop
sudo service nodered start

install:
node-red-dashboard
node-red-contrib-sonoff-tasmota-enhanced 3.1.2

passwordless ssh access on host: https://www.raspberrypi.org/documentation/remote-access/ssh/passwordless.md
install mosquitto: https://randomnerdtutorials.com/how-to-install-mosquitto-broker-on-raspberry-pi/

sudo apt-get install ir-keytable


/lib/systemd/system/ir-remote-setup.service
[Unit]
Description=setup ir remote

[Service]
Type=oneshot
ExecStart=sudo ir-keytable -c -p NEC

[Install]
WantedBy=multi-user.target

sudo systemctl enable ir-remote-setup
sudo systemctl start ir-remote-setup

show ir code: sudo ir-keytable -c -p all -t


sudo apt-get install python3-pip
pip3 install evdev
pip3 install paho-mqtt
pip3 install pyyaml
pip3 install construct
pip3 install bluepy


