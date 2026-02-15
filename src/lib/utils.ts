import type { Comment, Comments as CommentsType, Post } from "../types";

type TopRoastPostOptions = {
  lovedIncludesAny?: string[];
  lovedExcludes?: string[];
  extraPredicate?: (post: Post) => boolean;
  limit?: number;
};

const getPostRating = (post: Post): number =>
  Number.parseFloat(post.ratings?.nodes?.[0]?.name || "");

const isRoastDinnerPost = (post: Post): boolean =>
  post.typesOfPost?.nodes?.some((node) => node.name === "Roast Dinner") ?? false;

const isClosedDownPost = (post: Post): boolean =>
  (post.closedDowns?.nodes?.length ?? 0) > 0;

export const getTopRoastDinnerPosts = (
  posts: Post[],
  {
    lovedIncludesAny = [],
    lovedExcludes = [],
    extraPredicate,
    limit = 5
  }: TopRoastPostOptions = {}
): Post[] => {
  const includes = lovedIncludesAny.map((term) => term.toLowerCase());
  const excludes = lovedExcludes.map((term) => term.toLowerCase());

  return posts
    .filter((post) => {
      const loved = post.highlights?.loved?.toLowerCase() ?? "";
      const rating = getPostRating(post);

      if (Number.isNaN(rating) || isClosedDownPost(post) || !isRoastDinnerPost(post)) {
        return false;
      }

      if (includes.length > 0 && !includes.some((term) => loved.includes(term))) {
        return false;
      }

      if (excludes.some((term) => loved.includes(term))) {
        return false;
      }

      if (extraPredicate && !extraPredicate(post)) {
        return false;
      }

      return true;
    })
    .sort((a, b) => getPostRating(b) - getPostRating(a))
    .slice(0, limit);
};

export const organiseComments = (comments: CommentsType): Comment[] => {
  if (!comments || comments.length === 0) {
    return [];
  }

  const commentMap = new Map<string, Comment>();

  comments.forEach((comment) => {
    comment.replies = [];
    commentMap.set(comment.id, comment);
  });

  const topLevelComments: Comment[] = [];

  comments.forEach((comment) => {
    if (comment.parentId) {
      const parent = commentMap.get(comment.parentId);
      if (parent) {
        parent.replies?.push(comment);
        return;
      }
    }

    topLevelComments.push(comment);
  });

  return topLevelComments;
};