//import required modules
const flightBookingDb = require('../model/users.js')
const validator = require('../utilities/validator.js')

let fBookingService = {}


fBookingService.bookFlight = async (flightBooking) => {
    try {
        validator.validateFlightId(flightBooking.flightId)
        const customerDetails = await flightBookingDb.checkCustomer(flightBooking.customerId)
        if (!customerDetails) {
            let err = new Error("Customer not registered. Register to proceed");
            err.status = 404;
            throw err;

        } else {
            let flight = await flightBookingDb.checkAvailability(flightBooking.flightId);
            if (!flight) {
                let err = new Error("Flight Unavailable");
                err.status = 404;
                throw err;
            } else {

                if (flight.status === "Cancelled") {
                    let err = new Error(`Sorry for the Inconvinience... ${flight.flightId} is cancelled!!`);
                    err.status = 400;
                    throw err;
                }

                if (flight.availableSeats === 0) {
                    let err = new Error(`Flight ${flight.flightId} is already full!!`);
                    err.status = 400;
                    throw err;
                }

                if (flight.availableSeats < flightBooking.noOfTickets) {
                    let err = new Error(`Flight almost Full... Only ${flight.availableSeats} left!!`);
                    err.status = 406;
                    throw err;
                }

                let bookingCost = flightBooking.noOfTickets * flight.fare;
                // Assign booking cost to flightBooking object
                flightBooking.bookingCost = bookingCost;
                let amountNeeded = bookingCost - flightBooking.walletAmount
                if (bookingCost > flightBooking.walletAmount) {
                    let err = new Error(`Insufficient Wallet Amount. Add more Rs. ${amountNeeded} to continue booking`);
                    err.status = 406;
                    throw err;
                }

                let bookingId = await flightBookingDb.bookFlight(flightBooking);
                return bookingId;
            }
        }


    } catch (error) {
        throw error;
    }
}

fBookingService.getAllBookings = async () => {
    try {
        let bookingDetails = await flightBookingDb.getAllBookings();

        if (!bookingDetails) {
            let err = new Error("No Bookings is found in any flight");
            err.status = 404;
            throw err;
        } else {

            return bookingDetails;
        }
    } catch (error) {
        throw error;
    }
}

fBookingService.customerBookingsByFlight = async (customerId, flightId) => {
    try {
        let customerDetails = await flightBookingDb.checkCustomer(customerId);

        if (!customerDetails) {
            let err = new Error("Customer not found");
            err.status = 404;
            throw err;
        } else {

            let flight = await flightBookingDb.checkAvailability(flightId);
            if (!flight) {
                let err = new Error("Flight detail not found");
                err.status = 404;
                throw err;
            } else {

                let bookingDetails = await flightBookingDb.customerBookingsByFlight(customerId, flightId);
                if (!bookingDetails) {
                    let err = new Error(`No Bookings found for ${customerId} in ${flightId}`);
                    err.status = 404;
                    throw err;

                } else {
                    return bookingDetails;
                }
            }
        }
    } catch (error) {
        throw error;
    }
}

fBookingService.getbookingsByFlightId = async (flightId) => {
    try {
        let bookings = await flightBookingDb.getbookingsByFlightId(flightId);

        if (!bookings) {
            let err = new Error(`No Bookings found in ${flightId}`);
            err.status = 404;
            throw err;
        } else {
            return bookings;
        }
    } catch (error) {
        throw error;
    }
}

fBookingService.updateBooking = async (bookingId, noOfTickets) => {
    try {

        let flight = await flightBookingDb.checkBooking(bookingId);
        if (!flight) {
            let err = new Error(`No Bookings with bookingId ${bookingId}`);
            err.status = 404;
            throw err;
        } else {

            if (flight.status === "Cancelled") {
                let err = new Error(`Sorry for the Inconvenience... ${flight.flightId} has been cancelled!!`);
                err.status = 406;
                throw err;
            }

            if (flight.availableSeats === 0) {
                let err = new Error(`Flight is already Full. Can't Book more tickets`);
                err.status = 406;
                throw err;
            }

            if (flight.availableSeats < noOfTickets) {
                let err = new Error(`Flight almost Full. Only  ${flight.availableSeats} seat left`);
                err.status = 406;
                throw err;
            }

            let customerId = flight.bookings.find(booking => booking.bookingId === bookingId).customerId;
            let customer = await flightBookingDb.checkCustomer(customerId);

            // addiional check usually not needed but its a good practice 
            if (!customer) {
                let err = new Error("Customer not found");
                err.status = 404;
                throw err;
            }


            let fare = flight.fare;
            let additionalCost = fare * noOfTickets;

            let amountNeeded = additionalCost - customer.walletAmount;
            if (additionalCost > customer.walletAmount) {
                let err = new Error(`Insufficient Wallet Amount. Add more Rs. ${amountNeeded} to continue booking`);
                err.status = 406;
                throw err;
            }

            let updateBooking = await flightBookingDb.updateBooking(bookingId, noOfTickets);
            if (!updateBooking) {
                let err = new Error("Update failed");
                err.status = 502;
                throw err;
            } else {
                return updateBooking;
            }
        }

    } catch (error) {
        throw error;
    }
}

module.exports = fBookingService;