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
            _this.processNodeList(body.childNodes, _this.buildConfigArray(config));
            return {
                outputHtml: body.innerHTML
            };
        };
        this.processNodeList = function (nodeList, configArray) {
            var allAdjacentTextOrBrNodes = _this.findAdjacentTextOrBrNodes(nodeList);
            allAdjacentTextOrBrNodes.forEach(function (textOrBrNodeSet) {
                configArray.forEach(function (configItem) {
                    _this.iterateMath(configItem, textOrBrNodeSet, nodeList);
                });
            });
            for (var i = 0; i < nodeList.length; i++) {
                var node = nodeList[i];
                _this.processNodeList(node.childNodes, configArray);
            }
        };
        this.replaceAllDelims = function (grp, delimiterSet, nodeList, type) {
            _this.replaceDelims(nodeList, grp, delimiterSet, false, type);
            _this.replaceDelims(nodeList, grp, delimiterSet, true, type);
        };
        this.cleanOccurences = function (occurences) {
            if (occurences.length > 0) {
                if (!occurences[occurences.length - 1].end) {
                    occurences.pop();
                }
            }
        };
        this.replaceDelims = function (nodeList, grp, delimiterSet, isStart, type) {
            var oldDelimLength = grp[isStart ? 0 : 1].length;
            var nodeAndIndex = isStart ? delimiterSet.start : delimiterSet.end;
            var nodeVal = nodeList[nodeAndIndex.nodeNumber].nodeValue;
            nodeList[nodeAndIndex.nodeNumber].nodeValue =
                nodeVal.substr(0, nodeAndIndex.index) +
                    _this.config[type + 'MathReplacement'][isStart ? 0 : 1] +
                    nodeVal.substr(nodeAndIndex.index + oldDelimLength, nodeVal.length - 1);
        };
        this.buildOccurences = function (reStart, reEnd, textContent, occurences, nodeNumber) {
            var matchFound = false;
            if (occurences.length == 0 || !occurences[occurences.length - 1].start) {
                matchFound = _this.searchStart(reStart, textContent, occurences, nodeNumber);
                if (matchFound) {
                    _this.buildOccurences(reStart, reEnd, textContent, occurences, nodeNumber);
                }
            }
            else {
                matchFound = _this.searchEnd(reEnd, textContent, occurences, nodeNumber);
                if (matchFound) {
                    _this.buildOccurences(reStart, reEnd, textContent, occurences, nodeNumber);
                }
            }
        };
        this.searchStart = function (reStart, textContent, occurences, nodeNumber) {
            var m;
            if (m = reStart.exec(textContent)) {
                if (occurences.length === 0 ||
                    occurences[occurences.length - 1].end.nodeNumber < nodeNumber ||
                    occurences[occurences.length - 1].end.index < m.index) {
                    occurences.push({
                        start: {
                            nodeNumber: nodeNumber,
                            index: m.index
                        },
                        end: undefined
                    });
                    return true;
                }
                else {
                    _this.searchEnd(reStart, textContent, occurences, nodeNumber);
                }
            }
        };
        this.searchEnd = function (reEnd, textContent, occurences, nodeNumber) {
            var m;
            if (m = reEnd.exec(textContent)) {
                if (occurences[occurences.length - 1].start.nodeNumber < nodeNumber ||
                    occurences[occurences.length - 1].start.index < m.index) {
                    occurences[occurences.length - 1].end = {
                        nodeNumber: nodeNumber,
                        index: m.index
                    };
                    return true;
                }
                else {
                    _this.searchEnd(reEnd, textContent, occurences, nodeNumber);
                }
            }
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
    MathjaxParser.prototype.buildConfigArray = function (config) {
        var configArray = [];
        var insertAtIndex = function (idx, configArray, grp, type) {
            configArray.splice(idx, 0, {
                group: grp,
                type: type
            });
        };
        var findIndex = function (configArray, startDelimiter) {
            var index = 0;
            for (var i = 0; i < configArray.length; i++) {
                if (startDelimiter.indexOf(configArray[i].group[0]) > -1) {
                    break;
                }
                ++index;
            }
            return index;
        };
        config.inlineMath.forEach(function (grp) {
            var idx = findIndex(configArray, grp[0]);
            insertAtIndex(idx, configArray, grp, 'inline');
        });
        config.displayMath.forEach(function (grp) {
            var idx = findIndex(configArray, grp[0]);
            insertAtIndex(idx, configArray, grp, 'display');
        });
        return configArray;
    };
    MathjaxParser.prototype.iterateMath = function (configItem, textOrBrNodeSet, nodeList) {
        var _this = this;
        var matchedDelimiterSets = [];
        for (var i = textOrBrNodeSet.start; i < textOrBrNodeSet.end; i++) {
            var node = nodeList[i];
            if (node.nodeType === 3) {
                var textContent = node.textContent;
                var reStart = new RegExp("(" + this.escapeRegExp(configItem.group[0]) + ")", 'g');
                var reEnd = new RegExp("(" + this.escapeRegExp(configItem.group[1]) + ")", 'g');
                this.buildOccurences(reStart, reEnd, textContent, matchedDelimiterSets, i);
            }
        }
        this.cleanOccurences(matchedDelimiterSets);
        matchedDelimiterSets = matchedDelimiterSets.reverse();
        matchedDelimiterSets.forEach(function (delimiterSet) {
            _this.replaceAllDelims(configItem.group, delimiterSet, nodeList, configItem.type);
        });
    };
    return MathjaxParser;
}());
var ExecutionOrder;
(function (ExecutionOrder) {
    ExecutionOrder[ExecutionOrder["INLINE_FIRST"] = 0] = "INLINE_FIRST";
    ExecutionOrder[ExecutionOrder["DISPLAY_FIRST"] = 1] = "DISPLAY_FIRST";
    ExecutionOrder[ExecutionOrder["CONFLICT"] = 2] = "CONFLICT";
})(ExecutionOrder || (ExecutionOrder = {}));
