# Vendored animation library

`gsap.min.js` and `ScrollTrigger.min.js` are GSAP 3.13.0, taken from the npm package
`gsap@3.13.0` (`dist/` folder, unmodified).

They are vendored rather than loaded from a CDN so the page needs no third-party script
and the Content-Security-Policy in `vercel.json` can stay at `script-src 'self'`.

Licence: the GSAP Standard License ("no charge" licence). Free to use in this site.
See https://gsap.com/community/standard-license/ for the terms and
https://gsap.com/licensing/ for the plugin list. ScrollTrigger is part of the free set.

To update: `npm pack gsap@<version>`, unpack, and copy `package/dist/gsap.min.js` and
`package/dist/ScrollTrigger.min.js` over the two files here.
