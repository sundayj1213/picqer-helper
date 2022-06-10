
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