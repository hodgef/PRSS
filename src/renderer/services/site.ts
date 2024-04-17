import { v4 as uuidv4 } from "uuid";
import { getString } from "../../common/utils";
import { IPostItem, ISite, ISiteMenus } from "../../common/interfaces";

export const getSampleSiteStructure = (): {
  site: ISite;
  items: IPostItem[];
} => {
  const siteUUID = uuidv4();
  const { home, blog, post } = getSampleSiteItems(siteUUID);

  return {
    site: {
      uuid: siteUUID,
      title: "",
      url: "",
      theme: "slate",
      updatedAt: null,
      createdAt: Date.now(),
      publishedAt: null,
      headHtml: "<title>%item.title% - %site.title%</title>",
      footerHtml: "",
      sidebarHtml: "",
      structure: [
        {
          key: home.uuid,
          children: [
            {
              key: blog.uuid,
              children: [
                {
                  key: post.uuid,
                  children: [],
                },
              ],
            },
          ],
        },
      ],
      vars: {},
      menus: {
        header: [
          {
            key: home.uuid,
            children: [],
          },
          {
            key: blog.uuid,
            children: [],
          },
        ],
        footer: [],
        sidebar: [],
      } as ISiteMenus,
    } as ISite,
    items: [home, blog, post],
  };
};

const getCommonProps = () => ({
  headHtml: null,
  footerHtml: null,
  sidebarHtml: null,
  updatedAt: null,
  createdAt: Date.now(),
  vars: {},
});

export const getSampleSiteItems = (siteUUID: string) => {
  const commonProps = getCommonProps();

  return {
    home: {
      ...commonProps,
      uuid: uuidv4(),
      siteId: siteUUID,
      slug: "home",
      title: "Home",
      content: "<p>This is the beginning of something great.</p>",
      template: "home",
      vars: {
        heroTitle: "Welcome",
        heroMessage: getString("theme_default_hero_message"),
      },
      exclusiveVars: ["heroTitle", "heroMessage"],
    },
    blog: {
      ...commonProps,
      uuid: uuidv4(),
      siteId: siteUUID,
      slug: "blog",
      title: "Blog",
      content: "<p>Explore the latest posts</p>",
      template: "blog",
    },
    post: {
      ...commonProps,
      uuid: uuidv4(),
      siteId: siteUUID,
      slug: "my-post",
      title: "My Post",
      content: "<p>This is my first post.</p>",
      template: "post",
    },
  };
};

export const getSamplePost = (siteUUID: string, partialPost: Partial<IPostItem> = {}): IPostItem => {
  const commonProps = getCommonProps();
  return {
    ...commonProps,
    uuid: uuidv4(),
    siteId: siteUUID,
    slug: "my-post",
    title: "My Post",
    content: "<p>This is my first post.</p>",
    template: "post",
    ...partialPost
  }
}

export const getSampleSiteIntStructure = () => {
  return {
    publishSuggested: false,
  };
};
