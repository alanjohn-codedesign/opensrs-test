/**
 * OpenSRS Domain Modification XML Template
 * Based on https://domains.opensrs.guide/docs/modify-domain
 */

module.exports = (modificationData) => {
    const {
        domain,
        data, // What to modify: 'nameserver_list', 'auto_renew', 'contact_info', etc.
        ...attributes
    } = modificationData;

    // Map modification types to their corresponding action names
    const getActionName = (modificationType) => {
        console.log('🔧 getActionName called with:', modificationType);
        switch (modificationType) {
            case 'nameserver_list':
                console.log('🔧 Returning: advanced_update_nameservers');
                return 'advanced_update_nameservers';
            case 'auto_renew':
                console.log('🔧 Returning: modify');
                return 'modify';
            case 'contact_info':
                console.log('🔧 Returning: update_contacts');
                return 'update_contacts';
            case 'locking':
                console.log('🔧 Returning: modify');
                return 'modify';
            default:
                console.log('🔧 Returning default: modify');
                return 'modify';
        }
    };

    // Build attributes XML based on the data type being modified
    const buildAttributesXml = (data, attrs) => {
        let attributesXml = `<item key="domain">${domain}</item>
                <item key="handle">process</item>`;

        // Handle different modification types
        switch (data) {
            case 'nameserver_list':
                if (attrs.nameservers && Array.isArray(attrs.nameservers)) {
                    attributesXml += `
                <item key="op_type">assign</item>
                <item key="nameserver_list">
                    <dt_array>
                        ${attrs.nameservers.map((ns, index) => `<item key="${index}">
                            <dt_assoc>
                                <item key="name">${ns}</item>
                            </dt_assoc>
                        </item>`).join('\n                        ')}
                    </dt_array>
                </item>`;
                }
                break;

            case 'auto_renew':
                attributesXml += `
                <item key="auto_renew">${attrs.autoRenew ? 1 : 0}</item>
                <item key="data">auto_renew</item>`;
                break;

            case 'expire_action':
                attributesXml += `
                <item key="auto_renew">${attrs.autoRenew ? 1 : 0}</item>
                <item key="let_expire">${attrs.letExpire ? 1 : 0}</item>
                <item key="data">expire_action</item>`;
                break;

            case 'whois_privacy_state':
                attributesXml += `
                <item key="state">${attrs.state}</item>
                <item key="data">whois_privacy_state</item>`;
                break;

            case 'contact_info':
                if (attrs.contactSet) {
                    attributesXml += `
                <item key="contact_set">
                    <dt_assoc>
                        ${Object.keys(attrs.contactSet).map(contactType => {
                            const contact = attrs.contactSet[contactType];
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
                        }).join('\n                        ')}
                    </dt_assoc>
                </item>
                <item key="data">contact_info</item>`;
                }
                break;

            case 'forwarding_email':
                attributesXml += `
                <item key="forwarding_email">${attrs.forwardingEmail}</item>`;
                break;

            case 'locking':
                attributesXml += `
                <item key="lock_state">${attrs.lockState ? 1 : 0}</item>
                <item key="data">locking</item>`;
                break;

            default:
                // Handle custom attributes
                Object.keys(attrs).forEach(key => {
                    if (key !== 'nameservers' && key !== 'contactSet') {
                        attributesXml += `
                <item key="${key}">${attrs[key]}</item>`;
                    }
                });
                break;
        }

        return attributesXml;
    };

    const actionName = getActionName(data);
    console.log('🔧 Modify template - data:', data, 'actionName:', actionName);

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
        <item key="action">${actionName}</item>
        <item key="object">DOMAIN</item>
        <item key="attributes">
            <dt_assoc>
                ${buildAttributesXml(data, attributes)}
            </dt_assoc>
        </item>
    </dt_assoc>
</data_block>
</body>
</OPS_envelope>`;
};

