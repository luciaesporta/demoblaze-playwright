# Playwright's official image ships the browsers and their system libraries, so
# the tag must match the Playwright version in package-lock.json. A mismatch
# makes Playwright look for a browser revision the image does not carry and fail
# at runtime with "Executable doesn't exist at /ms-playwright/...".
FROM mcr.microsoft.com/playwright:v1.59.1-jammy

# Hooks belong to a developer checkout, not to a test image, and there is no
# .git here for husky to attach them to.
ENV HUSKY=0
ENV CI=true

WORKDIR /app

# Copy the manifests on their own first: this layer is only rebuilt when the
# dependencies change, so editing a test does not trigger a reinstall.
COPY package.json package-lock.json ./

RUN npm ci

COPY . .

# Fail the build on a type error rather than surfacing it mid-test-run.
RUN npm run typecheck

# Overridable at run time, e.g.
#   docker run --rm demoblaze-tests npx playwright test --project=chromium
CMD ["npx", "playwright", "test"]
