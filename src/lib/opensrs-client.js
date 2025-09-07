// opensrs-client.js
const axios = require('axios');
const crypto = require('crypto');

class OpenSRSClient {
  constructor(config = {}) {
    this.testMode = config.testMode || process.env.OPENSRS_TEST_MODE === 'true';
    this.resellerUsername = config.resellerUsername || process.env.OPENSRS_RESELLER_USERNAME;
    this.apiKey = config.apiKey || process.env.OPENSRS_API_KEY;

    // Set the appropriate host based on test/live mode
    if (this.testMode) {
      this.apiHost = config.testHost || process.env.OPENSRS_TEST_HOST || 'https://horizon.opensrs.net:55443';
    } else {
      this.apiHost = config.liveHost || process.env.OPENSRS_LIVE_HOST || 'https://rr-n1-tor.opensrs.net:55443';
    }

    if (!this.resellerUsername || !this.apiKey) {
      throw new Error('OpenSRS reseller username and API key are required');
    }
  }

  /**
   * Generate MD5 signature for OpenSRS API authentication
   * @param {string} xml - The XML request body
   * @returns {string} - The generated signature
   * 
   */
  generateSignature(xml) {
    // First MD5 hash: MD5(xml + api_key)
    const firstHash = crypto.createHash('md5').update(xml + this.apiKey).digest('hex');
    // Second MD5 hash: MD5(first_hash + api_key)
    const signature = crypto.createHash('md5').update(firstHash + this.apiKey).digest('hex');
    return signature;
  }

  /**
   * Create XML envelope for OpenSRS API requests
   * @param {string} action - The API action (e.g., 'LOOKUP', 'REGISTER')
   * @param {string} object - The object type (e.g., 'DOMAIN')
   * @param {Object} attributes - The attributes for the request
   * @returns {string} - The formatted XML
   */
  createXmlEnvelope(action, object, attributes = {}) {
    const attributesXml = this.objectToXml(attributes);
    return `<?xml version='1.0' encoding='UTF-8' standalone='no' ?>
<!DOCTYPE OPS_envelope SYSTEM 'ops.dtd'>
<OPS_envelope>
<header>
    <version>0.9</version>
</header>
<body>
<data_block>
    <dt_assoc>
        <item key="protocol">XCP</item>
        <item key="action">${action}</item>
        <item key="object">${object}</item>
        <item key="attributes">
            ${attributesXml}
        </item>
    </dt_assoc>
</data_block>
</body>
</OPS_envelope>`;
  }

  /**
   * Convert JavaScript object to OpenSRS XML format
   * @param {Object} obj - The object to convert
   * @returns {string} - The XML representation
   */
  objectToXml(obj) {
    if (typeof obj !== 'object' || obj === null) {
      return `<item>${obj}</item>`;
    }

    if (Array.isArray(obj)) {
      return `<dt_array>${obj.map((item, index) => `<item key="${index}">${item}</item>`).join('')}</dt_array>`;
    }

    const keys = Object.keys(obj);
    const isArray = keys.length > 0 && keys.every(key => /^\d+$/.test(key));

    const items = Object.entries(obj).map(([key, value]) => {
      if (typeof value === 'object' && value !== null) {
        return `<item key="${key}">${this.objectToXml(value)}</item>`;
      } else {
        return `<item key="${key}">${value}</item>`;
      }
    }).join('');

    const tag = isArray ? 'dt_array' : 'dt_assoc';
    return `<${tag}>${items}</${tag}>`;
  }

