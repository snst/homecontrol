#!/usr/bin/python3
import paho.mqtt.client as mqtt
from eq3btsmart import Thermostat
import json
import yaml

with open("/home/pi/homeconfig.yml", 'r') as ymlfile:
    cfg = yaml.load(ymlfile)

base_topic = "cmd/thermostat/"


class Room:
  def __init__(self, name, mac):
    self.name = name
    self.mac = mac
    self.thermostat = Thermostat(mac)


rooms = {}


def add_room(name, mac):
    rooms[name] = Room(name, mac)


def get_room(name):
    return rooms.get(name, None)


def on_connect(mqttc, obj, flags, rc):
    print("on_connect: " + str(rc))


def thermostat_get_status(room):
    if not room:
        return
    print("get status: " + room.name)
    room.thermostat.update()
    #print("Temp: " + str(room.thermostat.target_temperature))
    #print("Valve: " + str(room.thermostat.valve_state))
    topic = "state/thermostat/" + room.name + "/status"
    msg=json.dumps({
        "temp": float(room.thermostat.target_temperature)
        , "valve":  int(room.thermostat.valve_state)
        , "mode": str(room.thermostat.mode)
        , "boost":  bool(room.thermostat.boost)
        , "lowbat": bool(room.thermostat.low_battery)
        , "room": str(room.name)
        }) 
    client.publish(topic, msg, 0, True)
    print("publish: " + topic + " " + msg)


def thermostat_set_boost(room):
    if not room:
        return
    print("set boost %s" % (room.name))
    room.thermostat.mode = 5


def thermostat_set_temp(room, temp):
    if not room:
        return
    print("set temp %s: %f" % (room.name, temp))
    room.thermostat.target_temperature = temp


def on_message(mqttc, obj, msg):
    #print("msg: %s : %f" % (msg.topic, float(pl)))
    print(msg.topic + " " + str(msg.qos) + " " + str(msg.payload))
    topic = msg.topic.split("/")
    if len(topic) != 4:
        return

    room_name = topic[2]
    cmd = topic[3]

    room = get_room(room_name)

    pl = msg.payload.decode("utf-8")

    if cmd == "status":
        if room_name == "all":
            for room in rooms.values():
                thermostat_get_status(room)
        else:
            thermostat_get_status(room)

    if cmd == "temp":
        thermostat_set_temp(room, float(pl))
        thermostat_get_status(room)
        pass

    if cmd == "boost":
        thermostat_set_boost(room)
        thermostat_get_status(room)
        pass


def on_publish(mqttc, obj, mid):
    #print("mid: " + str(mid))
    pass


def on_subscribe(mqttc, obj, mid, granted_qos):
    #print("Subscribed: " + str(mid) + " " + str(granted_qos))
    pass


def on_log(mqttc, obj, level, string):
    print(string)


add_room("living", cfg['bt']['living'])
add_room("bed", cfg['bt']['bed'])
add_room("bath", cfg['bt']['bath'])


client = mqtt.Client()
client.username_pw_set(username=cfg['mqtt']['username'],password=cfg['mqtt']['password'])
client.on_message = on_message
client.on_connect = on_connect
client.on_publish = on_publish
client.on_subscribe = on_subscribe
# client.on_log = on_log
client.connect(cfg['mqtt']['server'], 1883, 60)

#for name in rooms:
#    client.subscribe(base_topic + name + "/#", 0)
client.subscribe(base_topic + "#", 0)

client.loop_forever()