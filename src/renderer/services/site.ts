import { v4 as uuidv4 } from 'uuid';

export const getSampleSiteStructure = () => {
    const [item1, item2] = getSampleSiteItems(2);

    return {
        id: '',
        title: '',
        url: '',
        theme: 'press',
        updatedAt: null,
        publishedAt: null,
        items: [item1, item2],
        headHtml: '<title>%item.title% - %site.title%</title>',
        footerHtml: '',
        sidebarHtml: '',
        structure: [
            {
                key: item1.id,
                children: [
                    {
                        key: item2.id,
                        children: []
                    }
                ]
            }
        ],
        vars: {},
        menus: {
            header: [],
            footer: [],
            sidebar: []
        } as ISiteMenus
    } as ISite;
};

export const getSampleSiteItems = (nbItems = 1) => {
    const items = [
        {
            id: uuidv4(),
            slug: 'home',
            title: 'Home',
            content: 'This is the beginning of something great.',
            template: 'home',
            headHtml: null,
            footerHtml: null,
            sidebarHtml: null,
            updatedAt: null,
            createdAt: Date.now(),
            vars: {}
        },
        {
            id: uuidv4(),
            slug: 'my-post',
            title: 'My Post',
            content: 'This is my first post.',
            template: 'post',
            headHtml: null,
            footerHtml: null,
            sidebarHtml: null,
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
