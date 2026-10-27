#!/usr/bin/env bash
# One-off probe: prints status and body of POST /invoices for each payment method against the self-hosted API.
set -u
API="${API_URL:-http://localhost:8091}"
token=$(curl -s -X POST "$API/users/login" -H 'Content-Type: application/json' -d '{"email":"customer@practicesoftwaretesting.com","password":"welcome01"}' | sed -E 's/.*"access_token":"([^"]+)".*/\1/')
auth=(-H "Authorization: Bearer $token" -H 'Content-Type: application/json')
pid=$(curl -s "$API/products" | sed -E 's/.*"data":\[\{"id":"([^"]+)".*/\1/')
place=$(curl -s "$API/postcode-lookup?country=NL&postcode=1122AB")
city=$(echo "$place" | sed -E 's/.*"city":"([^"]*)".*/\1/'); state=$(echo "$place" | sed -E 's/.*"state":"([^"]*)".*/\1/')
echo "lookup: $place"
probe() { # name, details-json
  cart=$(curl -s -X POST "$API/carts" "${auth[@]}" | sed -E 's/.*"id":"([^"]+)".*/\1/')
  curl -s -o /dev/null -X POST "$API/carts/$cart" "${auth[@]}" -d "{\"product_id\":\"$pid\",\"quantity\":1}"
  body="{\"billing_street\":\"Test street 98\",\"billing_city\":\"$city\",\"billing_state\":\"$state\",\"billing_country\":\"NL\",\"billing_postal_code\":\"1122AB\",\"payment_method\":\"$1\",\"payment_details\":$2,\"cart_id\":\"$cart\"}"
  echo "== $1 details=$2"
  curl -s -w '\nstatus=%{http_code}\n' -X POST "$API/invoices" "${auth[@]}" -d "$body"
}
for m in credit-card bank-transfer gift-card buy-now-pay-later cash-on-delivery bogus-method; do probe "$m" '{}'; done
probe credit-card '{"credit_card_number":"4111-1111-1111-1111","expiration_date":"12/2030","cvv":"123","card_holder_name":"Jane Doe"}'
probe bank-transfer '{"bank_name":"Test Bank","account_name":"Jane Doe","account_number":"12345678"}'
probe gift-card '{"gift_card_number":"ABC12345","validation_code":"1234"}'
probe buy-now-pay-later '{"monthly_installments":"6"}'
