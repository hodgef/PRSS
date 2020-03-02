import { error } from './utils';

export const getTemplate = async (templateId: string, extension: string) => {
    const templateRelPath = templateId.split('.').join('/');
    const templatePath = `${templateRelPath}.${extension}`;
    const module = await import('C:/Dev/prss/src/renderer/themes/' + templatePath);

    if (!module) {
        error(`The template (${templateId}) does not exist.`);
        return () => {};
    } else {
        return module.default;
    };
}