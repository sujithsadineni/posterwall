import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router";
import { useApolloClient, useMutation } from "@apollo/client/react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import type { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/Field";
import { Logo } from "@/components/Logo";
import { LOG_IN, SIGN_UP } from "@/graphql/operations";
import { useTitle } from "@/hooks/useTitle";
import { apiError } from "@/lib/errors";
import { logInSchema, signUpSchema } from "@/lib/validation";

// only same-site paths, so ?next= can't send someone to another website
function useNext() {
  const next = useSearchParams()[0].get("next") ?? "/";
  return next.startsWith("/") && !next.startsWith("//") ? next : "/";
}

function Shell({
  title,
  children,
  footer,
}: {
  title: string;
  children: React.ReactNode;
  footer: React.ReactNode;
}) {
  useTitle(title);
  return (
    <div className="mx-auto grid max-w-sm gap-6 pt-4">
      <div className="grid justify-items-center gap-3 text-center">
        <Logo showName={false} className="[&>svg]:size-12" />
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
      </div>
      <div className="rounded-2xl border bg-card p-6 shadow-xs">{children}</div>
      <p className="text-center text-sm text-muted-foreground">{footer}</p>
    </div>
  );
}

export function LogIn() {
  const next = useNext();
  const navigate = useNavigate();
  const client = useApolloClient();
  const [logIn] = useMutation(LOG_IN);
  const [failed, setFailed] = useState<string | null>(null);
  const form = useForm<z.infer<typeof logInSchema>>({
    resolver: zodResolver(logInSchema),
    defaultValues: { username: "", password: "" },
  });

  const onSubmit = form.handleSubmit(async (input) => {
    setFailed(null);
    try {
      await logIn({ variables: { input } });
      await client.resetStore(); // refetch everything as this person (likedByMe, menus)
      toast.success("Welcome back");
      navigate(next);
    } catch (e) {
      setFailed(apiError(e).message);
    }
  });

  return (
    <Shell
      title="Log in"
      footer={
        <>
          New here?{" "}
          <Link to="/signup" className="font-medium text-primary hover:underline">
            Create an account
          </Link>
        </>
      }
    >
      <form onSubmit={onSubmit} noValidate className="grid gap-4">
        {failed && (
          <p role="alert" className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {failed}
          </p>
        )}
        <Field label="Username" error={form.formState.errors.username?.message}>
          <Input autoComplete="username" autoFocus {...form.register("username")} />
        </Field>
        <Field label="Password" error={form.formState.errors.password?.message}>
          <Input type="password" autoComplete="current-password" {...form.register("password")} />
        </Field>
        <Button type="submit" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? "Logging in…" : "Log in"}
        </Button>
      </form>
    </Shell>
  );
}

export function SignUp() {
  const next = useNext();
  const navigate = useNavigate();
  const client = useApolloClient();
  const [signUp] = useMutation(SIGN_UP);
  const form = useForm<z.infer<typeof signUpSchema>>({
    resolver: zodResolver(signUpSchema),
    defaultValues: { username: "", email: "", password: "" },
  });
  const errors = form.formState.errors;

  const onSubmit = form.handleSubmit(async (input) => {
    try {
      await signUp({ variables: { input } });
      await client.resetStore();
      toast.success("Welcome to PosterWall");
      navigate(next);
    } catch (e) {
      const err = apiError(e);
      for (const [field, message] of Object.entries(err.fields))
        form.setError(field as "username" | "email" | "password", { message });
      if (!Object.keys(err.fields).length) toast.error(err.message);
    }
  });

  return (
    <Shell
      title="Create your account"
      footer={
        <>
          Already have one?{" "}
          <Link to="/login" className="font-medium text-primary hover:underline">
            Log in instead
          </Link>
        </>
      }
    >
      <form onSubmit={onSubmit} noValidate className="grid gap-4">
        <Field label="Username" error={errors.username?.message} hint="3–30 letters, numbers or _">
          <Input autoComplete="username" autoFocus {...form.register("username")} />
        </Field>
        <Field label="Email" error={errors.email?.message}>
          <Input type="email" autoComplete="email" {...form.register("email")} />
        </Field>
        <Field label="Password" error={errors.password?.message} hint="At least 8 characters">
          <Input type="password" autoComplete="new-password" {...form.register("password")} />
        </Field>
        <Button type="submit" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? "Creating…" : "Create account"}
        </Button>
      </form>
    </Shell>
  );
}
