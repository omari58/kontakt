# Changelog

## [0.1.2](https://github.com/omari58/kontakt/compare/v0.1.1...v0.1.2) (2026-02-11)


### Features

* **cards:** add pronouns, calendar link, and editable calendar text ([c817e66](https://github.com/omari58/kontakt/commit/c817e664bea98aede2dbafba7b794680a5cc368e))
* **email-footer:** add avatar shape, contact selection, and fix PATCH ([1c6f27d](https://github.com/omari58/kontakt/commit/1c6f27d3d9b91598b5f3271b483cac42f9cd925f))
* **email-footer:** add avatar toggle to signature field controls ([6861a9a](https://github.com/omari58/kontakt/commit/6861a9adfa09c7fb35827aeed5905557241a3a82))
* **email-footer:** add contact columns and card link text options ([9914878](https://github.com/omari58/kontakt/commit/991487870fb2d127b2129f1b0bd493b034e39e3c))
* **email-footer:** add i18n keys for signatures feature ([b4a9a21](https://github.com/omari58/kontakt/commit/b4a9a2143d2ec49a42b185b3e7edecd8f422b74f))
* **email-footer:** add pronouns and calendarUrl fields to Card model ([4b526fe](https://github.com/omari58/kontakt/commit/4b526fe6eaa57a699b4e562f485950089c3148b3))
* **email-footer:** add Signature model and SignatureLayout enum ([233910d](https://github.com/omari58/kontakt/commit/233910dfd04f760621de5bb188437382c0808eb1))
* **email-footer:** add signature routes and navigation ([6e9955b](https://github.com/omari58/kontakt/commit/6e9955b928e2f4974f67a123008ad06ccc201a41))
* **email-footer:** add Signature types and Card pronoun/calendar fields ([bc7ecaf](https://github.com/omari58/kontakt/commit/bc7ecafed200970822905926ac8df90e72de4797))
* **email-footer:** add SignatureCard list item component ([7d82572](https://github.com/omari58/kontakt/commit/7d8257225bbc26e9cb23f2b96b111817009990db))
* **email-footer:** add SignatureEditorView for create/edit signatures ([825bdc2](https://github.com/omari58/kontakt/commit/825bdc23f14bb943e671b688b734f2b67e97fae4))
* **email-footer:** add SignatureFieldToggles component ([1488170](https://github.com/omari58/kontakt/commit/14881702edd6bcdf46e533c4bf4d96e09f8523ea))
* **email-footer:** add SignatureLayoutPicker component ([8da086e](https://github.com/omari58/kontakt/commit/8da086ec94c12c305ecfe40a02c78c13df2ae57f))
* **email-footer:** add SignaturePreview component with sandboxed iframe ([7459ed5](https://github.com/omari58/kontakt/commit/7459ed58460345895af42cef1af6353a838ca6ef))
* **email-footer:** add Signatures NestJS module with CRUD API ([d70e5bd](https://github.com/omari58/kontakt/commit/d70e5bd1dbd4fbe7bf9ff3a2a39b124c44dea088))
* **email-footer:** add signatures Pinia store and composable ([5050041](https://github.com/omari58/kontakt/commit/505004199127da063614068a3207f11db55c637a))
* **email-footer:** add SignaturesView list page with four-state UI ([459532d](https://github.com/omari58/kontakt/commit/459532d17ac9355c610117b20d47533cf79f6b6d))
* **email-footer:** add social platform PNG icons for email signatures ([f86465f](https://github.com/omari58/kontakt/commit/f86465f28cd12c9d0ef8d0ef0e457ca5071dd539))
* **email-footer:** add useSignatureHtml composable ([6e0eba4](https://github.com/omari58/kontakt/commit/6e0eba458d7399ce02af10eabe6187d1d2eb361a))
* **keycloak:** enable user registration on local realm ([be7f32a](https://github.com/omari58/kontakt/commit/be7f32a39df639a3c1f6717c40c97c86a58ffbd9))


### Bug Fixes

* **auth:** proper OIDC logout and redirect to frontend ([8309852](https://github.com/omari58/kontakt/commit/8309852ab33b1c6936e2e63128e6feb3025d7a2a))
* **auth:** update auth controller tests for OIDC logout and redirect ([c106dbf](https://github.com/omari58/kontakt/commit/c106dbf97ebae23fbd676c176b81f5568a7ddff4))
* **ci:** merge docker publish into release workflow ([1e49f83](https://github.com/omari58/kontakt/commit/1e49f8387b03cf9bb341eb87460057d6bbe9fdf9))
* **editor:** make sticky card preview scrollable within viewport ([2a7ce54](https://github.com/omari58/kontakt/commit/2a7ce54fc4c80e616d0cefa3bf1c4fe1f0ba92af))
* **email-footer:** add /public proxy to Vite dev server ([fc9835b](https://github.com/omari58/kontakt/commit/fc9835bf206680c928acb50fd652075f26bf0f18))
* **email-footer:** add missing failedLoadSignatures i18n key ([d1fcfaa](https://github.com/omari58/kontakt/commit/d1fcfaa29e3060c32f83edbb2c657c1c248f2a29))
* **email-footer:** add missing pronouns/calendarUrl to QrModal test mock ([846a0ac](https://github.com/omari58/kontakt/commit/846a0ac3f922622bfba0b3dae038edd9a9e7793b))
* **email-footer:** correct social icon URL path and fix TS strict errors ([4752542](https://github.com/omari58/kontakt/commit/475254230847b470c2709b4b887ac7ff894735ba))
* **email-footer:** escape single quotes in escapeHtml and add XSS test ([f641c58](https://github.com/omari58/kontakt/commit/f641c5889be889dfa1c3a906537539a1c449207c))
* **email-footer:** handle absolute avatar URLs from S3/MinIO storage ([b02d0f9](https://github.com/omari58/kontakt/commit/b02d0f9a871bf715c01b57ab7bfe59c19f16e76e))
* **email-footer:** remove allow-same-origin from SignaturePreview sandbox ([bcc2d26](https://github.com/omari58/kontakt/commit/bcc2d267c9f5ca13f534121ceb6961bdd1eca061))
* **email-footer:** use correct i18n key for signature save toast ([14003b2](https://github.com/omari58/kontakt/commit/14003b2425b8131870077d1b246343733c8c8699))

## [0.1.1](https://github.com/omari58/kontakt/compare/v0.1.0...v0.1.1) (2026-02-10)


### Features

* **qr-modal:** add i18n keys for QR modal ([d09b23a](https://github.com/omari58/kontakt/commit/d09b23af33070f2b4cfca7a871299c0ef61ccc2c))
* **qr-modal:** add qr-code-styling dependency ([9ddf327](https://github.com/omari58/kontakt/commit/9ddf32777d717d161e5326dc057fe60cf971b1e0))
* **qr-modal:** create QrModal.vue component with tests ([d44ddd0](https://github.com/omari58/kontakt/commit/d44ddd0798f4f5010e075b50686759e430f946f8))
* **qr-modal:** wire QR modal into Card Editor ([7329825](https://github.com/omari58/kontakt/commit/7329825a948acfcd67756fd5339a01f03127aff9))
* **qr-modal:** wire QR modal into Dashboard ([2ae62f8](https://github.com/omari58/kontakt/commit/2ae62f8da52caa126cbca95d38a3728d495b7062))


### Bug Fixes

* **qr-modal:** resolve favicon CORS, add minimal vCard, SVG download, and shared QrButton ([70e6b7b](https://github.com/omari58/kontakt/commit/70e6b7b493fa46c912fc236314f611343c094a6f))
* **qr-modal:** resolve quality issues from code review ([0b08487](https://github.com/omari58/kontakt/commit/0b08487878a0113c2139690f414d09f87eaa8aa2))
