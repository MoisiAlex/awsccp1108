var PerficientCCPApp = angular.module('PerficientCCPApp', ["ngRoute"]);
 //add any contact attributes to be excluded
 const CONFIG = 
          {
            "visibleCA": ["APAC_Country","APAC_Language","CallType","callPriority","routingLevel","ContactID"]
          };

PerficientCCPApp.config(["$routeProvider", "$locationProvider", "$interpolateProvider", "$sceDelegateProvider", function($routeProvider, $locationProvider, $interpolateProvider, $sceDelegateProvider) {
    $sceDelegateProvider.resourceUrlWhitelist([
        "self"
    ]);

    $interpolateProvider.startSymbol("INTERPOLATE_OPEN[");
    $interpolateProvider.endSymbol("]INTERPOLATE_CLOSE");

    $locationProvider.hashPrefix('');

    $routeProvider
        .when("/settings", {
            templateUrl: "static/partials/settings.html",
            controller: "AgentCCPUtilsController"
        })
        .when("/change-status", {
            templateUrl: "static/partials/change-status.html",
            controller: "AgentStateController"
        })
        .when("/dial-pad", {
            templateUrl: "static/partials/dial-pad.html",
            controller: "DialPadController"
        })
        .when("/quick-connects", {
            templateUrl: "static/partials/quick-connects.html",
            controller: "QuickConnectsController"
        })
        .otherwise({
            redirectTo: "/"
        })
}]);

