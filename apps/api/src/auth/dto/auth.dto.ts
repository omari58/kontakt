export interface JwtPayload {
  sub: string;
  email: string;
  name: string;
  role: string;
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
  idToken?: string;
}

export interface AuthorizationUrlResult {
  url: string;
  codeVerifier: string;
  state: string;
}