  /**
   * Make a request to the OpenSRS API
   * @param {string} action - The API action
   * @param {string} object - The object type
   * @param {Object} attributes - The request attributes
   * @returns {Promise<Object>} - The API response
   */
  async makeRequest(action, object, attributes = {}) {
    try {
      const xml = this.createXmlEnvelope(action, object, attributes);
      const signature = this.generateSignature(xml);

      const headers = {
        'Content-Type': 'text/xml',
        'X-Username': this.resellerUsername,
        'X-Signature': signature
      };

      console.log(`Making ${action} request to OpenSRS API...`);
      console.log('Request URL:', this.apiHost);
      console.log('Username:', this.resellerUsername);
      console.log('Signature length:', signature.length);
      console.log('Request XML:', xml);

      const response = await axios.post(this.apiHost, xml, { headers });

      console.log('Response status:', response.status);
      console.log('Response headers:', response.headers);
      console.log('Response data:', response.data);

      const jsonResponse = this.parseXmlResponse(response.data);
      console.log('JSON response:', JSON.stringify(jsonResponse, null, 2));
      return jsonResponse;
    } catch (error) {
      console.error('OpenSRS API request failed:', error.message);
      console.error('Error details:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        headers: error.response?.headers,
        data: error.response?.data,
        config: {
          url: error.config?.url,
          method: error.config?.method,
          headers: error.config?.headers
        }
      });

      return {
        success: false,
        error: error.message,
        responseCode: error.response?.status?.toString() || 'NETWORK_ERROR',
        responseText: error.response?.statusText || 'Network or connection error',
        statusCode: error.response?.status,
        statusText: error.response?.statusText,
        timestamp: new Date().toISOString(),
        data: {}
      };
    }
  }

  // =========================
  // XML PARSING (ROBUST)
  // =========================

  /**
   * Balanced slice for nested tags. Returns substring including outer tags.
   */
  balancedSlice(xml, startIdx, openTag, closeTag) {
    let i = startIdx;
    let depth = 0;
    const openLen = openTag.length;
    const closeLen = closeTag.length;

    if (xml.substring(i, i + openLen) !== openTag) return null;

    while (i < xml.length) {
      if (xml.substring(i, i + openLen) === openTag) { depth++; i += openLen; continue; }
      if (xml.substring(i, i + closeLen) === closeTag) {
        depth--; i += closeLen;
        if (depth === 0) {
          return xml.substring(startIdx, i);
        }
        continue;
      }
      i++;
    }
    return null;
  }

  /**
   * Extract an <item key="X"> ... </item> block with nesting awareness.
   * Returns the full string including the outer <item ...> and </item>.
   */
  extractItemBlock(xml, itemKey, fromIndex = 0) {
    const startTag = `<item key="${itemKey}">`;
    const start = xml.indexOf(startTag, fromIndex);
    if (start === -1) return null;

    let i = start + startTag.length;
    let depth = 1; // we're inside the outer <item ...>
    while (i < xml.length) {
      if (xml.startsWith('<item', i)) { depth++; i += 5; continue; }
      if (xml.startsWith('</item>', i)) {
        depth--; i += 7;
        if (depth === 0) {
          return xml.substring(start, i);
        }
        continue;
      }
      i++;
    }
    return null;
  }

  /**
   * Extract value from XML using regex (tolerant of whitespace).
   */
  extractXmlValue(xml, key) {
    const re = new RegExp(`<item\\s+key="${key}">\\s*([^<]+?)\\s*<\\/item>`, 'i');
    const m = xml.match(re);
    return m ? m[1] : null;
  }

  /**
   * Parse XML response from OpenSRS API and convert to JSON
   * @param {string} xmlString - The XML response string
   * @returns {Object} - The parsed JSON response object
   */
  parseXmlResponse(xmlString) {
    try {
      console.log('Parsing XML response to JSON...');

      const responseCode = this.extractXmlValue(xmlString, 'response_code');
      const responseText = this.extractXmlValue(xmlString, 'response_text');
      const isSuccess = responseCode === '200' || responseCode === '210';

      const result = {
        success: isSuccess,
        responseCode,
        responseText,
        timestamp: new Date().toISOString(),
        requestId: this.extractXmlValue(xmlString, 'request_id') || null
      };

      // Find <item key="attributes"><dt_assoc> ... </dt_assoc></item>
      const attributesStart = xmlString.indexOf('<item key="attributes">');
      if (attributesStart !== -1) {
        const assocStart = xmlString.indexOf('<dt_assoc>', attributesStart);
        if (assocStart !== -1) {
          const assocBlock = this.balancedSlice(xmlString, assocStart, '<dt_assoc>', '</dt_assoc>');
          if (assocBlock) {
            const inner = assocBlock.slice('<dt_assoc>'.length, -'</dt_assoc>'.length);
            result.data = this.parseAttributes(inner);

            if (result.data.suggestion) {
              result.suggestions = this.parseSuggestions(result.data.suggestion);
            }
            if (result.data.lookup) {
              result.lookups = this.parseLookups(result.data.lookup);
            }
            if (result.data.premium) {
              result.premium = this.parseSuggestions(result.data.premium);
            }
            if (result.data.personal_names) {
              result.personalNames = this.parseSuggestions(result.data.personal_names);
            }
            if (result.data.is_search_completed !== undefined) {
              result.isSearchCompleted = result.data.is_search_completed === '1';
            }
            if (result.data.request_response_time) {
              const n = Number(result.data.request_response_time);
              if (!Number.isNaN(n)) result.responseTime = n;
            }
          }
        }
      }

      if (!result.data) {
        result.data = {
          is_search_completed: this.extractXmlValue(xmlString, 'is_search_completed'),
          request_response_time: this.extractXmlValue(xmlString, 'request_response_time')
        };
      }

      console.log('Parsed JSON response:', JSON.stringify(result, null, 2));
      return result;

    } catch (error) {
      console.error('Error parsing XML response:', error);
      return {
        success: false,
        error: 'Failed to parse XML response',
        responseCode: 'PARSE_ERROR',
        responseText: error.message,
        timestamp: new Date().toISOString(),
        data: {}
      };
    }
  }

  /**
   * Parse attributes section from XML (inner of <dt_assoc>…</dt_assoc>)
   */
  parseAttributes(attributesXml) {
    const result = {};

    console.log('Attributes XML length:', attributesXml.length);
    console.log('Attributes XML preview:', attributesXml.substring(0, 500));

    // Extract simple top-level items that are not nested dt_assoc/array
    const simpleItems = attributesXml.match(/<item\s+key="([^"]+)">\s*([^<]+?)\s*<\/item>/g);
    if (simpleItems) {
      simpleItems.forEach(item => {
        const match = item.match(/<item\s+key="([^"]+)">\s*([^<]+?)\s*<\/item>/);
        if (match) result[match[1]] = match[2];
      });
    }

    // Parse known service sections with balanced extraction
    const serviceSections = ['suggestion', 'lookup', 'premium', 'personal_names'];
    serviceSections.forEach(service => {
      const svcItem = this.extractItemBlock(attributesXml, service);
      if (!svcItem) return;

      const assocStart = svcItem.indexOf('<dt_assoc>');
      if (assocStart === -1) return;

      const assocBlock = this.balancedSlice(svcItem, assocStart, '<dt_assoc>', '</dt_assoc>');
      if (!assocBlock) return;

      const inner = assocBlock.slice('<dt_assoc>'.length, -'</dt_assoc>'.length);
      result[service] = this.parseServiceSection(inner);
    });

    // Also extract common top-level flags if present
    if (result.is_search_completed === undefined) {
      result.is_search_completed = this.extractXmlValue(attributesXml, 'is_search_completed');
    }
    if (result.request_response_time === undefined) {
      result.request_response_time = this.extractXmlValue(attributesXml, 'request_response_time');
    }

    return result;
  }

  /**
   * Parse any service section (inner of service's <dt_assoc>)
   */
  parseServiceSection(serviceXml) {
    const result = {};

    // Count (optional)
    const count = this.extractXmlValue(serviceXml, 'count');
    if (count) result.count = Number(count);

    // Response info
    const responseCode = this.extractXmlValue(serviceXml, 'response_code');
    const responseText = this.extractXmlValue(serviceXml, 'response_text');
    const isSuccess = this.extractXmlValue(serviceXml, 'is_success');
    if (responseCode) result.response_code = responseCode;
    if (responseText) result.response_text = responseText;
    if (isSuccess !== null) result.is_success = isSuccess === '1';

    // Items: first try direct regex for a clean <dt_array> wrapper
    const itemsMatch = serviceXml.match(/<item\s+key="items">\s*<dt_array>([\s\S]*?)<\/dt_array>\s*<\/item>/s);
    if (itemsMatch) {
      result.items = this.parseItemsArray(itemsMatch[1]);
    } else {
      // If regex fails, use balanced extraction for items -> dt_array
      const itemsBlock = this.extractItemBlock(serviceXml, 'items');
      if (itemsBlock) {
        const arrStart = itemsBlock.indexOf('<dt_array>');
        if (arrStart !== -1) {
          const arrBlock = this.balancedSlice(itemsBlock, arrStart, '<dt_array>', '</dt_array>');
          if (arrBlock) {
            const inner = arrBlock.slice('<dt_array>'.length, -'</dt_array>'.length);
            result.items = this.parseItemsArray(inner);
          }
        }
      }
    }

    if (!result.items) result.items = [];
    return result;
  }

  /**
   * Parse items array: expects the INNER content of <dt_array>…</dt_array>
   */
  parseItemsArray(itemsXml) {
    const items = [];

    console.log('Parsing items array, XML length:', itemsXml.length);
    console.log('Items XML preview:', itemsXml.substring(0, 300));

    // If caller accidentally passed the full wrapper, strip it
    const dtArray = itemsXml.match(/<dt_array>([\s\S]*?)<\/dt_array>/s);
    const content = dtArray ? dtArray[1] : itemsXml;

    // Match <item key="N"> <dt_assoc> ... </dt_assoc> </item> (tolerant)
    const itemRegex = /<item[^>]*\bkey="(\d+)"[^>]*>\s*<dt_assoc>([\s\S]*?)<\/dt_assoc>\s*<\/item>/g;
    let m;
    while ((m = itemRegex.exec(content)) !== null) {
      const assoc = m[2];
      const domain = this.extractXmlValue(assoc, 'domain');
      const status = this.extractXmlValue(assoc, 'status');
      const price = this.extractXmlValue(assoc, 'price');

      if (domain) {
        const rec = {
          domain,
          status: status || 'unknown',
          available: status === 'available'
        };
        if (price && !Number.isNaN(Number(price))) rec.price = Number(price);
        items.push(rec);
      }
    }

    console.log(`Total items parsed: ${items.length}`);
    return items;
  }

  /**
   * Parse suggestions utility
   */
  parseSuggestions(suggestionData) {
    const result = {
      count: Number(suggestionData.count) || 0,
      items: []
    };

    if (suggestionData.items && Array.isArray(suggestionData.items)) {
      result.items = suggestionData.items.map(item => ({
        domain: item.domain || '',
        status: item.status || 'unknown',
        available: item.status === 'available'
      }));
    }

    return result;
  }

  /**
   * Parse lookups utility
   */
  parseLookups(lookupData) {
    const result = {
      count: Number(lookupData.count) || 0,
      items: []
    };

    if (lookupData.items && Array.isArray(lookupData.items)) {
      result.items = lookupData.items.map(item => ({
        domain: item.domain || '',
        status: item.status || 'unknown',
        available: item.status === 'available'
      }));
    }

    return result;
  }

  // =========================
  // PUBLIC API METHODS
  // =========================

  async lookupDomain(domain) {
    return this.makeRequest('LOOKUP', 'DOMAIN', { domain });
  }

  async getDomain(domain) {
    return this.makeRequest('GET', 'DOMAIN', { domain });
  }
  // Normalize phone to OpenSRS format: +1.4165550123
