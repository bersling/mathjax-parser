(function(window, angular) {
var MathjaxParser = (function () {
    function MathjaxParser() {
        var _this = this;
        this.parse = function (inputHtml, config) {
            _this.config = config || {
                inlineMath: [['$', '$'], ['\\(', '\\)']],
                displayMath: [['$$', '$$'], ['\\[', '\\]']],
                inlineMathReplacement: ['XXX', 'XXX'],
                displayMathReplacement: ['YYY', 'YYY']
            };
            var body = document.createElement('body');
            body.innerHTML = inputHtml;
            _this.processNodeList(body.childNodes, _this.buildDelimiterArray(config));
            return {
                outputHtml: body.innerHTML
            };
        };
        this.processNodeList = function (nodeList, delimiterArray) {
            var allAdjacentTextOrBrNodes = _this.findAdjacentTextOrBrNodes(nodeList);
            allAdjacentTextOrBrNodes.forEach(function (textOrBrNodeSet) {
                _this.iterateMath(delimiterArray, textOrBrNodeSet, nodeList);
            });
            for (var i = 0; i < nodeList.length; i++) {
                var node = nodeList[i];
                if (node.nodeType !== 3) {
                    _this.processNodeList(node.childNodes, delimiterArray);
                }
            }
        };
        this.isMatchingIndex = function (text, idx, delim) {
            return text.substr(idx, delim.length) === delim;
        };
        this.replaceStartAndEndOfMatchedSet = function (delimiterSet, nodeList) {
            _this.replaceDelims(nodeList, delimiterSet.end);
            _this.replaceDelims(nodeList, delimiterSet.start);
        };
        this.cleanOccurences = function (occurences) {
            if (occurences.length > 0) {
                if (!occurences[occurences.length - 1].end) {
                    occurences.pop();
                }
            }
        };
        this.replaceDelims = function (nodeList, delimiterMatch) {
            var oldDelimLength = delimiterMatch.isStart ?
                delimiterMatch.delimiterGroup.group[0].length : delimiterMatch.delimiterGroup.group[1].length;
            var nodeVal = nodeList[delimiterMatch.nodeNumber].nodeValue;
            nodeList[delimiterMatch.nodeNumber].nodeValue =
                nodeVal.substr(0, delimiterMatch.index) +
                    _this.config[delimiterMatch.delimiterGroup.type + 'MathReplacement'][delimiterMatch.isStart ? 0 : 1] +
                    nodeVal.substr(delimiterMatch.index + oldDelimLength, nodeVal.length - 1);
        };
        this.findAdjacentTextOrBrNodes = function (nodeList) {
            var textOrBrNodes = [];
            for (var i = 0; i < nodeList.length; i++) {
                var node = nodeList[i];
                _this.isTextOrBrNode(node) ? textOrBrNodes.push(true) : textOrBrNodes.push(false);
            }
            var adjacentTextOrBrNodes = [];
            for (var i = 0; i < textOrBrNodes.length; i++) {
                var isTextOrBrNode = textOrBrNodes[i];
                if (isTextOrBrNode) {
                    if (adjacentTextOrBrNodes.length === 0 ||
                        adjacentTextOrBrNodes[adjacentTextOrBrNodes.length - 1].end !== i) {
                        adjacentTextOrBrNodes.push({
                            start: i,
                            end: i + 1
                        });
                    }
                    else if (adjacentTextOrBrNodes[adjacentTextOrBrNodes.length - 1].end === i) {
                        ++adjacentTextOrBrNodes[adjacentTextOrBrNodes.length - 1].end;
                    }
                }
            }
            return adjacentTextOrBrNodes;
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
    MathjaxParser.prototype.buildDelimiterArray = function (config) {
        var delimiterArray = [];
        var insertAtIndex = function (idx, delimiterArray, grp, type) {
            delimiterArray.splice(idx, 0, {
                group: grp,
                type: type
            });
        };
        var findIndex = function (delimiterArray, startDelimiter) {
            var index = 0;
            for (var i = 0; i < delimiterArray.length; i++) {
                if (startDelimiter.indexOf(delimiterArray[i].group[0]) > -1) {
                    break;
                }
                ++index;
            }
            return index;
        };
        config.inlineMath.forEach(function (grp) {
            var idx = findIndex(delimiterArray, grp[0]);
            insertAtIndex(idx, delimiterArray, grp, 'inline');
        });
        config.displayMath.forEach(function (grp) {
            var idx = findIndex(delimiterArray, grp[0]);
            insertAtIndex(idx, delimiterArray, grp, 'display');
        });
        return delimiterArray;
    };
    MathjaxParser.prototype.iterateMath = function (delimiterArray, textOrBrNodeSet, nodeList) {
        var state = {
            matchedDelimiterSets: []
        };
        for (var nodeNumber = textOrBrNodeSet.start; nodeNumber < textOrBrNodeSet.end; nodeNumber++) {
            var node = nodeList[nodeNumber];
            if (node.nodeType === 3) {
                var textContent = node.textContent;
                this.processIndices(textContent, state, delimiterArray, nodeNumber);
            }
        }
        this.cleanOccurences(state.matchedDelimiterSets);
        this.replaceMatches(state.matchedDelimiterSets, nodeList);
    };
    MathjaxParser.prototype.replaceMatches = function (matchedDelimiterSets, nodeList) {
        var _this = this;
        matchedDelimiterSets = matchedDelimiterSets.reverse();
        matchedDelimiterSets.forEach(function (delimiterSet) {
            _this.replaceStartAndEndOfMatchedSet(delimiterSet, nodeList);
        });
    };
    MathjaxParser.prototype.processIndices = function (textContent, state, delimiterArray, nodeNumber) {
        var _this = this;
        var idx = 0;
        while (idx < textContent.length) {
            if (state.matchedDelimiterSets.length === 0 ||
                state.matchedDelimiterSets[state.matchedDelimiterSets.length - 1].end) {
                delimiterArray.some(function (delimiterGroup) {
                    if (_this.isMatchingIndex(textContent, idx, delimiterGroup.group[0])) {
                        state.lastMatchedGroup = delimiterGroup;
                        MathjaxParser.pushStart(state.matchedDelimiterSets, nodeNumber, idx, delimiterGroup);
                        return true;
                    }
                });
            }
            else {
                if (this.isMatchingIndex(textContent, idx, state.lastMatchedGroup.group[1])) {
                    MathjaxParser.pushEnd(state.matchedDelimiterSets, nodeNumber, idx, state.lastMatchedGroup);
                }
            }
            ++idx;
        }
    };
    MathjaxParser.prototype.pushStart = function (matchedDelimiterSets, nodeNumber, idx, delimiterGroup) {
        matchedDelimiterSets.push({
            start: {
                nodeNumber: nodeNumber,
                index: idx,
                delimiterGroup: delimiterGroup,
                isStart: true
            },
            end: undefined,
        });
    };
    ;
    MathjaxParser.prototype.pushEnd = function (matchedDelimiterSets, nodeNumber, idx, delimiterGroup) {
        matchedDelimiterSets[matchedDelimiterSets.length - 1].end = {
            nodeNumber: nodeNumber,
            index: idx,
            delimiterGroup: delimiterGroup,
            isStart: false
        };
    };
    ;
    return MathjaxParser;
}());
var ExecutionOrder;
(function (ExecutionOrder) {
    ExecutionOrder[ExecutionOrder["INLINE_FIRST"] = 0] = "INLINE_FIRST";
    ExecutionOrder[ExecutionOrder["DISPLAY_FIRST"] = 1] = "DISPLAY_FIRST";
    ExecutionOrder[ExecutionOrder["CONFLICT"] = 2] = "CONFLICT";
})(ExecutionOrder || (ExecutionOrder = {}));
var parser = new MathjaxParser();
angular.module('MathjaxParser', []).service('MathjaxParserService', function(){
this.parse = parser.parse
});
})(window, window.angular);