var express = require('express');
var router = express.Router();
let URL = require('url');
let HAM = require('@harvardartmuseums/ham');

let ham = new HAM(process.env.HAM_APIKEY);

router.get('/:endpoint', async function(req, res, next) {
    let qs = {
        parameters: {},
        aggregations: {}
    };

    for (var param in req.query) {
        if (param == 'aggregation') {
            qs.aggregations = JSON.parse(req.query[param]);
        } else {
            qs.parameters[param] = req.query[param];
        }
    }
    let results = await ham.search(req.params.endpoint, qs.parameters, qs.aggregations);

    // Rewrite the next and prev URLs according to the data routes used in this application
    // Strip the HAM API key from the query string so it is not exposed across the app
    if (results.info.next) {
        let urlNext = URL.parse(results.info.next);
        qNext = urlNext.query.substring(44);
        results.info.next = `${req.protocol}://${req.get('host')}${req.baseUrl}/${req.params.endpoint}?${qNext}`;
    }
    if (results.info.prev) {
        let urlPrev = URL.parse(results.info.prev);
        qPrev = urlPrev.query.substring(44);
        results.info.prev = `${req.protocol}://${req.get('host')}${req.baseUrl}/${req.params.endpoint}?${qPrev}`;
    }
    
    res.json(results);
});

router.get('/:endpoint/:id', async function(req, res, next) {
    let results = await ham.get(req.params.endpoint, req.params.id);
    res.json(results);
});


module.exports = router;
