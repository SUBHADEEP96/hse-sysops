export const routes = {
  login: "/auth/login",
  appLaunch: "/auth/app-launch",
  session: "/auth/session",
  dashboard: {
    stats: "/dashboard/stats",
    critical: "/dashboard/audits-rpn-critical",
    observations: "/dashboard/observations-open-closed",
  },
  audits: "/audits",
  forms: "/forms/for-selection",
  dynamicForm: "/dynamic-form",
  submissions: "/submissions",
  countries: "/countries",
  locations: "/locations",
  locationsForCountry: (countryId: string) =>
    `/locations/country/${encodeURIComponent(countryId)}`,
  likelihood: "/rpn/likelihood",
  severity: "/rpn/severity",
  notifications: "/notifications",
  unread: "/notifications/unread-count",
} as const;
