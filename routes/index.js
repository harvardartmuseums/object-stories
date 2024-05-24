var express = require('express');
var router = express.Router();
let HAM = require('@harvardartmuseums/ham');

let applicationInfo = {
  title: 'Object Stories',
  description: 'Experimental templates for art'
};

let ham = new HAM(process.env.HAM_APIKEY);

/* GET home page. */
router.get('/', async function(req, res, next) {
  res.render('index', { about: applicationInfo });
});

router.get('/object/:id', async function(req, res, next) {
  let object = await ham.Objects.get(req.params.id);

  let template = "basic";
  if (object.classification == "Coins"){
    template = "coins";
    
    // try to cut the description into the obverse and reverse sides
    var startIndex = object.description.indexOf("Obv.: ");
    var endIndex = object.description.indexOf("\r\n\r\n", startIndex);
    if (startIndex !== -1 && endIndex !== -1) {
      // Extract the content between "Obv.: " and "\r\n\r\n"
      object.coinObv = object.description.substring(startIndex + "Obv.: ".length, endIndex);
      object.coinRev = object.description.substring(endIndex + "\r\n\r\nRev.: ".length);
    } else {
      var endIndex = object.description.indexOf("\r\n", startIndex);
      if (startIndex !== -1 && endIndex !== -1){
        object.coinObv = object.description.substring(startIndex + "Obv.: ".length, endIndex);
        object.coinRev = object.description.substring(endIndex + "\r\nRev.: ".length);
      }
    }
  }
  // run additional stats and aggregations
  
  // try to count the number of entries in the provenance description
  object.provenancecount = 0;
  if (object.provenance !== null) {
    object.provenancecount = (object.provenance.match(/\r\n/g) || []).length;
  }

  // try to extract the dimensions of the painting only (not frame)
  var endIndex = object.dimensions.indexOf("framed");
  if (endIndex !== -1) {
    // Extract the content before "framed" 
    object.dimNoFrame = object.dimensions.substring(0, endIndex);
  } else {
    var endIndex = object.dimensions.indexOf("frame");
    if (endIndex !== -1){
      object.dimNoFrame = object.dimensions.substring(0, endIndex);
    }
  }

  // append a "pretty print" version of the raw JSON; use to display the JSON directly on a web page
  object.raw = JSON.stringify(object, null, "\t");
  
  if (object.gallery) {
    let gallery = await ham.Galleries.get(object.gallery.galleryid);
    object.gallery.details = gallery; // can add gallery to line 46
  }
  
  // send the data to the template
  res.render('story-templates/'+template, {about: applicationInfo, data: object});
});

/* GET home page. */
router.get('/', async function(req, res, next) {
  res.render('index', { about: applicationInfo });
});

router.get('/object/:id/coolpage', async function(req, res, next) {
  let object = await ham.Objects.get(req.params.id);

  let params = {image:object.images[0].imageid,q:'type:face AND source:"AWS Rekognition"'};

  let annotations = await ham.Annotations.search(params);
  
  if (annotations.records.length === 1){
    object.pose = annotations["records"][0]["raw"]["Pose"];
  }
  
  // append a "pretty print" version of the raw JSON; use to display the JSON directly on a web page
  object.raw = JSON.stringify(object, null, "\t");

  res.render('story-templates/advanced', {about: applicationInfo, data: object});
});

// router.get('/object/:id', async function(req, res, next) {
//   let object = await ham.Objects.get(req.params.id)

//   // run additional stats and aggregations
  
//   // try to count the number of entries in the provenance description
//   object.provenancecount = 0;
//   if (object.provenance !== null) {
//     object.provenancecount = (object.provenance.match(/\r\n/g) || []).length;
//   }

//   // append a "pretty print" version of the raw JSON; use to display the JSON directly on a web page
//   object.raw = JSON.stringify(object, null, "\t");
  
//   // send the data to the template
//   res.render('story-templates/basic', {about: applicationInfo, data: object});
// });
module.exports = router;