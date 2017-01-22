interface MathjaxParserConfig {

  inlineMath: string[][]; //e.g. [['$','$'],['\\(','\\)']],
  displayMath: string[][]; //e.g. [['$$','$$'],['\\[','\\]']],
  inlineMathReplacement: string[]; //e.g. ['<span class="inline-math">', '</span>']
  displayMathReplacement: string[] // e.g. ['<span class="display-math">','</span>']

}
