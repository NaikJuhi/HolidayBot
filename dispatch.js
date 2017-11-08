'use strict';

const bookFlights=require('./bookFlights');
const validateHotel=require('./validateHotel');
const GreetUser=require('./GreetUser');

module.exports=function(intentRequest, callback)
{

	console.log(`dispatch userId=${intentRequest.userId}, intentName=${intentRequest.currentIntent.name}`);

    const intentName = intentRequest.currentIntent.name;

    // Dispatch to your skill's intent handlers
   if (intentName === 'BookFlight') {
        console.log(intentName + 'was called');
        return bookFlights(intentRequest, callback);
        
     }

     if (intentName === 'BookAHotel') {
        console.log(intentName + 'was called');
        return validateHotel(intentRequest, callback);
        
     }

      if (intentName === 'GreetingsIntent') {
        console.log(intentName + 'was called');
        return GreetUser(intentRequest, callback);
     }
    throw new Error(`Intent with name ${intentName} not supported`);


}