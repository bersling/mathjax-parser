(function(window, angular) {

  var MathjaxParser = (function () {
    function MathjaxParser() {
      var _this = this;
      this.parse = function (inputHtml, config) {
        config = config || {
              inlineMath: [['$', '$'], ['\\(', '\\)']],
              displayMath: [['$$', '$$'], ['\\[', '\\]']],
              inlineMathReplacement: ['<span class="inline-math" style="color: red">', '</span>'],
              displayMathReplacement: ['<span class="display-math" style="color: blue">', '</span>']
            };
        var body = document.createElement('body');
        body.innerHTML = inputHtml;
        _this.walkTheDOM(body, _this.mathjaxProcessorFactory(config));
        return {
          outputHtml: body.innerHTML
        };
      };
      this.mathjaxProcessorFactory = function (config) {
        return function (node) {
          var separatedNodes = _this.separateTextBrSuccessionsFromOtherNodesInChildren(node);
          var separatedNodesAsStrings = [];
          separatedNodes.forEach(function (nodeBundle) {
            var str = nodeBundle.concated;
            if (nodeBundle.type === 'text-or-br') {
              str = _this.parseMathjaxFromTextBrNodeSuccessionString(str, config);
            }
            separatedNodesAsStrings.push(str);
          });
          var newInnerHtml = separatedNodesAsStrings.join("");
          node.innerHTML = newInnerHtml;
        };
      };
      this.parseMathjaxFromTextBrNodeSuccessionString = function (str, config) {
        var mathConstants = [{
          delimiters: config.displayMath,
          replacements: config.displayMathReplacement
        }, {
          delimiters: config.inlineMath,
          replacements: config.inlineMathReplacement
        }];
        console.log(str, 1);
        mathConstants.forEach(function (type) {
          type.delimiters.forEach(function (delim) {
            var expression = _this.escapeRegExp(delim[0]) + "(.+?)" + _this.escapeRegExp(delim[1]);
            var rx = new RegExp(expression, 'g');
            str = str.replace(rx, _this.escapeRegexReplacementString(type.replacements[0]) + "$1" +
                _this.escapeRegexReplacementString(type.replacements[1]));
          });
        });
        console.log(str, 2);
        return str;
      };
      this.separateTextBrSuccessionsFromOtherNodesInChildren = function (node) {
        var children = $(node).contents();
        var separatedNodes = [];
        if (children.length > 0) {
          var first = children.get(0);
          var oldType_1;
          children.each(function (idx) {
            var child = children.get(idx);
            var newType = _this.isTextOrBrNode(child) ? 'text-or-br' : 'other';
            if (newType !== oldType_1) {
              var nodeSubset = {
                type: newType,
                nodes: [],
                nodeValues: [],
                concated: ""
              };
              separatedNodes.push(nodeSubset);
            }
            oldType_1 = newType;
            var current = separatedNodes[separatedNodes.length - 1];
            current.nodes.push(idx);
            current.nodeValues.push(_this.getHtml(child));
            current.concated += _this.getHtml(child);
          });
        }
        return separatedNodes;
      };
      this.walkTheDOM = function (node, func) {
        func(node);
        node = node.firstChild;
        while (node) {
          _this.walkTheDOM(node, func);
          node = node.nextSibling;
        }
      };
      this.getHtml = function (node) {
        var html = "";
        if (node.nodeType === 3) {
          html = node.nodeValue;
        }
        else {
          html = node.outerHTML;
        }
        return html;
      };
      this.isTextOrBrNode = function (node) {
        return node.nodeType === 3 || node.nodeName === 'BR';
      };
      this.escapeRegExp = function (str) {
        return str.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&");
      };
      this.escapeRegexReplacementString = function (str) {
        return str.replace(/\$/g, "$$$$");
      };
    }
    return MathjaxParser;
  }());

  var parser = new MathjaxParser();

  angular.module("MathjaxParser", []).service('MathjaxParser', parser);

})(window, window.angular);