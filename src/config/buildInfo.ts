const DEVELOPMENT_LABEL = 'dev';

export const buildInfo = {
  version: process.env.REACT_APP_VERSION || DEVELOPMENT_LABEL,
  buildVersion: process.env.REACT_APP_BUILD_VERSION || DEVELOPMENT_LABEL,
  gitSha: process.env.REACT_APP_BUILD_SHA || DEVELOPMENT_LABEL,
  buildTime: process.env.REACT_APP_BUILD_TIME || DEVELOPMENT_LABEL
} as const;
