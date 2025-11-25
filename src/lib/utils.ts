import { Comments as CommentsType } from "../types";

export const organiseComments = (comments: CommentsType) => {
  const commentMap = new Map();

  comments?.forEach((comment) => {
    comment.replies = [];
    commentMap.set(comment.id, comment);
  });

  const topLevelComments: CommentsType = [];
  comments?.forEach((comment) => {
    if (comment.parentId) {
      const parent = commentMap.get(comment.parentId);
      if (parent) {
        parent.replies.push(comment);
      }
    } else {
      topLevelComments.push(comment);
    }
  });

  return topLevelComments;
};