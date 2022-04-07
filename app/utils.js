'use strict';

/**
 * Fill params object with the params of request
 * @param  {Request} req
 * @param  {Object} params
 */
function getParamsFromRequest(req, params) {
    // console.log(req.body);
    // console.log(JSON.stringify(req.body));
	if(!req.body) {
		return;
	}
	for(let key in params) {
		if(params.hasOwnProperty(key)) {
			if(req.body[key] != null || req.body[key] != undefined) {
				// set on request
				params[key] = req.body[key];
			}
		}
	}
    return params;
}

module.exports = {
    getParamsFromRequest
};