import { v4 as uuidv4 } from 'uuid';

export const getSampleSiteStructure = (): {
    site: ISite;
    items: IPostItem[];
} => {
    const siteUUID = uuidv4();
    const { home, blog, post } = getSampleSiteItems(siteUUID);

    return {
        site: {
            uuid: siteUUID,
            title: '',
            url: '',
            theme: 'press',
            updatedAt: null,
            createdAt: Date.now(),
            publishedAt: null,
            headHtml: '<title>%item.title% - %site.title%</title>',
            footerHtml: '',
            sidebarHtml: '',
            structure: [
                {
                    key: home.uuid,
                    children: [
                        {
                            key: blog.uuid,
                            children: [
                                {
                                    key: post.uuid,
                                    children: []
                                }
                            ]
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
        } as ISite,
        items: [home, blog, post]
    };
};

export const getSampleSiteItems = (siteUUID: string) => {
    const commonProps = {
        headHtml: null,
        footerHtml: null,
        sidebarHtml: null,
        updatedAt: null,
        createdAt: Date.now(),
        vars: {}
    };

    return {
        home: {
            uuid: uuidv4(),
            siteId: siteUUID,
            slug: 'home',
            title: 'Home',
            content: '<p>This is the beginning of something great.</p>',
            template: 'home',
            ...commonProps
        },
        blog: {
            uuid: uuidv4(),
            siteId: siteUUID,
            slug: 'blog',
            title: 'Blog',
            content: '<p>Explore the latest posts</p>',
            template: 'blog',
            ...commonProps
        },
        post: {
            uuid: uuidv4(),
            siteId: siteUUID,
            slug: 'my-post',
            title: 'My Post',
            content: '<p>This is my first post.</p>',
            template: 'post',
            ...commonProps
        }
    };
};

export const getSampleSiteIntStructure = () => {
    return {
        publishSuggested: false
    };
};
