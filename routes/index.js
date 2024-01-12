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
  
  // run additional stats and aggregations
  
  // try to count the number of entries in the provenance description
  object.provenancecount = 0;
  if (object.provenance !== null) {
    object.provenancecount = (object.provenance.match(/\r\n/g) || []).length;
  }

  // append a "pretty print" version of the raw JSON; use to display the JSON directly on a web page
  object.raw = JSON.stringify(object, null, "\t");
  
  // send the data to the template
  res.render('story-templates/basic', {about: applicationInfo, data: object});
});

module.exports = router;
