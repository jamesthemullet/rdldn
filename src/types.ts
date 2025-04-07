export type Size = {
  name: string;
  sourceUrl: string;
};

export type Sizes = {
  name: string;
  sourceUrl: string;
}[];

export type Post = {
  title?: string;
  slug?: string;
  featuredImage?: {
    node: {
      sourceUrl: string;
      mediaDetails?: {
        sizes: Sizes;
      };
    };
  };
  featuredImageUrl?: string;
  seo?: {
    opengraphImage?: {
      sourceUrl: string;
    };
  };
};

export type Location = {
  name: string;
  slug: string;
};
