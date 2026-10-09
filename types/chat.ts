export type Message = {
    id: string;
    phoneNumber?: string;
    text: string;
};

export type Contact = {
    read: boolean;
    messages: Message[];
};