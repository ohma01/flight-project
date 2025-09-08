let Validator = {};

Validator.validateFlightId = function (flightId) {
   // validate the flightId 
   let regex = /^IND-[1-9][0-9]{2}$/
   if(!regex.test(flightId)){
    let err = new Error("Error in flight Id");
    err.status = 406;
    throw err;
   }
}


Validator.validateBookingId = function (bookingId) {
    // validate the bookingId
    if(!(bookingId >=1000 && bookingId <= 9999)){
        let err = new Error("Error in booking Id");
        err.status = 406;
        throw err;
    }
}

module.exports = Validator;