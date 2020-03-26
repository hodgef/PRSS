import { getString, get } from '../../../common/utils';
import { build } from '../build';
import { error } from '../utils';
import { modal } from '../../components/Modal';
import path from 'path';
import { shell } from 'electron';

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

    deploy = async (onUpdate?, providedBufferItems?: IBufferItem[]) => {
        modal.alert(
            'You have no hosting set up with this site. Please set one up in your Site Settings or deploy the files manually.'
        );
        const bufferDir = get('paths.buffer');

        if (providedBufferItems && providedBufferItems.length) {
            if (providedBufferItems.length > 1) {
                /**
                 * Open root buffer dir
                 */
                shell.openItem(bufferDir);
            } else {
                /**
                 * Open item dir
                 */
                const itemBufferPath = path.join(
                    bufferDir,
                    providedBufferItems[0].path
                );
                shell.openItem(itemBufferPath);
            }
        }

        onUpdate && onUpdate();
        return true;
    };
}

export default FallbackProvider;
