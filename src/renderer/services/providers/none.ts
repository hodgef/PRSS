import { getString, getInt } from '../../../common/utils';
import { build } from '../build';
import { error, confirmation } from '../utils';
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
        const confirmationRes = await confirmation({
            title:
                'You have no hosting set up with this site. Please change hosting or deploy the files manually.',
            buttons: [
                {
                    label: 'Change hosting',
                    action: () => {}
                },
                {
                    label: 'View Files',
                    action: () => {}
                }
            ],
            showCancel: true
        });

        if (confirmationRes === 0) {
            return {
                type: 'redirect',
                value: `/sites/${this.site.id}/hosting`
            };
        }

        if (confirmationRes === 1) {
            const bufferDir = getInt('paths.buffer');

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
        }

        onUpdate && onUpdate();
        return false;
    };
}

export default FallbackProvider;
