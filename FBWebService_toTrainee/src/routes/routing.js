// import all required modules
const FlightBooking = require('../model/flightBooking.js');
const fBookingService = require('../service/users.js');
const express = require('express');
const router = express.Router();

//implement routing as per the given requirement

router.post('/bookFlight', async (req, res, next) => {
    try {
        let tempObj = req.body;
        let flightBookingObj = new FlightBooking({ ...tempObj });

        let bookingId = await fBookingService.bookFlight(flightBookingObj);

        return res.status(201).json(
            {
                "message":`Flight booking is successful with booking Id: ${bookingId}`
            }
        )
    } catch (error) {
        return next(error);
    }
})

router.get('/getAllBookings',async(req,res,next)=>{
    try {
        let bookings =  await fBookingService.getAllBookings();

        return res.status(200).json(
             bookings    
        )
    } catch (error) {
        return next(error);
    }
})

router.get('/customerBookings/:customerId/:flightId', async(req,res,next)=>{
    try {
        let customerId = parseInt(req.params.customerId);
        let flightId = parseInt(req.params.flightId);

        let bookings = await fBookingService.customerBookingsByFlight(customerId,flightId);

        return res.status(200).json(
            bookings
        )
    } catch (error) {
        return next(error);
    }
})


router.get('/bookingsByFlight/:flightId', async(req,res,next)=>{
    try {
        let flightId = req.params.flightId;

        let bookings = await fBookingService.getbookingsByFlightId(flightId);

        return res.status(200).json(
            bookings
        )
    } catch (error) {
        return next(error);
    }
})

router.put('/updateBooking/:bookingId', async(req,res,next)=>{
    try {
        let bookingId = req.params.bookingId;
        let noOfTickets = req.body.noOfTickets;

        let flight = await fBookingService.updateBooking(bookingId,noOfTickets);

        return res.status(200).json(
            {
                "message" : `Booking successfully updated!! updated flight details ${flight}`
            }
        )
    } catch (error) {
        return next(error);
    }
})

// export routing as module
module.exports = router;
