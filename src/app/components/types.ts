export interface IMessage {
  direction: "incoming" | "outgoing";
  speaker: string;
  content: string;
}
