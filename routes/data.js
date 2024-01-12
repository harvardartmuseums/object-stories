var express = require('express');
var router = express.Router();
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
    res.json(results);
});

router.get('/:endpoint/:id', async function(req, res, next) {
    let results = await ham.get(req.params.endpoint, req.params.id);
    res.json(results);
});


module.exports = router;
