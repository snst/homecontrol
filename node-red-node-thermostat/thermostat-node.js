/**
 * Copyright 2018 Seth350
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 **/

module.exports = function(RED) {

    // var settings = RED.settings;  // optional - only needed if required later

    function HTML(config) {
        var configAsJson = JSON.stringify(config);
        //debugger;
        var html = String.raw`
        <p ng-init='init(` + configAsJson + `)'> </p>
        <md-button ng-click="send({topic: 'cmd/thermostat/`  + config.roomTopic + `/status', payload: '0'})">` + config.roomLabel  + `</md-button>
        <md-slider md-discrete="" step="0.5" min="14" max="24" ng-model="t_slider_temp" ng-change="change_temp()"></md-slider>
        <md-card layout="row"><p class="label">Temp: {{t_temp}}</p></md-card>
        <md-card layout="row"><p class="label">Valve: {{t_valve}}</p></md-card>
        <md-card layout="row"><p class="label">Mode: {{t_mode}}</p></md-card>
        <md-card layout="row"><p class="label">Boost: {{t_boost}}</p></md-card>
        <md-card layout="row"><p class="label">Bat: {{t_lowbat}}</p></md-card>
        <span class="material-icons" ng-show="t_lowbat==true">battery_alert</span>
        <span class="material-icons" ng-show="t_lowbat==false">battery_full</span>
        `;
        return html;
    };

    function checkConfig(node, conf) {
        if (!conf || !conf.hasOwnProperty("group")) {
            node.error(RED._("ui_thermostat-node.error.no-group"));
            return false;
        }
        return true;
    }

    var ui = undefined;

    function ThermostatNode(config) {
        try {
            var node = this;
            if(ui === undefined) {
                ui = RED.require("node-red-dashboard")(RED);
            }
            RED.nodes.createNode(this, config);

            //debugger;

            if (checkConfig(node, config)) {
                var html = HTML(config);                    // *REQUIRED* !!DO NOT EDIT!!
                var done = ui.addWidget({                   // *REQUIRED* !!DO NOT EDIT!!
                    node: node,                             // *REQUIRED* !!DO NOT EDIT!!
                    order: config.order,                    // *REQUIRED* !!DO NOT EDIT!!
                    group: config.group,                    // *REQUIRED* !!DO NOT EDIT!!
                    width: config.width,                    // *REQUIRED* !!DO NOT EDIT!!
                    height: config.height,                  // *REQUIRED* !!DO NOT EDIT!!
                    format: html,                           // *REQUIRED* !!DO NOT EDIT!!
                    templateScope: "local",                 // *REQUIRED* !!DO NOT EDIT!!
                    emitOnlyNewValues: false,               // *REQUIRED* Edit this if you would like your node to only emit new values.
                    forwardInputMessages: false,            // *REQUIRED* Edit this if you would like your node to forward the input message to it's ouput.
                    storeFrontEndInputAsState: false,       // *REQUIRED* If the widgect accepts user input - should it update the backend stored state ?

                    convertBack: function (value) {
                        return value;
                    },

                    beforeEmit: function(msg, value) {
                        return { msg: msg };
                    },

                    beforeSend: function (msg, orig) {
                        if (orig) {
                            return orig.msg;
                        }
                    },

                    initController: function($scope, events) {
                        //debugger;

                        $scope.flag = true;

                        $scope.init = function (config) {
                            $scope.config = config;
                        };
                        $scope.$watch('msg', function(msg) {
                            if (!msg) { return; } 
                            if (msg.payload.room != $scope.config.roomTopic) { return; }
/*
                            var tt;
                            tt = document.getElementById("temp_"+$scope.$eval('$id'));
                            $(tt).html(msg.payload.temp);
*/
                            //debugger;
                            $scope.t_temp = msg.payload.temp;
                            $scope.t_slider_temp = msg.payload.temp;
                            $scope.t_valve = msg.payload.valve;
                            $scope.t_mode = msg.payload.mode;
                            $scope.t_boost = msg.payload.boost;
                            $scope.t_lowbat = msg.payload.lowbat;
                        });

                        $scope.change_temp = function() {
                            //debugger;
                            $scope.send({topic: 'cmd/thermostat/'  + $scope.config.roomTopic + '/temp', payload: $scope.t_slider_temp});
                        };
                    }
                });
            }
        }
        catch (e) {
            // eslint-disable-next-line no-console
            console.warn(e);
        }

        node.on("close", function() {
            if (done) {
                done();
            }
        });
    }

    RED.nodes.registerType("ui_thermostat-node", ThermostatNode);
}
