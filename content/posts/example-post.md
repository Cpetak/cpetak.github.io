---
title: "Example post"
date: 2026-09-16
draft: true # set to false to publish
tags: [example]
summary: "A short summary shown in the post list."
ShowToc: false
ShowReadingTime: true
---

This is an example post. It's a draft, so it only shows up with `hugo server -D`.

Create a new post with:

```sh
hugo new content posts/my-new-post.md
```

## Formatting

Regular **Markdown** works: *italics*, [links](https://gohugo.io), lists, and code.

- Images: put the file next to the post (e.g. `posts/my-post/index.md` + `posts/my-post/figure.png`) and use `![alt text](figure.png)`.
- Figures with captions: `{{</* figure src="figure.png" caption="A caption" align="center" */>}}`
- Files in `static/` are served at the site root, e.g. [the CV](/Curriculum_Vitae.pdf).
