declare var $;

class MathjaxParser {

  public parse = (inputHtml: string, config?: MathjaxParserConfig): ParserResponse => {

    //set a default config
    this.config = config || {
          inlineMath: [['$','$'],['\\(','\\)']],
          displayMath: [['$$','$$'],['\\[','\\]']],
          inlineMathReplacement: ['<span class="inline-math" style="color: red">', '</span>'],
          displayMathReplacement: ['<span class="display-math" style="color: blue">','</span>']
        };

    this.executionOrder = this.determineExecutionOrder();

    if (this.executionOrder.valueOf() === ExecutionOrder.CONFLICT) {
      console.log("Sorry, the provided config isn't supported. \"inlineMath.contains(displayMath)\" AND \"displayMath.contains(inlineMath)\" not supported");
      return;
    }

    //create a DOM element in order to use the DOM-Walker
    let body: HTMLElement = document.createElement('body');
    body.innerHTML = inputHtml;

    this.processNodeList(body.childNodes);

    return {
      outputHtml: body.innerHTML
    };

  };

  private executionOrder;
  private config;
  private configArryified: {delims: string[][][]; replacements: string[][]};

  private walkTheDomAndOperateOnChildren = (node: Node, func) => {
    var childNodes: NodeList = node.childNodes;
    func(childNodes);
    for (var i = 0; i < childNodes.length; i++) {
      this.walkTheDomAndOperateOnChildren(childNodes[i], func);
    }
  };

  private determineExecutionOrder() {
    let order: ExecutionOrder = ExecutionOrder.DISPLAY_FIRST;
    this.config.inlineMath.forEach(inlineGrp => {
      this.config.displayMath.forEach(displayGrp => {
        if (inlineGrp[0].indexOf(displayGrp[0]) > -1) {
          order = ExecutionOrder.INLINE_FIRST;
        }
      });
    });
    if (order.valueOf() === ExecutionOrder.INLINE_FIRST.valueOf()) {
      this.config.inlineMath.forEach(inlineGrp => {
        this.config.displayMath.forEach(displayGrp => {
          if (displayGrp[0].indexOf(inlineGrp[0]) > -1) {
            order = ExecutionOrder.CONFLICT;
          }
        });
      });
    }

    return order;
  }

  private processNodeList = (nodeList: NodeList) => {
    let allAdjacentTextOrBrNodes: MyRange<number>[] = this.findAdjacentTextOrBrNodes(nodeList);

    allAdjacentTextOrBrNodes.forEach((textOrBrNodeSet: MyRange<number>) => {
      if (this.executionOrder.valueOf() === ExecutionOrder.INLINE_FIRST) {
        this.iterateMath('inline', textOrBrNodeSet, nodeList);
        this.iterateMath('display', textOrBrNodeSet, nodeList);
      } else {
        this.iterateMath('display', textOrBrNodeSet, nodeList);
        this.iterateMath('inline', textOrBrNodeSet, nodeList);
      }
    });

    //process children
    for (let i: number = 0; i < nodeList.length; i++) {
      let node: Node = nodeList[i];
      this.processNodeList(node.childNodes);
    }

  };

  private iterateMath(type: MathType, textOrBrNodeSet: MyRange<number>, nodeList: NodeList) {
    //Iterate through all delimiters, trying to find matching delimiters
    this.config[type + 'Math'].forEach(grp => {

      let matchedDelimiterSets: MyRange<NodeAndIndex>[] = [];

      for (var i = textOrBrNodeSet.start; i < textOrBrNodeSet.end; i++) {
        let node: Node = nodeList[i];

        //for the text nodes (type 3), other nodes dont matter
        if (node.nodeType === 3) {

          const textContent: string = node.textContent;

          //find a matches
          //TODO: correct escapes for $ special case...
          //const pattern = grp[0] !== "$" ?  "(" + this.escapeRegExp(grp[0]) + ")" : "([^\\]|^)(\$)";
          const reStart = new RegExp("(" + this.escapeRegExp(grp[0]) + ")",'g');
          const reEnd = new RegExp("(" + this.escapeRegExp(grp[1]) + ")", 'g');

          this.buildOccurences(reStart, reEnd, textContent, matchedDelimiterSets, i);

        }
      }

      this.cleanOccurences(matchedDelimiterSets);

      //REPLACE ALL MATCHED DELIMITERS WITH REPLACEMENTS
      matchedDelimiterSets = matchedDelimiterSets.reverse(); // work the array back to from so indexes don't get messed up
      matchedDelimiterSets.forEach((delimiterSet: MyRange<NodeAndIndex>) => {
        this.replaceAllDelims(grp, delimiterSet, nodeList, type);
      });

    });
  }

  private replaceAllDelims = (grp, delimiterSet: MyRange<NodeAndIndex>, nodeList: NodeList, type: MathType) => {
    //handle end FIRST
    this.replaceDelims(nodeList, grp, delimiterSet,  false, type);

    //handle start
    this.replaceDelims(nodeList, grp, delimiterSet, true, type);
  };

  private cleanOccurences = (occurences: MyRange<NodeAndIndex>[]) => {
    if (occurences.length > 0) {
      if (!occurences[occurences.length - 1].end) {
        occurences.pop();
      }
    }
  };

