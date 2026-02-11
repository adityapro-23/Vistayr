const Listing = require("../models/listing");
const Booking = require("../models/booking");

module.exports.renderDashboard = async (req, res) => {
    // We render the page first. The data will be fetched via AJAX immediately after load.
    res.render("users/dashboard.ejs");
};

module.exports.getDashboardStats = async (req, res) => {
    try {
        const { user } = req;
        const currentYear = new Date().getFullYear();

        // 1. Get all listings for this host
        const listings = await Listing.find({ owner: user._id });
        const listingIds = listings.map(l => l._id);

        // 2. Get all bookings for these listings
        const allBookings = await Booking.find({ listing: { $in: listingIds } })
            .populate("listing")
            .populate("user");

        // --- KPI CALCULATIONS ---
        const confirmedBookings = allBookings.filter(b => b.status === 'confirmed');
        const pendingBookings = allBookings.filter(b => b.status === 'waiting');

        // Total Revenue
        const totalRevenue = confirmedBookings.reduce((acc, curr) => acc + curr.totalPrice, 0);

        // Total Booked Nights (for ADR)
        const totalNights = confirmedBookings.reduce((acc, curr) => {
            const days = (curr.endDate - curr.startDate) / (1000 * 60 * 60 * 24);
            return acc + days;
        }, 0);

        // Average Daily Rate (ADR)
        const adr = totalNights > 0 ? (totalRevenue / totalNights).toFixed(2) : 0;

        // Occupancy Rate (Simplified: Booked Nights / (Total Listings * 365))
        const totalPossibleNights = listingIds.length * 365; 
        const occupancyRate = totalPossibleNights > 0 ? ((totalNights / totalPossibleNights) * 100).toFixed(1) : 0;

        // --- CHART DATA GENERATION (Monthly Revenue for Current Year) ---
        const monthlyRevenue = new Array(12).fill(0);
        
        confirmedBookings.forEach(booking => {
            const bookingDate = new Date(booking.startDate);
            if (bookingDate.getFullYear() === currentYear) {
                const month = bookingDate.getMonth(); // 0 = Jan, 11 = Dec
                monthlyRevenue[month] += booking.totalPrice;
            }
        });

        // Send JSON response for the frontend JS to consume
        res.json({
            stats: {
                totalRevenue,
                totalBookings: confirmedBookings.length,
                pendingCount: pendingBookings.length,
                adr,
                occupancyRate,
                totalListings: listings.length
            },
            chartData: {
                labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
                data: monthlyRevenue
            },
            recentBookings: pendingBookings // Send pending requests to populate the table
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to fetch stats" });
    }
};

