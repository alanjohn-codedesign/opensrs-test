// Name suggest XML template based on OpenSRS documentation
// https://domains.opensrs.guide/docs/name_suggest

module.exports = (searchString) => {
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
                <item key="action">NAME_SUGGEST</item>
                <item key="attributes">
                    <dt_assoc>
                        <item key="searchstring">${searchString}</item>
                        <item key="services">
                            <dt_array>
                                <item key="0">lookup</item>
                                <item key="1">suggestion</item>
                            </dt_array>
                        </item>
                        <item key="tlds">
                            <dt_array>
                                <item key="0">.com</item>
                                <item key="1">.net</item>
                                <item key="2">.org</item>
                                <item key="3">.co</item>
                                <item key="4">.info</item>
                            </dt_array>
                        </item>
                        <item key="language_list">en</item>
                        <item key="max_wait_time">30</item>
                    </dt_assoc>
                </item>
            </dt_assoc>
        </data_block>
    </body>
</OPS_envelope>`;
};

