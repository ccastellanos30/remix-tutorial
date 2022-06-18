import { Form, useActionData, useLoaderData, useTransition } from "@remix-run/react";
import type { ActionFunction, LoaderFunction } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import invariant from "tiny-invariant";
import { deletePost, getPost, Post, updatePost } from "~/models/post.server";
import { useState } from "react";

const inputClassName = `w-full rounded border border-gray-500 px-2 py-1 text-lg`;

type ActionData =
  | {
      title: null | string;
      slug: null | string;
      markdown: null | string;
    }
  | undefined;

type LoaderData = { post: Post, slug: string };

export const loader: LoaderFunction = async ({ params }) => {
  invariant(params.slug, '`params.slug` is required');
  const post = await getPost(params.slug)

  invariant(post, 'Post not found');

  return json<LoaderData>({ post, slug: params.slug });
}

export const action: ActionFunction = async ({ request }) => {
  // TODO: remove me
  await new Promise((res) => setTimeout(res, 1000));

  const formData = await request.formData();

  const originalSlug = formData.get("original-slug");

  invariant(
    typeof originalSlug === "string",
    "title must be a string"
  );

  const intent = formData.get("intent");

  if (intent === 'delete') {
    await deletePost(originalSlug);

    return redirect("/posts/admin");
  }

  const title = formData.get("title");
  const slug = formData.get("slug");
  const markdown = formData.get("markdown");

  const errors: ActionData = {
    title: title ? null : "Title is required",
    slug: slug ? null : "Slug is required",
    markdown: markdown ? null : "Markdown is required",
  };
  const hasErrors = Object.values(errors).some(
    (errorMessage) => errorMessage
  );
  if (hasErrors) {
    return json<ActionData>(errors);
  }

  invariant(
    typeof title === "string",
    "title must be a string"
  );
  invariant(
    typeof slug === "string",
    "slug must be a string"
  );
  invariant(
    typeof markdown === "string",
    "markdown must be a string"
  );

  await updatePost(originalSlug, { title, slug, markdown });

  return redirect("/posts/admin");
};

export default function EditPost() {
  const { post, slug } = useLoaderData<LoaderData>();
  const errors = useActionData();

  const transition = useTransition();
  const isUpdating = Boolean(transition.submission?.formData.get('intent') === 'update');
  const isDeleting = Boolean(transition.submission?.formData.get('intent') === 'delete');

  return (
    <Form method="post">
      <p>
        <label>
          Post Title:{" "}
          {errors?.title ? (
            <em className="text-red-600">{errors.title}</em>
          ) : null}
          <input
            key={slug}
            type="text"
            name="title"
            className={inputClassName}
            defaultValue={post.title}
          />
        </label>
      </p>
      <p>
        <label>
          Post Slug:{" "}
          {errors?.slug ? (
            <em className="text-red-600">{errors.slug}</em>
          ) : null}
          <input
            key={slug}
            type="text"
            name="slug"
            className={inputClassName}
            defaultValue={post.slug}
          />
        </label>
      </p>
      <p>
        <label htmlFor="markdown">
          Markdown:{" "}
          {errors?.markdown ? (
            <em className="text-red-600">
              {errors.markdown}
            </em>
          ) : null}
        </label>
        <br />
        <textarea
          key={slug}
          id="markdown"
          rows={20}
          name="markdown"
          className={`${inputClassName} font-mono`}
          defaultValue={post.markdown}
        />
      </p>

      <input type="hidden" name="original-slug" value={slug} />

      <p className="text-right">
        <button
          name="intent"
          value="delete"
          type="submit"
          className="rounded bg-red-500 py-2 px-4 text-white hover:bg-red-600 focus:bg-red-400 disabled:bg-red-300 mr-2"
          disabled={isDeleting}
        >
          {isDeleting ? 'Deleting...' : 'Delete Post'}
        </button>

        <button
          name="intent"
          value="update"
          type="submit"
          className="rounded bg-blue-500 py-2 px-4 text-white hover:bg-blue-600 focus:bg-blue-400 disabled:bg-blue-300"
          disabled={isUpdating}
        >
          {isUpdating ? 'Updating...' : 'Update Post'}
        </button>
      </p>
    </Form>
  );
}