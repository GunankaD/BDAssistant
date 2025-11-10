import {onDocumentCreated} from "firebase-functions/v2/firestore";
import * as admin from "firebase-admin";
import * as functions from "firebase-functions";

admin.initializeApp();

export const onBirdCreated = onDocumentCreated(
  {
    document: "birds/{id}",
    region: "asia-south1",
  },
  async (event) => {
    const snap = event.data;
    if (!snap) return;

    const bird = snap.data() as Record<string, any>;
    const id = event.params.id;

    const data: Record<string, string> = {
      title: "Bird Detected & Deterred!",
      body: `${bird.species} •  Farm C`,
      type: "bird_seen",
      id: id ?? "",
      species: bird.species ?? "",
      soundName: bird.soundName ?? "",
      timestamp: bird.timestamp ?? "",
      imageUrl: bird.imageUrl ?? "",
      location: bird.location ? JSON.stringify(bird.location) : "",
      device: bird.device ?? "",
    };

    try {
      const res = await admin.messaging().send({
        data,
        android: {priority: "high"},
        topic: "birds_updates",
      });
      functions.logger.info("✅ FCM sent:", res);
    } catch (err) {
      functions.logger.error("❌ FCM send failed:", err);
    }
  }
);
