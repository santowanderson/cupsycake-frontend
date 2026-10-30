export interface Address {
  id?: number;
  zip_code: string;
  street_address: string;
  number: string;
  complement?: string;
  neighborhood: string;
  city: string;
  state_code: string;
  state_name: string;
}

export interface UserProfile {
  customer_id: number;
  first_name: string;
  last_name: string;
  cpf: string;
  email: string;
  formatted_phone: string;
  gender: string;
  birth_date: string;
  age: number;
  zip_code: string;
  street_address: string;
  number: string;
  complement?: string;
  neighborhood: string;
  city: string;
  state_code: string;
  state_name: string;
}
