const cardNumberInput = document.getElementById('card-number');
const cardExpiryInput = document.getElementById('card-expiry');
const cardCvcInput = document.getElementById('card-cvc');
const paymentForm = document.getElementById('payment-form');
const submitBtn = document.getElementById('submit-btn');
const btnText = document.querySelector('.btn-text');
const loader = document.querySelector('.loader');

// --- NEW MOCK GATEWAY LOGIC ---
// Extract session_id from URL
const urlParams = new URLSearchParams(window.location.search);
const sessionId = urlParams.get('session_id');

if (!sessionId) {
    alert("Invalid Checkout Link. Missing session_id.");
    document.body.innerHTML = "<h1 style='text-align:center;'>Invalid Link: No Session ID</h1>";
} else {
    // Fetch session details from our Mock Gateway
    fetch(`/api/checkout/sessions/${sessionId}`)
        .then(res => res.json())
        .then(session => {
            if (session.error) {
                alert(session.error);
                document.body.innerHTML = `<h1 style='text-align:center;'>${session.error}</h1>`;
                return;
            }
            // Update UI with real amount from session
            const formattedAmount = (session.amountTotal / 100).toFixed(2);
            document.querySelector('.checkout-header p strong').textContent = `$${formattedAmount}`;
            btnText.textContent = `Pay $${formattedAmount}`;
        })
        .catch(err => {
            console.error("Failed to load session details", err);
        });
}
// ------------------------------

// Auto-format card number
cardNumberInput.addEventListener('input', function (e) {
    let target = e.target;
    let value = target.value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    let formattedValue = '';

    for (let i = 0; i < value.length; i++) {
        if (i > 0 && i % 4 === 0) {
            formattedValue += ' ';
        }
        formattedValue += value[i];
    }
    target.value = formattedValue;
});

// Auto-format expiration date
cardExpiryInput.addEventListener('input', function (e) {
    let target = e.target;
    let value = target.value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    
    if (value.length > 2) {
        target.value = value.substring(0, 2) + ' / ' + value.substring(2, 4);
    } else {
        target.value = value;
    }
});

// Auto-format CVC
cardCvcInput.addEventListener('input', function (e) {
    let target = e.target;
    target.value = target.value.replace(/[^0-9]/gi, '').substring(0, 4);
});

// Handle form submission to our Gateway
paymentForm.addEventListener('submit', async function (e) {
    e.preventDefault(); 
    
    btnText.style.display = 'none';
    loader.style.display = 'block';
    submitBtn.disabled = true;

    try {
        // Send payment to our Mock Gateway
        const response = await fetch(`/api/checkout/sessions/${sessionId}/pay`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ mock_card: cardNumberInput.value })
        });
        
        const result = await response.json();
        
        if (result.success) {
            btnText.style.display = 'block';
            btnText.textContent = 'Payment Successful ✓';
            loader.style.display = 'none';
            submitBtn.classList.add('success');
            
            // Redirect back to merchant success url
            setTimeout(() => {
                window.location.href = result.redirect_url;
            }, 1200);
        } else {
            throw new Error(result.error);
        }
    } catch (err) {
        alert('Payment Failed: ' + err.message);
        btnText.style.display = 'block';
        btnText.textContent = 'Pay Now';
        loader.style.display = 'none';
        submitBtn.disabled = false;
    }
});
