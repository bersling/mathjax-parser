declare var $;

class MathjaxParser {

  public parse = (inputHtml: string, config?: MathjaxParserConfig): ParserResponse => {

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

    console.log(str,1)

    mathConstants.forEach(type => {
      type.delimiters.forEach(delim => {
        let expression = this.escapeRegExp(delim[0]) + "(.+?)" + this.escapeRegExp(delim[1]);
        let rx: RegExp = new RegExp(expression, 'g');
        str = str.replace(rx, this.escapeRegexReplacementString(type.replacements[0]) + "$1" +
            this.escapeRegexReplacementString(type.replacements[1]));
      });
    });

    console.log(str, 2);

    return str;
  };


  //separates text-br-successions from other nodes, keeps the order
  //example "hello <br> friend <strong>bu</strong> bla" will be
  //    hello <br> friend          <strong>bu</strong>            bla
  // [{'text-or-br', [0,1,2]}       ,{'other', [3]},        {'text-or-br',[4}]
  private separateTextBrSuccessionsFromOtherNodesInChildren = (node: HTMLElement): NodeSubset[] => {
    let children = $(node).contents();
    let separatedNodes: NodeSubset[] = [];

    if (children.length > 0) {
      let first = children.get(0);

      //init
      let oldType: string;

      children.each((idx:number) => {
        let child = children.get(idx);
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



  //DOM Helpers
  private walkTheDOM = (node, func) => {
    func(node);
    node = node.firstChild;
    while (node) {
      this.walkTheDOM(node, func);
      node = node.nextSibling;
    }
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

  private isTextOrBrNode = (node: HTMLElement | Element) => {
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