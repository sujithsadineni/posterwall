import { lazy, Suspense } from "react";
import { Route, Routes } from "react-router";
import { Layout } from "@/components/Layout";
import { NotFound } from "@/components/NotFound";
import { PostCardSkeleton } from "@/components/PostCard";
import { Feed } from "@/pages/Feed";

// The feed loads with the app; every other page (forms, zod, dialogs) is its own file, fetched on first visit.
const PostPage = lazy(() => import("@/pages/PostPage").then((m) => ({ default: m.PostPage })));
const Write = lazy(() => import("@/pages/Write").then((m) => ({ default: m.Write })));
const Profile = lazy(() => import("@/pages/Profile").then((m) => ({ default: m.Profile })));
const LogIn = lazy(() => import("@/pages/Auth").then((m) => ({ default: m.LogIn })));
const SignUp = lazy(() => import("@/pages/Auth").then((m) => ({ default: m.SignUp })));

export default function App() {
  return (
    <Routes>
      <Route
        element={
          <Suspense fallback={<PostCardSkeleton />}>
            <Layout />
          </Suspense>
        }
      >
        <Route index element={<Feed />} />
        <Route path="p/:id" element={<PostPage />} />
        <Route path="p/:id/edit" element={<Write />} />
        <Route path="write" element={<Write />} />
        <Route path="u/:username" element={<Profile />} />
        <Route path="login" element={<LogIn />} />
        <Route path="signup" element={<SignUp />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}
