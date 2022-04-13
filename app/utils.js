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

function uuidv4() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

module.exports = {
    getParamsFromRequest,
	uuidv4,
};