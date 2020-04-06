/*var hostname = "";
var port = 37695;
var username = "";
var password = "";
var clientId = "";*/

var base_topic = "cmd/thermostat/";

clientId += new Date().getUTCMilliseconds();
var subscription = "state/#";

mqttClient = new Paho.MQTT.Client(hostname, port, clientId);
mqttClient.onMessageArrived = message_arrived;
mqttClient.onConnectionLost = connection_lost;

var temp_map = {};
var thermostat_timer = null;
var temp_cmd = null;
var temp_src = null;


function log_mqtt(str) {
	SetCell("cmd", str);
}

function SendMqtt(path, value) {
	var message = new Paho.MQTT.Message(value);
	message.destinationName = path;
	mqttClient.send(message);
	log_mqtt(path + " " + value);
	console.log(path + " " + value);
};

function HandleClick(ioname, path, value) {
	var cell = document.getElementById(ioname)
	if (cell) {
		cell.addEventListener("click",
			function () {
				SendMqtt(path, value)
			},
			true);
	}
}


function SetCell(name, value) {
	var cell = document.getElementById(name);
	if (cell) {
		cell.textContent = value;
	}
}

function Connect() {

	mqttClient.connect({
		onSuccess: connected,
		onFailure: connection_failed,
		keepAliveInterval: 60,
		cleanSession: true,
		userName: username,
		useSSL: true,
		password: password
	});
}

function connected() {
	console.log("Connected");
	set_connected_status(true);
	mqttClient.subscribe(subscription);
}

function connection_failed(res) {
	set_connected_status(false);
	console.log("Connect failed:" + res.errorMessage);
}

function connection_lost(res) {
	if (res.errorCode != 0) {
		set_connected_status(false);
		console.log("Connection lost:" + res.errorMessage);
		Connect();
	}
}

function set_connected_status(connected) {
	var element = document.querySelector("#connect_status");
	if (connected)
		element.className = "mif mif-cloud-upload";
	else
		element.className = "mif mif-cloud3";
}

function set_innerHTML(selector, value) {
	var element = document.querySelector(selector);
	if (element)
		element.innerHTML = value;
}

function set_style_display(selector, value) {
	var element = document.querySelector(selector);
	if (element)
		element.style.display = value;
}

function set_thermostat_temp_state(room, set_val) {
	if (set_val)
		$("#" + room + " #temp").addClass("fg-dark");
	else
		$("#" + room + " #temp").removeClass("fg-dark");
}

function set_thermostat_icon(room, item, val) {
	var element = $("#" + room + " #" + item);
	if (val)
		element.show();
	else
		element.hide();
}

function set_thermostat_status(obj) {
	temp_map[obj.room] = obj.temp;
	set_innerHTML("#" + obj.room + " #temp", obj.temp);
	set_innerHTML("#" + obj.room + " #valve", obj.valve);
	set_thermostat_temp_state(obj.room, false);

	set_thermostat_icon(obj.room, "lowbat", obj.lowbat);
	set_thermostat_icon(obj.room, "boost", obj.boost);
}

function set_element_status(obj, name, unit, digits) {
	var element = document.querySelector("#" + obj.room + " #" + name);
	if (element) {
		element.innerHTML = obj[name].toFixed(digits);
	}
}

function set_sensor_status(obj) {
	set_element_status(obj, "temperature", "°", 1);
	set_element_status(obj, "humidity", "%", 0);
	set_element_status(obj, "windspeed", "km/h", 0);
	set_element_status(obj, "pressure", "hPa", 0);
}

function set_switch_status(obj) {
	var element = document.querySelector("#" + obj.room);
	if (element) {
		if (obj.on)
			$("#" + obj.room + " #icon").addClass("fg-yellow");
		else
			$("#" + obj.room + " #icon").removeClass("fg-yellow");
	}
}

function message_arrived(message) {
	payload = message.payloadString;
	topic = message.destinationName;
	console.log(topic + " : " + payload);
	var obj = JSON.parse(payload);

	SetCell("payload", topic + " : " + payload);
	if (topic.startsWith("state/thermostat/")) {
		set_thermostat_status(obj);
	}
	else if (topic.startsWith("state/sensor/")) {
		set_sensor_status(obj);
	}
	else if (topic.startsWith("state/switch/")) {
		set_switch_status(obj);
	}
}

function toggle_button(event) {
	event.preventDefault(); // To prevent following the link (optional)
	var payload = "off";
	if (event.target.checked)
		payload = "on";
	var id = event.target.id;
	var topic = "cmnd/" + id + "/power";
	SendMqtt(topic, payload);
}

function set_thermostat_temp(room, value) {
	SendMqtt(base_topic + room + "/temp", value);
}

function set_thermostat_boost(room) {
	SendMqtt(base_topic + room + "/boost", "");
}

function query_thermostat_status(room) {
	SendMqtt(base_topic + room + "/status", "");
}

function handle_thermostat_tile(room, cmd) {
	clearTimeout(thermostat_timer);

	var delta = 0;
	if (cmd == "left")
		delta = -0.5;
	else if (cmd == "right")
		delta = 0.5;
	else if (cmd == "top")
		thermostat_timer = setTimeout(set_thermostat_boost, 100, room);
	else if (cmd == "bottom") {
		set_thermostat_temp_state(room, true);
		thermostat_timer = setTimeout(query_thermostat_status, 100, room);
	}


	if (delta != 0) {
		var n = temp_map[room] + delta;
		temp_map[room] = n;
		set_innerHTML("#" + room + " #temp", n.toString());
		set_thermostat_temp_state(room, true);
		thermostat_timer = setTimeout(set_thermostat_temp, 1000, room, n.toString());
	}
}


function check_tile_event(event) {
	if (event instanceof Event) {
		if (event.detail)
			if (event.detail.side) {
				temp_cmd = event.detail.side;
				temp_src = event.srcElement.id;
			}
		//console.log(event.detail.side);
	}

	if (event instanceof MouseEvent) {
		return true;
	}
	return false;
}

function thermostat_tile_clicked(event) {
	if (check_tile_event(event)) {
		handle_thermostat_tile(temp_src, temp_cmd);
	}
}

function preset_tile_clicked(event) {
	if (check_tile_event(event)) {
		SendMqtt("cmd/preset", temp_src);
	}
}

function switch_tile_clicked(event) {
	if (check_tile_event(event)) {
		SendMqtt("cmnd/" + temp_src + "/power", "toggle");
	}
}


function init() {

	$('.thermostat_tile').on("click", function (event) { thermostat_tile_clicked(event) });
	$('.preset_tile').on("click", function (event) { preset_tile_clicked(event) });
	$('.switch_tile').on("click", function (event) { switch_tile_clicked(event) });

	Connect();
}