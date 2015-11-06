function clickColor(hex, seltop, selleft, html5) {
  clearWrongInput();
  hh = 1;
  var colorrgb, colornam = "", xhttp, c, r, g, b, i;
  if (html5 && html5 == 5)	{
    c = document.getElementById("html5colorpicker").value;
  } else {
    if (hex == 0)	{
      c = document.getElementById("entercolor").value;
    } else {
      c = hex;
    }
  }
  if (c.substr(0,1) == "#")	{
    c = c.substr(1);
  }
  c = c.replace(/;/g, "");
  if (c.indexOf(",") > -1 || c.toLowerCase().indexOf("rgb") > -1 || c.indexOf("(") > -1) {
    c = c.replace(/rgb/i, "");
    c = c.replace("(", "");
    c = c.replace(")", "");
    c = rgbToHex(c);
    if (c == -1) {wrongInput(); return;}
  }
  colorhex = c;
  if (colorhex.length == 3) {colorhex = colorhex.substr(0,1) + colorhex.substr(0,1) + colorhex.substr(1,1) + colorhex.substr(1,1) + colorhex.substr(2,1) + colorhex.substr(2,1); }
  colorhex = colorhex.substr(0,6);
//    if (hexArr.length == 0) {checkColorValue(); }
  for (i = 0; i < hexArr.length; i++) {
    if (c.toLowerCase() == hexArr[i].toLowerCase()) {
      colornam = namArr[i];
      break;
    }
    if (c.toLowerCase() == namArr[i].toLowerCase()) {
      colorhex = hexArr[i];
      colornam = namArr[i];
      break;
    }
    if (c == rgbArr[i]) {
      colorhex = hexArr[i];
      colornam = namArr[i];
      break;
    }
  }
  colorhex = colorhex.substr(0,10);
  colorhex = colorhex.toUpperCase();
  r = HexToR(colorhex);
  g = HexToG(colorhex);
  b = HexToB(colorhex);
  if (isNaN(r) || isNaN(g) || isNaN(b)) {wrongInput(); return;}
  document.getElementById("colorhexDIV").innerHTML = "#" + colorhex;
  document.getElementById("colorrgbDIV").innerHTML = "rgb(" + r + ", " + g + ", " + b + ")";
  document.getElementById("colornamDIV").innerHTML = colornam;
  if ((seltop+199)>-1 && selleft>-1) {
    document.getElementById("selectedhexagon").style.top=seltop + "px";
    document.getElementById("selectedhexagon").style.left=selleft + "px";
    document.getElementById("selectedhexagon").style.visibility="visible";
  } else {
    document.getElementById("divpreview").style.backgroundColor = "#" + colorhex;
    document.getElementById("selectedhexagon").style.visibility = "hidden";
  }
  document.getElementById("selectedcolor").style.backgroundColor = "#" + colorhex;
  document.getElementById("html5colorpicker").value = "#" + colorhex;

  document.getElementById('trio1').style.backgroundColor = "rgb(" + r + "," + g + "," + b + ")";
  document.getElementById('trio2').style.backgroundColor = "rgb(" + b + "," + r + "," + g + ")";
  document.getElementById('trio3').style.backgroundColor = "rgb(" + g + "," + b + "," + r + ")";
  document.getElementById('triotxt1').innerHTML = "#" + rgbToHex(r + "," + g + "," + b);
  document.getElementById('triotxt2').innerHTML = "#" + rgbToHex(b + "," + r + "," + g);
  document.getElementById('triotxt3').innerHTML = "#" + rgbToHex(g + "," + b + "," + r);
  document.getElementById('comp1').style.backgroundColor = "rgb(" + r + "," + g + "," + b + ")";
  document.getElementById('comp1txt').innerHTML = "#" + rgbToHex(r + "," + g + "," + b);
  b1=255-r;b2=255-g;b3=255-b;
  document.getElementById('comp2').style.backgroundColor = "rgb(" + b1 + "," + b2 + "," + b3 + ")";
  document.getElementById('comp2txt').innerHTML = "#" + rgbToHex(b1 + "," + b2 + "," + b3);
  document.getElementById('slideRed').value = r;
  document.getElementById('slideGreen').value = g;
  document.getElementById('slideBlue').value = b;
  for (i = 0; i < 12; i++) {
    document.getElementById('spi' + i).style.backgroundColor = tinycolor(colorhex).spin(i*30).toString();
    document.getElementById('spitxt' + i).innerHTML = tinycolor(colorhex).spin(i*30);
  }
  changeRed(r);changeGreen(g);changeBlue(b);
  changeLight(100);changeDark(100);//changeSaturation(100);changeGrey(100);
}