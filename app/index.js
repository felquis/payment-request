import fetch from 'isomorphic-fetch'

const PAGARME_ENCRYPTION_KEY = 'ek_test_m33wJhYA1QbnDbFCB759pvd6rGjs30'

let amount = 0
const pay = document
  .querySelector('#pay')
  .addEventListener('click', onPayClicked)

const slider = document
  .querySelector('[type="range"]')

slider.addEventListener('input', (event) => onSlide(event.target.value))

onSlide(slider.value)

const errorHandler = (err) => {
  ga('send', 'event', 'payment-request-error', err, {
    nonInteraction: true
  })

  console.error('Uh oh, something bad happened.', err)
}

function onSlide (input) {
  amount = input
  document.querySelector('.total-value').textContent = makeItGreatAgain(input) + ' R$'
}

function makeItGreatAgain (number) {
  return number.toString().split('').map((value, index, arr) => {
    return index === (arr.length - 2)? ',' + value : value
  }).reverse().map((value, index, n) => {
    if (index === 5) {
      value = value + '.'
  }

    return value
  }).reverse().join('')
}

function putDecimalMarker (number) {
  return number.toString().split('').map((value, index, arr) => {
    return index === (arr.length - 2)? '.' + value : value
  }).join('')
}

if ('PaymentRequest' in window) {
  ga('send', 'event', 'has-payment-request', {
    nonInteraction: true
  })
} else {
  ga('send', 'event', 'no-payment-request', {
    nonInteraction: true
  })
}

function onPayClicked () {
  ga('send', 'event', 'pay-button-click')

  const supportedInstruments = [{
    supportedMethods: ['visa', 'mastercard']
  }]

  const details = {
    displayItems: [
      {
        label: 'Amount',
        amount: { currency: 'BRL', value : putDecimalMarker(amount) }
      }
    ],
    total:  {
      label: 'Total',
      amount: { currency: 'BRL', value : putDecimalMarker(amount) }
    },
  shippingOptions: []
  }

  if ('PaymentRequest' in window) {
    return new PaymentRequest(supportedInstruments, details)
      .show()
      .then(paymentRequest)
      .catch(errorHandler)
  }

  const checkout = new PagarMeCheckout.Checkout({
    encryption_key: PAGARME_ENCRYPTION_KEY,
    success: payment => sendFromPagarMeCheckout(payment)
  })

  const params = {
    customerData: "false", amount: amount, createToken: true, interestRate: 10, paymentMethods: 'credit_card'
  }

  checkout.open(params)
}

function paymentRequest (payment) {
  ga('send', 'event', 'payment-request-openned', {
    nonInteraction: true
  })

  let payload = {
    amount: amount,
    encryption_key: PAGARME_ENCRYPTION_KEY,
    card_number: payment.details.cardNumber,
    card_holder_name: payment.details.cardholderName,
    card_cvv: payment.details.cardSecurityCode,
    card_expiration_date: payment.details.expiryMonth + payment.details.expiryYear.substr(2, 2),
    metadata: payment.details.billingAddress
  }

  return sendPayment(payload)
  .then((response) => {
    ga('send', 'event', 'payment-request-success', {
      nonInteraction: true
    })

    payment.complete('success')

    return response
  })
  .catch((cat) => {
    ga('send', 'event', 'payment-request-fail', cat, {
      nonInteraction: true
    })
  })
}

function sendFromPagarMeCheckout (payload) {
  ga('send', 'event', 'checkout-success', {
    nonInteraction: true
  })
}

function sendPayment (payload) {
  return fetch('https://api.pagar.me/1/transactions', {
    method: 'POST',
    headers: new Headers({
      'Access-Control-Allow-Origin': '*',
      'Content-Type': 'application/json'
    }),
    body: JSON.stringify(payload)
  })
  .then(res => {
    return res.json()
  })
}

function getTotal() {
  // total-transferido
  // Isso é trial
  // sinta-se a vontade em acessar https://docs.pagar.me/api/
  // e usar essa api_key para fazer requests :)
  return fetch('https://api.pagar.me/1/transactions?api_key=ak_test_tyc9JhrNIEcFu98Xh2SggIYDz7bcdu&count=100&page=1')
  .then((response) => response.json())
  .then((response) => {
    return response.reduce((acc, trx) => {
      if (new Date(trx.date_created).getTime() >= 1476433780698) {
        acc.push(trx)
      }

      return acc
    }, [])
  })
  .then((response) => {
    return {
      amount: response.reduce((acc, trx) => {
        return acc += trx.amount || 0
      }, 0),
      list: response
    }
  })
}

// meh, totalmente pog
let idsInDOM = []

function writeTotal() {
  getTotal().then((response) => {
    const el = document.querySelector('.total-transferido')
    const newValue = makeItGreatAgain(response.amount)

    if (el.textContent !== newValue) {
      el.textContent = newValue
    }

    const list = document.querySelector('.list')

    response.list.reverse().map(function (trx) {

      if (idsInDOM.indexOf(trx.id) !== -1) { return }

      idsInDOM.push(trx.id)
      list.insertAdjacentHTML('afterbegin', `<li>${trx.card_holder_name} - ${makeItGreatAgain(trx.amount)}</li>`)
    })

    setTimeout(writeTotal, 2500)
  })
  .catch((s) => {
    console.log(':shit:', s)
  })
}

writeTotal()
