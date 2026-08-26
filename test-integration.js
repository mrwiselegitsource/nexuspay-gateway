async function runTest() {
    console.log("==========================================");
    console.log("🔌 Connecting to the live NexusPay Gateway...");
    console.log("==========================================\n");
    
    try {
        // We are calling the LIVE API on the internet, just like the docs say!
        const response = await fetch('https://nexuspay-gateway-post.vercel.app/api/checkout/sessions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                line_items: [{ 
                    price_data: { unit_amount: 15000 } // $150.00
                }],
                success_url: 'https://nexuspay-gateway-post.vercel.app/success.html',
                cancel_url: 'https://nexuspay-gateway-post.vercel.app/cancel.html'
            })
        });

        const text = await response.text();
        try {
            const session = JSON.parse(text);
            console.log("✅ SUCCESS! The Gateway responded with a session object:\n");
            console.log(session);
            console.log("\n------------------------------------------");
            console.log("To complete the payment, redirect the customer to:");
            console.log("👉 " + session.url);
            console.log("------------------------------------------\n");
        } catch (e) {
            console.log("Failed to parse JSON. Raw response:");
            console.log(text);
        }
        
    } catch (err) {
        console.error("Failed to connect:", err);
    }
}

runTest();
