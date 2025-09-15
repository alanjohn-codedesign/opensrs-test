/**
 * OpenSRS Registry Check Nameserver XML Template
 * Based on https://domains.opensrs.guide/docs/nameserver-commands-overview
 */

module.exports = (nameserverData) => {
    const {
        nameserver,
        tld = null
    } = nameserverData;

    const tldXml = tld ? `<item key="tld">${tld}</item>` : '';

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
        <item key="action">registry_check_nameserver</item>
        <item key="object">nameserver</item>
        <item key="attributes">
            <dt_assoc>
                <item key="nameserver">${nameserver}</item>
                ${tldXml}
            </dt_assoc>
        </item>
    </dt_assoc>
</data_block>
</body>
</OPS_envelope>`;
};
