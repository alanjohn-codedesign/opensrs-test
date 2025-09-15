// opensrs-client.js
const axios = require('axios');
const crypto = require('crypto');
const CacheManager = require('./cache-manager');

// Import XML templates
const registerDomainTemplate = require('./xml-templates/register-domain');
const modifyDomainTemplate = require('./xml-templates/modify-domain');
const createDnsZoneTemplate = require('./xml-templates/create-dns-zone');
const getDnsZoneTemplate = require('./xml-templates/get-dns-zone');
const setDnsZoneTemplate = require('./xml-templates/set-dns-zone');
const deleteDnsZoneTemplate = require('./xml-templates/delete-dns-zone');

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

    console.log('🔧 OpenSRS Client Configuration:');
    console.log('  Test Mode:', this.testMode);
    console.log('  API Host:', this.apiHost);
    console.log('  Reseller Username:', this.resellerUsername ? 'Set' : 'Missing');
    console.log('  API Key:', this.apiKey ? 'Set' : 'Missing');

    if (!this.resellerUsername || !this.apiKey) {
      throw new Error('OpenSRS reseller username and API key are required. Please set OPENSRS_RESELLER_USERNAME and OPENSRS_API_KEY environment variables.');
    }

    // Initialize cache manager
    this.cache = new CacheManager();
    
    // Clean expired cache entries every 10 minutes
    setInterval(() => {
      this.cache.clearExpired();
    }, 10 * 60 * 1000);
  }

  /**
   * Generate MD5 signature for OpenSRS API authentication
   */
  generateSignature(xml) {
    const firstHash = crypto.createHash('md5').update(xml + this.apiKey).digest('hex');
    const signature = crypto.createHash('md5').update(firstHash + this.apiKey).digest('hex');
    return signature;
  }

  /**
   * Test API connectivity with a simple request
   */
  async testConnectivity() {
    try {
      console.log('🔍 Testing OpenSRS API connectivity...');
      
      // Use a simple lookup request to test connectivity
      const testXml = require('./xml-templates/lookup-domain')('example.com');
      const result = await this.makeRequest(testXml, 5000); // 5 second timeout for test
      
      console.log('✅ API connectivity test result:', result);
      return result;
    } catch (error) {
      console.error('❌ API connectivity test failed:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Make request to OpenSRS API with timeout
   */
  async makeRequest(xml, timeout = 10000) {
    try {
      const signature = this.generateSignature(xml);

      const headers = {
        'Content-Type': 'text/xml',
        'X-Username': this.resellerUsername,
        'X-Signature': signature
      };

      console.log('Making request to OpenSRS API...');
      console.log('API Host:', this.apiHost);
      console.log('Timeout:', timeout + 'ms');
      console.log('Request XML:', xml);

      const response = await axios.post(this.apiHost, xml, { 
        headers,
        timeout: timeout // Add timeout to prevent hanging requests
      });

      console.log('Response status:', response.status);
      console.log('Response data:', response.data);

      return this.parseXmlResponse(response.data);
    } catch (error) {
      console.error('OpenSRS API request failed:', error.message);
      if (error.code === 'ECONNABORTED') {
        return {
          success: false,
          error: 'Request timeout',
          data: null
        };
      }
      return {
        success: false,
        error: error.response?.data || error.message,
        data: null
      };
    }
  }

  /**
   * Parse XML response from OpenSRS
   */
  parseXmlResponse(xmlString) {
    try {
      console.log('🔍 Parsing XML response...');
      console.log('Raw XML response:', xmlString.substring(0, 500) + (xmlString.length > 500 ? '...' : ''));
      
      // Basic validation
      if (!xmlString || typeof xmlString !== 'string') {
        throw new Error('Invalid XML response: response is not a string');
      }
      
      if (!xmlString.includes('<OPS_envelope>')) {
        throw new Error('Invalid XML response: missing OPS_envelope structure');
      }
      
      // Extract response code
      const responseCodeMatch = xmlString.match(/<item key="response_code">(\d+)<\/item>/);
      const responseCode = responseCodeMatch ? responseCodeMatch[1] : null;
      
      // Extract response text - improved regex to handle encoded characters
      const responseTextMatch = xmlString.match(/<item key="response_text">([^<]*(?:<[^>]*>[^<]*)*)<\/item>/);
      const responseText = responseTextMatch ? responseTextMatch[1].replace(/&apos;/g, "'").replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&') : null;
      
      // Extract success status
      const successMatch = xmlString.match(/<item key="is_success">([01])<\/item>/);
      const isSuccess = successMatch ? successMatch[1] === '1' : false;

      // Extract attributes section
      const attributesMatch = xmlString.match(/<item key="attributes">\s*<dt_assoc>(.*?)<\/dt_assoc>\s*<\/item>/s);
      let attributes = {};
      
      if (attributesMatch) {
        const attributesContent = attributesMatch[1];
        
        // Extract status (for domain lookup)
        const statusMatch = attributesContent.match(/<item key="status">([^<]+)<\/item>/);
        if (statusMatch) attributes.status = statusMatch[1];
        
        // Extract price (for pricing requests) - try multiple formats
        const priceMatch = attributesContent.match(/<item key="price">([^<]+)<\/item>/);
        const costMatch = attributesContent.match(/<item key="cost">([^<]+)<\/item>/);
        const amountMatch = attributesContent.match(/<item key="amount">([^<]+)<\/item>/);
        
        if (priceMatch && priceMatch[1] !== 'undef') {
          attributes.price = parseFloat(priceMatch[1]);
        } else if (costMatch && costMatch[1] !== 'undef') {
          attributes.price = parseFloat(costMatch[1]);
        } else if (amountMatch && amountMatch[1] !== 'undef') {
          attributes.price = parseFloat(amountMatch[1]);
        }
        
        // Extract currency (for pricing requests)
        const currencyMatch = attributesContent.match(/<item key="currency">([^<]+)<\/item>/);
        if (currencyMatch && currencyMatch[1] !== 'undef') {
          attributes.currency = currencyMatch[1];
        } else {
          // Default currency if not specified
          attributes.currency = 'USD';
        }
        
        // Extract additional registration/modification response data
        const idMatch = attributesContent.match(/<item key="id">([^<]+)<\/item>/);
        if (idMatch) attributes.id = idMatch[1];
        
        const registrationTextMatch = attributesContent.match(/<item key="registration_text">([^<]+)<\/item>/);
        if (registrationTextMatch) attributes.registrationText = registrationTextMatch[1];
        
        const adminEmailMatch = attributesContent.match(/<item key="admin_email">([^<]+)<\/item>/);
        if (adminEmailMatch) attributes.adminEmail = adminEmailMatch[1];
        
        const transferIdMatch = attributesContent.match(/<item key="transfer_id">([^<]+)<\/item>/);
        if (transferIdMatch) attributes.transferId = transferIdMatch[1];
        
        // Extract DNS zone data
        const recordsMatch = attributesContent.match(/<item key="records">\s*<dt_array>(.*?)<\/dt_array>\s*<\/item>/s);
        if (recordsMatch) {
          attributes.records = this.parseDnsRecords(recordsMatch[1]);
        }
        
        // Extract suggestions data (for NAME_SUGGEST requests)
        this.parseSuggestionsData(attributesContent, attributes);
      }

      console.log('✅ Parsed response:', { responseCode, responseText, isSuccess, attributes });

      return {
        success: isSuccess,
        responseCode,
        responseText,
        data: attributes
      };
    } catch (error) {
      console.error('❌ Error parsing XML response:', error.message);
      console.error('❌ Error stack:', error.stack);
      console.error('❌ Raw XML (first 1000 chars):', xmlString?.substring(0, 1000));
      
      return {
        success: false,
        error: `Failed to parse XML response: ${error.message}`,
        rawResponse: xmlString?.substring(0, 500),
        data: null
      };
    }
  }

  /**
   * Parse DNS records from XML response (handles OpenSRS grouped structure)
   */
  parseDnsRecords(recordsContent) {
    try {
      const records = [];
      
      // OpenSRS returns records grouped by type (A, MX, CNAME, etc.)
      const typeMatches = recordsContent.match(/<item key="([A-Z]+)">\s*<dt_array>(.*?)<\/dt_array>\s*<\/item>/gs);
      
      if (typeMatches) {
        typeMatches.forEach(typeMatch => {
          // Extract the record type (A, MX, CNAME, etc.)
          const typeKeyMatch = typeMatch.match(/<item key="([A-Z]+)">/);
          if (!typeKeyMatch) return;
          
          const recordType = typeKeyMatch[1];
          
          // Extract the array content
          const arrayContentMatch = typeMatch.match(/<dt_array>(.*?)<\/dt_array>/s);
          if (!arrayContentMatch) return;
          
          const arrayContent = arrayContentMatch[1];
          
          // Parse individual records within this type
          const recordMatches = arrayContent.match(/<item key="\d+">\s*<dt_assoc>(.*?)<\/dt_assoc>\s*<\/item>/gs);
          
          if (recordMatches) {
            recordMatches.forEach(recordMatch => {
              const record = { type: recordType };
              
              const subdomainMatch = recordMatch.match(/<item key="subdomain">([^<]*)<\/item>/);
              if (subdomainMatch) record.subdomain = subdomainMatch[1];
              
              // Parse type-specific fields and convert to common format
              switch (recordType) {
                case 'A':
                  const ipMatch = recordMatch.match(/<item key="ip_address">([^<]+)<\/item>/);
                  if (ipMatch) record.address = ipMatch[1];
                  break;
                case 'AAAA':
                  const ipv6Match = recordMatch.match(/<item key="ipv6_address">([^<]+)<\/item>/);
                  if (ipv6Match) record.address = ipv6Match[1];
                  break;
                case 'CNAME':
                case 'MX':
                  const hostnameMatch = recordMatch.match(/<item key="hostname">([^<]+)<\/item>/);
                  if (hostnameMatch) record.address = hostnameMatch[1];
                  
                  if (recordType === 'MX') {
                    const priorityMatch = recordMatch.match(/<item key="priority">([^<]+)<\/item>/);
                    if (priorityMatch) record.priority = parseInt(priorityMatch[1]);
                  }
                  break;
                case 'TXT':
                  const textMatch = recordMatch.match(/<item key="text">([^<]+)<\/item>/);
                  if (textMatch) record.address = textMatch[1];
                  break;
                case 'SRV':
                  const srvHostnameMatch = recordMatch.match(/<item key="hostname">([^<]+)<\/item>/);
                  if (srvHostnameMatch) record.address = srvHostnameMatch[1];
                  
                  const srvPriorityMatch = recordMatch.match(/<item key="priority">([^<]+)<\/item>/);
                  if (srvPriorityMatch) record.priority = parseInt(srvPriorityMatch[1]);
                  
                  const weightMatch = recordMatch.match(/<item key="weight">([^<]+)<\/item>/);
                  if (weightMatch) record.weight = parseInt(weightMatch[1]);
                  
                  const portMatch = recordMatch.match(/<item key="port">([^<]+)<\/item>/);
                  if (portMatch) record.port = parseInt(portMatch[1]);
                  break;
                default:
                  // Fallback for unknown types
                  const addressMatch = recordMatch.match(/<item key="address">([^<]+)<\/item>/);
                  if (addressMatch) record.address = addressMatch[1];
              }
              
              // Add optional TTL if present
              const ttlMatch = recordMatch.match(/<item key="ttl">([^<]+)<\/item>/);
              if (ttlMatch) record.ttl = parseInt(ttlMatch[1]);
              
              records.push(record);
            });
          }
        });
      }
      
      console.log('📋 Parsed DNS records:', records);
      return records;
    } catch (error) {
      console.error('Error parsing DNS records:', error);
      return [];
    }
  }

  /**
   * Parse suggestions data from NAME_SUGGEST response
   */
  parseSuggestionsData(attributesContent, attributes) {
    try {
      // Look for suggestion service results
      const suggestionMatch = attributesContent.match(/<item key="suggestion">\s*<dt_assoc>(.*?)<\/dt_assoc>\s*<\/item>/s);
      if (suggestionMatch) {
        const suggestionContent = suggestionMatch[1];
        
        // Extract items array from suggestions
        const itemsMatch = suggestionContent.match(/<item key="items">\s*<dt_array>(.*?)<\/dt_array>\s*<\/item>/s);
        if (itemsMatch) {
          const itemsContent = itemsMatch[1];
          const domains = [];
          
          // Extract individual domain suggestions
          const domainMatches = itemsContent.match(/<item key="\d+">\s*<dt_assoc>(.*?)<\/dt_assoc>\s*<\/item>/gs);
          if (domainMatches) {
            domainMatches.forEach(match => {
              const domainMatch = match.match(/<item key="domain">([^<]+)<\/item>/);
              if (domainMatch) {
                domains.push(domainMatch[1]);
              }
            });
          }
          
          attributes.suggested_domains = domains;
        }
      }
      
      // Look for lookup service results  
      const lookupMatch = attributesContent.match(/<item key="lookup">\s*<dt_assoc>(.*?)<\/dt_assoc>\s*<\/item>/s);
      if (lookupMatch) {
        const lookupContent = lookupMatch[1];
        
        // Extract items array from lookup
        const itemsMatch = lookupContent.match(/<item key="items">\s*<dt_array>(.*?)<\/dt_array>\s*<\/item>/s);
        if (itemsMatch) {
          const itemsContent = itemsMatch[1];
          const domains = [];
          
          // Extract individual domain lookups
          const domainMatches = itemsContent.match(/<item key="\d+">\s*<dt_assoc>(.*?)<\/dt_assoc>\s*<\/item>/gs);
          if (domainMatches) {
            domainMatches.forEach(match => {
              const domainMatch = match.match(/<item key="domain">([^<]+)<\/item>/);
              if (domainMatch) {
                domains.push(domainMatch[1]);
              }
            });
          }
          
          attributes.lookup_domains = domains;
        }
      }
    } catch (error) {
      console.warn('Warning: Could not parse suggestions data:', error.message);
    }
  }

  /**
   * Domain lookup function with caching
   */
  async lookupDomain(domain) {
    // Check cache first
    const cached = this.cache.getCachedLookup(domain);
    if (cached) {
      return cached;
    }

    // Make API call if not cached
    const lookupXml = require('./xml-templates/lookup-domain')(domain);
    const result = await this.makeRequest(lookupXml);
    
    // Cache the result
    this.cache.cacheLookup(domain, result);
    
    return result;
  }

  /**
   * Get domain price function with caching
   */
  async getPrice(domain) {
    // Check cache first
    const cached = this.cache.getCachedPrice(domain);
    if (cached) {
      return cached;
    }

    // Make API call if not cached
    const priceXml = require('./xml-templates/get-price')(domain);
    const result = await this.makeRequest(priceXml);
    
    // Cache the result
    this.cache.cachePrice(domain, result);

    return result;
  }

  /**
   * Get name suggestions function
   */
  async getNameSuggestions(searchString) {
    const suggestionsXml = require('./xml-templates/name-suggest')(searchString);
    return await this.makeRequest(suggestionsXml);
  }

  /**
   * Combined domain search with suggestions and pricing (Optimized with parallel processing)
   */
  async searchDomainWithSuggestions(searchQuery) {
    try {
      const startTime = Date.now();
      console.log(`🔍 Starting optimized domain search for: ${searchQuery}`);

      // Get name suggestions first
      const suggestionsResult = await this.getNameSuggestions(searchQuery);
      
      if (!suggestionsResult.success) {
        return {
          success: false,
          error: 'Failed to get domain suggestions',
          data: null
        };
      }

      // Extract suggested domains from the suggestions result
      const allSuggestedDomains = this.extractSuggestedDomains(suggestionsResult.data, searchQuery);
      // Limit to first 10 domains for performance
      const suggestedDomains = allSuggestedDomains.slice(0, 10);
      console.log(`📋 Processing ${suggestedDomains.length} domains out of ${allSuggestedDomains.length} suggestions in parallel...`);
      
      // Process domains in batches to avoid overwhelming the API
      const batchSize = 5; // Process 5 domains at a time
      const results = [];
      
      for (let i = 0; i < suggestedDomains.length; i += batchSize) {
        const batch = suggestedDomains.slice(i, i + batchSize);
        console.log(`🔄 Processing batch ${Math.floor(i/batchSize) + 1}: ${batch.join(', ')}`);
        
        const batchPromises = batch.map(async (domain) => {
        try {
          console.log(`🔍 Processing domain: ${domain}`);
          
          // Run lookup and pricing in parallel for each domain with individual error handling
          const lookupPromise = this.lookupDomain(domain).catch(err => ({
            success: false,
            error: `Lookup failed: ${err.message}`,
            data: null
          }));
          
          const pricePromise = this.getPrice(domain).catch(err => ({
            success: false,
            error: `Price failed: ${err.message}`,
            data: null
          }));

          const [lookupResult, priceResult] = await Promise.all([lookupPromise, pricePromise]);

          const availability = lookupResult.success && lookupResult.data?.status ? lookupResult.data.status : 'unknown';
          
          console.log(`📊 ${domain}: availability=${availability}, priceSuccess=${priceResult.success}`);
          if (priceResult.success) {
            console.log(`💰 ${domain} price data:`, JSON.stringify(priceResult.data, null, 2));
          } else {
            console.log(`❌ ${domain} price error:`, priceResult.error || 'Unknown error');
            console.log(`❌ ${domain} price response code:`, priceResult.responseCode);
            console.log(`❌ ${domain} price response text:`, priceResult.responseText);
          }
          
          return {
        domain,
            availability,
            lookupSuccess: lookupResult.success,
            priceSuccess: priceResult.success,
            priceData: priceResult.data,
            priceError: priceResult.error
          };
        } catch (error) {
          console.error(`❌ Error processing ${domain}:`, error.message);
          return {
            domain,
            availability: 'error',
            lookupSuccess: false,
            priceSuccess: false,
            priceData: null,
            priceError: error.message
          };
        }
      });

        // Wait for batch to complete and add to results
        const batchResults = await Promise.all(batchPromises);
        results.push(...batchResults);
        
        // Small delay between batches to be gentle on the API
        if (i + batchSize < suggestedDomains.length) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }

      const domainResults = results;
      
      // Debug: Log all results before filtering
      console.log('🔍 All domain results before filtering:');
      domainResults.forEach(result => {
        console.log(`  ${result.domain}: ${result.availability} (lookup: ${result.lookupSuccess}, price: ${result.priceSuccess})`);
      });
      
      // Filter and format only available domains
      const suggestions = domainResults
        .filter(result => {
          const isAvailable = result.availability === 'available';
          if (!isAvailable) {
            console.log(`🚫 Filtering out ${result.domain} - Status: ${result.availability}`);
          }
          return isAvailable;
        })
        .map(result => {
          const suggestion = {
            domain: result.domain,
            availability: result.availability,
            price: null,
            currency: null,
            debug: {
              priceSuccess: result.priceSuccess,
              priceError: result.priceError || null
            }
          };

          // Add pricing for available domains
          if (result.priceSuccess && result.priceData) {
            suggestion.price = result.priceData.price || null;
            suggestion.currency = result.priceData.currency || 'USD';
            console.log(`💰 Added pricing for ${result.domain}: $${suggestion.price} ${suggestion.currency}`);
          } else {
            console.log(`⚠️ No pricing for ${result.domain}: priceSuccess=${result.priceSuccess}, error=${result.priceError}`);
          }

          return suggestion;
        });

      const processingTime = Date.now() - startTime;
      console.log(`✅ Search completed in ${processingTime}ms`);
      console.log(`📊 Results: ${suggestions.length} available domains out of ${suggestedDomains.length} checked`);
      console.log(`📦 Cache stats:`, this.cache.getStats());

      return {
        success: true,
        data: {
          search_query: searchQuery,
          suggestions: suggestions,
          stats: {
            total_checked: suggestedDomains.length,
            available_count: suggestions.length,
            processing_time_ms: processingTime,
            cache_stats: this.cache.getStats()
          }
        }
      };

    } catch (error) {
      console.error('Error in searchDomainWithSuggestions:', error);
      return {
        success: false,
        error: error.message,
        data: null
      };
    }
  }

  /**
   * Extract suggested domains from name suggestions response
   */
  extractSuggestedDomains(data, originalSearchQuery) {
    // Extract base name from search query (remove any existing TLD)
    const baseName = originalSearchQuery.replace(/\..+$/, '');
    
    let domains = [];
    
    // First, try to use actual OpenSRS suggestions if available
    if (data && data.suggested_domains && data.suggested_domains.length > 0) {
      domains = data.suggested_domains;
      console.log('✅ Using OpenSRS suggested domains:', domains);
    } else if (data && data.lookup_domains && data.lookup_domains.length > 0) {
      domains = data.lookup_domains;
      console.log('✅ Using OpenSRS lookup domains:', domains);
    } else {
      // Fallback: Generate common TLD alternatives
      console.log('⚠️ No OpenSRS suggestions found, generating fallback domains');
      const tlds = ['.com', '.net', '.org', '.co', '.info', '.biz', '.us'];
      domains = tlds.map(tld => baseName + tld);
    }
    
    console.log(`🎯 Final domain list for "${baseName}":`, domains);
    return domains;
  }

  /**
   * Register a new domain
   */
  async registerDomain(registrationData) {
    try {
      console.log('🔧 Registering domain:', registrationData.domain);
      
      const xml = registerDomainTemplate(registrationData);
      // Use longer timeout for domain registration (30 seconds)
      const result = await this.makeRequest(xml, 30000);
      
      console.log('✅ Domain registration result:', result);
      return result;
    } catch (error) {
      console.error('❌ Domain registration failed:', error.message);
      throw error;
    }
  }

  /**
   * Modify domain properties
   */
  async modifyDomain(domain, modificationType, modificationData) {
    try {
      console.log('🔧 Modifying domain:', domain, 'Type:', modificationType);
      console.log('🔧 Modification data:', modificationData);
      
      const templateData = {
        domain,
        data: modificationType,
        ...modificationData
      };
      console.log('🔧 Template data:', JSON.stringify(templateData, null, 2));
      
      const xml = modifyDomainTemplate(templateData);
      
      console.log('🔧 Generated modify XML:');
      console.log(xml);
      
      const result = await this.makeRequest(xml);
      
      console.log('✅ Domain modification result:', result);
      return result;
    } catch (error) {
      console.error('❌ Domain modification failed:', error.message);
      throw error;
    }
  }

  /**
   * Create DNS zone for domain
   */
  async createDnsZone(domain, records = []) {
    try {
      console.log('🔧 Creating DNS zone for:', domain);
      
      const xml = createDnsZoneTemplate({ domain, records });
      const result = await this.makeRequest(xml);
      
      console.log('✅ DNS zone creation result:', result);
      return result;
    } catch (error) {
      console.error('❌ DNS zone creation failed:', error.message);
      throw error;
    }
  }

  /**
   * Get DNS zone records for domain
   */
  async getDnsZone(domain) {
    try {
      console.log('🔧 Getting DNS zone for:', domain);
      
      const xml = getDnsZoneTemplate(domain);
      const result = await this.makeRequest(xml);
      
      console.log('✅ DNS zone retrieval result:', result);
      return result;
    } catch (error) {
      console.error('❌ DNS zone retrieval failed:', error.message);
      throw error;
    }
  }

  /**
   * Set/Update DNS zone records for domain
   */
  async setDnsZone(domain, records) {
    try {
      console.log('🔧 Setting DNS zone for:', domain);
      
      const xml = setDnsZoneTemplate({ domain, records });
      const result = await this.makeRequest(xml);
      
      console.log('✅ DNS zone update result:', result);
      return result;
    } catch (error) {
      console.error('❌ DNS zone update failed:', error.message);
      throw error;
    }
  }

  /**
   * Delete DNS zone for domain
   */
  async deleteDnsZone(domain) {
    try {
      console.log('🔧 Deleting DNS zone for:', domain);
      
      const xml = deleteDnsZoneTemplate(domain);
      const result = await this.makeRequest(xml);
      
      console.log('✅ DNS zone deletion result:', result);
      return result;
    } catch (error) {
      console.error('❌ DNS zone deletion failed:', error.message);
      throw error;
    }
  }

}

module.exports = OpenSRSClient;