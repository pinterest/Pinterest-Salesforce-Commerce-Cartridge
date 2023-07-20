// Event Code API Documentation: https://help.pinterest.com/en/business/article/add-event-codes
// this file is the source of pinterest.min.js

$('body').on('product:afterAddToCart', function (e, payload) {
    try {
        if (pintrk) {
            var eventData = {
                'value': 0,
                'line_items': []
            };

            if (
                payload
                && payload.pinterest
                && payload.pinterest.gdprConsent
            ) {
                pintrk('setconsent', payload.pinterest.gdprConsent);
            }

            if (
                payload
                && payload.pinterest
                && payload.pinterest.requestID
            ) {
                eventData['event_id'] = payload.pinterest.requestID;
            }

            if (
                payload
                && payload.cart
                && payload.cart.items
                && payload.cart.items.length
                && payload.pinterest
                && payload.pinterest.pid
            ) {
                for (var item of payload.cart.items) {
                    var productData = {};

                    if (item.id && item.id === payload.pinterest.pid) {
                        productData['product_id'] = item.id;
                    } else {
                        continue;
                    }

                    if (!eventData.currency && item.price && item.price.sales && item.price.sales.currency) {
                        eventData.currency = item.price.sales.currency;
                    }

                    if (item.brand) {
                        productData['product_brand'] = item.brand;
                    }

                    if (item.pinterest) {
                        if (item.pinterest.category) {
                            productData['product_category'] = item.pinterest.category;
                        }

                        if (item.pinterest.property) {
                            eventData.property = item.pinterest.property;
                        }
                    }

                    if (item.productName) {
                        productData['product_name'] = item.productName;
                    }

                    if (item.quantity) {
                        productData['product_quantity'] = (payload.pinterest.quantity ? Number(payload.pinterest.quantity) : 1);
                    }

                    if (item.price && item.price.sales && item.price.sales.decimalPrice) {
                        if (typeof item.price.sales.decimalPrice === 'string') {
                            productData['product_price'] = parseFloat(item.price.sales.decimalPrice);
                        } else {
                            productData['product_price'] = item.price.sales.decimalPrice;
                        }

                        eventData.value = (Number(eventData.value) + (Number(productData['product_quantity']) * Number(productData['product_price']))).toFixed(2);
                    }

                    eventData['line_items'].push(productData);
                }
            }

            pintrk('track', 'addtocart', eventData);
        }
    } catch (e) {
        console.log(e.toString());
    }
});
