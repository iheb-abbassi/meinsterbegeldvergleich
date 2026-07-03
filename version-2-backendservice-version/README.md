# Version 2 - Backend Service Version

This is the current safer setup.

- `index.html`, `styles.css`, `script.js`, and `api/lead.js` are hosted on Vercel.
- IONOS should use `ionos-widget/widget.html`.
- Form submissions go to the Vercel backend first, then EmailJS sends the emails.
- Images are stored in `images/` and referenced through GitHub raw URLs.

