'use strict';

const lexResponses=require('./lexResponses');
const databaseManager=require('./databaseManager');

const validCities = ['new york', 'los angeles', 'chicago', 'houston', 'philadelphia', 'phoenix', 'san antonio', 'san diego', 'dallas', 'san jose','austin', 'jacksonville', 'san francisco', 'indianapolis', 'columbus', 'fort worth', 'charlotte', 'detroit', 'el paso', 'seattle', 'denver', 'washington dc',
  'memphis', 'boston', 'nashville', 'baltimore', 'portland','mumbai','pune','delhi','bangalore','chennai','jaipur','patna','surat','hyderabad'];

const validResp = ['yes','ok','yup'];

function buildFulfilmentResult(fullfilmentState,messageContent)
{
  return {
  fullfilmentState,
  message :{contentType:'PlainText',content :messageContent}
  }
}


function fetchCheapFlights() 
{
	var mydata= new Array();
  return databaseManager.fetchFlightsFromDatabse().then(item => 
  {
      for (var ii in item) {
      ii = item[ii];

      mydata[mydata.length] =ii.airlines+"   "+ii.class;
      }

      return mydata;
  });
  
}

function fulfillBooking(source,destination,departdate,departtime) 
{
  return databaseManager.saveBookingToDatabase(source,destination,departdate,departtime).then(item => 
  {
   
    return buildFulfilmentResult('Fulfilled', `Thank your flight has been booked with booking id ${item.bookingId}`);
  });
}


function buildValidationResult(isValid, violatedSlot, messageContent) 
{
  if (messageContent == null) {
  return {
    isValid,
    violatedSlot
    };
  }
  return {
    isValid,
    violatedSlot,
    message: { contentType: 'PlainText', content: messageContent },
  };
}


function parseLocalDate(date) 
{
  /**
  * Construct a date object in the local timezone by parsing the input date string, assuming a YYYY-MM-DD format.
  * Note that the Date(dateString) constructor is explicitly avoided as it may implicitly assume a UTC timezone.
  */
  const dateComponents = date.split(/\-/);
  return new Date(dateComponents[0], dateComponents[1] - 1, dateComponents[2]);
}

function isValidDate(DepartDate) 
{
  try {
  return !(isNaN(parseLocalDate(DepartDate).getTime()));
  } catch (err) {
  return false;
  }
}

function isValidCity(city) 
{
  return (validCities.indexOf(city.toLowerCase()) > -1);
}

function CheckResp(flightdetails) 
{
  return (validResp.indexOf(flightdetails.toLowerCase()) > -1);
}

function validateBookFlight(flyTo,flyFrom,flightdetails,DepartDate) 
{
    if (flyTo && !isValidCity(flyTo)) {
      return buildValidationResult(false, 'flyTo', `We currently do not support ${flyTo} as a valid destination. Can you try a different city?`);
    }

    if (flyFrom && !isValidCity(flyFrom)) {
      return buildValidationResult(false, 'flyFrom', `We currently do not support ${flyFrom} as a valid source. Can you try a different city?`);
    }


    if (DepartDate) {
      if (!isValidDate(DepartDate)) {
      return buildValidationResult(false, 'DepartDate', 'I did not understand your departure date. When would you like to Depart?');
      } 
    } 

    if (flyFrom && flyFrom==flyTo) {
      return buildValidationResult(false, 'flyFrom', 'Source and Destination cities cannot be same,please try a different city');
    }

    if (flightdetails && CheckResp(flightdetails)) {
      return buildValidationResult(false, 'flightdetails', `These are the cheapest flights available..Please select an airline from following details : \r\n `);
    }
    return buildValidationResult(true, null, null);
}

module.exports=function(intentRequest, callback)
{
    const flyTo = intentRequest.currentIntent.slots.flyTo;
    const flyFrom = intentRequest.currentIntent.slots.flyFrom;
    const DepartDate = intentRequest.currentIntent.slots.DepartDate;
    const DepartTime = intentRequest.currentIntent.slots.DepartTime;
    const flightdetails= intentRequest.currentIntent.slots.flightdetails;
    const slots = intentRequest.currentIntent.slots;
   

    const source = intentRequest.invocationSource;

   
    if (source === 'DialogCodeHook') 
    {
      const validationResult = validateBookFlight(flyTo,flyFrom,flightdetails,DepartDate);
     
      if (!validationResult.isValid) 
      {
        if(validationResult.violatedSlot === 'flightdetails')
        {
       

        return fetchCheapFlights().then(fetchflights => {
       
        validationResult.message.content=validationResult.message.content+' '+fetchflights.join("\r\n");
        slots[`${validationResult.violatedSlot}`] = null;
        callback(lexResponses.elicitSlot(intentRequest.sessionAttributes,intentRequest.currentIntent.name,slots,validationResult.violatedSlot,validationResult.message));
        return; });

        }
        else
        {
        slots[`${validationResult.violatedSlot}`] = null;
        callback(lexResponses.elicitSlot(intentRequest.sessionAttributes,intentRequest.currentIntent.name,slots,validationResult.violatedSlot, validationResult.message));
        return;
        }
      }

     
      callback(lexResponses.delegate(intentRequest.sessionAttributes,intentRequest.currentIntent.slots));
      return;
    }


    if (source === 'FulfillmentCodeHook') 
    {
      
      return fulfillBooking(flyFrom,flyTo,DepartDate,DepartTime).then(fullfiledOrder => {
     
      callback(lexResponses.close(intentRequest.sessionAttributes,fullfiledOrder.fullfilmentState,fullfiledOrder.message));
      return;

      });

      callback(lexResponses.close(intentRequest.sessionAttributes,'Fulfilled',{contentType: 'PlainText', content: `Your flight has been booked.Thank you.Please visit again.` }));
    }

}