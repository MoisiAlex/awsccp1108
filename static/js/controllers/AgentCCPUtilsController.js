PerficientCCPApp.controller("AgentCCPUtilsController", function($scope, $rootScope, $http, CountryCodesHolder) {
    $scope.thisControllerName = "AgentCCPUtilsController";
    console.log($scope.thisControllerName);

    $scope.gotoLogout = false;

    $scope.countryCode = "+1";
    $scope.callableCountries = CountryCodesHolder.value.callableCountries.sort();
    $scope.countryCodesToDialCodes = CountryCodesHolder.value.countryCodesToDialCodes;
    $scope.countryISOCodesToCountryNames = CountryCodesHolder.value.countryISOCodesToCountryNames;
    $scope.countryNamesToCountryISOCodes = CountryCodesHolder.value.countryNamesToCountryISOCodes;
    $scope.hardPhoneNumber = "";

    angular.element(document.getElementById("settingsPage")).ready(function() {
        const lastCountryCode = localStorage.getItem("hardPhoneCountryCode") || "us";
        const countryDialCode = $scope.countryCodesToDialCodes[lastCountryCode];
        $scope.countryCode = countryDialCode;
        const selectedFlag = $("#selectedDialFlag");
        const selectedClassList = selectedFlag.attr("class").split(' ');
        selectedClassList.forEach(function(cssClass) {
            if (cssClass.includes("flag-")) {
                selectedFlag.removeClass(cssClass);
            }
        });
        selectedFlag.addClass(`flag-${lastCountryCode}`);
        $("#selectedDialCode").html(`&nbsp;&nbsp;&nbsp;${countryDialCode}`);

        $scope.hardPhoneNumber = localStorage.getItem("hardPhoneNumber");
        var phoneTypeSelect = document.getElementsByName("phoneType");
        var val = null;
        if (localStorage.getItem("phoneType") === null) {
            localStorage.setItem("phoneType", "Softphone");
            val = localStorage.getItem("phoneType");
            $scope.saveSoftPhoneAgentConfig();
        }
        else {
            val = localStorage.getItem("phoneType");
        }
        for(var i = 0; i < phoneTypeSelect.length; i++) {

            if (phoneTypeSelect[i].value === val) {
                phoneTypeSelect[i].checked = true;

            }
        }
    });

    $scope.hardphoneLabelOnClick = function() {
        var hardphoneRadioButton = document.getElementById('hardphoneRadioButton').checked = true;
        $scope.phoneType = "hardPhone";
    };

    $scope.changeCountryCodeButtonOnClick = function(countryCode) {
        const countryDialCode = $scope.countryCodesToDialCodes[countryCode];
        localStorage.setItem("hardPhoneCountryCode", countryCode);
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

    $scope.saveSoftPhoneAgentConfig = function() {
        document.getElementById("softphoneRadioButton").checked = true;
        $scope.phoneType = "Softphone";
        var newConfig = $rootScope.perm_agent.getConfiguration();
        newConfig.softphoneEnabled = true;
        $rootScope.perm_agent.setConfiguration(newConfig, {
            success: function() {
                console.log("Changed to softphone");
                localStorage.setItem("phoneType", "Softphone");
                },
            failure: function() {
                console.log("Failed to change to softphone");
            }
        })
    };

    $scope.setHardPhone = function(number) {
        var newConfig = $rootScope.perm_agent.getConfiguration();
        newConfig.softphoneEnabled = false;
        $scope.hardPhoneNumber = number;
        localStorage.setItem("hardPhoneNumber", number);
        let countryCode = $scope.countryCode;

        newConfig.extension = countryCode + number;
        $rootScope.perm_agent.setConfiguration(newConfig, {
            success: function() {
                console.log("Changed to hardphone");
                localStorage.setItem("phoneType", "hardPhone");
            },
            failure: function() {
                console.log("Failed to change to hardphone");
            }
        })
    };

    $scope.downloadAgentLog = function() {
        connect.getLog().download();
    };
});
