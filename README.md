# mathjax-parser

A simple mathjax parser in order to find and replace occurences of mathjax in a HTML.

## Installation
You can install this to your codebase in multiple ways.

### Bower
bower install --save mathjax-parser

### Just get the JS
Download mathjax-parser.js and include the script tag

## Running the parser
```
var parser = new MathjaxParser();
parser.parse(demoString).outputHtml;
```
(see the demo.html)
