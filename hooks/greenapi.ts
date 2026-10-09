"use client";

import useCredentials from "@/hooks/credentials";
import {useCallback, useState} from "react";
import Throttle from "@/helpers/throttle";
import {AtLeastOne} from "@/helpers/types";
import {Message} from "@/types/chat";
import normalizePhone from "@/helpers/phone";

const METHOD_THROTTLES: Record<string, Throttle> = {
    // Account
    getQr: Throttle.perSecond(1),
    sendAuthorizationPassword: Throttle.perSecond(1),
    startAuthorization: Throttle.perSecond(1),
    sendAuthorizationCode: Throttle.perSecond(1),
    logout: Throttle.perSecond(1),
    getStateInstance: Throttle.perSecond(1),
    reboot: Throttle.perSecond(1),
    getSettings: Throttle.perSecond(1),
    setSettings: Throttle.perSecond(1),
    setProfilePicture: Throttle.perSecond(1),
    setAccountSettings: Throttle.perSecond(1),
    getAccountSettings: Throttle.perSecond(1),

    // Cloud password
    getAuthorizationPasswordStatus: Throttle.perSecond(1),
    setAuthorizationPassword: Throttle.perSecond(1),
    editAuthorizationPassword: Throttle.perSecond(1),
    deleteAuthorizationPassword: Throttle.perSecond(1),

    // Sending
    sendMessage: Throttle.perSecond(50),
    sendFileByUrl: Throttle.perSecond(50),
    sendFileByUpload: Throttle.perSecond(50),
    uploadFile: Throttle.perSecond(1),
    sendLocation: Throttle.perSecond(50),
    sendContact: Throttle.perSecond(50),
    sendPoll: Throttle.perSecond(50),
    forwardMessages: Throttle.perSecond(50),

    // Receiving (HTTP API)
    receiveNotification: Throttle.perSecond(100),
    deleteNotification: Throttle.perSecond(100),
    downloadFile: Throttle.perSecond(1),

    // Journals
    getChatHistory: Throttle.perSecond(1),
    getMessage: Throttle.perSecond(1),
    lastIncomingMessages: Throttle.perSecond(1),
    lastOutgoingMessages: Throttle.perSecond(1),

    // Queues
    getMessagesCount: Throttle.perSecond(1),
    showMessagesQueue: Throttle.perSecond(1),
    clearMessagesQueue: Throttle.perSecond(1),
    getWebhooksCount: Throttle.perSecond(1),
    clearWebhooksQueue: Throttle.perSecond(1),

    // Groups
    createGroup: Throttle.perSecond(1),
    updateGroupName: Throttle.perSecond(1),
    getGroupData: Throttle.perSecond(10),
    updateGroupSettings: Throttle.perSecond(1),
    addGroupParticipant: Throttle.perSecond(1),
    removeGroupParticipant: Throttle.perSecond(1),
    setGroupAdmin: Throttle.perSecond(1),
    removeAdmin: Throttle.perSecond(1),
    setGroupPicture: Throttle.perSecond(1),
    leaveGroup: Throttle.perSecond(1),

    // Read marks
    readChat: Throttle.perSecond(1),

    // Service
    checkAccount: Throttle.perSecond(10),
    getAvatar: Throttle.perSecond(10),
    getContacts: Throttle.perSecond(1),
    getContactInfo: Throttle.perSecond(10),
    deleteMessage: Throttle.perSecond(1),
    getChats: Throttle.perSecond(1),
    sendTyping: Throttle.perSecond(1),
    editMessage: Throttle.perSecond(50),
} as const;

export type CheckAccountResponse = {
    exist: boolean;
    chatId: string;
    fromCache: boolean;
}

export type YesNo = "yes" | "no";
export type SetSettingsRequest = AtLeastOne<{
    webhookUrl: string;
    webhookUrlToken: string;
    delaySendMessagesMilliseconds: number;
    markIncomingMessagesReaded: YesNo;
    markIncomingMessagesReadedOnReply: YesNo;
    outgoingWebhook: YesNo;
    outgoingMessageWebhook: YesNo;
    outgoingAPIMessageWebhook: YesNo;
    stateWebhook: YesNo;
    incomingWebhook: YesNo;
    editedMessageWebhook: YesNo;
    deletedMessageWebhook: YesNo;
    pollMessageWebhook: YesNo;
    downloadUrlJpeg: YesNo;
}>;

export type SetSettingsResponse = {
    saveSettings: boolean;
};

export type ReceiveNotificationRequest = {
    receiveTimeout?: number;
};

export type InstanceData = {
    idInstance: number;
    wid: string;
    typeInstance: string;
};

export type SenderData = {
    chatId: string;
    chatName: string;
    chatType: string;
    sender: string;
    senderName: string;
    senderType: string;
    senderContactName: string;
    senderPhoneNumber: number;
};

export type TextMessageData = {
    typeMessage: "textMessage";
    textMessageData: { textMessage: string };
};

export type IncomingMessageNotification = {
    typeWebhook: "incomingMessageReceived";
    instanceData: InstanceData;
    timestamp: number;
    idMessage: string;
    senderData: SenderData;
    messageData: TextMessageData;
};

