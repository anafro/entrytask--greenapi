"use client";

import {ChatBubble, Send} from "google-material-icons/filled";
import {Add, Logout} from "google-material-icons/outlined";
import {useEffect, useState} from "react";
import clsx from "clsx";
import Avatar from "@/components/Avatar";
import useContacts from "@/hooks/contacts";
import sleep from "@/helpers/sleep";
import useCredentials from "@/hooks/credentials";

export default function Index() {
    const {
        greenAPI,
        contacts,
        messages,
        selectedPhone,
        hasContact,
        addContact,
        openChat,
        saveMessage,
        sendMessage,
    } = useContacts();

    const {
        deleteCredentials,
    } = useCredentials();

    const {setup, receiveMessage} = greenAPI;
    const [draft, setDraft] = useState("");

    const promptNewContact = () => {
        const phoneNumber: string | null = prompt("Enter contact's phone number");

        if (phoneNumber === null) {
            return;
        }

        if (!hasContact(phoneNumber)) {
            addContact(phoneNumber);
        }

        openChat(phoneNumber);
    };

    const logout = () => {
        deleteCredentials();
        window.location.reload();
    }

    useEffect(() => {
        let cancelled = false;

        const synchronizeChatContent = async () => {
            while (!cancelled) {
                try {
                    await setup();
                    const message = await receiveMessage();

                    if (message?.phoneNumber === undefined) {
                        await sleep(500);
                        continue;
                    }

                    saveMessage(message.phoneNumber, message);
                } catch (e) {
                    console.error(e);
                    await sleep(3000);
                }
            }
        };

        void synchronizeChatContent();

        return () => {
            cancelled = true;
        };
    }, [setup, receiveMessage, saveMessage]);

    const send = async () => {
        const text = draft.trim();
        if (text === "") return;

        setDraft("");
        try {
            await sendMessage(text);
        } catch (e) {
            console.error(e);
            setDraft(text);
        }
    };

    return (
        <div className={"relative flex-1 flex items-stretch"}>
            <div id={"toolbar"} className={"bg-zinc-900 flex flex-col items-stretch justify-start px-4 py-10"}>
                <button className={"cursor-pointer flex flex-col items-center justify-center p-4 text-zinc-200"}>
                    <ChatBubble></ChatBubble>
                    <p>Chats</p>
                </button>
                <button onClick={logout} className={"cursor-pointer flex flex-col items-center justify-center self-end p-4 text-zinc-700"}>
                    <Logout></Logout>
                    <p>Logout</p>
                </button>
            </div>

            <div id={"chats"} className={"my-12 px-6 flex flex-col items-stretch min-w-96 border-x border-zinc-800 gap-y-2"}>
                <h1 className={"text-4xl mbe-6"}>Chats</h1>

                {Object.entries(contacts).map(([phoneNumber, contact]) => (
                    <div
                        key={phoneNumber}
                        onClick={() => openChat(phoneNumber)}
                        className={clsx(
                            "flex gap-x-4 px-2 py-3 rounded cursor-pointer",
                            phoneNumber == selectedPhone ? "bg-zinc-800" : "bg-zinc-900",
                        )}
                    >
                        <Avatar phoneNumber={phoneNumber}></Avatar>
                        <div className={"flex flex-col"}>
                            <p className={"leading-4 font-semibold flex items-center gap-x-2"}>
                                {!contact.read && (
                                    <span className={"size-2 bg-indigo-600 animate-pulse rounded-full"}></span>
                                )}
                                {phoneNumber}
                            </p>
                        </div>
                    </div>
                ))}
            </div>

            <div id={"chat"}
                 className={"px-24 py-12 w-full bg-[url(/backgrounds/chat.svg)] bg-cover flex flex-col items-stretch justify-end"}>
                <div className={"flex flex-col px-12 gap-y-8"}>
                    {messages.map((message) => {
                        const incoming = message.phoneNumber !== undefined;
                        return (
                            <div
                                key={message.id}
                                className={clsx(
                                    "rounded px-6 py-3 max-w-120",
                                    incoming ? "self-start bg-zinc-600" : "self-end bg-indigo-600",
                                )}
                            >
                                <p className={"font-semibold"}>{incoming ? message.phoneNumber : "Me"}</p>
                                <p className={incoming ? "text-zinc-300" : "text-indigo-300"}>{message.text}</p>
                            </div>
                        );
                    })}
                </div>

                <div className={"flex gap-x-4 w-full max-w-120 self-center shadow-xl transition-transform mbs-8 has-focus:-translate-y-1"}>
                    <input
                        className={"bg-zinc-900 flex-1"}
                        type={"text"}
                        placeholder={"Message..."}
                        value={draft}
                        disabled={selectedPhone === undefined}
                        onChange={(e) => setDraft(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && void send()}
                    />

                    <button
                        onClick={() => void send()}
                        disabled={selectedPhone === undefined}
                        className={"grid place-items-center rounded bg-indigo-500 aspect-square disabled:opacity-50"}
                    >
                        <Send className={"text-white scale-75"}></Send>
                    </button>
                </div>
            </div>

            <button onClick={promptNewContact} className={"cursor-pointer absolute bottom-24 right-24 bg-indigo-400 text-white rounded-full w-16 h-16 p-2 flex items-center justify-center"}>
                <Add className={"scale-175"}></Add>
            </button>
        </div>
    );
}