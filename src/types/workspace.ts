export type Workspace = {
  id: string;
  name: string;
  description?: string;
  logo?: string;
  street?: string;
  postal_code?: string;
  city?: string;
  country?: string;
  contact_email?: string;
  phone_landline?: string;
  phone_mobile?: string;
  manager_id?: string;
  manager?: {
    id: string;
    firstName?: string | null;
    lastName?: string | null;
    email: string;
  } | null;
};
