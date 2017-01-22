#contents = ""
with open('mathjax-parser.js', 'r') as myfile:
    contents=myfile.read()

angularStart = "(function(window, angular) {\n";
angularEnd = "  var parser = new MathjaxParser();\n" + \
             "angular.module('MathjaxParser, []).service('MathjaxParser', parser);\n" + \
             "})(window, window.angular);";

print(angularStart + contents + angularEnd);