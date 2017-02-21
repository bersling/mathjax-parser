QUnit.test( "Simple tests", function( assert ) {

  var config = {
    inlineMath: [['$','$'],['\\(','\\)']],
    displayMath: [['$$','$$'],['\\[','\\]']],
    inlineMathReplacement: ['<span class="inline-math">', '</span>'],
    displayMathReplacement: ['<span class="display-math">','</span>']
  };
  var parser = new MathjaxParser();

  //simple display
  var html ="First $$test$$";
  var out = parser.parse(html, config).outputHtml;
  assert.equal( out, 'First <span class="display-math">test</span>');

  //simple inline
  var html ="First $test$";
  var out = parser.parse(html, config).outputHtml;
  assert.equal( out, 'First <span class="inline-math">test</span>');

  //simple x test 1
  var html ="<p>$x^2 &lt; x$</p>";
  var out = parser.parse(html, config).outputHtml;
  assert.equal( out, '<p><span class="inline-math">x^2 &lt; x</span></p>');


});