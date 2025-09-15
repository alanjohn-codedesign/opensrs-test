/**
 * OpenSRS Modify Nameserver XML Template
 * Based on https://domains.opensrs.guide/docs/nameserver-commands-overview
 */

module.exports = (nameserverData) => {
    const {
        nameserver,
        ip_addresses = []
    } = nameserverData;

    // Format IP addresses as indexed object
    const ipAddressesXml = ip_addresses.length > 0 ? 
        `<item key="ip_addresses">
            <dt_array>
                ${ip_addresses.map((ip, index) => `<item key="${index}">
                    <dt_assoc>
                        <item key="ip_address">${ip}</item>
                    </dt_assoc>
                </item>`).join('\n                ')}
            </dt_array>
        </item>` : '';

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
        <item key="action">modify</item>
        <item key="object">nameserver</item>
        <item key="attributes">
            <dt_assoc>
                <item key="nameserver">${nameserver}</item>
                <item key="handle">process</item>
                ${ipAddressesXml}
            </dt_assoc>
        </item>
    </dt_assoc>
</data_block>
</body>
</OPS_envelope>`;
};
