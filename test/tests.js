QUnit.test( "Simple tests", function( assert ) {


  var config = {
    inlineMath: [['$','$'],['\\(','\\)']],
    displayMath: [['$$','$$'],['\\[','\\]']],
    inlineMathReplacement: ['XXX', 'XXX'],
    displayMathReplacement: ['<span class="display-math">','</span>']
  };
  var parser = new MathjaxParser();
  var html;
  var out;

/*
  //simple inline
  html ="First $test$";
  out = parser.parse(html, config).outputHtml;
  assert.equal( out, 'First XXXtestXXX');

  //shouldnt replace anything
  html ="I thought $<span>it's great$</span>";
  out = parser.parse(html, config).outputHtml;
  assert.equal( out, html);

  //shouldnt replace anything
  html ="I thought $<span>it's great$</span>";
  out = parser.parse(html, config).outputHtml;
  assert.equal( out, html);

  //mixed delims & children
  html ="I $thought$ <span>\\(it's great\\)</span>";
  out = parser.parse(html, config).outputHtml;
  assert.equal( out, "I XXXthoughtXXX <span>XXXit's greatXXX</span>");
*/

  //with br
  html ="Hello $\\frac a b = c <br> =d$";
  out = parser.parse(html, config).outputHtml;
  assert.equal( out, "Hello XXX\\frac a b = c <br> =dXXX");


  //with br and edge case $
  //html ="$How <br> are <br> you$";
  //out = parser.parse(html, config).outputHtml;
  //assert.equal( out, "XXXHow <br> are <br> youXXX");




  /*


   //simple display
   var html ="First $$test$$";
   var out = parser.parse(html, config).outputHtml;
   assert.equal( out, 'First <span class="display-math">test</span>');

   //simple x test 1
   var html ="<p>$x^2 &lt; x$</p>";
   var out = parser.parse(html, config).outputHtml;
   assert.equal( out, '<p><span class="inline-math">x^2 &lt; x</span></p>');

   //simple x test 2
   var html ="<p>&lt;x$</p>";
   var out = parser.parse(html, config).outputHtml;
   assert.equal( out, '<p><span class="inline-math">&lt;x</span></p>');



    //Test separateTextBrSuccessionsFromOtherNodesInChildren
    var div = document.createElement('div');
    div.innerHTML = "<div>hello <br> friend <strong>bu</strong> bla</div>";
    var node = div.firstElementChild;

    console.log(parser.separateTextBrSuccessionsFromOtherNodesInChildren(node));
  */

  /*

  //Test separateTextBrSuccessionsFromOtherNodesInChildren
  var div = document.createElement('div');
  div.innerHTML = "<div>&lt;x</div>";
  var node = div.firstElementChild;
  parser.parse(div.innerHTML, config);

  //console.log(parser.getHtml(node));

  assert.equal(1,1);

  */

});
