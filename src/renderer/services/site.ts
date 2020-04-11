import { v4 as uuidv4 } from 'uuid';

export const getSampleSiteStructure = () => {
    const [item1] = getSampleSiteItems();

    return {
        id: '',
        title: '',
        url: '',
        theme: 'press',
        updatedAt: null,
        publishedAt: null,
        items: [item1],
        headHtml: '<title>%item.title% - %site.title%</title>',
        footerHtml: '',
        structure: [
            {
                key: item1.id,
                children: []
            }
        ],
        vars: {}
    } as ISite;
};

export const getSampleSiteItems = (nbItems = 1) => {
    const items = [
        {
            id: uuidv4(),
            slug: 'home',
            title: 'Hello World!',
            content: 'This is the beginning of something great.',
            template: 'home',
            headHtml: null,
            footerHtml: null,
            updatedAt: null,
            createdAt: Date.now(),
            vars: {}
        }
    ];

    return items.slice(0, nbItems);
};

export const getSampleSiteIntStructure = () => {
    return {
        publishSuggested: false
    };
};
