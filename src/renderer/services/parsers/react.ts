import { getTemplate } from './../templates';
const template_extension = 'tsx';

const parser: parserType = async (templateId, data) => {
    const template = await getTemplate(templateId, template_extension);
    console.log('template', template, data);

    return '';
}

export default parser;