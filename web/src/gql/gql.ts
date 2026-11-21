/* eslint-disable */
import * as types from "./graphql";
import type { TypedDocumentNode as DocumentNode } from "@graphql-typed-document-node/core";

/**
 * Map of all GraphQL operations in the project.
 *
 * This map has several performance disadvantages:
 * 1. It is not tree-shakeable, so it will include all operations in the project.
 * 2. It is not minifiable, so the string of a GraphQL query will be multiple times inside the bundle.
 * 3. It does not support dead code elimination, so it will add unused operations.
 *
 * Therefore it is highly recommended to use the babel or swc plugin for production.
 * Learn more about it here: https://the-guild.dev/graphql/codegen/plugins/presets/preset-client#reducing-bundle-size
 */
type Documents = {
  "\n  fragment PostCard on Post {\n    id\n    movieTitle\n    releaseYear\n    language\n    rating\n    posterUrl\n    title\n    body\n    createdAt\n    updatedAt\n    likeCount\n    likedByMe\n    commentCount\n    author {\n      id\n      username\n    }\n  }\n": typeof types.PostCardFragmentDoc;
  "\n  query Me {\n    me {\n      id\n      username\n    }\n  }\n": typeof types.MeDocument;
  "\n  query Feed($first: Int, $after: String, $language: Language) {\n    feed(first: $first, after: $after, language: $language) {\n      nodes {\n        ...PostCard\n      }\n      nextCursor\n    }\n  }\n": typeof types.FeedDocument;
  "\n  query Post($id: ID!) {\n    post(id: $id) {\n      ...PostCard\n      comments {\n        id\n        body\n        createdAt\n        author {\n          id\n          username\n        }\n      }\n    }\n  }\n": typeof types.PostDocument;
  "\n  query User($username: String!) {\n    user(username: $username) {\n      id\n      username\n      createdAt\n      posts {\n        ...PostCard\n      }\n    }\n  }\n": typeof types.UserDocument;
  "\n  mutation LogIn($input: LogInInput!) {\n    logIn(input: $input) {\n      id\n      username\n    }\n  }\n": typeof types.LogInDocument;
  "\n  mutation SignUp($input: SignUpInput!) {\n    signUp(input: $input) {\n      id\n      username\n    }\n  }\n": typeof types.SignUpDocument;
  "\n  mutation LogOut {\n    logOut\n  }\n": typeof types.LogOutDocument;
  "\n  mutation CreatePost($input: PostInput!) {\n    createPost(input: $input) {\n      ...PostCard\n    }\n  }\n": typeof types.CreatePostDocument;
  "\n  mutation UpdatePost($id: ID!, $input: PostInput!) {\n    updatePost(id: $id, input: $input) {\n      ...PostCard\n    }\n  }\n": typeof types.UpdatePostDocument;
  "\n  mutation DeletePost($id: ID!) {\n    deletePost(id: $id)\n  }\n": typeof types.DeletePostDocument;
  "\n  mutation ToggleLike($postId: ID!) {\n    toggleLike(postId: $postId) {\n      id\n      likeCount\n      likedByMe\n    }\n  }\n": typeof types.ToggleLikeDocument;
  "\n  mutation AddComment($postId: ID!, $body: String!) {\n    addComment(postId: $postId, body: $body) {\n      id\n      body\n      createdAt\n      author {\n        id\n        username\n      }\n    }\n  }\n": typeof types.AddCommentDocument;
  "\n  mutation DeleteComment($id: ID!) {\n    deleteComment(id: $id)\n  }\n": typeof types.DeleteCommentDocument;
};
const documents: Documents = {
  "\n  fragment PostCard on Post {\n    id\n    movieTitle\n    releaseYear\n    language\n    rating\n    posterUrl\n    title\n    body\n    createdAt\n    updatedAt\n    likeCount\n    likedByMe\n    commentCount\n    author {\n      id\n      username\n    }\n  }\n":
    types.PostCardFragmentDoc,
  "\n  query Me {\n    me {\n      id\n      username\n    }\n  }\n": types.MeDocument,
  "\n  query Feed($first: Int, $after: String, $language: Language) {\n    feed(first: $first, after: $after, language: $language) {\n      nodes {\n        ...PostCard\n      }\n      nextCursor\n    }\n  }\n":
    types.FeedDocument,
  "\n  query Post($id: ID!) {\n    post(id: $id) {\n      ...PostCard\n      comments {\n        id\n        body\n        createdAt\n        author {\n          id\n          username\n        }\n      }\n    }\n  }\n":
    types.PostDocument,
  "\n  query User($username: String!) {\n    user(username: $username) {\n      id\n      username\n      createdAt\n      posts {\n        ...PostCard\n      }\n    }\n  }\n":
    types.UserDocument,
  "\n  mutation LogIn($input: LogInInput!) {\n    logIn(input: $input) {\n      id\n      username\n    }\n  }\n":
    types.LogInDocument,
  "\n  mutation SignUp($input: SignUpInput!) {\n    signUp(input: $input) {\n      id\n      username\n    }\n  }\n":
    types.SignUpDocument,
  "\n  mutation LogOut {\n    logOut\n  }\n": types.LogOutDocument,
  "\n  mutation CreatePost($input: PostInput!) {\n    createPost(input: $input) {\n      ...PostCard\n    }\n  }\n":
    types.CreatePostDocument,
  "\n  mutation UpdatePost($id: ID!, $input: PostInput!) {\n    updatePost(id: $id, input: $input) {\n      ...PostCard\n    }\n  }\n":
    types.UpdatePostDocument,
  "\n  mutation DeletePost($id: ID!) {\n    deletePost(id: $id)\n  }\n": types.DeletePostDocument,
  "\n  mutation ToggleLike($postId: ID!) {\n    toggleLike(postId: $postId) {\n      id\n      likeCount\n      likedByMe\n    }\n  }\n":
    types.ToggleLikeDocument,
  "\n  mutation AddComment($postId: ID!, $body: String!) {\n    addComment(postId: $postId, body: $body) {\n      id\n      body\n      createdAt\n      author {\n        id\n        username\n      }\n    }\n  }\n":
    types.AddCommentDocument,
  "\n  mutation DeleteComment($id: ID!) {\n    deleteComment(id: $id)\n  }\n": types.DeleteCommentDocument,
};

