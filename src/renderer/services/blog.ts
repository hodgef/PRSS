export const getSampleSiteStructure = () => {
    return {
        id: '',
        title: '',
        type: '',
        url: '',
        theme: 'default',
        items: [
            getSampleBlogItem()
        ]
    } as ISite;
}

export const getSampleBlogItem = () => {
    return {
        id: 'sample-post',
        title: 'Hello World!',
        content: 'This is a post',
        children: []
    };
};