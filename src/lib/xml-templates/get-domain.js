/**
 * OpenSRS Get Domain XML Template
 * Based on OpenSRS get domain documentation
 */

module.exports = (domain) => {
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
        <item key="action">get</item>
        <item key="object">domain</item>
        <item key="attributes">
            <dt_assoc>
                <item key="domain">${domain}</item>
            </dt_assoc>
        </item>
    </dt_assoc>
</data_block>
</body>
</OPS_envelope>`;
};
