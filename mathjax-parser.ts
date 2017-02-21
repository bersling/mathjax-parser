declare var $;

class MathjaxParser {

  public parse = (inputHtml: string, config?: MathjaxParserConfig): ParserResponse => {

    console.log(inputHtml, 0);

    //set a default config
    config = config || {
          inlineMath: [['$','$'],['\\(','\\)']],
          displayMath: [['$$','$$'],['\\[','\\]']],
          inlineMathReplacement: ['<span class="inline-math" style="color: red">', '</span>'],
          displayMathReplacement: ['<span class="display-math" style="color: blue">','</span>']
        };

    //create a DOM element in order to use the DOM-Walker
    let body: HTMLElement = document.createElement('body');
    body.innerHTML = inputHtml;

    //Walk the DOM applying the mathjax processor to each node
    console.log(body.innerHTML, 1);
    this.walkTheDOM(body, this.mathjaxProcessorFactory(config));

    return {
      outputHtml: body.innerHTML
    };
  };

  private mathjaxProcessorFactory = (config: MathjaxParserConfig) => {
    return (node: HTMLElement) => {
      let separatedNodes: NodeSubset[] = this.separateTextBrSuccessionsFromOtherNodesInChildren(node);

      let separatedNodesAsStrings: string[] = [];
      separatedNodes.forEach(nodeBundle => {
        let str = nodeBundle.concated;

        if (nodeBundle.type === 'text-or-br') {
          //could contain mathjax!
          str = this.parseMathjaxFromTextBrNodeSuccessionString(str, config);
        }
        separatedNodesAsStrings.push(str);
      });

      let newInnerHtml = separatedNodesAsStrings.join("");
      node.innerHTML = newInnerHtml;
    }
  };

  private parseMathjaxFromTextBrNodeSuccessionString = (str: string, config: MathjaxParserConfig): string => {

    let mathConstants = [{
      delimiters: config.displayMath,
      replacements: config.displayMathReplacement
    }, {
      delimiters: config.inlineMath,
      replacements: config.inlineMathReplacement
    }];

    mathConstants.forEach(type => {
      type.delimiters.forEach(delim => {
        let expression = this.escapeRegExp(delim[0]) + "(.+?)" + this.escapeRegExp(delim[1]);
        let rx: RegExp = new RegExp(expression, 'g');
        str = str.replace(rx, this.escapeRegexReplacementString(type.replacements[0]) + "$1" +
            this.escapeRegexReplacementString(type.replacements[1]));
      });
    });

    return str;
  };


  //separates text-br-successions from other nodes, keeps the order
  //example "hello <br> friend <strong>bu</strong> bla" will be
  //    hello <br> friend          <strong>bu</strong>            bla
  // [{'text-or-br', [0,1,2]}       ,{'other', [3]},        {'text-or-br',[4}]
  private separateTextBrSuccessionsFromOtherNodesInChildren = (node: HTMLElement): NodeSubset[] => {
    console.log(node.innerHTML, 3);
    let children = $(node).contents();
    console.log(3.5, children);
    let separatedNodes: NodeSubset[] = [];

    if (children.length > 0) {
      let first = children.get(0);

      //init
      let oldType: string;

      children.each((idx:number) => {
        let child = children.get(idx);
        console.log(4, idx, child, this.getHtml(child), child);
        let newType: string = this.isTextOrBrNode(child) ? 'text-or-br' : 'other';
        if (newType !== oldType) {
          let nodeSubset: NodeSubset = {
            type: newType,
            nodes: <number[]>[],
            nodeValues: <string[]>[],
            concated: ""
          };
          separatedNodes.push(nodeSubset);
        }
        oldType = newType;
        let current: NodeSubset = separatedNodes[separatedNodes.length - 1];
        current.nodes.push(idx);
        current.nodeValues.push(this.getHtml(child));
        current.concated += this.getHtml(child);
      });

    }
    return separatedNodes;
  };

  private sanitize(str) {

  }

  //DOM Helpers
  private walkTheDOM = (node, func) => {
    func(node);
    node = node.firstChild;
    while (node) {
      this.walkTheDOM(node, func);
      node = node.nextSibling;
    }
  };

  private walkTheDomAndOperateOnChildren = (node: Node, func) => {
    var childNodes: NodeList = node.childNodes;
    func(childNodes);
    for (var i = 0; i < childNodes.length; i++) {
      this.walkTheDomAndOperateOnChildren(childNodes[i], func);
    }
  };

  private processNodeList = (nodeList: NodeList) => {
    let allAdjacentTextOrBrNodes: MyRange[] = this.findAdjacentTextOrBrNodes(nodeList);
    allAdjacentTextOrBrNodes.forEach((textOrBrNodeSet: MyRange) => {

      //TODO: replace the matching $...$ in the nodes...
      //either by concating nodes, then doing regex, then inserting the html2dom where old node was...

      //only match $ and not \$!
      //or by iterating through nodes, making a list like [1,1,3,4,5] of all $ occurences, then replacing those occurences

      var inlineMathOccurences = [];
      var displayMathOccurences = [];
      for (var i = textOrBrNodeSet.start; i < textOrBrNodeSet.end; i++) {


      }
    })

  };

  private findAdjacentTextOrBrNodes = (nodeList: NodeList): MyRange[] => {
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
    // [[0,3],[4,5]]
    let adjacentTextOrBrNodes: MyRange[] = [];
    for (let i: number = 0; i < textOrBrNodes.length; i++) {
      let isTextOrBrNode: boolean = textOrBrNodes[i];
      if (isTextOrBrNode) {

        //handle case if IS NOT adjacent: insert new array
        if (adjacentTextOrBrNodes.length === 0 ||
            adjacentTextOrBrNodes[adjacentTextOrBrNodes.length - 1].end !== i) {
          adjacentTextOrBrNodes.push({
            start: i,
            end: i+1
          });
        }

        //handle case if IS adjacent: raise value by one
        else if (adjacentTextOrBrNodes[adjacentTextOrBrNodes.length - 1][1] === i) {
          ++adjacentTextOrBrNodes[adjacentTextOrBrNodes.length - 1].end;
        }

      }
    }
    return adjacentTextOrBrNodes;
  };



  private getHtml = (node: HTMLElement): string => {
    let html: string = "";
    if (node.nodeType === 3) {
      html =  node.nodeValue;
    } else {
      html = node.outerHTML;
    }
    return html
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

interface MyRange {
  start: number;
  end: number;
}