/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};

/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {

/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId])
/******/ 			return installedModules[moduleId].exports;

/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			exports: {},
/******/ 			id: moduleId,
/******/ 			loaded: false
/******/ 		};

/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);

/******/ 		// Flag the module as loaded
/******/ 		module.loaded = true;

/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}


/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;

/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;

/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";

/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(0);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ function(module, exports) {

	'use strict';

	var PAGARME_ENCRYPTION_KEY = 'ek_test_m33wJhYA1QbnDbFCB759pvd6rGjs30';

	var amount = 0;
	var pay = document.querySelector('#pay').addEventListener('click', onPayClicked);

	var slider = document.querySelector('[type="range"]');

	slider.addEventListener('input', function (event) {
	  return onSlide(event.target.value);
	});

	onSlide(slider.value);

	var errorHandler = function errorHandler(err) {
	  return console.error('Uh oh, something bad happened.', err);
	};

	function onSlide(input) {
	  amount = input;
	  document.querySelector('.total-value').textContent = formatCurrency(input) + 'R$';
	}

	function formatCurrency(number) {
	  return number.toString().split('').map(function (value, index, arr) {
	    return index === arr.length - 2 ? ',' + value : value;
	  }).reverse().map(function (value, index, n) {
	    if (index === 5) {
	      value = value + '.';
	    }

	    return value;
	  }).reverse().join('');
	}

	function onPayClicked() {
	  var supportedInstruments = [{
	    supportedMethods: ['visa', 'mastercard']
	  }];

	  var details = {
	    displayItems: [{
	      label: 'Amount',
	      amount: { currency: 'BRL', value: amount }
	    }, {
	      label: 'Discount',
	      amount: { currency: 'BRL', value: '-10.00' }
	    }],
	    total: {
	      label: 'Total',
	      amount: { currency: 'BRL', value: amount }
	    },
	    shippingOptions: []
	  };

	  console.log(amount);

	  if ('PaymentRequest' in window) {
	    return new PaymentRequest(supportedInstruments, details).show().then(paymentRequest).then(finishPayment).catch(errorHandler);
	  }

	  var checkout = new PagarMeCheckout.Checkout({
	    encryption_key: PAGARME_ENCRYPTION_KEY,
	    success: function success(payment) {
	      return sendFromPagarMeCheckout(payment);
	    }
	  });

	  var params = {
	    customerData: "false", amount: amount, createToken: true, interestRate: 10, paymentMethods: 'credit_card'
	  };

	  checkout.open(params);
	}

	function paymentRequest(payment) {
	  console.log(amount);
	  var payload = {
	    amount: amount,
	    encryption_key: PAGARME_ENCRYPTION_KEY,
	    card_number: payment.details.cardNumber,
	    card_holder_name: payment.details.cardholderName,
	    card_cvv: payment.details.cardSecurityCode,
	    card_expiration_date: payment.details.expiryMonth + payment.details.expiryYear.substr(2, 2),
	    metadata: payment.details.billingAddress
	  };

	  return sendPayment(payload).then(function (response) {
	    payment.complete('success');

	    return response;
	  });
	}

	function sendFromPaymentRequestAPI(payment) {
	  return sendPayment(payload).then(function (response) {
	    payment.complete('success');

	    return response;
	  }).catch(function (cat) {
	    console.log('Failed PaymentRequestAPI', cat);
	    payment.complete('fail');
	  });
	}

	function sendFromPagarMeCheckout(payload) {
	  return finishPayment(payload);
	}

	function sendPayment(payload) {
	  return fetch('https://api.pagar.me/1/transactions', {
	    method: 'POST',
	    headers: new Headers({
	      'Access-Control-Allow-Origin': '*',
	      'Content-Type': 'application/json'
	    }),
	    body: JSON.stringify(payload)
	  }).then(function (res) {
	    return res.json();
	  });
	}

	function finishPayment(paymentObject) {
	  var pre = document.querySelector('pre');

	  pre.innerHTML = JSON.stringify(paymentObject, 0, 2, 0);
	}

/***/ }
/******/ ]);