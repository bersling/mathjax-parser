# mathjax-parser

[![Build Status](https://travis-ci.org/bersling/mathjax-parser.svg?branch=master)](https://travis-ci.org/bersling/mathjax-parser)

A simple mathjax parser in order to find and replace occurences of mathjax in a HTML String. No Jquery. Zero Regex. 0 Code Warnings. 10+ unit tests. 

## Installation
```
npm install --save mathjax-parser
```

## Running the parser
```
var parser = new MathjaxParser();
parser.parse(demoString).outputHtml;
```
See the demo.html or the [plunker](https://embed.plnkr.co/h84SUO5jzUayIIEYSfum/).

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
A description of the building-and-thought-process of the parser can be found here: https://www.tsmean.com/articles/math/mathjax-parser-for-html-strings/

