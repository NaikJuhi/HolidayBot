'use strict';

const uuidv1 = require('uuid/v1'); //to generate unique ids
const AWS = require('aws-sdk'); // import entire SDK
const promisify = require("es6-promisify"); // converting callbak to promises
const dynamo = new AWS.DynamoDB.DocumentClient();


// Save Flights Details
module.exports.saveBookingToDatabase=function(source,destination,departdate,departtime) {

	const item={};
	item.bookingId=uuidv1();	
	item.source=source;
	item.destination=destination;
	item.departdate=departdate;
	item.departtime=departtime;

	const params={
		TableName : 'flight-booking-details-table',
		Item:item
	};

	const putAsync=promisify(dynamo.put,dynamo);

	return putAsync(params).then(() => {
    console.log(`saving order ${JSON.stringify(item)}`);
    return item;
  	}).catch((error)=> {
		Promise.resolve(error);
		});
}


// Save Hotel Details

module.exports.saveHotelBookingToDatabase=function(Rating,PickRoomType,PickPaymentOptions,PickCheckinDate,PickCheckoutDate) {

	const item={};
	item.hotelid=uuidv1();	
	item.Rating=Rating;
	item.PickRoomType=PickRoomType;
	item.PickPaymentOptions=PickPaymentOptions;
	item.PickCheckinDate=PickCheckinDate;
	item.PickCheckoutDate=PickCheckoutDate;

	const params={
		TableName : 'booking-hotel-data-table',
		Item:item
	};


	const putAsync=promisify(dynamo.put,dynamo);

	return putAsync(params).then(() => {
    console.log(`saving order ${JSON.stringify(item)}`);
    return item;
  	}).catch((error)=> {
  		console.log(error)
		Promise.resolve(error);
		});


}

// Fetch Flights Details

module.exports.fetchFlightsFromDatabse=function() {

	

   const params = {
    TableName: "flights-details-table",
	};

	const getAsync = promisify(dynamo.scan, dynamo);
  	return getAsync(params).then(response => {
    console.log("Inside callback ");
    return onScanTable(null,response,'flightId','airlines','class');
  });

}


function onScanTable(err, data,itemcode,itemairline,itemclass) {
  var count = 0;
  var resArr=[];
    if (err) {
        console.error("Unable to scan the table. Error JSON:", JSON.stringify(err, null, 2));
    } else {        
        console.log("Scan succeeded.");
        data.Items.forEach(function(itemdata) {
          resArr[resArr.length] =  {"flightId":itemdata[itemcode],"airlines":itemdata[itemairline],"class":itemdata[itemclass]};
           

        });

    }
    console.log("Scan succeeded resArr ."+resArr);
    return resArr;
}	




// Fetch Hotel Details

module.exports.fetchHotelsFromDatabse=function(Rating) {

	const params = {
    TableName: "hotel-details-table",
	};


    const getAsync = promisify(dynamo.scan, dynamo);
  	return getAsync(params).then(response => {
    console.log("Inside callback ");
    return onScanHotelTable(null,response,'hotelid','hotel_name','rating');
  });

}

function onScanHotelTable(err, data,itemcode,itemhotel,itemrating) {
  var count = 0;
  var resArr=[];
    if (err) {
        console.error("Unable to scan the table. Error JSON:", JSON.stringify(err, null, 2));
    } else {        
        console.log("Scan succeeded.");
        data.Items.forEach(function(itemdata) {
          resArr[resArr.length] =  {"hotelid":itemdata[itemcode],"hotel_name":itemdata[itemhotel],"rating":itemdata[itemrating]};
           console.log("Item fetched @@@@@@@@@@@@:", ++count,JSON.stringify(itemdata));

        });

    }
    console.log("Scan succeeded resArr ."+resArr);
    return resArr;
}	