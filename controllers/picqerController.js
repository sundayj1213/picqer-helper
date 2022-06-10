const bl = require('bl');
const { default: axios } = require("axios");
const PDFMerger = require('pdf-merger-js');
const PDFDocument = require('pdfkit');
const Sevdesk = require('sevdesk');
const sevdesk = new Sevdesk({ apiKey: '<API_KEY' });
const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

// Use a lookup table to find the index.
const lookup = typeof Uint8Array === 'undefined' ? [] : new Uint8Array(256);
for (let i = 0; i < chars.length; i++) {
    lookup[chars.charCodeAt(i)] = i;
}

module.exports = class picqerController {
  /**
   * Create Missing Reference PDF
   * @param {*} Reference
   * @returns 
   */
  createMissingRefPDF(Reference) {
    return new Promise((resolve) => {
        let pdfDoc = new PDFDocument;
        pdfDoc.pipe(bl((err, data) => {
            resolve(data.toString('base64'));
        }));
        pdfDoc
          .fontSize(30)
          .fillColor('red')
          .text(`Picklist Reference (Order Name) not found: ${Reference}`, { 
              align: 'center'
          });
        pdfDoc.end();
    });
  }

  /**
   * Find SevDesk Invoice By ID
   * @param {*} invoiceID 
   * @returns {String}
   */
  getSevDeskInvoicePDF(invoiceID) {
    return new Promise((resolve) => {
      sevdesk.invoice.getPdf(invoiceID, {}, (_, result) => {
        resolve(result.content);
      });
    });
  }

  /**
   * Find SevDesk Invoice by Order Name
   * @param {String} orderName 
   * @param {number} offset 
   * @param {number} limit 
   * @returns 
   */
  findSevDeskInvoiceByOrderName(orderName, offset = 0, limit = 100) {
    return new Promise((resolve) => {
        sevdesk.invoice.get({
            offset: offset * limit,
            limit
        }, (_, result) => {
             
            // if no more result, or empty result return empty
            if(!result || result && !result.length) return resolve({});

            // if invoice with footer text containing Order.name
            const invoice = result.find(i => i.footText.includes(orderName));

            // if nothing was found, paginate
            if(!invoice) {
                // increment offset by 1 to keep paginating
                offset++;

                // paginate to another 100
                return resolve(findByOrderName(orderName, offset));
            }

            // return invoice with matching Order.name
            resolve(invoice);
        });
    });
  }

  /**
   * Decode base64 file
   * @param {*} base64 
   * @returns 
   */
  decode = (base64) => {
    let bufferLength = base64.length * 0.75,
        len = base64.length,
        i,
        p = 0,
        encoded1,
        encoded2,
        encoded3,
        encoded4;
  
    if (base64[base64.length - 1] === '=') {
        bufferLength--;
        if (base64[base64.length - 2] === '=') {
            bufferLength--;
        }
    }
  
    const arraybuffer = new ArrayBuffer(bufferLength),
        bytes = new Uint8Array(arraybuffer);
  
    for (i = 0; i < len; i += 4) {
        encoded1 = lookup[base64.charCodeAt(i)];
        encoded2 = lookup[base64.charCodeAt(i + 1)];
        encoded3 = lookup[base64.charCodeAt(i + 2)];
        encoded4 = lookup[base64.charCodeAt(i + 3)];
  
        bytes[p++] = (encoded1 << 2) | (encoded2 >> 4);
        bytes[p++] = ((encoded2 & 15) << 4) | (encoded3 >> 2);
        bytes[p++] = ((encoded3 & 3) << 6) | (encoded4 & 63);
    }
  
    return arraybuffer;
  }

  /**
   * Merge multiple files and return base64 encode string
   * @param {[]} result 
   * @returns 
   */
  mergePDFGetBase64String = async (files) => {
    try {
      var merger = new PDFMerger();

      if(Array.isArray(files)) {
        for(var pdf of files) {
          merger.add(
            Buffer.from(this.decode(pdf))
          );
        }
      }

      const result = await merger.saveAsBuffer();

      return Buffer.from(result).toString('base64');
    } catch (e) {
      console.log(e.message);
      return '';
    }
  }

  /**
   * Format Picqer response data
   * @param {*} body 
   * @param {*} carrier 
   * @returns {*}
   */
  formatShipmentResponse = async(result) => {
    return {
      identifier: result.NewOrderID,
      trackingurl: result.TrackingExternalLink,
      label_contents_pdf: await this.mergePDFGetBase64String(result.PDF),
    }
  }

  /**
   * Format Deafult request data
   * @param {*} body 
   * @returns 
   */
  getDefaultRequestData(body) {
    return {
      to_address: {
        name: body.picklist.deliveryname ?? "",
        company: body.picklist.deliverycontact ?? "",
        street1: body.picklist.deliveryaddress ?? "",
        street2: body.picklist.deliveryaddress2 ?? "",
        city: body.picklist.deliverycity ?? "",
        state: body.picklist.deliveryregion ?? "",
        zip: body.picklist.deliveryzipcode ?? "",
        country: body.picklist.deliverycountry ?? "DE",
        email: body.picklist.emailaddress,
        phone: body.picklist.telephone
      },
      from_address: {
        name: body.sender.name ?? "",
        company: body.sender.contactname ?? "",
        street1: body.sender.address ?? "",
        street2: body.sender.address2 ?? "",
        city: body.sender.city ?? "",
        state: body.sender.region ?? "",
        zip: body.sender.zipcode ?? "",
        country: "DE",
        email: "<EMAIL>",
        phone: "<PHONE>"
      },
      parcels: [{
        length: 20,
        width: 20,
        height: 20,
        weight: body.weight/1000
      }],
      ContentDescription: `Order from ${body.picklist.deliveryname}`,
      TotalValue: `${body.worth} EUR`,
    }
  }
  /**
   * Formats ShippyPro request data
   * @param {*} body 
   * @returns {*}
   */
  formatShipmentRequest = (body, carrier) => {
    const defaultParams = this.getDefaultRequestData(body);
    return {
      Method: "Ship",
      Params: {
        ...defaultParams,
        TransactionID: `ORDER${body.picklist.idorder}`,
        OrderID: `ORDER${body.picklist.idorder}`,
        CarrierName: carrier.name,
        CarrierService: carrier.service,
        CarrierID: parseInt(carrier.id, 10),
        RateID: carrier.rateId,
        Async: false
      }
    };
  }

  /**
   * Formats ShippyPro request data
   * @param {*} body 
   * @returns {*}
   */
  formatRatesRequest = (body) => {
    const defaultParams = this.getDefaultRequestData(body);
    return {
      Method: "GetRates",
      Params: {
        ...defaultParams,
        Insurance: 0,
        InsuranceCurrency: 'EUR',
        CashOnDelivery: 0,
        CashOnDeliveryCurrency: 'EUR',
        ShippingService: "Standard"
      }
    };
  }

  /**
   * Get Rate from Service
   * @param {*} body 
   * @param {*} service 
   * @returns 
   */
  getRateFromService(rates, service) {
    const result = rates.find(i => i.service == service);

    if(!result) return rates[0] ?? {};

    return result;
  }
  /**
   * Get Carrier Data
   * @param {*} body 
   * @returns 
   */
  getCarrierData = async (body, service) => {

    // format rate data
    const shipmentData = this.formatRatesRequest(body);

    // post request to create shipment
    const result = await axios.post('https://www.shippypro.com/api', shipmentData, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Basic <API_KEY>'
      }
    });

    // get rate by service name
    const rate = this.getRateFromService(result.data.Rates, service);
 
    return {
      id: rate.carrier_id ?? "",
      name: rate.carrier ?? "",
      service: rate.service ?? "",
      rateId: rate.rate_id ?? "",
      currency: rate.currency
    };
  };

  /**
   * Send shipment data to ShippyPro
   * @param {*} body
   * @param {*} carrier
   * @returns {Object}
   */
   store = async (body, carrier) => {
    try {
      // get request data
      const shipmentData = this.formatShipmentRequest(body, carrier);

      // post request to create shipment
      const result = await axios.post('https://www.shippypro.com/api', shipmentData, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Basic <API_KEY>'
        }
      });
      
      return result.data;
    } catch (e) {
      console.log(e);
      return {};
    }
  }

  /**
   * Send shipment to DHL parcel (Germany)
   * @param {*} req 
   * @param {*} res 
   * @returns {Void}
   */
  dhlParcel = async (req, res) => {
    // get carrier
    const carrier = await this.getCarrierData(req.body, 'Paket DE');
    // send to ShippyPro
    const response = await this.store(req.body, carrier);

    // format response
    const result = await this.formatShipmentResponse(response);

    // return response to Picqer
    return res.json(result);
  }

  /**
   * Send shipment to DHL Express Domestic (Germany)
   * @param {*} req 
   * @param {*} res 
   * @returns {Void}
   */
  dhlExpressDomestic = async (req, res) => {

    // get carrier
    const carrier = await this.getCarrierData(req.body, 'EXPRESS DOMESTIC');
    // send to ShippyPro
    const response = await this.store(req.body, carrier);

    // format response
    const result = await this.formatShipmentResponse(response);

    // return response to Picqer
    return res.json(result);

  }

  /**
   * Send shipment to DHL Express worldwide (International)
   * @param {*} req 
   * @param {*} res 
   * @returns {Void}
   */
   dhlExpressWorldWide = async (req, res) => {

    // get carrier
    const carrier = await this.getCarrierData(req.body, 'EXPRESS WORLDWIDE EU');
    // send to ShippyPro
    const response = await this.store(req.body, carrier);

    // format response
    const result = await this.formatShipmentResponse(response);

    // return response to Picqer
    return res.json(result);

  }

  /**
   * Send shipment to DHL Express Economy (International)
   * @param {*} req 
   * @param {*} res 
   * @returns {Void}
   */
   dhlExpressEconomy = async (req, res) => {

    // get carrier
    const carrier = await this.getCarrierData(req.body, 'ECONOMY SELECT EU');
    // send to ShippyPro
    const response = await this.store(req.body, carrier);

    // format response
    const result = await this.formatShipmentResponse(response);

    // return response to Picqer
    return res.json(result);

  }

  /**
   * Get SevDesk Invoice from Picklist reference
   * @param {*} req 
   * @param {*} res 
   * @returns {Void}
   */
  fetchSevDeskInvoice = async (req, res) => {
    // result 
    const result = {
      identifier: req.body.reference,
    };
    // get invoice
    const invoice = await this.findSevDeskInvoiceByOrderName(req.body.reference);

    // generate not found pdf
    if(!invoice.id) {
      result.label_contents_pdf = await this.createMissingRefPDF(req.body.reference);
    } else {
      result.label_contents_pdf = await this.getSevDeskInvoicePDF(invoice.id);
    }

    // return response to Picqer
    return res.json({
      ...result,
      trackingurl: `https://my.sevdesk.de/#/fi/detail/type/${invoice.invoiceType}/id/${invoice.id}`,
    });
  }
};