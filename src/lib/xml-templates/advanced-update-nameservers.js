/**
 * OpenSRS Advanced Update Nameservers XML Template
 * Based on https://domains.opensrs.guide/docs/nameserver-commands-overview
 */

module.exports = (nameserverData) => {
    const {
        domain,
        op_type = 'assign', // 'assign' or 'remove'
        nameservers = []
    } = nameserverData;

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
        <item key="action">advanced_update_nameservers</item>
        <item key="object">domain</item>
        <item key="domain">${domain}</item>
        <item key="attributes">
            <dt_assoc>
                <item key="assign_ns">
                    <dt_array>
                        ${nameservers.map((ns, index) => `<item key="${index}">${ns}</item>`).join('\n                        ')}
                    </dt_array>
                </item>
                <item key="op_type">${op_type}</item>
            </dt_assoc>
        </item>
    </dt_assoc>
</data_block>
</body>
</OPS_envelope>`;
};