normalizePhone(phone) {
  if (!phone) return phone;
  // Remove everything except digits and +
  let s = String(phone).replace(/[^\d+]/g, '');
  // Collapse multiple + and keep only leading
  s = s.replace(/\++/g, '+').replace(/(?!^)\+/g, '');
  // If user forgot +, add it
  if (!s.startsWith('+')) s = `+${s}`;
  
  // For OpenSRS, format as +1.4165550123 (add dot after country code for North American numbers)
  if (s.startsWith('+1') && s.length === 12) {
    s = s.substring(0, 2) + '.' + s.substring(2);
  }
  
  return s;
}

 normalizeContact(contact) {
   if (!contact) return contact;
   const c = { ...contact };
   
   // Normalize phone numbers
   if (c.phone) c.phone = this.normalizePhone(c.phone);
   if (c.fax) c.fax = this.normalizePhone(c.fax);
   
   // Normalize country and state codes
   if (c.country) c.country = String(c.country).toUpperCase(); // ISO-2
   if (c.state) c.state = String(c.state).toUpperCase();   // e.g., NY, CA
   
   // Ensure required fields are present
   if (!c.address3 && contact === c) c.address3 = 'Owner'; // Default address3
   
   // Ensure all required fields have values
   const requiredFields = ['first_name', 'last_name', 'address1', 'city', 'state', 'country', 'postal_code', 'phone', 'email'];
   for (const field of requiredFields) {
     if (!c[field]) {
       console.warn(`⚠️ Missing required contact field: ${field}`);
     }
   }
   
   return c;
 }

