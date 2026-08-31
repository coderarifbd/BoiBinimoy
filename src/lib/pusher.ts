import PusherServer from "pusher";
import PusherClient from "pusher-js";

export const pusherServer = new PusherServer({
  appId: process.env.PUSHER_APP_ID || "1800000",
  key: process.env.NEXT_PUBLIC_PUSHER_KEY || "boibinimoy_app_key",
  secret: process.env.PUSHER_SECRET || "boibinimoy_secret",
  cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER || "ap1",
  useTLS: true,
});

export const getPusherClient = () => {
  return new PusherClient(process.env.NEXT_PUBLIC_PUSHER_KEY || "boibinimoy_app_key", {
    cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER || "ap1",
  });
};

export async function triggerChatEvent(channel: string, event: string, data: unknown) {
  try {
    await pusherServer.trigger(channel, event, data);
  } catch (error) {
    // If Pusher credentials are mock/offline during dev, gracefully log
    console.warn("Pusher trigger info (offline/fallback):", error);
  }
}
