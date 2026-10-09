"use client";

import {useCallback, useMemo, useRef, useState, useSyncExternalStore} from "react";
import useCredentials from "@/hooks/credentials";
import useGreenAPI from "@/hooks/greenapi";
import normalizePhone from "@/helpers/phone";
import type {Contact, Message} from "@/types/chat";

type Contacts = Record<string, Contact>;

const EMPTY = "{}";
const listeners = new Set<() => void>();

function subscribe(cb: () => void) {
    listeners.add(cb);
    window.addEventListener("storage", cb);
    return () => {
        listeners.delete(cb);
        window.removeEventListener("storage", cb);
    };
}

function parse(raw: string): Contacts {
    try {
        return JSON.parse(raw);
    } catch {
        return {};
    }
}

function withRead(all: Contacts, phoneNumber: string | number): Contacts {
    const contact = all[phoneNumber];
    if (contact === undefined || contact.read) return all;
    return {...all, [phoneNumber]: {...contact, read: true}};
}

export default function useContacts() {
    const greenAPI = useGreenAPI();
    const {getChatId, sendMessage: sendViaApi} = greenAPI;
    const {getInstanceId} = useCredentials();

    const instanceId = getInstanceId();
    const key = instanceId === undefined ? undefined : `contacts-${instanceId}`;

    const [selectedPhone, setSelectedPhone] = useState<string | number | undefined>(undefined);
    const selectedRef = useRef<string | number | undefined>(undefined);

    const getSnapshot = useCallback(
        () => (key === undefined ? EMPTY : localStorage.getItem(key) ?? EMPTY),
        [key],
    );
    const raw = useSyncExternalStore(subscribe, getSnapshot, () => EMPTY);
    const contacts = useMemo(() => parse(raw), [raw]);

    const messages = selectedPhone === undefined
        ? []
        : contacts[selectedPhone]?.messages ?? [];

    const update = useCallback((change: (all: Contacts) => Contacts) => {
        if (key === undefined) return;
        const current = parse(localStorage.getItem(key) ?? EMPTY);
        const next = change(current);
        if (next === current) return;
        localStorage.setItem(key, JSON.stringify(next));
        listeners.forEach((l) => l());
    }, [key]);

    const addContact = useCallback((phoneNumber: string) => {
        const phone = normalizePhone(phoneNumber);
        update((all) => all[phone] ? all : {...all, [phone]: {read: true, messages: []}});
    }, [update]);

    const markAsRead = useCallback((phoneNumber: string) => {
        const phone = normalizePhone(phoneNumber);
        update((all) => {
            if (all[phone] === undefined) {
                throw new Error(`${phone} is not in the contact list.`);
            }
            return withRead(all, phone);
        });
    }, [update]);

    const hasContact = useCallback((phoneNumber: string) => {
        const normalizedPhone = normalizePhone(phoneNumber);
        return Object.hasOwn(contacts, normalizedPhone);
    }, [contacts]);

    const openChat = useCallback((phoneNumber: string) => {
        const phone = normalizePhone(phoneNumber);
        selectedRef.current = phone;
        setSelectedPhone(phone);
        update((all) => withRead(all, phone));
    }, [update]);

    const saveMessage = useCallback((phoneNumber: string | number, message: Message) => {
        const phone = normalizePhone(phoneNumber);
        update((all) => {
            const contact = all[phone] ?? {read: true, messages: []};
            if (contact.messages.some((m) => m.id === message.id)) {
                return all;
            }

            const incoming = message.phoneNumber !== undefined;
            const unread = incoming && phone !== selectedRef.current;

            return {
                ...all,
                [phone]: {
                    read: unread ? false : contact.read,
                    messages: [...contact.messages, message],
                },
            };
        });
    }, [update]);

    const sendMessage = useCallback(async (text: string) => {
        if (selectedPhone === undefined) {
            throw new Error("Open a chat with openChat first.");
        }

        const phoneNumber = selectedPhone;
        const chatId = await getChatId(phoneNumber);
        const {idMessage} = await sendViaApi({message: text, chatId});
        saveMessage(phoneNumber, {id: idMessage, text});
    }, [selectedPhone, getChatId, sendViaApi, saveMessage]);

    return {
        greenAPI,
        contacts,
        messages,
        selectedPhone,
        addContact,
        hasContact,
        markAsRead,
        openChat,
        saveMessage,
        sendMessage,
    };
}