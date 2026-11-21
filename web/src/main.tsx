import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router";
import { ApolloProvider } from "@apollo/client/react";
import { MotionConfig } from "motion/react";
import { Toaster } from "@/components/ui/sonner";
import { client } from "@/lib/apollo";
import App from "./App.tsx";
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    {/* "user": animations stop when the OS asks for reduced motion */}
    <MotionConfig reducedMotion="user">
      <ApolloProvider client={client}>
        <BrowserRouter basename={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <App />
        </BrowserRouter>
        <Toaster richColors position="bottom-center" />
      </ApolloProvider>
    </MotionConfig>
  </StrictMode>,
);
