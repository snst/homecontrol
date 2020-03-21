#!/usr/bin/python3
import evdev
import paho.mqtt.client as mqtt
import paho.mqtt.publish as publish
import yaml

with open("../homeconfig.yml", 'r') as ymlfile:
    cfg = yaml.load(ymlfile)

devices = [evdev.InputDevice(path) for path in evdev.list_devices()]
device = evdev.InputDevice('/dev/input/event0')

state_topic = 'ir'

client = mqtt.Client("ir-client")
client.username_pw_set(username=cfg['mqtt']['username'],password=cfg['mqtt']['password'])
client.connect(cfg['mqtt']['server'], 1883, 60)
client.loop_start()

for event in device.read_loop():
  if event.value>0 and event.value < 999999:
    print(event.value)
    client.publish(state_topic, event.value)
