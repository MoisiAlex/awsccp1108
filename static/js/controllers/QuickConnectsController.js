PerficientCCPApp.controller("QuickConnectsController", function($scope, $rootScope) {

    $scope.emitCallQuickConnect = function(quickConnect) {
        $scope.$emit("TransferToOrCallQuickConnect", quickConnect);
        window.location.href = "#/";

    };
});
