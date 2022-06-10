const picqerController = new (require('../controllers/picqerController'))();
const express = require('express');
const router = express.Router();

// Use DHL Parcel Carrier
router.post('/shipment/create/dhl_parcel', picqerController.dhlParcel);
// Use DHL Express Domestic Carrier
router.post('/shipment/create/dhl_express_domestic', picqerController.dhlExpressDomestic);
// Use DHL Express Worldwide Carrier
router.post('/shipment/create/dhl_express_worldwide', picqerController.dhlExpressWorldWide);
// Use DHL Express Economy Carrier
router.post('/shipment/create/dhl_express_economy', picqerController.dhlExpressEconomy);
// Get Invoice
router.post('/invoice/sevdesk/get', picqerController.fetchSevDeskInvoice);

module.exports = router;
