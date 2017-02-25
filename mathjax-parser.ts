class MathjaxParser {

  public parse = (inputHtml: string, config?: MathjaxParserConfig): ParserResponse => {

    //set a default config
    this.config = config || {
          inlineMath: [['$','$'],['\\(','\\)']],
          displayMath: [['$$','$$'],['\\[','\\]']],
          inlineMathReplacement: ['XXX', 'XXX'],
          displayMathReplacement: ['YYY','YYY']
        };

    //create a DOM element in order to use the DOM-Walker
    let body: HTMLElement = document.createElement('body');
    body.innerHTML = inputHtml;

    this.processNodeList(body.childNodes, this.buildDelimiterArray(config));

    return {
      outputHtml: body.innerHTML
    };

  };

  private config;

  private buildDelimiterArray(config): DelimiterGroup[]  {
    let delimiterArray: DelimiterGroup[] = [];
    let insertAtIndex = (idx: number, delimiterArray, grp: string[], type: string) => {

      delimiterArray.splice(idx, 0, {
        group: grp,
        type: type
      });
    };
    let findIndex = (delimiterArray: DelimiterGroup[], startDelimiter: string): number => {
      let index = 0;
      for (let i = 0; i < delimiterArray.length; i++) {
        if (startDelimiter.indexOf(delimiterArray[i].group[0]) > -1) {
          break;
        }
        ++index;
      }
      return index;
    };

    config.inlineMath.forEach(grp => {
      let idx = findIndex(delimiterArray, grp[0]);
      insertAtIndex(idx, delimiterArray, grp, 'inline');
    });
    config.displayMath.forEach(grp => {
      let idx = findIndex(delimiterArray, grp[0]);
      insertAtIndex(idx, delimiterArray, grp, 'display');
    });
    return delimiterArray;
  }

  private processNodeList = (nodeList: NodeList, delimiterArray: DelimiterGroup[]) => {

    let allAdjacentTextOrBrNodes: MyRange<number>[] = this.findAdjacentTextOrBrNodes(nodeList);

    allAdjacentTextOrBrNodes.forEach((textOrBrNodeSet: MyRange<number>) => {
      this.iterateMath(delimiterArray, textOrBrNodeSet, nodeList);
    });

    //process children
    for (let i: number = 0; i < nodeList.length; i++) {
      let node: Node = nodeList[i];
      
      //only need to process non-text nodes
      if (node.nodeType !== 3) {
        this.processNodeList(node.childNodes, delimiterArray); 
      }
      
    }

  };

  private isMatchingIndex = (text: string, idx: number, delim: string):  boolean => {
    return text.substr(idx, delim.length) === delim;
  };

  private iterateMath(delimiterArray: DelimiterGroup[], textOrBrNodeSet: MyRange<number>, nodeList: NodeList) {
    //Iterate through all delimiters, trying to find matching delimiters
    let state: CurrentState = {
      matchedDelimiterSets: []
    };

    for (let nodeNumber = textOrBrNodeSet.start; nodeNumber < textOrBrNodeSet.end; nodeNumber++) {
      let node: Node = nodeList[nodeNumber];

      //for the text nodes (type 3), other nodes dont matter
      if (node.nodeType === 3) {

        const textContent: string = node.textContent;

        //check every index if matches a delimiter group
        this.processIndices(textContent, state, delimiterArray, nodeNumber);

      }
    }

    this.cleanOccurences(state.matchedDelimiterSets);

    //REPLACE ALL MATCHED DELIMITERS WITH REPLACEMENTS
    this.replaceMatches(state.matchedDelimiterSets, nodeList);

  }

  private replaceMatches(matchedDelimiterSets: MyRange<DelimiterMatch>[], nodeList: NodeList) {
    matchedDelimiterSets = matchedDelimiterSets.reverse(); // work the array back to from so indexes don't get messed up
    matchedDelimiterSets.forEach((delimiterSet: MyRange<DelimiterMatch>) => {
      this.replaceStartAndEndOfMatchedSet(delimiterSet, nodeList);
    });
  }

  private processIndices(textContent: string, state: CurrentState,
                         delimiterArray: DelimiterGroup[], nodeNumber: number) {

    let idx = 0;
    while (idx < textContent.length) {

      //if all occurences of delimiters so far are closed (i.e. have 'end') and we're looking for a new opening delimiter
      if (state.matchedDelimiterSets.length === 0 ||
          state.matchedDelimiterSets[state.matchedDelimiterSets.length - 1].end) {

        delimiterArray.some(delimiterGroup => {
          if (this.isMatchingIndex(textContent, idx, delimiterGroup.group[0])) {
            state.lastMatchedGroup = delimiterGroup;
            //TODO: correct escapes for $ special case...
            this.pushStart(state.matchedDelimiterSets, nodeNumber, idx, delimiterGroup);
            return true;
          }
        });
      }

      //if start matched, but end not matched yet
      else {
        if (this.isMatchingIndex(textContent, idx, state.lastMatchedGroup.group[1])) {
          this.pushEnd(state.matchedDelimiterSets, nodeNumber, idx, state.lastMatchedGroup);
        }

      }
      ++idx;

    }
  }

  private replaceStartAndEndOfMatchedSet = (delimiterSet: MyRange<DelimiterMatch>, nodeList: NodeList) => {

    //handle end FIRST
    this.replaceDelims(nodeList, delimiterSet.end);

    //handle start
    this.replaceDelims(nodeList, delimiterSet.start);

  };

  private cleanOccurences = (occurences: MyRange<DelimiterMatch>[]) => {
    if (occurences.length > 0) {
      if (!occurences[occurences.length - 1].end) {
        occurences.pop();
      }
    }
  };

  private replaceDelims = (nodeList: NodeList, delimiterMatch: DelimiterMatch) => {

    const oldDelimLength = delimiterMatch.isStart ?
        delimiterMatch.delimiterGroup.group[0].length : delimiterMatch.delimiterGroup.group[1].length;

    const nodeVal = nodeList[delimiterMatch.nodeNumber].nodeValue;

    //insert the new delimiter while removing the old delimiter
    nodeList[delimiterMatch.nodeNumber].nodeValue =

        //string start
        nodeVal.substr(0, delimiterMatch.index) +
            //replacement string
        this.config[delimiterMatch.delimiterGroup.type + 'MathReplacement'][delimiterMatch.isStart ? 0 : 1] +
            //string rest
        nodeVal.substr(delimiterMatch.index + oldDelimLength, nodeVal.length - 1);
  };

  private pushStart(matchedDelimiterSets: MyRange<DelimiterMatch>[], nodeNumber: number, idx: number, delimiterGroup: DelimiterGroup) {
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

  private pushEnd(matchedDelimiterSets: MyRange<DelimiterMatch>[], nodeNumber: number, idx: number, delimiterGroup: DelimiterGroup) {
    matchedDelimiterSets[matchedDelimiterSets.length - 1].end = {
      nodeNumber: nodeNumber,
      index: idx,
      delimiterGroup: delimiterGroup,
      isStart: false
    };
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

}

interface ParserResponse {
  outputHtml: string;
}

interface MyRange<T> {
  start: T;
  end: T;
}
interface DelimiterMatch {
  nodeNumber: number;
  index: number;
  isStart: boolean;
  delimiterGroup: DelimiterGroup;
}

interface MathjaxParserConfig {
  inlineMath: string[][]; //e.g. [['$','$'],['\\(','\\)']],
  displayMath: string[][]; //e.g. [['$$','$$'],['\\[','\\]']],
  inlineMathReplacement: string[]; //e.g. ['<span class="inline-math">', '</span>']
  displayMathReplacement: string[] // e.g. ['<span class="display-math">','</span>']
}

interface DelimiterGroup {
  group: string[];
  type: MathType;
}

interface CurrentState {
  matchedDelimiterSets: MyRange<DelimiterMatch>[];
  lastMatchedGroup?: DelimiterGroup;
}

type MathType = 'inline' | 'display'