  private replaceDelims = (nodeList: NodeList, grp, delimiterSet: MyRange<NodeAndIndex> , isStart: boolean, type: MathType) => {

    const oldDelimLength = grp[isStart ? 0 : 1].length;
    const nodeAndIndex = isStart ? delimiterSet.start : delimiterSet.end;

    const nodeVal = nodeList[nodeAndIndex.nodeNumber].nodeValue;

    //insert the new delimiter while removing the old delimiter
    nodeList[nodeAndIndex.nodeNumber].nodeValue =

        //string start
        nodeVal.substr(0, nodeAndIndex.index) +
            //replacement string
        this.config[type + 'MathReplacement'][isStart ? 0 : 1] +
            //string rest
        nodeVal.substr(nodeAndIndex.index + oldDelimLength, nodeVal.length - 1);

  };


  //fills occurences with matched start/end groups
  private buildOccurences = (reStart: RegExp, reEnd: RegExp, textContent: string, occurences: MyRange<NodeAndIndex>[], nodeNumber: number) => {

    let matchFound = false;

    //in case it's a starting match
    if (occurences.length == 0 || !occurences[occurences.length - 1].start) {
      matchFound = this.searchStart(reStart, textContent, occurences, nodeNumber);
      if (matchFound) {
        this.buildOccurences(reStart, reEnd, textContent, occurences, nodeNumber);
      }
    }

    //find an end delimiter matching the start delimiter
    else {
      matchFound = this.searchEnd(reEnd, textContent, occurences, nodeNumber);
      if (matchFound) {
        this.buildOccurences(reStart, reEnd, textContent, occurences, nodeNumber);
      }
    }

  }

  private searchStart = (reStart: RegExp, textContent: string, occurences: MyRange<NodeAndIndex>[], nodeNumber: number): boolean => {
    //find a starting delimiter larger than the last end delimiter
    let m;
    if (m = reStart.exec(textContent)) {
      if(occurences.length === 0 ||
          occurences[occurences.length - 1].end.nodeNumber < nodeNumber ||
          occurences[occurences.length - 1].end.index < m.index
      ) {
        occurences.push({
          start: {
            nodeNumber: nodeNumber,
            index: m.index
          },
          end: undefined
        });
        return true;
      } else {
        //continue search if something was found, but it's too low
        this.searchEnd(reStart, textContent, occurences, nodeNumber);
      }

    }
  }

  private searchEnd = (reEnd: RegExp,  textContent: string, occurences:MyRange<NodeAndIndex>[], nodeNumber: number): boolean => {
    //find an end delimiter larger than startDelimiter
    var m;
    if(m = reEnd.exec(textContent)) {
      if (occurences[occurences.length - 1].start.nodeNumber < nodeNumber ||
          occurences[occurences.length - 1].start.index < m.index) {
        occurences[occurences.length - 1].end = {
          nodeNumber: nodeNumber,
          index: m.index
        }
        return true;
      } else {
        //continue search if something was found, but it's too low
        this.searchEnd(reEnd, textContent, occurences, nodeNumber);
      }
    }
  };

  private findAdjacentTextOrBrNodes = (nodeList: NodeList): MyRange<number>[] => {
    //value true if node is textOrBr, false otherwise
    //example:
    // hello <br> world <span>bla</span>
    // would yield
    // [true, true, true, false]
    let textOrBrNodes: boolean[] = [];
    for (let i: number = 0; i < nodeList.length; i++) {
      let node: Node = nodeList[i];
      this.isTextOrBrNode(node) ? textOrBrNodes.push(true) : textOrBrNodes.push(false);
    }

    //get array with ranges (arrays) of adjacentTextOrBrNodes
    //example:
    // hello <br> world <span>bla</span> that's cool
    // would yield
    // [{start: 0, end: 3},{start: 4, end: 5}]
    let adjacentTextOrBrNodes: MyRange<number>[] = [];
    for (let i: number = 0; i < textOrBrNodes.length; i++) {
      let isTextOrBrNode: boolean = textOrBrNodes[i];

      if (isTextOrBrNode) {

        //handle case if IS NOT ADJACENT MATCH: insert new array
        if (adjacentTextOrBrNodes.length === 0 ||
            adjacentTextOrBrNodes[adjacentTextOrBrNodes.length - 1].end !== i
        ) {

          adjacentTextOrBrNodes.push({
            start: i,
            end: i+1
          });
        }
        //handle case if IS ADJACENT MATCH: raise value by one
        else if (adjacentTextOrBrNodes[adjacentTextOrBrNodes.length - 1].end === i) {
          ++adjacentTextOrBrNodes[adjacentTextOrBrNodes.length - 1].end;
        }

      }
    }
    return adjacentTextOrBrNodes;
  };




  private isTextOrBrNode = (node: Node) => {
    return node.nodeType === 3 || node.nodeName === 'BR';
  };

  //Regex Helpers
  private escapeRegExp = (str: string) => {
    return str.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&");
  };

  private escapeRegexReplacementString = (str: string) => {
    return str.replace(/\$/g, "$$$$");
  };

}

interface ParserResponse {
  outputHtml: string;
}

interface NodeSubset {
  type: string;
  nodes: number[];
  nodeValues: string[];
  concated: string;
}

interface MyRange<T> {
  start: T;
  end: T;
}
interface NodeAndIndex {
  nodeNumber: number;
  index: number;
}

interface MathjaxParserConfig {
  inlineMath: string[][]; //e.g. [['$','$'],['\\(','\\)']],
  displayMath: string[][]; //e.g. [['$$','$$'],['\\[','\\]']],
  inlineMathReplacement: string[]; //e.g. ['<span class="inline-math">', '</span>']
  displayMathReplacement: string[] // e.g. ['<span class="display-math">','</span>']
}

enum ExecutionOrder { INLINE_FIRST, DISPLAY_FIRST, CONFLICT}
type MathType = 'inline' | 'display'