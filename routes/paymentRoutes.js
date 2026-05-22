require(`dotenv`).config
const express = require(`express`)
const app = express()
const stripe = require(`stripe`)(process.env.STRIPE_SECRET_KEY)
const Product = require("../models/Product")
const router = express.Router()
const Cart = require(`../models/cart`);
const { authenticateToken } = require(`../middleware/auth`);
const passport = require("../config/passport");
router.post("/checkout-session", authenticateToken , async (req, res) => {
    try {
        console.log("--- Stripe Checkout Debug ---");
        console.log("Full req.user object:", req.user);
        
        const userId = req.user ? (req.user.id || req.user._id) : null;
        console.log("Extracted User ID:", userId);

        if (!userId) {
            return res.status(401).json({ error: "User unauthorized or token invalid" });
        }

        const cart = await Cart.findOne({ user: userId });
        console.log("Database Cart Query Result:", cart);

        if (!cart || !cart.items || cart.items.length === 0) {
            return res.status(400).json({ error: "Cart is empty" });
        }

        const sellerBreakdown = {};
        const lineItems = [];

        for (const item of cart.items) {
            const productDoc = await Product.findById(item.product);
            
            if (!productDoc) {
                console.log(`Error: Product ID ${item.product} not found in database.`);
                return res.status(404).json({ error: `Product details missing for ID ${item.product}` });
            }

            if (!productDoc.seller) {
                console.log(`Error: Product ${productDoc.name} is missing a seller ID attribute.`);
                return res.status(400).json({ error: `Product ${productDoc.name} has no assigned seller.` });
            }

            const sellerId = productDoc.seller.toString();
            const itemTotal = item.price * item.quantity;

            // Group absolute total pricing per seller (stored in cents)
            if (!sellerBreakdown[sellerId]) {
                sellerBreakdown[sellerId] = 0;
            }
            sellerBreakdown[sellerId] += Math.round(itemTotal * 100);

            lineItems.push({
                price_data: {
                    currency: "usd",
                    product_data: { name: productDoc.name },
                    unit_amount: Math.round(item.price * 100),
                },
                quantity: item.quantity,
            });
        }

        console.log("Final Seller Breakdown calculation:", sellerBreakdown);

        // Build Stripe session configuration
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ["card"],
            mode: "payment",
            line_items: lineItems,
            success_url: process.env.CLIENT_URL ? `${process.env.CLIENT_URL}/success?session_id={CHECKOUT_SESSION_ID}` : "https://localhost:3000/success",
            cancel_url: process.env.CLIENT_URL ? `${process.env.CLIENT_URL}/cart` : "https://localhost:3000/cart",
            metadata: {
                buyerId: userId.toString(),
                sellerBreakdown: JSON.stringify(sellerBreakdown)
            }
        });

        console.log("Stripe Checkout Session created successfully.");
        res.status(200).json({ url: session.url });

    } catch (error) {
        console.error("Checkout Session Exception Raised:", error.message);
        res.status(500).json({ error: error.message });
    }
});
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
    const sig = req.headers['stripe-signature'];
    let event;

    try {
        event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
    } catch (err) {
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    if (event.type === 'checkout.session.completed') {
        const session = event.data.object;
        
        // 1. Extract the breakdown we saved earlier
        const buyerId = session.metadata.buyerId;
        const sellerBreakdown = JSON.parse(session.metadata.sellerBreakdown);

        // 2. Loop through each seller and transfer their portion
        for (const [sellerId, totalInCents] of Object.entries(sellerBreakdown)) {
            try {
                // Fetch seller's stripe Connect Account ID from your database
                const sellerUser = await User.findById(sellerId);
                if (!sellerUser || !sellerUser.stripeConnectId) continue;

                // Calculate your cut (e.g., 10% platform fee)
                const platformFee = Math.round(totalInCents * 0.10); 
                const sellerCut = totalInCents - platformFee;

                // Transfer the funds from your main account balance to the seller's account
                await stripe.transfers.create({
                    amount: sellerCut,
                    currency: 'usd',
                    destination: sellerUser.stripeConnectId,
                    transfer_group: session.id, // Links these transfers to this specific checkout session
                });

            } catch (transferError) {
                console.error(`Failed to transfer to seller ${sellerId}:`, transferError.message);
                // In production, log this to an error tracking tool to retry manually later
            }
        }

        // 3. Clear the buyer's cart
        await Cart.findOneAndUpdate({ user: buyerId }, { items: [] });
    }

    res.json({ received: true });
});
module.exports = router;