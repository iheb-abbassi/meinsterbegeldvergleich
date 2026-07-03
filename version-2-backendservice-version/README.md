# Version 2 - Hybrid Backend Service Version

This is the hybrid safer setup.

- Vercel hosts the backend API in `api/lead.js`.
- IONOS should use `ionos-widget/widget.html`.
- The IONOS widget has inline HTML, CSS, and frontend JavaScript for smoother loading.
- Form submissions go to the Vercel backend first, then EmailJS sends the emails.
- Compact icons are stored in `icon-images/` and referenced through GitHub raw URLs.
