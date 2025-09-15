/**
 * OpenSRS Set DNS Zone XML Template
 * Based on https://domains.opensrs.guide/docs/dns-zone-commands-overview
 */

module.exports = (dnsData) => {
    const {
        domain,
        records = []
    } = dnsData;

    // Group records by type as per OpenSRS documentation (same as create_dns_zone)
    const recordsByType = {};
    
    records.forEach(record => {
        const type = record.type.toUpperCase();
        if (!recordsByType[type]) {
            recordsByType[type] = [];
        }
        recordsByType[type].push(record);
    });
    
    // Format records according to OpenSRS structure
    const recordsXml = Object.keys(recordsByType).map(type => {
        const typeRecords = recordsByType[type];
        const recordsArray = typeRecords.map((record, index) => {
            let recordXml = `<item key="${index}">
                            <dt_assoc>
                                <item key="subdomain">${String(record.subdomain || '')}</item>`;
            
            // Add type-specific fields based on OpenSRS documentation
            switch (type) {
                case 'A':
                    recordXml += `
                                <item key="ip_address">${String(record.address)}</item>`;
                    break;
                case 'AAAA':
                    recordXml += `
                                <item key="ipv6_address">${String(record.address)}</item>`;
                    break;
                case 'CNAME':
                    recordXml += `
                                <item key="hostname">${String(record.address)}</item>`;
                    break;
                case 'MX':
                    recordXml += `
                                <item key="priority">${String(record.priority || 10)}</item>
                                <item key="hostname">${String(record.address)}</item>`;
                    break;
                case 'TXT':
                    recordXml += `
                                <item key="text">${String(record.address)}</item>`;
                    break;
                case 'SRV':
                    recordXml += `
                                <item key="priority">${String(record.priority || 10)}</item>
                                <item key="weight">${String(record.weight || 1)}</item>
                                <item key="hostname">${String(record.address)}</item>
                                <item key="port">${String(record.port || 80)}</item>`;
                    break;
                default:
                    // Fallback for other record types
                    recordXml += `
                                <item key="address">${String(record.address)}</item>`;
            }
            
            recordXml += `
                            </dt_assoc>
                        </item>`;
            
            return recordXml;
        }).join('\n                        ');
        
        return `<item key="${type}">
                    <dt_array>
                        ${recordsArray}
                    </dt_array>
                </item>`;
    }).join('\n                ');

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
        <item key="action">set_dns_zone</item>
        <item key="object">domain</item>
        <item key="attributes">
            <dt_assoc>
                <item key="domain">${domain}</item>
                <item key="records">
                    <dt_assoc>
                        ${recordsXml}
                    </dt_assoc>
                </item>
            </dt_assoc>
        </item>
    </dt_assoc>
</data_block>
</body>
</OPS_envelope>`;
};

