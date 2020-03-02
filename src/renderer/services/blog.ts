import { v4 as uuidv4 } from 'uuid';

import { get, set } from './utils';

export const getSampleSiteStructure = () => {
    const [ item1, item2, item3, item4, item5 ] = getSampleBlogItems(5);

    return {
        id: '',
        title: '',
        type: 'blog',
        url: '',
        theme: 'default',
        items: [
            item1,
            item2,
            item3,
            item4,
            item5
        ],
        structure: [
            [item1.id, [
                [item2.id,
                    [item3.id, item4.id]
                ],
                item5.id
            ]]
        ]
    } as ISite;
}

export const getSampleBlogItems = (nbItems = 1) => {
    const items = [
        {
            id: uuidv4(),
            slug: 'hello-home',
            title: 'Hello home!',
            content: 'This is a home',
            template: 'home',
            parser: 'react'
        },
        {
            id: uuidv4(),
            slug: 'test-post',
            title: 'My test post',
            content: 'This is a test post',
            template: 'home',
            parser: 'react'
        },
        {
            id: uuidv4(),
            slug: 'test-world',
            title: 'My home world',
            content: 'This is a test world',
            template: 'home',
            parser: 'react'
        },
        {
            id: uuidv4(),
            slug: 'test-blog',
            title: 'My blog post',
            content: 'This is a test blog',
            template: 'home',
            parser: 'react'
        },
        {
            id: uuidv4(),
            slug: 'test-stuff',
            title: 'My blog stuff',
            content: 'This is a test stuff',
            template: 'home',
            parser: 'react'
        }
    ];

    return items.slice(0, nbItems);
};

export const deletePosts = async (siteId: string, postIds: string[]) => {
    /*const site = get(`sites.${siteId}`);
    site.items = site.items.filter(item => !postIds.includes(item.id));

    if (site.items.length === 1) {
        return false;
    }

    set(`sites.${siteId}`, site);
    const { content } = await uploadConfig(siteId) || {};

    if (content) {
        return true;
    } else {
        return false;
    }*/
    return false;
}