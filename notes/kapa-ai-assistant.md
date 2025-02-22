# [kapa.ai](http://kapa.ai) assistant details

## Configuration

Everything required for the code configuration for the [kapa.ai](http://kapa.ai) assistant lies in the `theme.config.ts` file of the repo. There you will find the `<script>` tag which brings in the kapa.ai assistant modal into the website.

Configuration details for this script tag can be found in the [kapa.ai](http://kapa.ai) documentation here: https://docs.kapa.ai/

Currently the website has the modal enabled by a custom button component located at `components/AskAIButton.tsx`

## Enabling/disabling the feature

The kapa AI assistant can be toggled on and off on the website by toggling the **`enable_docs_ai_widget`** feature flag.
