#contents = ""
with open('mathjax-parser.js', 'r') as myfile:
    contents=myfile.read()

angularStart = "(function(window, angular) {\n";
angularEnd = "var parser = new MathjaxParser();\n" + \
             "angular.module('MathjaxParser', []).service('MathjaxParserService', function(){\n" + \
             "this.parse = parser\n" + \
             "});\n" + \
             "})(window, window.angular);";

f = open('angular-mathjax-parser.js', 'w')
f.write(angularStart + contents + angularEnd)  # python will convert \n to os.linesep
f.close()  # you can omit in most cases as the destructor will call it
