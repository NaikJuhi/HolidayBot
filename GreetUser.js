'use strict';

const lexResponses=require('./lexResponses');

module.exports=function(intentRequest, callback)
{
	const source = intentRequest.invocationSource;

	if (source === 'FulfillmentCodeHook') {

		callback(lexResponses.close(intentRequest.sessionAttributes,'Fulfilled',null));
   	}
}