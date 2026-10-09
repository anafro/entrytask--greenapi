import Cookies from "universal-cookie";

export const INSTANCE_ID_COOKIE_NAME = "instanceId";
export const INSTANCE_ID_PATTERN = /^\d{12}$/;
export const API_TOKEN_COOKIE_NAME = "apiToken";
export const API_TOKEN_PATTERN = /^[0-9a-f]{50}$/;

const cookies = new Cookies(null, {path: "/", sameSite: "strict"});

const getApiToken = (): string | undefined => cookies.get(API_TOKEN_COOKIE_NAME);
const setApiToken = (token: string): void => cookies.set(API_TOKEN_COOKIE_NAME, token);
const hasApiToken = (): boolean => getApiToken() !== undefined;

const getInstanceId = (): string | undefined => cookies.get(INSTANCE_ID_COOKIE_NAME);
const setInstanceId = (id: string): void => cookies.set(INSTANCE_ID_COOKIE_NAME, id);
const hasInstanceId = (): boolean => getInstanceId() !== undefined;

const deleteCredentials = (): void => {
    cookies.remove(INSTANCE_ID_COOKIE_NAME);
    cookies.remove(API_TOKEN_COOKIE_NAME);
}

const credentials = {
    getApiToken, setApiToken, hasApiToken,
    getInstanceId, setInstanceId, hasInstanceId,
    deleteCredentials,
};

export default function useCredentials() {
    return credentials;
}