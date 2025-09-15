/**
 * OpenSRS Domain Registration XML Template
 * Based on https://domains.opensrs.guide/docs/sw_register-domain-or-trust_service-
 */

module.exports = (registrationData) => {
    const {
        domain,
        handle = 'process', // 'save' or 'process'
        autoRenew = 0, // 0 or 1
        period = 1, // Registration period in years
        regUsername,
        regPassword,
        contactSet,
        nameservers = [],
        customTldData = {},
        affiliateId = null
    } = registrationData;

    // Format nameservers as indexed object
    const nameserverXml = nameservers.length > 0 ? 
        `<item key="custom_nameservers">1</item>
        <item key="nameserver_list">
            <dt_array>
                ${nameservers.map((ns, index) => `<item key="${index}">
                    <dt_assoc>
                        <item key="name">${ns}</item>
                    </dt_assoc>
                </item>`).join('\n                ')}
            </dt_array>
        </item>` : '';

    // Format contact set
    const contactSetXml = Object.keys(contactSet).map(contactType => {
        const contact = contactSet[contactType];
        return `<item key="${contactType}">
                    <dt_assoc>
                        <item key="first_name">${contact.firstName}</item>
                        <item key="last_name">${contact.lastName}</item>
                        <item key="org_name">${contact.orgName || ''}</item>
                        <item key="address1">${contact.address1}</item>
                        <item key="address2">${contact.address2 || ''}</item>
                        <item key="city">${contact.city}</item>
                        <item key="state">${contact.state || ''}</item>
                        <item key="country">${contact.country}</item>
                        <item key="postal_code">${contact.postalCode}</item>
                        <item key="phone">${contact.phone}</item>
                        <item key="email">${contact.email}</item>
                    </dt_assoc>
                </item>`;
    }).join('\n                ');

    // Format TLD-specific data if provided
    const tldDataXml = Object.keys(customTldData).length > 0 ? 
        `<item key="tld_data">
            <dt_assoc>
                ${Object.keys(customTldData).map(key => 
                    typeof customTldData[key] === 'object' ? 
                        `<item key="${key}">
                            <dt_assoc>
                                ${Object.keys(customTldData[key]).map(subKey => 
                                    `<item key="${subKey}">${customTldData[key][subKey]}</item>`
                                ).join('\n                                ')}
                            </dt_assoc>
                        </item>` :
                        `<item key="${key}">${customTldData[key]}</item>`
                ).join('\n                ')}
            </dt_assoc>
        </item>` : '';

    // Format affiliate ID if provided
    const affiliateIdXml = affiliateId ? `<item key="affiliate_id">${affiliateId}</item>` : '';

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
        <item key="action">SW_REGISTER</item>
        <item key="object">DOMAIN</item>
        <item key="attributes">
            <dt_assoc>
                <item key="reg_type">new</item>
                <item key="domain">${domain}</item>
                <item key="handle">${handle}</item>
                <item key="period">${period}</item>
                <item key="auto_renew">${autoRenew}</item>
                <item key="reg_username">${regUsername}</item>
                <item key="reg_password">${regPassword}</item>
                <item key="f_whois_privacy">0</item>
                ${affiliateIdXml}
                ${nameserverXml}
                ${tldDataXml}
                <item key="contact_set">
                    <dt_assoc>
                        ${contactSetXml}
                    </dt_assoc>
                </item>
            </dt_assoc>
        </item>
    </dt_assoc>
</data_block>
</body>
</OPS_envelope>`;
};

