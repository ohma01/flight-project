const mongoose = require("mongoose")
const Schema = mongoose.Schema;
mongoose.Promise = global.Promise;
mongoose.set('useCreateIndex', true)
const url = "mongodb://localhost:27017/FlightBooking_DB";

const customerSchema = Schema({
    customerId: String,
    customerName: String,
    walletAmount: Number,
    customerType: { type: String, enum: ['Platinum', 'Gold', 'Silver'] }
}, { collection: "Customer" });

const flightBookingSchema = Schema({
    customerId: String,
    bookingId: { type: Number, unique: true },
    noOfTickets: { type: Number, min: [1, "minimum number of tickets should be 1"], max: [5, "maximum 5 tickets can be booked by a customer"] },
    bookingCost: { type: Number, min: [0, "Booking cost can't be negative"] }
})

const flightSchema = Schema({
    flightId: String,
    AircraftName: String,
    fare: Number,
    availableSeats: Number,
    status: { type: String, enum: ['Running', 'Cancelled'] },
    bookings: { type: [flightBookingSchema], default: [] }
}, { collection: "Flight" })

let collection = {};

collection.getCustomerCollection = async() => {
    try {
        return (await mongoose.connect(url, { useNewUrlParser: true, useUnifiedTopology: true })).model('Customer', customerSchema)
    } catch (err) {
        let error = new Error("Could not connect to database")
        error.status = 500
        throw error
    }
}

collection.getFlightCollection = async() => {
    try {
        return (await mongoose.connect(url, { useNewUrlParser: true, useUnifiedTopology: true })).model('Flight', flightSchema)
    } catch (err) {
        let error = new Error("Could not connect to database")
        error.status = 500
        throw error
    }
}

module.exports = collection;