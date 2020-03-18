// import { toast } from 'react-toastify';
import { globalRequire } from './../../common/utils';
import { get } from '../../common/utils';
import { build } from './build';

export const previewServer = globalRequire('browser-sync').create('prss');

export const bufferAndStartPreview = async (site, itemId) => {
    stopPreview();
    const buildRes = await build(site, null, itemId);

    if (buildRes && buildRes.length) {
        const bufferItem = buildRes[0];
        startPreview(bufferItem.path);
    }

    return buildRes;
};

export const startPreview = (startPath = '/') => {
    stopPreview();

    if (!previewServer.active) {
        const bufferDir = get('paths.buffer');
        previewServer.init({
            server: bufferDir,
            startPath
        });
        // previewServer.watch('*').on('change', previewServer.reload);
        previewServer.notify('PRSS Preview Started', 3000);
        // toast.success('Starting PRSS Preview');
    }
};

export const stopPreview = () => {
    if (previewServer.active) {
        previewServer.notify('PRSS Preview Stopped', 3000);
        previewServer.exit();
    }
};
