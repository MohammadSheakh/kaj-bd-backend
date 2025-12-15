// services/AgoraService.ts

/*--------------------------
🔔 Important:

1. Agora prefers numeric UIDs. If your userId is a MongoDB ObjectId (string),
do not pass it directly as a number (it won’t fit in 32-bit). Instead, hash it
into a safe integer (as shown above) or use the string UID method if your frontend
SDK supports it.

2. Never use UID = 0 — Agora interprets this as “assign a random UID”, which breaks
identity tracking.

---------------------------*/

//@ts-ignore
import { RtcTokenBuilder, RtcRole, TokenBuilder } from 'agora-token';
import { config } from '../../config';

export class AgoraService {
  private appId: string;
  private appCertificate: string;

  constructor() {
    this.appId = config.agora.appId!;
    this.appCertificate = config.agora.appCertificationPrimary!;

    if (!this.appId) {
      throw new Error('AGORA_APP_ID is required');
    }
    // App Certificate can be empty only if token auth is disabled in Agora Console
    // But for security, we require it
    if (!this.appCertificate) {
      throw new Error('AGORA_APP_CERTIFICATE is required');
    }
  }

  /**
   * Generate an RTC token for a user to join a specific call channel.
   * @param channelName - e.g., conversationId (must match frontend)
   * @param userId - Must be a **number** or a string that can be converted to a non-zero number
   * @param role - 'publisher' (send+receive) or 'subscriber' (receive only)
   * @param expireTimeInSeconds - Default: 3600 (1 hour)
   */
  generateRtcToken(
    channelName: string,
    userId: string | number,
    role: 'publisher' | 'subscriber' = 'publisher',
    expireTimeInSeconds: number = 3600
  ): string {
    // Agora requires UID to be a number. If it's a string (e.g., MongoDB ObjectId),
    // we convert it deterministically. Avoid UID=0!
    let uid: number;

    if (typeof userId === 'number') {
      uid = userId;
    } else {
      // Convert string to a positive integer (e.g., using first 8 chars of hex)
      // ⚠️ Ensure it's never 0 — Agora treats UID=0 as "random UID"
      uid = parseInt(userId.substring(0, 8), 16) || 1;
      if (uid === 0) uid = 1;
    }

    const roleEnum = role === 'publisher' ? RtcRole.PUBLISHER : RtcRole.SUBSCRIBER;

    const token = RtcTokenBuilder.buildTokenWithUid(
      this.appId,
      this.appCertificate,
      channelName,
      uid,
      roleEnum,
      expireTimeInSeconds
    );

    return token;
  }

  // Optional: Generate token with string UID (if using Agora's string UID feature)
  // Only use this if your frontend explicitly uses string UIDs (newer SDKs support it)
  generateRtcTokenWithStringUid(
    channelName: string,
    uidStr: string,
    expireTimeInSeconds: number = 3600
  ): string {
    return TokenBuilder.buildRTCTokenWithStringUid(
      this.appId,
      this.appCertificate,
      channelName,
      uidStr,
      RtcRole.PUBLISHER,
      expireTimeInSeconds
    );
  }
}