/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 *
 *
 * @example
 * ```ts
 * const query = graphql(`query GetUser($id: ID!) { user(id: $id) { name } }`);
 * ```
 *
 * The query argument is unknown!
 * Please regenerate the types.
 */
export function graphql(source: string): unknown;

/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(
  source: "\n  fragment PostCard on Post {\n    id\n    movieTitle\n    releaseYear\n    language\n    rating\n    posterUrl\n    title\n    body\n    createdAt\n    updatedAt\n    likeCount\n    likedByMe\n    commentCount\n    author {\n      id\n      username\n    }\n  }\n",
): (typeof documents)["\n  fragment PostCard on Post {\n    id\n    movieTitle\n    releaseYear\n    language\n    rating\n    posterUrl\n    title\n    body\n    createdAt\n    updatedAt\n    likeCount\n    likedByMe\n    commentCount\n    author {\n      id\n      username\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(
  source: "\n  query Me {\n    me {\n      id\n      username\n    }\n  }\n",
): (typeof documents)["\n  query Me {\n    me {\n      id\n      username\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(
  source: "\n  query Feed($first: Int, $after: String, $language: Language) {\n    feed(first: $first, after: $after, language: $language) {\n      nodes {\n        ...PostCard\n      }\n      nextCursor\n    }\n  }\n",
): (typeof documents)["\n  query Feed($first: Int, $after: String, $language: Language) {\n    feed(first: $first, after: $after, language: $language) {\n      nodes {\n        ...PostCard\n      }\n      nextCursor\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(
  source: "\n  query Post($id: ID!) {\n    post(id: $id) {\n      ...PostCard\n      comments {\n        id\n        body\n        createdAt\n        author {\n          id\n          username\n        }\n      }\n    }\n  }\n",
): (typeof documents)["\n  query Post($id: ID!) {\n    post(id: $id) {\n      ...PostCard\n      comments {\n        id\n        body\n        createdAt\n        author {\n          id\n          username\n        }\n      }\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(
  source: "\n  query User($username: String!) {\n    user(username: $username) {\n      id\n      username\n      createdAt\n      posts {\n        ...PostCard\n      }\n    }\n  }\n",
): (typeof documents)["\n  query User($username: String!) {\n    user(username: $username) {\n      id\n      username\n      createdAt\n      posts {\n        ...PostCard\n      }\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(
  source: "\n  mutation LogIn($input: LogInInput!) {\n    logIn(input: $input) {\n      id\n      username\n    }\n  }\n",
): (typeof documents)["\n  mutation LogIn($input: LogInInput!) {\n    logIn(input: $input) {\n      id\n      username\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(
  source: "\n  mutation SignUp($input: SignUpInput!) {\n    signUp(input: $input) {\n      id\n      username\n    }\n  }\n",
): (typeof documents)["\n  mutation SignUp($input: SignUpInput!) {\n    signUp(input: $input) {\n      id\n      username\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(
  source: "\n  mutation LogOut {\n    logOut\n  }\n",
): (typeof documents)["\n  mutation LogOut {\n    logOut\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(
  source: "\n  mutation CreatePost($input: PostInput!) {\n    createPost(input: $input) {\n      ...PostCard\n    }\n  }\n",
): (typeof documents)["\n  mutation CreatePost($input: PostInput!) {\n    createPost(input: $input) {\n      ...PostCard\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(
  source: "\n  mutation UpdatePost($id: ID!, $input: PostInput!) {\n    updatePost(id: $id, input: $input) {\n      ...PostCard\n    }\n  }\n",
): (typeof documents)["\n  mutation UpdatePost($id: ID!, $input: PostInput!) {\n    updatePost(id: $id, input: $input) {\n      ...PostCard\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(
  source: "\n  mutation DeletePost($id: ID!) {\n    deletePost(id: $id)\n  }\n",
): (typeof documents)["\n  mutation DeletePost($id: ID!) {\n    deletePost(id: $id)\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(
  source: "\n  mutation ToggleLike($postId: ID!) {\n    toggleLike(postId: $postId) {\n      id\n      likeCount\n      likedByMe\n    }\n  }\n",
): (typeof documents)["\n  mutation ToggleLike($postId: ID!) {\n    toggleLike(postId: $postId) {\n      id\n      likeCount\n      likedByMe\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(
  source: "\n  mutation AddComment($postId: ID!, $body: String!) {\n    addComment(postId: $postId, body: $body) {\n      id\n      body\n      createdAt\n      author {\n        id\n        username\n      }\n    }\n  }\n",
): (typeof documents)["\n  mutation AddComment($postId: ID!, $body: String!) {\n    addComment(postId: $postId, body: $body) {\n      id\n      body\n      createdAt\n      author {\n        id\n        username\n      }\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(
  source: "\n  mutation DeleteComment($id: ID!) {\n    deleteComment(id: $id)\n  }\n",
): (typeof documents)["\n  mutation DeleteComment($id: ID!) {\n    deleteComment(id: $id)\n  }\n"];

export function graphql(source: string) {
  return (documents as any)[source] ?? {};
}

export type DocumentType<TDocumentNode extends DocumentNode<any, any>> =
  TDocumentNode extends DocumentNode<infer TType, any> ? TType : never;
