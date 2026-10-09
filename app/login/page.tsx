"use client";

import React, {useState} from "react";
import useCredentials, {API_TOKEN_PATTERN, INSTANCE_ID_PATTERN} from "@/hooks/credentials";
import {redirect} from "next/navigation";
import "./login.module.sass";
import Image from "next/image";
import {z} from "zod";

export default function LoginPage() {
    const credentials = useCredentials();
    const [instanceId, setInstanceId] = useState<string>("");
    const [apiToken, setApiToken] = useState<string>("");
    const Credentials = z.object({
        instanceId: z.string().regex(INSTANCE_ID_PATTERN, "Instance ID must be exactly 12 digits."),
        apiToken: z.string().regex(API_TOKEN_PATTERN, "API token must be exactly 50 digits or a-f letters."),
    })
    type Credentials = z.infer<typeof Credentials>;
    const [errors, setErrors] = useState<Partial<Record<keyof Credentials, string>>>({});

    const startChatting = (e: React.SubmitEvent<HTMLFormElement>): void => {
        e.preventDefault()
        const result = Credentials.safeParse({ instanceId, apiToken });

        if (!result.success) {
            const errors = z.flattenError(result.error).fieldErrors;
            return setErrors(_ => ({
                instanceId: errors.instanceId?.[0],
                apiToken: errors.apiToken?.[0],
            }));
        }

        credentials.setApiToken(apiToken);
        credentials.setInstanceId(instanceId);
        redirect("/");
    };

    return (
        <div id={"login"} className={"flex-1 flex flex-col h-full items-center justify-center"}>
            <div className={"flex flex-col px-16 pbs-14 pbe-8 border bg-zinc-900 shadow-xl rounded border-zinc-800 gap-y-2 text-center"}>
                <Image className={"self-center w-32 aspect-square mbe-8 shadow-xl"} width={400} height={400} src={"/logos/max.svg"} alt={"MAX logo"}></Image>
                <h1 className={"text-5xl text-center"}>Welcome aboard</h1>
                <p>Contact your clients on MAX through a gateway. For free.</p>
                <form onSubmit={startChatting} className="flex flex-col items-center justify-center gap-y-2 my-4">
                    <input
                        className={"w-96"}
                        type={"text"}
                        name={"instanceId"}
                        placeholder={"Instance ID"}
                        value={instanceId}
                        pattern={INSTANCE_ID_PATTERN.source}
                        onChange={(e) => setInstanceId(e.target.value)}
                    />
                    {
                        errors.apiToken &&
                        <p className={"text-red-400"}>{errors.apiToken}</p>
                    }
                    <input
                        className={"w-96"}
                        type={"password"}
                        name={"apiToken"}
                        placeholder={"API Token"}
                        value={apiToken}
                        pattern={API_TOKEN_PATTERN.source}
                        onChange={(e) => setApiToken(e.target.value)}
                    />
                    {
                        errors.instanceId &&
                        <p className={"text-red-400"}>{errors.instanceId}</p>
                    }

                    <input className={"mbs-5"} type={"submit"} value={"Start chatting"}></input>
                    <p className={"font-light text-xs mbs-3"}>
                        Feel lost?
                        Learn more about credentials <a href={"https://green-api.com/"} target={"_blank"}>here</a>.
                    </p>
                </form>
            </div>

            <p className={"font-light text-xs opacity-20 mbs-12"}>Made with &lt;3 by Anatoly Frolov, for Green API
                recruiters.</p>
        </div>
    );
}