// Shared by the server check (formGuard) and the client forms. Deliberately not "company",
// "website", "phone" etc.: browser autofill fills those even with autocomplete="off", which would
// trap real people.
export const HONEYPOT_FIELD = "extra_details";
