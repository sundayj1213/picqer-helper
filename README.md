# node-js-getting-started

A barebones Node.js app using [Express 4](http://expressjs.com/).

This application supports the [Getting Started on Heroku with Node.js](https://devcenter.heroku.com/articles/getting-started-with-nodejs) article - check it out.

## Running Locally

Make sure you have [Node.js](http://nodejs.org/) and the [Heroku CLI](https://cli.heroku.com/) installed.

```sh
git clone https://github.com/heroku/node-js-getting-started.git # or clone your own fork
cd node-js-getting-started
npm install
npm start
```

Your app should now be running on [localhost:5000](http://localhost:5000/).


## API Reference
Create a Custom Shipping Method and specify the following endpoints. Here's some guide: https://picqer.com/en/api/custom-shippingmethod

#### Create Shipment label for DHL Parcel from Picklist Webhook

```http
POST /picqer/shipment/create/dhl_parcel
```

#### Create Shipment label for DHL Express Domestic from Picklist Webhook

```http
POST /picqer/shipment/create/dhl_express_domestic
```

#### Create Shipment label for DHL Express World Wide from Picklist Webhook

```http
POST /picqer/shipment/create/dhl_express_worldwide
```

#### Create Shipment label for DHL Express Economy from Picklist Webhook

```http
POST /picqer/shipment/create/dhl_express_economy
```

#### Get SevDesk Invoice from Picklist Order ID

```http
POST /picqer/invoice/sevdesk/get
```
## Deploying to Heroku

```
heroku create
git push heroku main
heroku open
```
or

[![Deploy to Heroku](https://www.herokucdn.com/deploy/button.svg)](https://heroku.com/deploy)

## Documentation

For more information about using Node.js on Heroku, see these Dev Center articles:

- [Getting Started on Heroku with Node.js](https://devcenter.heroku.com/articles/getting-started-with-nodejs)
- [Heroku Node.js Support](https://devcenter.heroku.com/articles/nodejs-support)
- [Node.js on Heroku](https://devcenter.heroku.com/categories/nodejs)
- [Best Practices for Node.js Development](https://devcenter.heroku.com/articles/node-best-practices)
- [Using WebSockets on Heroku with Node.js](https://devcenter.heroku.com/articles/node-websockets)
