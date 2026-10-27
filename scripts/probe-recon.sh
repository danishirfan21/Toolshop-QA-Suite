#!/usr/bin/env bash
# Temporary CI probe (task 5): prints status and body for unknown API behaviours.
A="$API_URL"
show() { echo "--- $1"; shift; curl -s -w '\nHTTP %{http_code}\n' "$@"; }
show "login wrong password" -X POST "$A/users/login" -H 'Content-Type: application/json' -d '{"email":"customer@practicesoftwaretesting.com","password":"wrong-pass"}'
show "login unknown email" -X POST "$A/users/login" -H 'Content-Type: application/json' -d '{"email":"nobody@example.com","password":"welcome01"}'
show "login empty body" -X POST "$A/users/login" -H 'Content-Type: application/json' -d '{}'
show "POST /carts no token" -X POST "$A/carts" -H 'Content-Type: application/json' -d '{}'
CART=$(curl -s -X POST "$A/carts" -H 'Content-Type: application/json' -d '{}')
echo "--- cart created: $CART"
ID=$(echo "$CART" | sed -n 's/.*"id":"\([^"]*\)".*/\1/p')
PID=$(curl -s "$A/products" | sed -n 's/.*"data":\[{"id":"\([^"]*\)".*/\1/p')
echo "cart=$ID product=$PID"
show "GET cart no token" "$A/carts/$ID"
show "add item no token qty1" -X POST "$A/carts/$ID" -H 'Content-Type: application/json' -d "{\"product_id\":\"$PID\",\"quantity\":1}"
for q in 99 100 101 1000 999999 -1; do
  show "add item qty $q" -X POST "$A/carts/$ID" -H 'Content-Type: application/json' -d "{\"product_id\":\"$PID\",\"quantity\":$q}"
done
show "DELETE cart no token" -X DELETE "$A/carts/$ID"
