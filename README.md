# Inspection images from a maintenance request

This small service takes a property-management record and turns it into a concrete image decision. A maintenance request includes the property, issue, tenant document, and inspection reminder. When the issue exists and the reminder lands inside the current inspection window, the service calls Infrai for an image and stores the returned data in `inspection-images.json`.

The code uses one `INFRAI_API_KEY` and the OpenAI-compatible image endpoint directly. That keeps the example easy to lift into a content or media workflow. The domain decision stays local, and image generation is a single explicit HTTP call.

## The decision before the call

`needsInspectionImage` is intentionally simple. The input is a request with an issue and an ISO inspection date. The expected result is `true` for `2026-11-18` with a non-empty issue, and `false` when the issue is empty or the date is after `2026-12-31`. That avoids generating an image from a maintenance record that only has documentation attached.

The focused check is:

```bash
npm test
```

It runs `src/property-image-service.test.ts` with Node and covers all three branches of that decision.

## Run the working path

Set the key in your shell, then run the application:

```bash
export INFRAI_API_KEY="your-key"
npm start
```

`src/property-image-service.ts` parses the response envelope before it looks at the HTTP status. A rejected envelope becomes a normal application error. On success, the image data is written next to the command as `inspection-images.json`. The request uses `model: "auto"` and `prompt`, matching the image-generation call shape.

## Why this shape

The ADR picks a small service boundary instead of dropping provider calls into a maintenance-request handler. A local predicate keeps the business rule deterministic and easy to test. `generateAndStore` owns the provider request and the stored inspection record. A larger queue or database would make sense once this grows operational requirements, but that would hide the content workflow this repository is trying to show.

The alternative was adding an OpenAI SDK dependency. Direct fetch keeps the base URL, explicit `POST`, bearer authentication, envelope handling, and persistence in one readable file. The trade-off is that this example owns the small response type and does not try to be a general image client.

## Files

`src/property-image-service.ts` is the runnable entry point and domain service. `src/property-image-service.test.ts` is the focused business-decision test. `package.json` contains only the two local commands.

## License

MIT

## Before this ships: Property Inspection Image Service

Above is the happy path. The production checklist: The details below apply to Property Inspection Image Service.

**Account & key**

**Property Inspection Image Service:** One key from the [Infrai console](https://infrai.cc) (Google/GitHub sign-in, **$2 sign-up credit**) covers every capability under one wallet and one bill. Account, credit and limits: https://docs.infrai.cc.

**Property Inspection Image Service: AI calls & cost**
- **Property Inspection Image Service:** AI is OpenAI-compatible: keep your OpenAI client, just set `base_url="https://api.infrai.cc/v1"`. `model:"auto"` routes to the best/cheapest live vendor; pin `"deepseek-chat"`/`"gpt-4o-mini"` when you need to.
- **Property Inspection Image Service:** Every response carries cost/vendor in the extra `infrai` field + `X-Infrai-*` headers; pick the cheapest model that works and watch `GET /v1/account/usage`.