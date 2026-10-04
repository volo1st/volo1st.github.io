export async function recoverPlaybackAudioSession(root = globalThis) {
  const audioSession = root.navigator?.audioSession;
  if (!audioSession || !('type' in audioSession)) return false;

  try {
    audioSession.type = 'ambient';
    await new Promise((resolve) => root.setTimeout(resolve, 0));
    audioSession.type = 'playback';
    return true;
  } catch (error) {
    return false;
  }
}