PerficientCCPApp.run(

    function($rootScope, $interval, $sce, OutboundPhoneNumberHolder) {
        $rootScope.connectName = "equinix-amer-uat";
        $rootScope.scopeName = "$rootScope";
        console.log($rootScope.scopeName);

        $rootScope.logoutUrl = "https://" + $rootScope.connectName
          + ".awsapps.com/connect/logout";
        $sce.trustAsUrl($rootScope.logoutUrl);

        $rootScope.muteButtonActionLabel = "Mute";
        $rootScope.customerPhoneNumber = null;
        $rootScope.thirdPartyPhoneNumber = null;

        $rootScope.agentStates = "Initializing...";

        $rootScope.perm_contact = null;
        $rootScope.perm_agent = null;
        $rootScope.callConnecting = false;
        $rootScope.callConnected = false;
        $rootScope.callIsInbound = false;

        $rootScope.agentState = null;

        $rootScope.showAfterWorkCallTimer = false;

        $rootScope.timerPromise = null;

        $rootScope.customerTimerCounterSeconds = 0;
        $rootScope.thirdPartyTimerCounterSeconds = 0;
        $rootScope.afterCallWorkTimerCounterSeconds = 0;

        $rootScope.timerPromise = $interval(function() {
            $rootScope.customerTimerCounterSeconds ++;
            $rootScope.thirdPartyTimerCounterSeconds ++;
            $rootScope.afterCallWorkTimerCounterSeconds ++;
        }, 1000);

        $rootScope.setCallConnected = function(val) {
            $rootScope.callConnected = val;
            $rootScope.$apply();
        };

        $rootScope.callIsConnected = function() {
            return $rootScope.callConnected;
        };

        connect.agent(subscribeToAgentEvents);
        connect.contact(subscribeToContactEvents);

// LogMessages section display controls

const showLogsBtn = document.getElementById('showAttributes');
const showLogsDiv = document.getElementById('hiddenAttributes');
const hideLogsBtn = document.getElementById('hideAttributes');
const hideLogsDiv = document.getElementById('visibleAttributes');

showLogsBtn.addEventListener('click',replaceDisplay);
hideLogsBtn.addEventListener('click',replaceDisplay);

    function replaceDisplay(){
            showLogsDiv.style.display = showLogsDiv.style.display === 'none' ? '' : 'none';
            hideLogsDiv.style.display = hideLogsDiv.style.display === 'none' ? '' : 'none';
    }

  function logMsgToScreen(msg) {
        logMsgs.innerHTML =  new Date().toLocaleTimeString() + ' : ' + msg + '<br>' + logMsgs.innerHTML;
    }

    function logInfoMsg(msg) {
        connect.getLog().info(msg);
        logMsgToScreen(msg);
    }

    function updateContactAttribute(msg){
        const tableRef = document.getElementById('attributesTable').getElementsByTagName('tbody')[0];             
        for (let key in msg) {
            if (msg.hasOwnProperty(key) && CONFIG.visibleCA.indexOf(key)!==-1) {
                        let row = tableRef.insertRow(tableRef.rows.length);
                        let cell1 = row.insertCell(0);
                        let cell2 = row.insertCell(1);
                        cell1.innerHTML = key;
                        cell2.innerHTML = msg[key]['value'];
                }
            }
    }
        
    function clearContactAttribute(){
        let old_tbody= document.getElementById('attributesTable').getElementsByTagName('tbody')[0];
        let new_tbody = document.createElement('tbody');    
        old_tbody.parentNode.replaceChild(new_tbody, old_tbody);     
    }


        function handleAfterCallWork() {
            console.log("Handling After Call Work");
            $rootScope.agentState = "AfterCallWork";
            $rootScope.$emit("UpdateCustomerCallStatus");
            $rootScope.showAfterWorkCallTimer = true;
            $rootScope.$apply();
        }

        function handleAgentOffline() {
            console.log("agent offline");
            $rootScope.agentState = $rootScope.perm_agent.getStatus().name;
            $rootScope.$apply();
        }

        function handleAgentNotRoutable() {
            console.log("Not routable");
        }

        function handleMuteToggle(obj) {
            if (obj.muted === true) {
              $rootScope.muteButtonActionLabel = "Unmute";
            }
            else {
              $rootScope.muteButtonActionLabel = "Mute";
            }
            $rootScope.isMuted = obj.muted;
            $rootScope.$apply();
        }

        function handleAgentOnline() {
            console.log("Handling agent online");
            $rootScope.agentState = $rootScope.perm_agent.getStatus().name;
            $rootScope.showAfterWorkCallTimer = false;
            $rootScope.$emit("UpdateCustomerCallStatus");
            $rootScope.$apply();
        }

        function handleContactConnecting() {

            console.log("Handling Contact Connecting");
            $rootScope.callConnecting = true;
            $rootScope.agentState = $rootScope.getCustomerConnection().getType() === "outbound"
              ? "Outbound Call"
              : "Inbound Call";

            $rootScope.$emit("UpdateCustomerCallStatus");
            $rootScope.$apply();
        }

        function handleContactConnected() {
            console.log("Handling Contact Connected");
            $rootScope.callConnecting = false;
            $rootScope.callIsInbound = false;
            $rootScope.agentState = "Connected";
            $rootScope.setCallConnected(true);
            $rootScope.$emit("UpdateCustomerCallStatus");
            $rootScope.$apply();
        }

        function handleContactEnded() {
            console.log("Handling Contact Ended");
            $rootScope.setCallConnected(false);
            $rootScope.callConnecting = false;
            $rootScope.callIsInbound = false;
            $rootScope.$apply();
            $rootScope.perm_contact = null;
            OutboundPhoneNumberHolder.value = "";

            if ($rootScope.perm_agent.getStatus().name === "AfterCallWork") {
                $rootScope.afterCallWorkTimerCounterSeconds = 0;
            }
        }

        function handleAgentRefresh(agent) {
            if ($rootScope.perm_agent == null) {
              $rootScope.perm_agent = agent;
            }
            console.log("Handling Agent Refresh.  Status: "
              + agent.getStatus().name);

            if (agent.getStatus().name === "AfterCallWork") {
                $rootScope.afterCallWorkTimerCounterSeconds =
                    convertTime(agent.getStatusDuration());
            }

            $rootScope.$emit("UpdateAgentStatus");
            $rootScope.$apply();
        }

        function handleContactRefresh(contact) {
            console.log("Handling Contact Refresh");
            const customerConnection = $rootScope.getCustomerConnection();
            const thirdPartyConnection = $rootScope.getThirdPartyConnection();

            if (customerConnection != null) {
                $rootScope.customerTimerCounterSeconds =
                    convertTime(customerConnection.getStatusDuration());
                $rootScope.customerPhoneNumber = customerConnection != null
                    ? getFormattedPhoneNumber(customerConnection)
                    : null;
            }

            if (thirdPartyConnection != null) {
                $rootScope.thirdPartyTimerCounterSeconds =
                    convertTime(thirdPartyConnection.getStatusDuration());
                $rootScope.thirdPartyPhoneNumber = thirdPartyConnection != null
                    ? getFormattedPhoneNumber(thirdPartyConnection)
                    : null;
            }

            $rootScope.$emit("UpdateCustomerCallStatus");
            $rootScope.$apply();
        }

        function subscribeToContactEvents(contact) {
            console.log("Subscribing to contact events");
            $rootScope.perm_contact = contact;
            $rootScope.perm_contact.onConnecting(handleContactConnecting);
            $rootScope.perm_contact.onConnected(handleContactConnected);
            $rootScope.perm_contact.onEnded(handleContactEnded);
            $rootScope.perm_contact.onRefresh(handleContactRefresh);

            updateContactAttribute($rootScope.perm_contact.getAttributes());  
            logInfoMsg("New contact is from " + contact.getActiveInitialConnection().getEndpoint().phoneNumber);
            logInfoMsg("Contact is from queue " + contact.getQueue().name);    
            logInfoMsg("ContactID is " + contact.getContactId());   
            logInfoMsg("Contact attributes are " + JSON.stringify(contact.getAttributes()));
            
            if ($rootScope.perm_contact.isInbound()) {
                console.log("inbound call.");
                $rootScope.callIsInbound = true;
                console.log($rootScope.callIsInbound);
                $rootScope.$apply();
                $rootScope.$emit("UpdateCustomerCallStatus");
            }
        }

        function subscribeToAgentEvents(agent) {
            console.log("Subscribing to agent events");

            $rootScope.perm_agent = agent;
            $rootScope.agentState = $rootScope.perm_agent.getStatus().name;
            $rootScope.agentStates = $rootScope.perm_agent.getAgentStates();
            $rootScope.$apply();

            $rootScope.perm_agent.onMuteToggle(handleMuteToggle);
            $rootScope.perm_agent.onAfterCallWork(handleAfterCallWork);
            $rootScope.perm_agent.onOffline(handleAgentOffline);
            $rootScope.perm_agent.onRoutable(handleAgentOnline);
            $rootScope.perm_agent.onRefresh(handleAgentRefresh);

            $rootScope.perm_agent.isAvailable = function() {
                return this.getStatus().name === "Available";
            };

            var quickConnectsPhoneNumbers = [];
            var quickConnectsQueues = [];
            $rootScope.perm_agent.getEndpoints($rootScope.perm_agent.getAllQueueARNs(), {
                success: function(data){
                    data.endpoints.forEach(
                        function(endpoint) {
                            if (endpoint.type === "phone_number") {
                                quickConnectsPhoneNumbers.push(endpoint);
                            }
                            else {
                                quickConnectsQueues.push(endpoint);
                            }
                        }
                    );
                    $rootScope.perm_agent.quickConnectsPhoneNumbers = quickConnectsPhoneNumbers;
                    $rootScope.perm_agent.quickConnectsQueues = quickConnectsQueues;
                },
                failure:function(){
                    console.log("Failed to getEndpoints");
                }
            });
        }

        function getFormattedPhoneNumber(connection) {
          if (connection == null) {
            return null;
          }
          let phoneNumber = connection.getEndpoint().phoneNumber;
          return phoneNumber.includes("sip")
            ? phoneNumber.split(":")[1].split("@")[0]
            : phoneNumber;
            // When contact is outbound, its endpoint phone number is in the format sip:+15416222013@lily-outbound, hence the need to do all this splitting.
        }

        function convertTime(milliseconds) {
            return Math.round(milliseconds / 1000);
        }

        $rootScope.getCustomerConnection = function() {
          return $rootScope.perm_contact != null
            ? $rootScope.perm_contact.getInitialConnection()
            : null;
        };

        $rootScope.getThirdPartyConnection = function() {
          return $rootScope.perm_contact != null
            ? $rootScope.perm_contact.getSingleActiveThirdPartyConnection()
            : null;
        };

        $rootScope.isDeskphoneEnabled = function() {
            if ($rootScope.perm_agent === null) {
              return false;
            }
            return !$rootScope.perm_agent.getConfiguration().softphoneEnabled;
        };

        $rootScope.isAgentLoggedIn = function() {
          return $rootScope.perm_agent != null;
        }

        $rootScope.loginUrl =
          "https://" + $rootScope.connectName + ".awsapps.com/connect/login";

        $rootScope.openLoginPage = function() {
          window.open($rootScope.loginUrl);
        }
    }
);


PerficientCCPApp.filter('formatTimer', function() {

    return function(input) {
        function pad(n) {
            return (n < 10 ? '0' : '') + n;
        }
        var seconds = input % 60;
        var minutes = Math.floor(input / 60);
        var hours = Math.floor(minutes / 60);
        return (pad(hours) + ':' + pad(minutes)+ ':' + pad(seconds));
    };
});
