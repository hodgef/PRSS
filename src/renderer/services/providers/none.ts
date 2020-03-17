import { getString } from '../../../common/utils';
import { build } from '../build';
import { error } from '../utils';

class FallbackProvider {
    private readonly site: ISite;
    public readonly vars = {};
    public static hostingTypeDef = {
        title: 'None (Manual deployment)',
        fields: []
    };

    constructor(site: ISite) {
        this.site = site;
    }

    setup = async onUpdate => {
        /**
         * Build project
         */
        const buildRes = await build(this.site, onUpdate);

        if (!buildRes) {
            error(getString('error_buffer'));
            return false;
        }

        return this.site;
    };
}

export default FallbackProvider;
