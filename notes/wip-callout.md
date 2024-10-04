## Wip Callout: Rendering Custom Maintenance Messages

The WipCallout component is a React functional component designed to render custom callouts for displaying messages about the page. This feature allows you to provide users with important information, including optional context text that makes it dynamic and reusable.

## Directory

You can find the WipCallout component in the `/components` directory.

## Behavior

When imported into a page, this component renders a message at the top of the nested page. It also sticks to the top when scrolling, ensuring users don't miss the important information. To add a different message, simply pass the `context` prop with your intended message.

## How to Use Wip Callout

1. Import it into your `.mdx` file:

```typescript
import { WipCallout } from '@/components/WipCallout';
```

2. Use it within the file

```typescript
<WipCallout /> // with default message

<WipCallout context="this tutorial is outdated" /> // with custom message

// with a custom `.md` file
import WipMsg from "@/message/WipMsg.md" //import the md file

<WipCallout context={<WipMsg/>} />  // with custom message

```

## Maintenance

Maintenance of this feature is straightforward. As a simple React component, you can find it located in the `/components` directory. Additionally, the relevant styling for this component can be found in the global CSS file at `/styles/global.css`.
