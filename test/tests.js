(function() {

  var config = {
    inlineMath: [['$','$'],['\\(','\\)']],
    displayMath: [['$$','$$'],['\\[','\\]']],
    inlineMathReplacement: ['XXX', 'XXX'],
    displayMathReplacement: ['YYY','ZZZ']
  };
  var parser = new MathjaxParser();
  var html;
  var out;

  QUnit.test( "Inline Math Tests", function( assert ) {

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

    //mixed delims
    html ="I $thought$ that \\(it's great\\)";
    out = parser.parse(html, config).outputHtml;
    assert.equal( out, "I XXXthoughtXXX that XXXit's greatXXX");

    //with br
    html ="Hello $\\frac a b = c <br> =d$";
    out = parser.parse(html, config).outputHtml;
    assert.equal( out, "Hello XXX\\frac a b = c <br> =dXXX");

    //$ on edges
    html = "$How you$";
    out = parser.parse(html, config).outputHtml;
    assert.equal( out, "XXXHow youXXX");

    //children
    html = "I $thought$ <span>\\(it's great\\) however <b>$bla$</b> </span>";
    out = parser.parse(html, config).outputHtml;
    assert.equal( out, "I XXXthoughtXXX <span>XXXit's greatXXX however <b>XXXblaXXX</b> </span>");

    //simple inline
    html ="First $&lt;x$";
    out = parser.parse(html, config).outputHtml;
    assert.equal( out, 'First XXX&lt;xXXX');

    //block test
    html ="First $$test$$";
    out = parser.parse(html, config).outputHtml;
    assert.equal( out, 'First YYYtestZZZ');

    //with less than sign
    html ="<p>$&lt;x$</p>";
    out = parser.parse(html, config).outputHtml;
    assert.equal( out, '<p>XXX&lt;xXXX</p>');

  });

})();