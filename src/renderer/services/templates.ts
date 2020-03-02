import { error } from './utils';

export const getTemplate = async (templateId: string, extension: string) => {
    const templateRelPath = templateId.split('.').join('/');
    const templatePath = `${templateRelPath}.${extension}`;

    const template = await import('../themes/' + templatePath);

    if (template && template.default) {
        return template.default;
    } else {
        error(`Could not find theme "${templateId}"`);
        return false;
    }
}