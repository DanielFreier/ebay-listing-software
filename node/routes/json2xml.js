/**
 *  json2xml - Convert an xml2js JSON object back to XML
 *  
 *  @author Derek Anderson
 *  @copyright 2011 Media Upstream
 *  @license MIT License
 *
 *  Usage:
 *
 *      json2xml({"Foo": "@": { "baz": "bar", "production":"true" }}, "Test", function(xml){
 *        console.log(xml); // log the XML data
 *      });    
 *
 */
var json2xml = function(json, root, cb){
  var recursion = 0;
  var xml = '<?xml version="1.0" ?>';
  var isArray = function(obj) { return obj.constructor == Array; };
  
  var parseAttributes = function(node){
    for(key in node){
      var value = node[key];
      xml += ' ' + key +'="'+ value +'"';
    };
    xml += '>';
  };
  
  var parseNode = function(node, parentNode){
    recursion++;
    // Handle Object structures in the JSON properly
    if(!isArray(node)){
      xml += '<'+ parentNode;
      if(typeof node == 'object' && node['@']){
        parseAttributes(node['@']);
      } else {
        xml += '>';
      }
      for(key in node){
        var value = node[key];  
        // text values
        if(typeof value == 'string'){
          if(key === '#'){
            xml += value;
          } else {
            xml += '<'+ key +'>'+ value + '</'+key+'>';
          }
        }
        // is an object
        if(typeof value == 'object' && key != '@'){
          parseNode(node[key], key);
        }
      }
      recursion--;
      xml += '</'+ parentNode +'>';
    }
    
    // Handle array structures in the JSON properly
    if(isArray(node)){
      for(var i=0; i < node.length; i++){
        parseNode(node[i], parentNode);
      }
      recursion--;
    }
    
    if (recursion === 0) { cb(xml); }
  };
  parseNode(json, root); // fire up the parser!
};
