# cpetak.github.io

Personal website built with [Hugo](https://gohugo.io) and the [PaperMod](https://github.com/adityatelange/hugo-PaperMod) theme.

## Requirements

- **Hugo extended, 0.146 or newer.** PaperMod refuses to build on older versions, and the
  templates in `layouts/` use the post-0.146 template system. The GitHub Actions workflow
  pins 0.166; match that locally if you can. Check with `hugo version` (the output must say
  `extended`).
  - macOS: `brew install hugo`
  - Linux: download the `hugo_extended_<version>_linux-amd64.deb` from the
    [releases page](https://github.com/gohugoio/hugo/releases) and `sudo dpkg -i` it.
    Distro packages are often too old.
  - Windows: `winget install Hugo.Hugo.Extended`
- **git**, for the theme submodule.
- Optional, only for preparing media: `ffmpeg` (videos) and `sips` (macOS) or ImageMagick
  (images). See [Media](#media).

## Setup

```sh
git clone --recurse-submodules <this repo>
cd csengeblog
hugo server -D   # preview at http://localhost:1313 (-D also shows drafts)
```

If you cloned without `--recurse-submodules`, run `git submodule update --init`.
Config changes in `hugo.yaml` need a server restart; content and template edits reload live.

## Verify a change

```sh
hugo
```

builds the site into `public/` and must finish with **no warnings and no errors**. Deprecation
warnings from Hugo count: the copied templates in `layouts/` exist partly to keep the build
warning-free (see below). `public/` and `resources/` are build output and are gitignored.

## Where things are

| What | Where |
| --- | --- |
| Site settings, menu, landing page (photo, tagline, buttons, social links) | `hugo.yaml` |
| About page | `content/about/index.md` (its images sit next to it) |
| Publications | `data/publications.yaml`, one entry per paper (`year`, `title`, `authors`, `venue`, `url`); rendered by `layouts/publications.html` as a timeline, sorted by year in the template |
| CV | replace `static/Curriculum_Vitae.pdf` |
| Blog posts | `content/posts/`. A post with media is a folder: `posts/my-post/index.md` plus its files |
| PDFs and other files | `static/`, served at the site root (`static/foo.pdf` → `/foo.pdf`) |
| Photo and logo | `assets/img/`; favicons in `static/favicon*` |
| All custom CSS | `assets/css/extended/custom.css` (PaperMod's extension hook, loaded after the theme's own CSS) |
| Landing-page background | `static/js/fitness-landscape.js`, loaded only on the home page |
| Deployment | `.github/workflows/hugo.yml` |

## How this differs from stock PaperMod

The theme lives in `themes/PaperMod` as an untouched git submodule. **Never edit files in
there**; every customization is in the repo root and overrides the theme by path. Some of
these are *copies* of theme files with small edits, and those need re-syncing when the theme
is updated.

| File | Why it exists | Copy of a theme file? |
| --- | --- | --- |
| `layouts/baseof.html` | uses `.Language.Direction` (the theme's `.LanguageDirection` is deprecated) and adds `.IsHome` to the footer cache key so the landing page can have no footer | yes |
| `layouts/_partials/footer.html` | no footer on the landing page; no "Powered by" credit line | yes |
| `layouts/rss.xml`, `layouts/_partials/templates/opengraph.html` | `site.Language.Locale` instead of the deprecated `.LanguageCode` | yes |
| `layouts/_shortcodes/video.html` | adds `caption` and `width` to the theme's video shortcode | yes |
| `layouts/_shortcodes/callout.html` | Quarto-style callout boxes (`type`: tip, note, warning; `collapse=true` for a `<details>`) | no |
| `layouts/publications.html` | the publications timeline page (`layout: publications` in `content/publications.md`) | no |
| `layouts/_partials/extend_footer.html` | loads the landing-page shader; inlines the table-of-contents scroll-spy on single pages | no (theme hook) |
| `layouts/_markup/render-link.html` | makes `/file.pdf` links respect the base URL | no |
| `assets/css/extended/custom.css` | dark-mode logo, publications timeline, canvas placement, callouts, figure rows, sticky sidebar table of contents (viewports ≥ 1360px) | no (theme hook) |

Site-wide defaults set in `hugo.yaml`: table of contents on and open for every page
(`ShowToc`, `TocOpen`); a page can opt out with `ShowToc: false` in its front matter.

## Writing a post

```sh
hugo new content posts/my-post.md
```

Posts start as drafts. Set `draft: false` to publish. `content/posts/example-post.md` has the
basics. The microinjection protocol post is the reference for the extras:

- callout boxes: `{{< callout title="Ingredients" collapse=true >}} …markdown… {{< /callout >}}`
- figures side by side: wrap `{{< figure >}}` shortcodes in `<div class="fig-row"> … </div>`
  with blank lines around each shortcode; they stack on phones
- video: `{{< video src="vid/clip.mp4" caption="…" width="500" >}}`
- footnotes: standard `[^name]` Markdown

## Media

Keep the repo and the pages light. Before committing photos or videos:

- resize photos to about 1400px on the long side and re-encode as JPEG around quality 80
  (`sips -Z 1400 -s format jpeg -s formatOptions 80 in.jpg --out out.jpg` on macOS);
  a phone photo goes from several MB to a few hundred KB
- transcode video to H.264 at 720p, no audio if there is none worth keeping
  (`ffmpeg -i in.mp4 -vf "scale='min(1280,iw)':-2" -c:v libx264 -crf 28 -pix_fmt yuv420p -movflags +faststart -an out.mp4`)
- put a post's media inside the post's folder (`img/`, `vid/`), not in `static/`

## Publishing

Every push to `main`/`master` builds and publishes the site with GitHub Actions
(`.github/workflows/hugo.yml`), so editing a file directly on github.com works too. Progress
and errors show up in the repo's **Actions** tab. If a build fails, the previous version of the
site stays online.

One-time setup: create the GitHub repo, add it as `origin`, push, then repo
**Settings → Pages → Source: GitHub Actions**.

## Updating the theme

```sh
git submodule update --remote themes/PaperMod
hugo   # must still be warning-free
```

Afterwards diff each file marked "copy of a theme file" above against its new theme
counterpart (for example `diff themes/PaperMod/layouts/baseof.html layouts/baseof.html`) and
port any upstream changes, keeping the local edits. If upstream has fixed the deprecations
itself, the RSS and OpenGraph copies can simply be deleted.
