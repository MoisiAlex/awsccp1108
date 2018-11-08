PerficientCCPApp.controller("CCPContainerController", function($scope, $rootScope) {
    $scope.thisControllerName = "CCPContainerController";
    console.log($scope.thisControllerName);

    $scope.setAgentAvailableOnFrontPage = function() {
        var allAgentStates = $rootScope.perm_agent.getAgentStates();
        var agentAvailableState = null;

        for (var i = 0; i < allAgentStates.length; i ++) {
            if (allAgentStates[i].name === "Available") {
                agentAvailableState = allAgentStates[i];
            }
        }

        $rootScope.perm_agent.setState(agentAvailableState, {
            success: function() {
                window.location.href ='#/';
            },
            failure: function(err) {
                console.log(err);
                console.log(`Failed to set agent to ${state.name}`);
            }
        });
    }

    $scope.emitMakingOutboundCall = function() {
        console.log("emitting MakingOutboundCall");
        $scope.$emit("MakingOutboundCall");
    };

    $scope.emitAnswerCall = function() {
        console.log("Emitting AnsweringCall");
        $scope.$emit("AnsweringCall");
    };

    $scope.emitHoldOrResumeCall = function() {
        console.log("emitting HoldOrResumeCall");
        $scope.$emit("HoldOrResumeCall");
    };

    $scope.emitEndCall = function() {
        console.log("Emitting EndCall");
        $scope.$emit("EndCall")
    };

    $scope.emitMuteOrUnmute = function (){
        console.log("Emitting MuteOrUnmute");
        $scope.$emit("MuteOrUnmute");
    };

    $scope.emitSwapActiveCalls = function() {
        console.log("Emitting SwapActiveCalls");
        $scope.$emit("SwapActiveCalls");
    };

    $scope.emitAllHoldOrAllResume = function() {
        console.log("Emitting AllHold");
        $scope.$emit("AllHoldOrAllResume");
    };

    $scope.emitJoinCalls = function() {
        console.log("Emitting JoinCalls");
        $scope.$emit("JoinCalls");
    };
});
