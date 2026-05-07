declare const __MCP_VERSION__: string;

// `__MCP_VERSION__` is replaced at build time by tsup with the value of
// `version` in this package.json. The fallback is only used in uncompiled
// dev contexts (e.g. running tests directly without bundling).
export const MCP_VERSION: string =
  typeof __MCP_VERSION__ !== 'undefined' ? __MCP_VERSION__ : '0.0.0-dev';
