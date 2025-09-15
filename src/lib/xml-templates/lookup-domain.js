// Domain lookup XML template based on OpenSRS documentation
// https://domains.opensrs.guide/docs/lookup-domain

module.exports = (domain) => {
  return `<?xml version='1.0' encoding="UTF-8" standalone="no" ?>
<!DOCTYPE OPS_envelope SYSTEM "ops.dtd">
<OPS_envelope>
    <header>
        <version>0.9</version>
    </header>
    <body>
        <data_block>
            <dt_assoc>
                <item key="protocol">XCP</item>
                <item key="object">DOMAIN</item>
                <item key="action">LOOKUP</item>
                <item key="attributes">
                    <dt_assoc>
                        <item key="domain">${domain}</item>
                        <item key="no_cache">1</item>
                    </dt_assoc>
                </item>
            </dt_assoc>
        </data_block>
    </body>
</OPS_envelope>`;
};

