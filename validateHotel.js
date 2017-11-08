'use strict';

const lexResponses=require('./lexResponses');
const databaseManager=require('./databaseManager');

const validResp = ['yes','ok','yup'];
function buildHotelFulfilmentResult(fullfilmentState,messageContent)
{
  return {
    fullfilmentState,
    message :{contentType:'PlainText',content :messageContent}
  }
}


function fetchTopHotels(Rating,PickCheckinDate,PickCheckoutDate) 
{
  var myhoteldata= new Array();
  return databaseManager.fetchHotelsFromDatabse(Rating).then(item => {
  

	for (var ii in item) {
	ii = item[ii];
		myhoteldata[myhoteldata.length] =ii.hotel_name+"\r\n";
	}

	//console.log("myhoteldata "+myhoteldata.join("\r\n"));
	return myhoteldata;

	});
}

function fulfillHotelBooking(Rating,PickRoomType,PickPaymentOptions,PickCheckinDate,PickCheckoutDate) 
{
	return databaseManager.saveHotelBookingToDatabase(Rating,PickRoomType,PickPaymentOptions,PickCheckinDate,PickCheckoutDate).then(item => {
    
	return buildHotelFulfilmentResult('Fulfilled', `Thank you.Your hotel has been booked with booking id ${item.hotelid}`);
  });
}


function buildValidationResult(isValid, violatedSlot, messageContent) {
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


function MinRating(Rating) 
{
    const MinimumRating = ['3','4','5'];
    return (MinimumRating.indexOf(Rating.toLowerCase()) > -1);
}

function ChkRoomType(RoomType) 
{
   const RoomTypeOptions = ['regular','delux','super delux'];
   return (RoomTypeOptions.indexOf(RoomType.toLowerCase()) > -1);
}

function ChkPaymentOpt(Payopt) 
{
	const PayoptOptions = ['on checkin','post checkout','oncheckin','postcheckout'];
    return (PayoptOptions.indexOf(Payopt.toLowerCase()) > -1);
}

function CheckResp(hoteldetails) 
{
  return (validResp.indexOf(hoteldetails.toLowerCase()) > -1);
}

function isValidateHotel(Rating, RoomType, Payopt,checkInDate,checkoutDate,hoteldetails)
{

	if (Rating && !MinRating(Rating)) 
	{
        return buildValidationResult(false, 'MinRating', `We serve hotels with ratings between 3 to 5`);
	}
	if (RoomType && !ChkRoomType(RoomType)) 
	{
		return buildValidationResult(false, 'PickRoomType', `We provide rooms of these categories : Regular,Delux and Super Delux`);
	}
	if (Payopt && !ChkPaymentOpt(Payopt)) 
	{
		return buildValidationResult(false, 'PickPaymentOptions', `We have only three Payment Options : On Checkin, Post Checkout`);
	}

  if (hoteldetails && CheckResp(hoteldetails)) {
      return buildValidationResult(false, 'hoteldetails', `These are the top Hotels available..Please select a hotel from following details : \r\n `);
  }
  return buildValidationResult(true, null, null);
}

module.exports=function(intentRequest, callback)
{
	const Rating = intentRequest.currentIntent.slots.MinRating;
    const PickRoomType = intentRequest.currentIntent.slots.PickRoomType;
    const PickPaymentOptions = intentRequest.currentIntent.slots.PickPaymentOptions;
	const PickCheckinDate = intentRequest.currentIntent.slots.PickCheckinDate;
    const PickCheckoutDate = intentRequest.currentIntent.slots.PickCheckoutDate;
    const hoteldetails= intentRequest.currentIntent.slots.hoteldetails;
	const source = intentRequest.invocationSource;

    if (source === 'DialogCodeHook') {

      const slots = intentRequest.currentIntent.slots;
        const validationResult = isValidateHotel(Rating,PickRoomType,PickPaymentOptions,PickCheckinDate,PickCheckoutDate,hoteldetails);

      if (!validationResult.isValid) 
      {
          if(validationResult.violatedSlot === 'hoteldetails')
          {
              return fetchTopHotels(Rating,PickCheckinDate,PickCheckoutDate).then(fetchTopHotels => {
             
               validationResult.message.content=validationResult.message.content+' '+fetchTopHotels.join("\r\n");
               slots[`${validationResult.violatedSlot}`] = null;
               callback(lexResponses.elicitSlot(intentRequest.sessionAttributes,intentRequest.currentIntent.name,slots,validationResult.violatedSlot,validationResult.message));
                return;
               });

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

    if (source === 'FulfillmentCodeHook') {

      return fulfillHotelBooking(Rating,PickRoomType,PickPaymentOptions,PickCheckinDate,PickCheckoutDate).then(fullfiledOrder => {
    
      callback(lexResponses.close(intentRequest.sessionAttributes,fullfiledOrder.fullfilmentState,fullfiledOrder.message));
      return;

      });

      callback(lexResponses.close(intentRequest.sessionAttributes,'Fulfilled',{contentType: 'PlainText', content: `Your hotel has been booked.Thank you.Please visit again.` }));
    }


}

