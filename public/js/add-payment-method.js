// Create a Stripe client.
var stripe = Stripe('pk_test_51HrPO4HULsWcNz6qEBfjiuAUbJ4dkFv1mGAIMEnqqViREQEAqTz0wRSUjAzSrTqQt66voHbwF2mpbIzPSRat4Llf00EC9CLJ6w');

// Create an instance of Elements.
var elements = stripe.elements();

// Get customer ID
var pathArray = window.location.pathname.split('/');
const customerID = pathArray[2];

// Custom styling can be passed to options when creating an Element.
// (Note that this demo uses a wider set of styles than the guide below.)
var style = {
  base: {
    color: '#32325d',
    fontFamily: '"Helvetica Neue", Helvetica, sans-serif',
    fontSmoothing: 'antialiased',
    fontSize: '16px',
    '::placeholder': {
      color: '#aab7c4'
    }
  },
  invalid: {
    color: '#fa755a',
    iconColor: '#fa755a'
  }
};

// Create an instance of the card Element.
var card = elements.create('card', {style: style});

card.on('change', ({error}) => {
  let displayError = document.getElementById('card-errors');
  if (error) {
    displayError.textContent = error.message;
  } else {
    displayError.textContent = '';
  }
});

var form = document.getElementById("method-form");

form.addEventListener("submit", function(ev) {
  ev.preventDefault();
  stripe.createPaymentMethod({
    type: 'card',
    card: card
  }).then(function(result) {
    console.log(result);
    if (result.error) {
      // Show errors from unsuccessul payment
      console.log(result.error.message);
      window.location.replace("error");
    } else {
      // Payment method added successfully
      window.location.replace("add-payment-method/attach/" + result.paymentMethod.id)
    }
  });
});
