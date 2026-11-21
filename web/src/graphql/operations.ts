import { graphql } from "@/gql";

// Every GraphQL operation the web app sends. Types are generated from these (npm run codegen -w web).

export const POST_CARD = graphql(`
  fragment PostCard on Post {
    id
    movieTitle
    releaseYear
    language
    rating
    posterUrl
    title
    body
    createdAt
    updatedAt
    likeCount
    likedByMe
    commentCount
    author {
      id
      username
    }
  }
`);

export const ME = graphql(`
  query Me {
    me {
      id
      username
    }
  }
`);

export const FEED = graphql(`
  query Feed($first: Int, $after: String, $language: Language) {
    feed(first: $first, after: $after, language: $language) {
      nodes {
        ...PostCard
      }
      nextCursor
    }
  }
`);

export const POST = graphql(`
  query Post($id: ID!) {
    post(id: $id) {
      ...PostCard
      comments {
        id
        body
        createdAt
        author {
          id
          username
        }
      }
    }
  }
`);

export const USER = graphql(`
  query User($username: String!) {
    user(username: $username) {
      id
      username
      createdAt
      posts {
        ...PostCard
      }
    }
  }
`);

export const LOG_IN = graphql(`
  mutation LogIn($input: LogInInput!) {
    logIn(input: $input) {
      id
      username
    }
  }
`);

export const SIGN_UP = graphql(`
  mutation SignUp($input: SignUpInput!) {
    signUp(input: $input) {
      id
      username
    }
  }
`);

export const LOG_OUT = graphql(`
  mutation LogOut {
    logOut
  }
`);

export const CREATE_POST = graphql(`
  mutation CreatePost($input: PostInput!) {
    createPost(input: $input) {
      ...PostCard
    }
  }
`);

export const UPDATE_POST = graphql(`
  mutation UpdatePost($id: ID!, $input: PostInput!) {
    updatePost(id: $id, input: $input) {
      ...PostCard
    }
  }
`);

export const DELETE_POST = graphql(`
  mutation DeletePost($id: ID!) {
    deletePost(id: $id)
  }
`);

export const TOGGLE_LIKE = graphql(`
  mutation ToggleLike($postId: ID!) {
    toggleLike(postId: $postId) {
      id
      likeCount
      likedByMe
    }
  }
`);

export const ADD_COMMENT = graphql(`
  mutation AddComment($postId: ID!, $body: String!) {
    addComment(postId: $postId, body: $body) {
      id
      body
      createdAt
      author {
        id
        username
      }
    }
  }
`);

export const DELETE_COMMENT = graphql(`
  mutation DeleteComment($id: ID!) {
    deleteComment(id: $id)
  }
`);
