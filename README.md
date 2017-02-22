# mathjax-parser

A simple mathjax parser in order to find and replace occurences of mathjax in a HTML.

## Installation
You can install this to your codebase in multiple ways.

### Bower
bower install --save mathjax-parser

### NPM
npm install --save mathjax-parser

### Just get the JS
Download mathjax-parser.js and include the script tag

## Running the parser
```
var parser = new MathjaxParser();
parser.parse(demoString).outputHtml;
```
(see the demo.html)

## Providing a configuration
Running the parser without a configuration is a bit pointless. Provide it with a config that looks like this:
```
var parser = new MathjaxParser();

var config = {
          inlineMath: [['$','$'],['\\(','\\)']],
          displayMath: [['$$','$$'],['\\[','\\]']],
          inlineMathReplacement: ['XXX', 'XXX'],
          displayMathReplacement: ['YYY','ZZZ']
        }

parser.parse(demoString, config).outputHtml;
```

## Thoughts behind the parser
A description of the building-and-thought-process of the parser can be found here: https://www.bersling.com/2017/01/22/mathjax-parser-for-html-strings/

