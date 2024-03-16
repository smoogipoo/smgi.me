---
title: Deferred rendering? ...what's that?
cover: /assets/of-deferred-rendering-header.png
---

The next release of osu! will feature a set of "experimental" renderers. You should definitely try them out and report back on your experiences!

![Settings](/assets/of-experimental-renderers.png)

- D3D11 (Experimental)
  - Windows users should prefer this over all other options.
  - Slight performance increase.
  - No more graphical glitches.
- Metal (Experimental)
  - Slight performance decrease.
  - May resolve graphical glitches.
- OpenGL (Experimental)
  - This should not be preferred over "OpenGL".
  - Slight performance decrease.
- Vulkan (Experimental)
  - Now available for Windows/Linux.
  - Linux users may benefit from using this over "OpenGL".

---

Continue reading if you're interested in learning more about what this means for the future of osu!framework.

## How did we get here?

[osu!](https://osu.ppy.sh), released circa 2007, was built atop the popular game framework [Microsoft XNA](https://en.wikipedia.org/wiki/Microsoft_XNA).
It made use of "sprite batches" which are collections of textures drawn together as rectangles (quads) on the screen.

![XNA SpriteBatch](/assets/xna-spritebatch.png)

Transparently to the developer, the sprite batch takes care of grouping textures and their associated vertices together so that the GPU performs as few draws as possible.
The fewer draws performed, the better the framerate.
This is perfect for a game like osu! that is entirely composed of textures sourced from either the game files, the user's skin, or the beatmap.

### OpenGL

The first OpenGL implementation appeared in osu! in 2008.
It used ["immediate mode"](https://en.wikipedia.org/wiki/Immediate_mode_(computer_graphics)) rendering which doesn't give the user control over batching and instead relies on the driver to do the optimisations itself.

![Immediate Mode Rendering](/assets/immediate-mode-rendering.png)

Being at the mercy of the driver meant that performance was inconsistent from GPU to GPU, and therefore this renderer only ever existed as a compatibility option.

### Moving forward with OpenGL

Designs for the future of osu! surfaced in 2015 and it quickly became clear that we needed to enhance the game's graphical fidelity.
XNA was deprecated in 2013 so we were left with no choice but to go all-out with OpenGL and rewrote most of the game to target the modern standards.

OpenGL became the default, along with our in-house implementation of sprite batching.

### Into osu!lazer

Then termed "osu-lazer-transitional", the game was being rewritten from the ground up starting in 2016.
Game components were restructured into a hierarchy that you can read more about in the first blog post on the topic, [Sprites and Containers in osu!](https://blog.ppy.sh/post/140087699883/sprites-and-containers-in-osu) by [peppy](https://ppy.sh).

Eventually, the rendering part of this project became [osu!framework](https://github.com/ppy/osu-framework), with the osu!stable OpenGL implementation last appearing in its complete form as ["GLWrapper"](https://github.com/ppy/osu-framework/blob/77840b71dbe12103eec916200936a9a7cb58ff6a/osu.Framework/Graphics/OpenGL/GLWrapper.cs).

### Advantages & disadvantages

The hierarchy made it easier to define reusable components that represent "things" on the screen - whether a texture or a grouping of other components.
It became possible to render most of the entire game within itself, leading to feats such as the multiplayer spectator screen that would not have been previously possible.

![Multiplayer Spectator](/assets/multiplayer-spectator.png)

However, because components were no longer just textures, it became challenging to group things in a way that renders efficiently.

![Rendering a screen](/assets/of-rendering-a-screen.png)

This new structure doesn't give us the ability to group textures together, causing a similar performance regression to the original OpenGL implementation.
["Texture atlasing"](https://en.wikipedia.org/wiki/Texture_atlas) was added to resolve this, creating a single large texture composed of many others.

![Texture atlasing](/assets/of-texture-atlasing.png)

For the most part, this restored the batching capability to be on-par or better than osu!stable.

### What is a circle anyway?

Have you ever wondered how osu! draws a circle? Or borders? Or glows?

If we were talking about osu!stable, they would be drawn via textures. Instead, osu!framework employs masking as a more modular technique that scales to any resolution.
It renders a quad with the desired texture and cuts out the parts that aren't needed.

![Rendering with masking](/assets/of-rendering-logo.png)

The cost: one draw. It "breaks the batch" in the same way that textures did prior to atlasing, however this is much harder to resolve and no easy tricks can help us.
Masking has since proliferated throughout the game - used on every screen, every overlay, during gameplay, and even in places you don't see it!

## Where do we go now?

Every year, I tackle one large-hitting problem in osu!framework from my list.

In 2023, I fired off[^1][^2][^3] a series of pull requests that implemented [Shader Storage Buffer Objects](https://www.khronos.org/opengl/wiki/Shader_Storage_Buffer_Object).
These are large blocks of storage akin to the texture atlas that can be filled with all the masking information necessary for a single frame.

Unfortunately, these changes were reverted because they ended up regressing performance and caused graphics corruption for some users.
It turns out that GPUs _really_ don't like changing data that has previously been submitted for processing.
Not only does osu!framework make grouping textures together challenging, it makes it _even harder_ to collate all the necessary masking information without drawing it first.

So it was back to the drawing board.

## Enter: Deferred Renderer

By shifting focus towards data submission, [osu-framework#6190](https://github.com/ppy/osu-framework/pull/6190) implements a "deferred renderer".
It "flattens" the hierarchy making it easier to manipulate and reorders data submissions to happen at the start of the frame instead, including vertices, masking information, and more.

![Deferred rendering with masking](/assets/of-deferred-rendering-masking.png)

The current implementation does not yet take advantage of the masking information now being available at the start of the frame, but that is a short term goal.

## Outro

There's still a lot of work left to do but this opens up many optimisation opportunities to ensure that osu!framework can continue supporting osu! well into the future.

Stay tuned for more!

---


[^1]: https://github.com/ppy/osu-framework/pull/5950
[^2]: https://github.com/ppy/osu-framework/pull/5952
[^3]: https://github.com/ppy/osu/pull/24613