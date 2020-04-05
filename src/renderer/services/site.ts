import { v4 as uuidv4 } from 'uuid';

export const getSampleSiteStructure = () => {
    // const [ item1 ] = getSampleSiteItems();
    const [item1, item2, item3, item4, item5] = getSampleSiteItems(5);

    return {
        id: '',
        title: '',
        url: '',
        theme: 'press',
        updatedAt: null,
        publishedAt: null,
        items: [item1, item2, item3, item4, item5],
        headHtml: '<title>%item.title% - %site.title%</title>',
        footerHtml: '',
        structure: [
            {
                key: item1.id,
                children: [
                    {
                        key: item2.id,
                        children: [
                            {
                                key: item3.id,
                                children: []
                            },
                            {
                                key: item4.id,
                                children: []
                            }
                        ]
                    },
                    {
                        key: item5.id,
                        children: []
                    }
                ]
            }
        ]
    } as ISite;
};

export const getSampleSiteItems = (nbItems = 1) => {
    const items = [
        {
            id: uuidv4(),
            slug: 'hello-home',
            title: 'Hello home!',
            content: 'This is a home',
            template: 'home',
            headHtml: null,
            footerHtml: null,
            updatedAt: null,
            createdAt: Date.now()
        },
        {
            id: uuidv4(),
            slug: 'test-post',
            title: 'My test post',
            content: '<h1>This is a test post</h1>',
            template: 'home',
            headHtml: null,
            footerHtml: null,
            updatedAt: null,
            createdAt: Date.now()
        },
        {
            id: uuidv4(),
            slug: 'test-world',
            title: 'My home world',
            content: 'This is a test world',
            template: 'home',
            headHtml: null,
            footerHtml: null,
            updatedAt: null,
            createdAt: Date.now()
        },
        {
            id: uuidv4(),
            slug: 'test-site',
            title: 'My site post',
            content: 'This is a test site',
            template: 'home',
            headHtml: null,
            footerHtml: null,
            updatedAt: null,
            createdAt: Date.now()
        },
        {
            id: uuidv4(),
            slug: 'test-stuff',
            title: 'My site stuff',
            content: 'This is a test stuff',
            template: 'home',
            headHtml: null,
            footerHtml: null,
            updatedAt: null,
            createdAt: Date.now()
        }
    ];

    return items.slice(0, nbItems);
};

export const getSampleSiteIntStructure = () => {
    return {
        publishSuggested: false
    };
};
