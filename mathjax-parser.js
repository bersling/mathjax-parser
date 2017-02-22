var MathjaxParser = (function () {
    function MathjaxParser() {
        var _this = this;
        this.parse = function (inputHtml, config) {
            _this.config = config || {
                inlineMath: [['$', '$'], ['\\(', '\\)']],
                displayMath: [['$$', '$$'], ['\\[', '\\]']],
                inlineMathReplacement: ['<span class="inline-math" style="color: red">', '</span>'],
                displayMathReplacement: ['<span class="display-math" style="color: blue">', '</span>']
            };
            _this.executionOrder = _this.determineExecutionOrder();
            if (_this.executionOrder.valueOf() === ExecutionOrder.CONFLICT) {
                console.log("Sorry, the provided config isn't supported. \"inlineMath.contains(displayMath)\" AND \"displayMath.contains(inlineMath)\" not supported");
                return;
            }
            var body = document.createElement('body');
            body.innerHTML = inputHtml;
            _this.processNodeList(body.childNodes);
            return {
                outputHtml: body.innerHTML
            };
        };
        this.walkTheDomAndOperateOnChildren = function (node, func) {
            var childNodes = node.childNodes;
            func(childNodes);
            for (var i = 0; i < childNodes.length; i++) {
                _this.walkTheDomAndOperateOnChildren(childNodes[i], func);
            }
        };
        this.processNodeList = function (nodeList) {
            var allAdjacentTextOrBrNodes = _this.findAdjacentTextOrBrNodes(nodeList);
            allAdjacentTextOrBrNodes.forEach(function (textOrBrNodeSet) {
                if (_this.executionOrder.valueOf() === ExecutionOrder.INLINE_FIRST) {
                    _this.iterateMath('inline', textOrBrNodeSet, nodeList);
                    _this.iterateMath('display', textOrBrNodeSet, nodeList);
                }
                else {
                    _this.iterateMath('display', textOrBrNodeSet, nodeList);
                    _this.iterateMath('inline', textOrBrNodeSet, nodeList);
                }
            });
            for (var i = 0; i < nodeList.length; i++) {
                var node = nodeList[i];
                _this.processNodeList(node.childNodes);
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
    MathjaxParser.prototype.determineExecutionOrder = function () {
        var _this = this;
        var order = ExecutionOrder.DISPLAY_FIRST;
        this.config.inlineMath.forEach(function (inlineGrp) {
            _this.config.displayMath.forEach(function (displayGrp) {
                if (inlineGrp[0].indexOf(displayGrp[0]) > -1) {
                    order = ExecutionOrder.INLINE_FIRST;
                }
            });
        });
        if (order.valueOf() === ExecutionOrder.INLINE_FIRST.valueOf()) {
            this.config.inlineMath.forEach(function (inlineGrp) {
                _this.config.displayMath.forEach(function (displayGrp) {
                    if (displayGrp[0].indexOf(inlineGrp[0]) > -1) {
                        order = ExecutionOrder.CONFLICT;
                    }
                });
            });
        }
        return order;
    };
    MathjaxParser.prototype.iterateMath = function (type, textOrBrNodeSet, nodeList) {
        var _this = this;
        this.config[type + 'Math'].forEach(function (grp) {
            var matchedDelimiterSets = [];
            for (var i = textOrBrNodeSet.start; i < textOrBrNodeSet.end; i++) {
                var node = nodeList[i];
                if (node.nodeType === 3) {
                    var textContent = node.textContent;
                    var reStart = new RegExp("(" + _this.escapeRegExp(grp[0]) + ")", 'g');
                    var reEnd = new RegExp("(" + _this.escapeRegExp(grp[1]) + ")", 'g');
                    _this.buildOccurences(reStart, reEnd, textContent, matchedDelimiterSets, i);
                }
            }
            _this.cleanOccurences(matchedDelimiterSets);
            matchedDelimiterSets = matchedDelimiterSets.reverse();
            matchedDelimiterSets.forEach(function (delimiterSet) {
                _this.replaceAllDelims(grp, delimiterSet, nodeList, type);
            });
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
