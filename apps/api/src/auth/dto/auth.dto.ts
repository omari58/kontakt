export interface OidcClaims {
  sub: string;
  email?: string;
  name?: string;
}

export interface AuthResult {
  user: {
    id: string;
    oidcSub: string;
    email: string;
    name: string;
    role: string;
  };
  token: string;
}

export interface AuthorizationUrlResult {
  url: string;
  codeVerifier: string;
  state: string;
}
