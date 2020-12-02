var stripe = Stripe("pk_test_51HrPO4HULsWcNz6qEBfjiuAUbJ4dkFv1mGAIMEnqqViREQEAqTz0wRSUjAzSrTqQt66voHbwF2mpbIzPSRat4Llf00EC9CLJ6w");

var elements = stripe.elements();
var style = {
  base: {
    color: "#32325d",
  }
};

var card = elements.create("card", { style: style });

card.on('change', ({error}) => {
  let displayError = document.getElementById('card-errors');
  if (error) {
    displayError.textContent = error.message;
  } else {
    displayError.textContent = '';
  }
});

var form = document.getElementById("payment-form");

form.addEventListener("submit", function(ev) {
  ev.preventDefault();
  stripe.confirmCardPayment(document.getElementById("submit").getAttribute("data-secret"), {
    payment_method: {
      card: card,
      billing_details: {
        name: document.getElementById("customerName").value
      }
    }
  }).then(function(result) {
    if (result.error) {
      // Show errors from unsuccessul payment
      console.log(result.error.message);
    } else {
      // Payment processed successfully
      if (result.paymentIntent.status === "succeeded") {
        // Show a success message to your customer
        // There's a risk of the customer closing the window before callback
        // execution. Set up a webhook or plugin to listen for the
        // payment_intent.succeeded event that handles any business critical
        // post-payment actions.
        window.location.replace("success");
      }
    }
  });
});
