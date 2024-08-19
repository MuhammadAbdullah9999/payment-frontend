import React, { useState } from "react";
import { PayPalScriptProvider, PayPalButtons, FUNDING } from "@paypal/react-paypal-js";
import './App.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faWallet, faSpinner } from '@fortawesome/free-solid-svg-icons';

function Message({ content }) {
  return <p className="text-center text-red-500">{content}</p>;
}

function App() {
  const initialOptions = {
    "client-id": "ATGlhVtnoiBx-R5iZYujoTcLdYcT3QVj8rTTY7DtARYMoOmSG8zoF3ZpZL2uzkfqxjp8UObuHTiFCBom",
    "disable-funding": "card,credit,paylater", // Disable credit card and pay later options
    "data-sdk-integration-source": "integrationbuilder_sc",
  };

  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false); // Loading state

  const cartItems = [
    { name: "PMI PMP Course", price: 20.00 },
    { name: "PMI PgMP Simulator", price: 20.00 },
  ];

  const handleCheckout = async () => {
    setLoading(true); // Start loading
    try {
        const response = await fetch('https://payment-backend-uzml.onrender.com/checkout', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ cartItems }), // Include cart items in the body
        });
        const data = await response.json();
        window.location.href = data.url;
    } catch (error) {
        console.error('Error:', error);
    } finally {
        setLoading(false); // Stop loading
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex justify-center items-center">
      <div className="container mx-auto p-4">
        <div className="bg-white w-1/2 m-auto shadow-md rounded-lg p-6 flex flex-col gap-6">
          <div className="flex-1">
            <h1 className="text-2xl font-bold mb-4">Shopping Cart</h1>

            {cartItems.map((item, index) => (
              <div key={index} className="mb-4">
                <h3 className="text-lg font-semibold">{item.name}</h3>
                <p className="text-gray-700">Price: ${item.price.toFixed(2)}</p>
              </div>
            ))}
          </div>

          <div className="flex-1">
            <PayPalScriptProvider options={initialOptions}>
              <PayPalButtons
                style={{
                  shape: "rect",
                  layout: "vertical",
                  height: 40,
                  width: "100%",
                  tagline: false,
                }}
                fundingSource={FUNDING.PAYPAL} // Specify PayPal as the only funding source
                createOrder={async () => {
                  try {
                    setLoading(true); // Start loading
                    const response = await fetch("https://payment-backend-uzml.onrender.com/api/orders", {
                      method: "POST",
                      headers: {
                        "Content-Type": "application/json",
                      },
                      body: JSON.stringify({
                        cart: cartItems.map(item => ({
                          name: item.name,
                          unit_amount: {
                            currency_code: "USD",
                            value: item.price.toFixed(2),
                          },
                          quantity: "1",
                        })),
                      }),
                    });

                    const orderData = await response.json();
                    setLoading(false); // Stop loading

                    if (orderData.id) {
                      return orderData.id;
                    } else {
                      const errorDetail = orderData?.details?.[0];
                      const errorMessage = errorDetail
                        ? `${errorDetail.issue} ${errorDetail.description} (${orderData.debug_id})`
                        : JSON.stringify(orderData);

                      throw new Error(errorMessage);
                    }
                  } catch (error) {
                    console.error(error);
                    setMessage(`Could not initiate PayPal Checkout...${error}`);
                    setLoading(false); // Stop loading
                  }
                }}
                onApprove={async (data, actions) => {
                  try {
                    const response = await fetch(
                      `https://payment-backend-uzml.onrender.com/api/orders/${data.orderID}/capture`,
                      {
                        method: "POST",
                        headers: {
                          "Content-Type": "application/json",
                        },
                      }
                    );

                    const orderData = await response.json();

                    const errorDetail = orderData?.details?.[0];

                    if (errorDetail?.issue === "INSTRUMENT_DECLINED") {
                      return actions.restart();
                    } else if (errorDetail) {
                      throw new Error(
                        `${errorDetail.description} (${orderData.debug_id})`
                      );
                    } else {
                      const transaction =
                        orderData.purchase_units[0].payments.captures[0];
                      setMessage(
                        `Transaction ${transaction.status}: ${transaction.id}. See console for all available details`
                      );
                      console.log(
                        "Capture result",
                        orderData,
                        JSON.stringify(orderData, null, 2)
                      );
                    }
                  } catch (error) {
                    console.error(error);
                    setMessage(
                      `Sorry, your transaction could not be processed...${error}`
                    );
                  }
                }}
              />
            </PayPalScriptProvider>

            <div className="text-center">
              <button
                onClick={handleCheckout}
                className="mt-4 bg-blue-500 text-white px-4 py-2 w-full rounded hover:bg-blue-600 flex items-center justify-center"
                disabled={loading} // Disable button during loading
              >
                {loading ? (
                  <FontAwesomeIcon icon={faSpinner} spin className="mr-2" />
                ) : (
                  <FontAwesomeIcon icon={faWallet} className="mr-2" />
                )}
                {loading ? "Processing..." : "Use cards and other"}
              </button>
            </div>

            <Message content={message} />
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;



// import React, { useState, useEffect } from 'react';
// import { loadStripe } from '@stripe/stripe-js';
// import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
// import './App.css'; // Ensure Tailwind CSS is imported

// const stripePromise = loadStripe('pk_test_51NqwwXJKcOK4e5vDN4x0CZGtrTjCez4sDiCN23JKob8brwImzZsyqzmXVTvdvZDaQ9CzMhNnJzaBtRxysTKJIqn200Fm8JzJvq');

// function CheckoutForm() {
//   const stripe = useStripe();
//   const elements = useElements();
//   const [message, setMessage] = useState(null);
//   const [isLoading, setIsLoading] = useState(false);

//   const handleSubmit = async (e) => {
//     e.preventDefault();

//     if (!stripe || !elements) {
//       return;
//     }

//     setIsLoading(true);

//     const { error, paymentIntent } = await stripe.confirmPayment({
//       elements,
//       confirmParams: {
//         return_url: `${window.location.origin}/payment-success`,
//       },
//     });

//     if (error) {
//       setMessage(`Error: ${error.message}`);
//       console.error('Error:', error);
//     } else if (paymentIntent.status === 'succeeded') {
//       setMessage('Payment succeeded!');
//     } else if (paymentIntent.status === 'requires_action') {
//       setMessage('Payment requires additional authentication.');
//     } else {
//       setMessage('Payment status: ' + paymentIntent.status);
//     }

//     setIsLoading(false);
//   };

//   return (
//     <form id="payment-form" onSubmit={handleSubmit} className="w-1/2 m-auto rounded-lg shadow-lg p-12 mt-16 bg-white">
//       <PaymentElement id="payment-element" />
//       <button
//         disabled={isLoading || !stripe || !elements}
//         id="submit"
//         className="mt-4 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
//       >
//         <span id="button-text">
//           {isLoading ? 'Processing...' : 'Pay now'}
//         </span>
//       </button>
//       {message && (
//         <div id="payment-message" className="mt-4 text-red-500">
//           {message}
//         </div>
//       )}
//     </form>
//   );
// }

// export default function App() {
//   const [clientSecret, setClientSecret] = useState('');

//   useEffect(() => {
//     fetch('https://payment-backend-uzml.onrender.com/create-payment-intent', {
//       method: 'POST',
//       headers: { 'Content-Type': 'application/json' },
//       body: JSON.stringify({
//         items: [
//           { id: 'pmp-course', name: 'PMI PMP Course', price: 20.00 },
//           { id: 'pgmp-simulator', name: 'PMI PgMP Simulator', price: 20.00 },
//         ],
//       }),
//     })
//       .then((res) => res.json())
//       .then((data) => setClientSecret(data.clientSecret))
//       .catch((error) => console.error('Error fetching client secret:', error));
//   }, []);

//   const appearance = {
//     theme: 'stripe',
//   };

//   const options = {
//     clientSecret,
//     appearance,
//   };

//   return (
//     <div className="App">
//       {clientSecret && (
//         <Elements options={options} stripe={stripePromise}>
//           <CheckoutForm />
//         </Elements>
//       )}
//     </div>
//   );
// }
