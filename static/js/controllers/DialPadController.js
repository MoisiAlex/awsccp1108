PerficientCCPApp.controller('DialPadController', function($scope, $rootScope, OutboundPhoneNumberHolder, CountryCodesHolder) {
    $scope.thisControllerName = "DialPadController";
    console.log($scope.thisControllerName);

    $scope.OutboundPhoneNumberHolder = OutboundPhoneNumberHolder;
    $scope.callableCountries = CountryCodesHolder.value.callableCountries.sort();
    $scope.countryCodesToDialCodes = CountryCodesHolder.value.countryCodesToDialCodes;
    $scope.countryISOCodesToCountryNames = CountryCodesHolder.value.countryISOCodesToCountryNames;
    $scope.countryNamesToCountryISOCodes = CountryCodesHolder.value.countryNamesToCountryISOCodes;
    $scope.countryCode = "+1";

    $scope.show = false;
    $scope.showCountryCodeList = function() {
        $scope.show = !$scope.show;
    };

    angular.element(document.getElementById("MyDialPad")).ready(function() {
        let lastUsedCountry = localStorage.getItem("lastUsedCountry");

        if (!lastUsedCountry) {
            lastUsedCountry = "us";
        }

        $scope.countryCode = $scope.countryCodesToDialCodes[lastUsedCountry];
        const selectedFlag = $("#selectedDialFlag");

        const selectedClassList = selectedFlag.attr("class").split(' ');

        selectedClassList.forEach(function(cssClass) {
            if (cssClass.includes("flag-")) {
                selectedFlag.removeClass(cssClass);
            }
        });

        selectedFlag.addClass(`flag-${lastUsedCountry}`);
        $("#selectedDialCode").html(`&nbsp;&nbsp;&nbsp;${$scope.countryCode}`);
    });

    $scope.changeCountryCodeButtonOnClick = function(countryCode) {
        localStorage.setItem("lastUsedCountry", countryCode);
        const countryDialCode = $scope.countryCodesToDialCodes[countryCode];
        $scope.countryCode = countryDialCode;
        const selectedFlag = $("#selectedDialFlag");

        const selectedClassList = selectedFlag.attr("class").split(' ');

        selectedClassList.forEach(function(cssClass) {
            if (cssClass.includes("flag-")) {
                selectedFlag.removeClass(cssClass);
            }
        });
        
        selectedFlag.addClass(`flag-${countryCode}`);
        $("#selectedDialCode").html(`&nbsp;&nbsp;&nbsp;${countryDialCode}`);
    };

    $scope.dialPadEmitMakingOutboundCall = function() {
        console.log("Emitting MakingOutboundCall");
        $scope.$emit("MakingOutboundCall", $scope.countryCode + $scope.OutboundPhoneNumberHolder.value);
        window.location.href ='#/';
    };

    $scope.playBeepOnClick = function() {
        $scope.playBeep();
    };

    $scope.playBeep = function() {
        let beep = new Audio("static/audio/beep.mp3");

        let beepPromise = beep.play();

        if (beepPromise !== undefined) {
            beepPromise.then(function() {
            }).catch(function(error) {
                console.log(error);
            })
        }
    };

    $scope.getContactSingleActiveConnection = function() {
        if ($rootScope.perm_contact) {
            let singleActiveConnection = $rootScope.perm_contact.getConnections().filter(function(conn) {
                return conn.getType() !== lily.ConnectionType.AGENT && conn.isConnected();
            });
            return singleActiveConnection;
        }
        else {
            return null;
        }
    };


    $scope.canSendDigit = function() {
        return $scope.contactHasSingleActiveConnection();
    };

    $scope.contactHasSingleActiveConnection = function() {
        let singleActiveConnection = $scope.getContactSingleActiveConnection();
        return  singleActiveConnection !== null && singleActiveConnection.length === 1;
    };

    $scope.appendToOutboundNumber = function (symbol) {
        $scope.OutboundPhoneNumberHolder.value += symbol;
        if (!$scope.canSendDigit()) {
            return;
        }

        console.log("sending digits");
        $scope.getContactSingleActiveConnection()[0].sendDigits(symbol, {
            success: function(data) {
                console.log("Successfully sent digits");
            },
            failure: function(err) {
                console.log("Failed to send digits");
                console.log(err);
            }
        });


    };
});
