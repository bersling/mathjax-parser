(function(window, angular) {
  <%= parser %>
  var parser = new MathjaxParser();
  angular.module('MathjaxParser', []).service('MathjaxParserService', function(){
    this.parse = parser.parse
  });
})(window, window.angular);