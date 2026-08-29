const https = require('https');

function runTest() {
    console.log("==========================================");
    console.log("🔌 Connecting to the live NexusPay Gateway...");
    console.log("==========================================\n");

    const data = JSON.stringify({
        line_items: [{ price_data: { unit_amount: 15000 } }],
        success_url: 'https://nexuspay-gateway-post.vercel.app/success.html',
        cancel_url: 'https://nexuspay-gateway-post.vercel.app/cancel.html'
    });

    const options = {
        hostname: 'nexuspay-gateway-post.vercel.app',
        path: '/api/checkout/sessions',
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Content-Length': data.length
        }
    };

    const req = https.request(options, (res) => {
        let responseBody = '';

        res.on('data', (chunk) => {
            responseBody += chunk;
        });

        res.on('end', () => {
            try {
                const session = JSON.parse(responseBody);
                console.log("✅ SUCCESS! The Gateway responded with a session object:\n");
                console.log(session);
                console.log("\n------------------------------------------");
                console.log("To complete the payment, redirect the customer to:");
                console.log("👉 " + session.url);
                console.log("------------------------------------------\n");
            } catch (e) {
                console.error("Failed to parse response:", responseBody);
            }
        });
    });

    req.on('error', (error) => {
        console.error("Failed to connect:", error);
    });

    req.write(data);
    req.end();
}

runTest();
