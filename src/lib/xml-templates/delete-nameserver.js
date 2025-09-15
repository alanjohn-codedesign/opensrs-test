/**
 * OpenSRS Delete Nameserver XML Template
 * Based on https://domains.opensrs.guide/docs/nameserver-commands-overview
 */

module.exports = (nameserverData) => {
    const {
        nameserver
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
        <item key="action">delete</item>
        <item key="object">nameserver</item>
        <item key="attributes">
            <dt_assoc>
                <item key="nameserver">${nameserver}</item>
                <item key="handle">process</item>
            </dt_assoc>
        </item>
    </dt_assoc>
</data_block>
</body>
</OPS_envelope>`;
};