toArrayObj(arr = []) {
  return Object.fromEntries((arr || []).map((v, i) => [String(i), v]));
}

 async registerDomain(domain, contacts, period = 1, nameservers = [], options = {}) {
   // Normalize contacts to OpenSRS expectations
   const contact_set = {};
   if (contacts?.registrant_contact) contact_set.owner   = this.normalizeContact(contacts.registrant_contact);
   if (contacts?.admin_contact)      contact_set.admin   = this.normalizeContact(contacts.admin_contact);
   if (contacts?.tech_contact)       contact_set.tech    = this.normalizeContact(contacts.tech_contact);
   if (contacts?.billing_contact)    contact_set.billing = this.normalizeContact(contacts.billing_contact);

   // If no admin contact provided, use owner contact
   if (!contact_set.admin && contact_set.owner) {
     contact_set.admin = { ...contact_set.owner, address3: 'Admin' };
   }
   
   // If no billing contact provided, use owner contact  
   if (!contact_set.billing && contact_set.owner) {
     contact_set.billing = { ...contact_set.owner, address3: 'Billing' };
   }

   const attributes = {
     reg_type: 'new',
     domain,
     period: Number(period) || 1,
     handle: 'process',
     auto_renew: options.auto_renew ? 1 : 0,
     f_whois_privacy: options.whois_privacy ? 1 : 0,
     // Domain registration credentials (required by OpenSRS)
     reg_username: options.reg_username || process.env.OPENSRS_REG_USERNAME || 'testuser',
     reg_password: options.reg_password || process.env.OPENSRS_REG_PASSWORD || 'testpass123',
     contact_set
   };

   // Handle nameservers with proper OpenSRS format
   if (Array.isArray(nameservers) && nameservers.length > 0) {
     attributes.custom_nameservers = 1;
     const nameserverArray = {};
     nameservers.forEach((ns, index) => {
       nameserverArray[index] = {
         name: ns,
         sortorder: index + 1
       };
     });
     attributes.nameserver_list = nameserverArray;
   } else {
     attributes.custom_nameservers = 0;
   }

   // Set custom_tech_contact flag
   attributes.custom_tech_contact = contact_set.tech ? 1 : 0;

   console.log('🏗️ Domain registration attributes:', JSON.stringify(attributes, null, 2));

   return this.makeRequest('SW_REGISTER', 'DOMAIN', attributes);
 }


  async renewDomain(domain, period = 1) {
    return this.makeRequest('RENEW', 'DOMAIN', { domain, period });
  }

  async modifyDomain(domain, attributes) {
    return this.makeRequest('MODIFY', 'DOMAIN', { domain, ...attributes });
  }

  async updateContacts(domain, contacts) {
    return this.makeRequest('UPDATE_CONTACTS', 'DOMAIN', { domain, ...contacts });
  }

  async getPrice(domain) {
    return this.makeRequest('GET_PRICE', 'DOMAIN', { domain });
  }

  async getBalance() {
    return this.makeRequest('GET_BALANCE', 'BALANCE', {});
  }

  async getNameSuggestions(searchString, options = {}) {
    const {
      services = ['lookup', 'suggestion', 'premium', 'personal_names'],
      tlds = ['.com', '.net', '.org', '.info', '.biz', '.us', '.mobi'],
      languages = ['en'],
      maxWaitTime = 30,
      serviceOverride = null,
      searchKey = null
    } = options;

    const tldArray = {};
    tlds.forEach((tld, index) => { tldArray[index] = tld; });

    const servicesArray = {};
    services.forEach((service, index) => { servicesArray[index] = service; });

    const attributes = {
      searchstring: searchString,
      services: servicesArray,
      tlds: tldArray,
      language_list: languages.join(','),
      max_wait_time: maxWaitTime
    };

    if (searchKey) attributes.search_key = searchKey;
    if (serviceOverride) attributes.service_override = serviceOverride;

    return this.makeRequest('NAME_SUGGEST', 'DOMAIN', attributes);
  }

  // DNS Zone Management
  async createDnsZone(domain, records = []) {
    return this.makeRequest('create_dns_zone', 'domain', { domain, records });
  }
  async getDnsZone(domain) {
    return this.makeRequest('get_dns_zone', 'domain', { domain });
  }
  async setDnsZone(domain, records) {
    return this.makeRequest('set_dns_zone', 'domain', { domain, records });
  }
  async deleteDnsZone(domain) {
    return this.makeRequest('delete_dns_zone', 'domain', { domain });
  }
  async resetDnsZone(domain) {
    return this.makeRequest('reset_dns_zone', 'domain', { domain });
  }
  async forceDnsNameservers(domain, nameservers) {
    return this.makeRequest('force_dns_nameservers', 'domain', { domain, nameservers });
  }

  // Nameserver Management
  async createNameserver(nameserver, ipAddress) {
    return this.makeRequest('CREATE', 'NAMESERVER', { nameserver, ip_address: ipAddress });
  }
  async getNameserver(nameserver) {
    return this.makeRequest('GET', 'NAMESERVER', { nameserver });
  }
  async modifyNameserver(nameserver, ipAddress) {
    return this.makeRequest('MODIFY', 'NAMESERVER', { nameserver, ip_address: ipAddress });
  }
  async deleteNameserver(nameserver) {
    return this.makeRequest('DELETE', 'NAMESERVER', { nameserver });
  }
  async advancedUpdateNameservers(domain, nameservers) {
    return this.makeRequest('ADVANCED_UPDATE_NAMESERVERS', 'DOMAIN', { domain, nameserver_list: nameservers });
  }
  async registryAddNs(domain, nameserver, ipAddress) {
    return this.makeRequest('REGISTRY_ADD_NS', 'NAMESERVER', { domain, nameserver, ip_address: ipAddress });
  }
  async registryCheckNameserver(nameserver) {
    return this.makeRequest('REGISTRY_CHECK_NAMESERVER', 'NAMESERVER', { nameserver });
  }

  // Domain Transfer APIs
  async checkTransfer(domain, authInfo) {
    return this.makeRequest('CHECK_TRANSFER', 'DOMAIN', { domain, auth_info: authInfo });
  }
  async processTransfer(domain, authInfo, contacts) {
    return this.makeRequest('PROCESS_TRANSFER', 'DOMAIN', { domain, auth_info: authInfo, ...contacts });
  }
  async cancelTransfer(domain) {
    return this.makeRequest('CANCEL_TRANSFER', 'DOMAIN', { domain });
  }
  async getTransfersIn() {
    return this.makeRequest('GET_TRANSFERS_IN', 'TRANSFER', {});
  }
  async getTransfersAway() {
    return this.makeRequest('GET_TRANSFERS_AWAY', 'TRANSFER', {});
  }
  async sendPassword(domain, type = 'transfer') {
    return this.makeRequest('SEND_PASSWORD', 'DOMAIN', { domain, type });
  }
  async tradeDomain(domain, authInfo, contacts) {
    return this.makeRequest('TRADE_DOMAIN', 'DOMAIN', { domain, auth_info: authInfo, ...contacts });
  }

  // Additional Domain APIs
  async getDomainsByExpireDate(expireFrom, expireTo) {
    return this.makeRequest('GET_DOMAINS_BY_EXPIREDATE', 'DOMAIN', { expire_from: expireFrom, expire_to: expireTo });
  }
  async getDomainsContacts(domain) {
    return this.makeRequest('GET_DOMAINS_CONTACTS', 'DOMAIN', { domain });
  }
  async getNotes(domain) {
    return this.makeRequest('GET_NOTES', 'DOMAIN', { domain });
  }
  async getOrderInfo(orderId) {
    return this.makeRequest('GET_ORDER_INFO', 'ORDER', { order_id: orderId });
  }
  async getOrdersByDomain(domain) {
    return this.makeRequest('GET_ORDERS_BY_DOMAIN', 'ORDER', { domain });
  }
  async getRegistrantVerificationStatus(domain) {
    return this.makeRequest('GET_REGISTRANT_VERIFICATION_STATUS', 'DOMAIN', { domain });
  }
  async sendRegistrantVerificationEmail(domain) {
    return this.makeRequest('SEND_REGISTRANT_VERIFICATION_EMAIL', 'DOMAIN', { domain });
  }
  async setDomainAffiliateId(domain, affiliateId) {
    return this.makeRequest('SET_DOMAIN_AFFILIATE_ID', 'DOMAIN', { domain, affiliate_id: affiliateId });
  }
  async getDomainAffiliateId(domain) {
    return this.makeRequest('GET_DOMAIN_AFFILIATE_ID', 'DOMAIN', { domain });
  }
  async getDeletedDomains() {
    return this.makeRequest('GET_DELETED_DOMAINS', 'DOMAIN', {});
  }
  async getContract(domain) {
    return this.makeRequest('GET_CONTRACT', 'DOMAIN', { domain });
  }

  // DNSSEC Management
  async modifyDnssec(domain, dnssecData) {
    return this.makeRequest('MODIFY', 'DNSSEC', { domain, ...dnssecData });
  }
  async getDnssec(domain) {
    return this.makeRequest('GET', 'DNSSEC', { domain });
  }
  async setDnssecInfo(domain, dnssecInfo) {
    return this.makeRequest('SET_DNSSEC_INFO', 'DNSSEC', { domain, ...dnssecInfo });
  }

  // Domain Forwarding
  async createDomainForwarding(domain, forwardingData) {
    return this.makeRequest('CREATE_DOMAIN_FORWARDING', 'DOMAIN_FORWARDING', { domain, ...forwardingData });
  }
  async getDomainForwarding(domain) {
    return this.makeRequest('GET_DOMAIN_FORWARDING', 'DOMAIN_FORWARDING', { domain });
  }
  async setDomainForwarding(domain, forwardingData) {
    return this.makeRequest('SET_DOMAIN_FORWARDING', 'DOMAIN_FORWARDING', { domain, ...forwardingData });
  }
  async deleteDomainForwarding(domain) {
    return this.makeRequest('DELETE_DOMAIN_FORWARDING', 'DOMAIN_FORWARDING', { domain });
  }

  // Bulk Change
  async submitBulkChange(bulkChangeData) {
    return this.makeRequest('SUBMIT', 'BULK_CHANGE', bulkChangeData);
  }
  async submitBulkChangeWhoisPrivacy(domains, privacySetting) {
    return this.makeRequest('SUBMIT_BULK_CHANGE', 'BULK_CHANGE', { domains, whois_privacy: privacySetting });
  }

  // User Management
  async addSubuser(subuserData) {
    return this.makeRequest('ADD', 'SUBUSER', subuserData);
  }
  async getSubuser(username) {
    return this.makeRequest('GET', 'SUBUSER', { username });
  }
  async modifySubuser(username, subuserData) {
    return this.makeRequest('MODIFY', 'SUBUSER', { username, ...subuserData });
  }
  async deleteSubuser(username) {
    return this.makeRequest('DELETE', 'SUBUSER', { username });
  }
  async getUserInfo() {
    return this.makeRequest('GET', 'USERINFO', {});
  }

  // Authentication / Ownership
  async changeOwnership(domain, newOwnerData) {
    return this.makeRequest('CHANGE', 'OWNERSHIP', { domain, ...newOwnerData });
  }
  async sendAuthcode(domain) {
    return this.makeRequest('SEND_AUTHCODE', 'DOMAIN', { domain });
  }

  // Event Notifications
  async pollEvent() {
    return this.makeRequest('POLL_EVENT', 'EVENT', {});
  }
  async ackEvent(eventId) {
    return this.makeRequest('ACK_EVENT', 'EVENT', { event_id: eventId });
  }

  // ICANN Trade
  async modifyTradeLockSetting(domain, lockSetting) {
    return this.makeRequest('MODIFY_TRADE_LOCK_SETTING', 'ICANN_TRADE', { domain, ...lockSetting });
  }
  async getTradeLockSetting(domain) {
    return this.makeRequest('GET_TRADE_LOCK_SETTING', 'ICANN_TRADE', { domain });
  }
  async modifyTradeDesignatedAgent(domain, agentData) {
    return this.makeRequest('MODIFY_TRADE_DESIGNATED_AGENT', 'ICANN_TRADE', { domain, ...agentData });
  }
  async getTradeDesignatedAgent(domain) {
    return this.makeRequest('GET_TRADE_DESIGNATED_AGENT', 'ICANN_TRADE', { domain });
  }
  async enableDesignatedAgent(domain) {
    return this.makeRequest('ENABLE_DESIGNATED_AGENT', 'ICANN_TRADE', { domain });
  }
  async cancelIcannTrade(domain) {
    return this.makeRequest('CANCEL_ICANN_TRADE', 'ICANN_TRADE', { domain });
  }
  async resendTradeApprovalNotice(domain) {
    return this.makeRequest('RESEND_TRADE_APPROVAL_NOTICE', 'ICANN_TRADE', { domain });
  }

  // Personal Names Service
  async registerPersonalName(personalNameData) {
    return this.makeRequest('SU_REGISTER', 'PERSONAL_NAME', personalNameData);
  }
  async queryPersonalName(surname) {
    return this.makeRequest('QUERY', 'SURNAME', { surname });
  }
  async updatePersonalName(surname, updateData) {
    return this.makeRequest('UPDATE', 'SURNAME', { surname, ...updateData });
  }
  async deletePersonalName(surname) {
    return this.makeRequest('DELETE', 'SURNAME', { surname });
  }

  // GDPR
  async gdprSendConsentReminderEmail(domain) {
    return this.makeRequest('GDPR_SEND_CONSENT_REMINDER_EMAIL', 'GDPR', { domain });
  }

  // Messaging
  async modifyMessagingLanguage(domain, language) {
    return this.makeRequest('MODIFY_MESSAGING_LANGUAGE', 'DOMAIN', { domain, language });
  }
}

module.exports = OpenSRSClient;
