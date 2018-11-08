PerficientCCPApp.controller("CallController", function($scope, $rootScope, $interval,
  OutboundPhoneNumberHolder, CountryCodesHolder) {
  $scope.thisControllerName = "CallController";

  $scope.OutboundPhoneNumberHolder = OutboundPhoneNumberHolder;
  $scope.countryCode = "+1";
  $scope.callableCountries = CountryCodesHolder.value.callableCountries;
  $scope.countryCodesToDialCodes =
    CountryCodesHolder.value.countryCodesToDialCodes;
  $scope.countryISOCodesToCountryNames =
    CountryCodesHolder.value.countryISOCodesToCountryNames;
  $scope.countryNamesToCountryISOCodes =
    CountryCodesHolder.value.countryNamesToCountryISOCodes;

  $scope.holdCustomerButtonActionLabel = "";
  $scope.holdAllButtonActionLabel = "";
  $scope.disableCallButtons = false;

  $scope.isCustomerOnHold = function() {
    if ($rootScope.perm_contact === null) {
      return false;
    }
    const customerConnection = $rootScope.getCustomerConnection();
    return customerConnection != null ? customerConnection.isOnHold() :
      false;
  }

  $scope.isThirdPartyOnHold = function() {
    if ($rootScope.perm_contact === null) {
      return false;
    }
    const thirdParyConnection = $rootScope.getThirdPartyConnection();
    return thirdParyConnection != null ? thirdParyConnection.isOnHold() :
      false;
  }

  $scope.connectedThirdParty = function() {
    return $rootScope.getThirdPartyConnection() != null;
  }

  $scope.holdCustomerButtonActionLabel = $scope.isCustomerOnHold()
      ? "Resume"
      : "Hold";

  $scope.customerCallStatus = $scope.isCustomerOnHold()
    ? "On Hold"
    : $rootScope.agentState;

  $scope.thirdPartyCallStatus = $scope.isThirdPartyOnHold()
    ? "On Hold"
    : $rootScope.agentState;

  $rootScope.$on("MakingOutboundCall", function(event, data) {
    console.log("Received emission MakingOutboundCall");
    if ($rootScope.perm_contact && $rootScope.perm_contact.isConnected()) {
      $scope.transferToNumber();
    } else if (data) {
      $scope.sendCall(data);
    } else {
      $scope.sendCall();
    }
  });
  $rootScope.$on("TransferToOrCallQuickConnect", function(event, data) {
    $scope.callOrTransferToQuickConnect(data);
  });
  $rootScope.$on("HoldOrResumeCall", function() {
    $scope.holdOrResumeCustomerCall()
  });
  $rootScope.$on("MuteOrUnmute", function() {
    $scope.muteOrUnmuteAgent();
  });
  $rootScope.$on("EndCall", function() {
    $scope.hangUpAgent();
  });
  $rootScope.$on("AnsweringCall", function() {
    $scope.answerCall();
  });
  $rootScope.$on("SendToSurvey", function() {
    $scope.transferToQueueAndEndCall();
  });
  $rootScope.$on("SwapActiveCalls", function() {
    $scope.swapActiveCalls();
  });
  $rootScope.$on("AllHoldOrAllResume", function() {
    $scope.allHoldOrAllResume();
  });
  $rootScope.$on("JoinCalls", function() {
    $scope.mergeActiveCalls();
  });
  $rootScope.$on("UpdateCustomerCallStatus", function() {
    $scope.updateCustomerCallStatus();
  });

  $rootScope.$on("UpdateAgentStatus", function() {
    $scope.updateAgentStatus();
  });

  $rootScope.$on("UpdateAgentStatus", function() {
    $scope.updateAgentStatus();
  });

  $scope.numberIsValid = function() {
    return $scope.OutboundPhoneNumberHolder.value.trim().length !== 0
      // This is the only validation logic for outbound phone numbers in the default CCP.
  };

  $scope.connectAgent = function(endpoint) {
    $rootScope.perm_agent.connect(endpoint, {
      success: function() {
        console.log("Successfully sent outbound call");
      },
      failure: function(err) {
        console.log("Failed to send outbound call");
        console.log(err);
      }
    });
  };

  $scope.callOrTransferToQuickConnect = function(endpoint) {
    if ($rootScope.perm_contact && $rootScope.perm_contact.isConnected()) {
      console.log("Adding connection to Contact");
      $scope.addConnectionToContact(endpoint);
    } else {
      $scope.sendCall(endpoint.phoneNumber);
    }
  };

  $scope.transferToNumber = function() {
    if ($scope.numberIsValid(OutboundPhoneNumberHolder.value)) {
      const endpoint = connect.Endpoint.byPhoneNumber(
        OutboundPhoneNumberHolder.value);
      const successCallback = function(data) {
        console.log("Transfering to number");
        $scope.$apply()
      }.bind($scope);
      $scope.addConnectionToContact(endpoint, successCallback);
    }
  };

  $scope.sendCall = function(number = null) {
    console.log("Sending call");
    if (number) {
      $scope.OutboundPhoneNumberHolder.value = number;
    }
    if ($scope.numberIsValid($scope.OutboundPhoneNumberHolder.value)) {
      let endpoint = connect.Endpoint.byPhoneNumber($scope.OutboundPhoneNumberHolder
        .value);
      $scope.connectAgent(endpoint);
      $scope.OutboundPhoneNumberHolder.value = "";
    }
  };

  $scope.answerCall = function() {
    console.log("Answering call");
    $rootScope.perm_contact.accept({
      success: function(data) {
        console.log("Successfully answered call.");
        console.log(data);
      },
      failure: function(data) {
        console.log("Failed to answer the call.");
        console.log(data);
      }
    })
  };

  $scope.hangUpAgent = function() {
    if ($rootScope.perm_contact.getAttributes().give_survey !== undefined) {
      if ($rootScope.perm_contact.getAttributes().give_survey.value ===
        "true") {
        $scope.transferToQueueAndEndCall();
      }
    } else {
      console.log("Ending call");
      $rootScope.perm_contact.getAgentConnection().destroy();
    }

    $rootScope.customerTimerCounterSeconds = 0;
    $rootScope.thirdPartyTimerCounterSeconds = 0;
  };

  /* Customer Methods */
  $scope.hangUpCustomer = function() {
    $rootScope.getCustomerConnection().destroy({
      success: function() {
        console.log("Customer hung up by agent")
      },
      failure: function() {
        console.log("Agent failed to hang up customer.");
      }
    });
  };

  $scope.hangUpThirdParty = function() {
    var thirdParty = $rootScope.getThirdPartyConnection();
    if (!thirdParty) {
      return;
    }
    thirdParty.destroy({
      success: function() {
        console.log("Hung up third party");
        $rootScope.$apply();
      },
      failure: function() {
        console.log("Failed to hang up third party");
      }
    });
  };

  $scope.addConnectionToContact = function(endpoint, success) {
    if (success == undefined) {
      success = function(data) {
        console.log("transfer success");
      }
    }
    $rootScope.perm_contact.addConnection(endpoint, {
      success: success,
      failure: function(err, data) {
        console.log(err);
        console.log(data);
        console.log("transfer failed");
      }
    });
  };

  $scope.resumeThirdParty = function() {
    console.log("resuming thirdParty");
    var thirdParty = $rootScope.perm_contact.getThirdPartyConnections().filter(
      function(conn) {
        return conn.isActive();
      })[0];
    thirdParty.resume({
      success: function() {
        $rootScope.thirdPartyTimerCounterSeconds = 0;
        console.log("Resumed third party");
      },
      failure: function() {
        console.log("Failed to resume third party");
      }
    });
  };

  $scope.resumeCustomer = function() {
    console.log("Resuming customer");
    $rootScope.getCustomerConnection().resume({
      success: function() {
        $rootScope.customerTimerCounterSeconds = 0;
        console.log("Resumed customer");
      },
      failure: function() {
        console.log("Failed to resume customer")
      }
    });
  };

  $scope.transferToQueueAndEndCall = function() {
    const definedEndpoint = {
      "agentLogin": null,
          "endpointARN": "arn:aws:connect:us-east-1:264599287113:instance/1c8dcab5-ddf8-4c39-9054-4910a71f82c1/transfer-destination/feebcf24-6a21-432d-adfe-9de623f0c9ba",
          "endpointId": "arn:aws:connect:us-east-1:264599287113:instance/1c8dcab5-ddf8-4c39-9054-4910a71f82c1/transfer-destination/feebcf24-6a21-432d-adfe-9de623f0c9ba",
          "name": "SurveyTransfer",
      "queue": null,
      "type": "queue"
    }
    var success = function(data) {
      $rootScope.perm_contact.getAgentConnection().destroy();
    }
    $scope.addConnectionToContact(definedEndpoint, success);
    return;
    let endpointName = "SurveyTransfer";
    let endpoint = null;
    $rootScope.perm_agent.getEndpoints($rootScope.perm_agent.getAllQueueARNs(), {
      success: function(data) {
        for (var i = 0; i < data.endpoints.length; i++) {
          if (data.endpoints[i].name === endpointName) {
            console.log(data.endpoints[i].name);
            endpoint = data.endpoints[i];
            $scope.addConnectionToContact(endpoint);
            $rootScope.perm_contact.getAgentConnection().destroy();
          }
        }
      },
      failure: function() {
        console.log("failed to retrieve endpoints");
      }
    });
  };

  $scope.holdOrResumeCustomerCall = function() {
    if ($rootScope.getCustomerConnection().isOnHold()) {
      $scope.resumeCustomerCall();
    } else {
      $scope.holdCustomerCall();
    }
  };

  $scope.allHoldOrAllResume = function() {
    if ($scope.isAllHold()) {
      console.log("Merging calls");
      $scope.mergeActiveCalls();
      $scope.holdAllButtonActionLabel = "Hold all";
    } else {
      console.log("holding all");
      var connectedConns = $rootScope.perm_contact.getConnections().filter(
        function(conn) {
          return conn.getType() !== lily.ConnectionType.AGENT &&
            conn.getStatus().type === lily.ConnectionStatusType.CONNECTED;
        });
      // Comment from Amazon;
      /**
       * This is necessary due to the nature of Conferenced state
       * in the VoiceService.  We can't immediately put both legs
       * on hold or one of the calls will fail.  So we put one leg
       * on hold, wait ALL_HOLD_DELAY_TIMEOUT_MS milliseconds, then
       * put the other leg on hold.  This gives GACD Critical and
       * VoiceService enough time to update the conversation state
       * so that the second hold operation is valid.
       */
      var allHoldImpl = function(conns) {
        var ALL_HOLD_DELAY_TIMEOUT_MS = 500;
        if (conns.length > 0) {
          var conn = conns.pop();
          conn.hold({
            success: function() {
              window.setTimeout(allHoldImpl(conns), ALL_HOLD_DELAY_TIMEOUT_MS);
            },
            failure: function(data) {
              lily.getLog().error(
                  'Failed to put %s conn on hold.', conn.getConnectionId()
                )
                .withData(data);
              if (callbacks && callbacks.failure) {
                callbacks.failure();
              }
            }
          });
        }
      };
      allHoldImpl(connectedConns);
      $scope.holdAllButtonActionLabel = "Resume all";
    }
  };

  $scope.isAllHold = function() {
    var initialConn = $rootScope.getCustomerConnection();
    if (initialConn == null) {
      return false;
    }
    var thirdPartyConn = $rootScope.getThirdPartyConnection();
    if (thirdPartyConn == null) {
      return false;
    }
    if (initialConn && thirdPartyConn) {
      return initialConn.isOnHold() && thirdPartyConn.isOnHold();
    } else {
      return false;
    }
  };

  $scope.areCallsJoined = function() {
    const initialConn = $rootScope.getCustomerConnection();
    if (initialConn == null || initialConn.getStatus().type === 'disconnected') {
      return false;
    }

    const thirdPartyConn = $rootScope.getThirdPartyConnection();
    if (thirdPartyConn == null || thirdPartyConn.getStatus().type === 'disconnected') {
      return false;
    }

    return !initialConn.isOnHold() && !thirdPartyConn.isOnHold();
  }

  $scope.handlingThirdPartContact = function() {
    if ($rootScope.perm_contact == null) {
      return false;
    }

    const initialConnection = $rootScope.getCustomerConnection();
    const thirdPartyConnection = $rootScope.getThirdPartyConnection();
    if (initialConnection && thirdPartyConnection) {
      return !initialConnection.isConnected();
    } else if (thirdPartyConnection) {
      return true;
    } else {
      return false;
    }
  };

  $scope.holdCustomerCall = function() {
    $scope.disableCallButtons = true;
    if ($rootScope.perm_contact && $scope.handlingThirdPartContact(
        $rootScope.perm_contact)) {
      var thirdPartyConnection = $rootScope.getThirdPartyConnection();
      thirdPartyConnection.hold({
        success: function() {
          console.log("Successfully held call");
          $rootScope.customerTimerCounterSeconds = 0;
          $scope.disableCallButtons = false;
        },
        failure: function(err) {
          console.log("Failed to hold call");
          console.log(err);
          $scope.disableCallButtons = false;
        }
      });
    } else {
      $rootScope.perm_contact.getInitialConnection().hold({
        success: function() {
          console.log("Successfully held call");
          $scope.disableCallButtons = false;
        },
        failure: function(err) {
          console.log("Failed to hold call");
          console.log(err);
          $scope.disableCallButtons = false;
        }
      });
    }
  };

  $scope.holdThirdPartyCall = function() {
    const connection = $rootScope.getThirdPartyConnection();
    if (connection == null) {
      return;
    }

    $scope.disableCallButtons = true;
    connection.hold({
      success: function() {
        console.log("Successfully held call");
        $scope.disableCallButtons = false;
      },
      failure: function(err) {
        console.log("Failed to hold call");
        console.log(err);
        $scope.disableCallButtons = false;
      }
    });
  }

  $scope.threeWayHoldImpl = function(holdingCustomer, callbacks) {
    const initialConn = $rootScope.getCustomerConnetion();
    const thirdPartyConn = $rootScope.getThirdPartyConnection();

    if (contact !== null && initialConn && thirdPartyConn) {
      if (initialConn.isConnected() && thirdPartyConn.isConnected()) {
        if (holdingCustomer) {
          initialConn.hold(callbacks);
        } else {
          thirdPartyConn.hold(callbacks);
        }
      } else {
        $rootScope.perm_contact.toggleActiveConnections(callbacks);
      }
    }
  };

  $scope.resumeCustomerCall = function() {
    $scope.disableCallButtons = true;
    $rootScope.perm_contact.getInitialConnection().resume({
      success: function(data) {
        $scope.disableCallButtons = false;
        $rootScope.customerTimerCounterSeconds = 0;
        console.log("Successfully resumed call");
      },
      failure: function(err) {
        $scope.disableCallButtons = false;
        console.log(err);
      }
    });
  };

  $scope.resumeThirdPartyCall = function() {
    $scope.disableCallButtons = true;
    $rootScope.getThirdPartyConnection().resume({
      success: function(data) {
        $scope.disableCallButtons = false;
        console.log("Successfully resumed call");
      },
      failure: function(err) {
        $scope.disableCallButtons = false;
        console.log(err);
      }
    });
  };

  $scope.muteOrUnmuteAgent = function() {
    if ($rootScope.isMuted) {
      $rootScope.perm_agent.unmute();
    } else {
      $rootScope.perm_agent.mute();
    }
  };

  $scope.swapActiveCalls = function() {
    console.log("Swapping calls");
    if ($rootScope.perm_contact) {
      $rootScope.perm_contact.toggleActiveConnections({
        success: function() {
          console.log("Successfully swapped calls");
        },
        failure: function(err) {
          console.log("Failed to swap calls");
          console.log(err);
        }
      })
    }
  };

  $scope.mergeActiveCalls = function() {
    $rootScope.perm_contact.conferenceConnections({
      success: function(data) {
        console.log("Successfully started a conference call");
        console.log(data);
        $rootScope.$apply();
      },
      failure: function(err) {
        console.log("Failed to start a conference call");
        console.log(err);
      }
    })
  };

  $scope.getThirdPartyCallStatus = function() {
    const connection = $rootScope.getThirdPartyConnection();
    if (connection == null) {
      return null;
    }

    const status = connection.getStatus().type;
    return status.charAt(0).toUpperCase() + status.substr(1);
  }

  $scope.getCustomerCallStatus = function() {
    const connection = $rootScope.getCustomerConnection();
    if (connection == null) {
      return null;
    }

    const status = connection.getStatus();
    const type = connection.getType();

    if ($rootScope.perm_agent !== null) {
      if ($rootScope.perm_agent.name === 'MissedCallAgent') {
        return "Missed call";
      }
    }

    if (status.type === "connected" && type === "inbound" && $rootScope.agentState !== 'Connected') {
      return "Inbound Call";
    }

    return status.type != "system" && status.type != "disconnected"
      ? status.type.charAt(0).toUpperCase() +
          status.type.substr(1)
      : null;
  }

  function getCallStatus(connection) {
    const status = connection.getStatus();
    return status.charAt(0).toUpperCase() + status.substr(1);
  }

  $scope.updateCustomerCallStatus = function() {
    const customerOnHold = $scope.isCustomerOnHold();
    const thirdPartyOnHold = $scope.isThirdPartyOnHold();

    $scope.thirdPartyCallStatus = thirdPartyOnHold
      ? "On Hold"
      : $scope.getThirdPartyCallStatus();

    $scope.updateAgentContactCallStatus();
    $scope.holdCustomerButtonActionLabel = customerOnHold
      ? "Resume"
      : "Hold";

    $scope.holdAllButtonActionLabel = $scope.isAllHold()
      ? "Resume all"
      : "Hold all";
  };

  $scope.updateAgentStatus = function() {
    $scope.updateAgentContactCallStatus();
  };

  // Updates primary contact or agent status
  $scope.updateAgentContactCallStatus = function() {
    const customerOnHold = $scope.isCustomerOnHold();
    const customerCallStatus = $scope.getCustomerCallStatus();
    const thirdPartyCallStatus = $scope.getThirdPartyCallStatus();
    const agentStatus = $rootScope.perm_agent != null
     ? $rootScope.perm_agent.getStatus().name
     : "";

    if ($scope.areCallsJoined()) {
      $scope.customerCallStatus = "Joined";
      $scope.thirdPartyCallStatus = "Joined";
    } else {
      $scope.customerCallStatus = customerOnHold
        ? "On Hold"
        : customerCallStatus !== null
          ? customerCallStatus
          : agentStatus;
    }
    console.log("customer call status set to: " + $scope.customerCallStatus);
  };

  $scope.isAgentInErrorState = function() {
    if ($rootScope.perm_agent === null) {
      return false;
    }

    const agentStatus = $rootScope.perm_agent.getStatus();
    return agentStatus.type === 'error' && agentStatus.name != "MissedCallAgent";
  };

  $scope.isCustomerCallActive = function() {
    const customerConnection = $rootScope.getCustomerConnection();
    if (customerConnection == null) {
      return false;
    }

    const status = customerConnection.getStatus().type;
    return !(status === connect.ConnectionStateType.DISCONNECTED);
  }
});