export type NotificationBody = IncomingMessageNotification;

export type ReceiveNotificationSuccess<B = NotificationBody> = {
    receiptId: number;
    body: B;
};

export type ReceiveNotificationResponse<B = NotificationBody> = ReceiveNotificationSuccess<B> | null;

export type DeleteNotificationResponse = {
    result: boolean;
    reason: string;
};

export type SendMessageRequest = {
    chatId: string;
    message: string;
    typingTime?: number;
    quotedMessageId?: string;
};

export type SendMessageResponse = {
    idMessage: string;
};

export default function useGreenAPI() {
    const [setupPerformed, setSetupPerformed] = useState<boolean>(false);
    const credentials = useCredentials();
    const request = useCallback(async (
        method: string,
        payload: Record<string, unknown> = {},
        httpMethod: "GET" | "POST" | "DELETE" = "POST",
        pathParams: (string | number)[] = [],
    ): Promise<Record<string, unknown> | null> => {
        const throttle: Throttle | undefined = METHOD_THROTTLES[method];

        if (throttle === undefined) {
            throw new Error(`"${method}" is an invalid Green API method.`);
        }

        await throttle.waitUntilUnthrottled();

        const path = [
            `waInstance${credentials.getInstanceId()}`,
            method,
            credentials.getApiToken(),
            ...pathParams,
        ].map((part) => encodeURIComponent(String(part))).join("/");

        const url = new URL(`https://3100.api.green-api.com/${path}`);
        const init: RequestInit = {method: httpMethod};

        if (httpMethod === "GET") {
            for (const [key, value] of Object.entries(payload)) {
                if (value !== undefined && value !== null) {
                    url.searchParams.set(key, String(value));
                }
            }
        } else if (httpMethod === "POST") {
            init.headers = {"Content-Type": "application/json"};
            init.body = JSON.stringify(payload);
        }

        const response = await fetch(url, init);

        if (!response.ok) {
            const text = await response.text().catch(() => "");
            throw new Error(`Green API ${method} failed: ${response.status} ${text}`);
        }

        const text = await response.text();

        try {
            return JSON.parse(text);
        } catch {
            return null;
        }
    }, [credentials]);

    const checkAccount = useCallback(async (phoneNumber: string | number): Promise<CheckAccountResponse> => {
        return await request("checkAccount", {
            phoneNumber: normalizePhone(phoneNumber),
        }) as CheckAccountResponse;
    }, [request]);

    const setSettings = useCallback(async (params: SetSettingsRequest): Promise<SetSettingsResponse> => {
        return await request("setSettings", params) as SetSettingsResponse;
    }, [request]);

    const receiveNotification = useCallback(async (params?: ReceiveNotificationRequest): Promise<ReceiveNotificationResponse> => {
        try {
            return await request("receiveNotification", params, "GET") as ReceiveNotificationResponse;
        } catch (e) {
            console.warn(e);
            return null;
        }
    }, [request]);

    const deleteNotification = useCallback(async (receiptId: number): Promise<DeleteNotificationResponse> => {
        return await request("deleteNotification", {}, "DELETE", [receiptId]) as DeleteNotificationResponse;
    }, [request]);

    const setup = useCallback(async () => {
        if (setupPerformed) {
            return;
        }

        let attempts = 10;
        while (--attempts > 0) {
            const { saveSettings } = await setSettings({
                webhookUrl: "",
                outgoingWebhook: "yes",
                stateWebhook: "yes",
                incomingWebhook: "yes"
            });

            if (saveSettings) {
                console.log("Succeeded set the settings up!")
                setSetupPerformed(() => true);
                return;
            }
        }

        throw new Error("The Green API settings haven't been set after several attempts.")
    }, [setSettings, setupPerformed]);

    const getChatId = useCallback(async (phoneNumber: string | number): Promise<string> => {
        const account = await checkAccount(phoneNumber);

        if (!account.exist) {
            throw new Error(`${phoneNumber} is not yet on MAX.`);
        }

        return account.chatId;
    }, [checkAccount]);

    const receiveMessage = useCallback(async (): Promise<Message | undefined> => {
        const notification = await receiveNotification({
            receiveTimeout: 5,
        });
        
        if (notification === null) {
            return undefined;
        }

        await deleteNotification(notification.receiptId);

        if (notification.body.typeWebhook !== "incomingMessageReceived") {
            return undefined;
        }

        if (notification.body.messageData.typeMessage !== "textMessage") {
            return undefined;
        }

        return {
            id: crypto.randomUUID(),
            phoneNumber: notification.body.senderData.senderPhoneNumber.toString(),
            text: notification.body.messageData.textMessageData.textMessage,
        };
    }, [deleteNotification, receiveNotification]);

    const sendMessage = useCallback(async (params: SendMessageRequest): Promise<SendMessageResponse> => {
        return await request("sendMessage", params) as SendMessageResponse;
    }, [request]);

    return {
        request,
        checkAccount,
        setSettings,
        receiveNotification,
        deleteNotification,
        getChatId,
        receiveMessage,
        sendMessage,
        setup,
    };
}