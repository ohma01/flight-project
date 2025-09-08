const dbModel = require('../utilities/connection');
const FlightBooking = require('./flightBooking');

const flightBookingDb = {}
//Do not modify or remove this method
flightBookingDb.generateId = async () => {
    let model = await dbModel.getFlightCollection();
    let ids = await model.distinct("bookings.bookingId");
    let bId = Math.max(...ids);
    return bId + 1;
}

flightBookingDb.checkCustomer = async (customerId) => {
    //fetch the customer object for the given customer Id
    let model = await dbModel.getCustomerCollection();
    let customer = await model.findOne({ customerId: customerId })
    if (customer) {
        return customer;
    } else {
        return null;
    }
}


flightBookingDb.checkBooking = async (bookingId) => {
    // fetch flight object which has the booking with the given bookingId
    let model = await dbModel.getFlightCollection();
    let flight = await model.findOne({ bookingId: bookingId });
    if (flight) {
        return flight;
    } else {
        return null;
    }
}

flightBookingDb.checkAvailability = async (flightId) => {
    // fetch the flight object for the given flight Id
    let model = await dbModel.getFlightCollection();
    let flight = await model.findOne({ flightId: flightId });
    if (flight) {
        return flight;
    } else {
        return null;
    }
}

flightBookingDb.updateCustomerWallet = async (customerId, bookingCost) => {
    // update customer wallet by reducing the bookingCost with the wallet amount for the given customerId
    let model = await dbModel.getCustomerCollection();
    let updated = await model.findOneAndUpdate(
        { customerId: customerId },
        { $inc: { walletAmount: -bookingCost } },
        { new: true, runValidators: true }
    )

    if (updated) {
        return true;
    } else {
        return false;
    }
}

flightBookingDb.bookFlight = async (flightBooking) => {
    // book a flight ticket
    let model = await dbModel.getFlightCollection();
    let bookingId = flightBookingDb.generateId();

    let { customerId, noOfTickets, bookingCost, flightId } = flightBooking;
    let bookingObj = {
        customerId: customerId,
        bookingId: bookingId,
        noOfTickets: noOfTickets,
        bookingCost: bookingCost
    };

    // Add booking to the bookings array of the flight
    let flight = await model.findOneAndUpdate(
        { flightId: flightId },
        { $push: { bookings: bookingObj } },
        { new: true, runValidators: true }
    );

    if (flight) {
        // Update available seats
        let updateFlightAvailableSeats = await model.findOneAndUpdate(
            { flightId: flightId },
            { $inc: { availableSeats: -noOfTickets } },
            { new: true, runValidators: true }
        );

        if (updateFlightAvailableSeats) {
            // Update customer wallet
            let updateCustomerWallet = await flightBookingDb.updateCustomerWallet(customerId, bookingCost);

            if (updateCustomerWallet) {
                return bookingId;
            } else {
                let err = new Error("Wallet not updated");
                err.status = 502;
                throw err;
            }
        } else {
            let err = new Error("Seats not updated");
            err.status = 502;
            throw err;
        }
    } else {
        let err = new Error("Booking failed");
        err.status = 500;
        throw err;
    }

}

flightBookingDb.getAllBookings = async () => {
    //get all the bookings done in all flights
    let model = await dbModel.getFlightCollection();

    // Fetch all flight documents, but only return the 'bookings' field
    let flights = await model.find({}, { bookings: 1 });

    // Check if any flights were retrieved from the database
    if (flights && flights.length > 0) {

        let allBookings = [];

        // Iterate over each flight document
        flights.forEach(flight => {
            // If the current flight has bookings, append them to allBookings
            if (flight.bookings && flight.bookings.length > 0) {
                allBookings = allBookings.concat(flight.bookings);
            }
        });

        return allBookings.length > 0 ? allBookings : null;
    } else {
        return null;
    }
}

flightBookingDb.customerBookingsByFlight = async (customerId, flightId) => {
    // get all customer bookings done for a flight
    let model = await dbModel.getFlightCollection();

    // Find the flight document by flightId
    let flight = await model.findOne({ flightId: flightId });

    if (flight) {
        // Get the bookings array from the flight document
        let bookings = flight.bookings;
        let allBookings = [];

        // Check if bookings exist and filter those that match the customerId
        if (bookings && bookings.length > 0) {
            bookings.forEach((booking) => {
                if (booking.customerId === customerId) {
                    allBookings.push(booking);
                }
            });
        }

        // Return the array of bookings if any are found, else return null
        return allBookings.length > 0 ? allBookings : null;
    } else {
        // If the flight with the given flightId is not found, return null
        return null;
    }
}

flightBookingDb.getbookingsByFlightId = async (flightId) => {
    // get all the bookings done for the given flightId
    let model = await dbModel.getFlightCollection();
    let flight = await model.findOne({ flightId: flightId });

    if (flight) {
        if (flight.bookings && flight.bookings.length > 0) {
            return flight.bookings;
        } else {
            return null;
        }

    } else {
        return null;
    }
}

flightBookingDb.updateBooking = async (bookingId, noOfTickets) => {
    // update no of tickets for the given bookingId
    let model = await dbModel.getFlightCollection();

    let flight = await model.findOne({ "bookings.bookingId": bookingId });

    if (!flight) {
        return null;
    }

    let fare = flight.fare;
    let flightId = flight.flightId;

    // Find the booking object within the flight's bookings array
    let booking = flight.bookings.find((booking) => {
        booking.bookingId === bookingId
    });

    if (!booking) {
        return null;
    }

    // Calculate additional cost for the new tickets
    let additionalCost = fare * noOfTickets;

    // Update the booking's noOfTickets and bookingCost
    booking.noOfTickets += noOfTickets;
    booking.bookingCost += additionalCost;

    // Update the flight's availableSeats
    flight.availableSeats -= noOfTickets;

    // Save the updated flight document
    let updated = await flight.save();

    if (updated) {
        // Update the customer's wallet by subtracting the additional booking cost
        let walletUpdated = await flightBookingDb.updateCustomerWallet(booking.customerId, additionalCost);

        if (walletUpdated) {
            // Return the updated flight details using checkAvailability
            return await flightBookingDb.checkAvailability(flightId);
        } else {
            // If wallet update fails, return null
            return null;
        }
    } else {
        return null;
    }


}

module.exports = flightBookingDb;